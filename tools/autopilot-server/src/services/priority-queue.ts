/**
 * Priority queue with disk persistence and concurrent worker pool
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { Mutex } from "async-mutex";
import type { Config, Priority, QueueState, Task, TaskStatus } from "../types";
import { logger } from "../utils/logger";

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export class PriorityQueue {
  private state: QueueState;
  private readonly config: Config;
  private readonly mutex = new Mutex();
  private readonly queueFile: string;
  private workers: Promise<void>[] = [];
  private shutdown = false;
  private paused = false;
  private taskHandler: ((task: Task) => Promise<void>) | null = null;
  private startTime = Date.now();

  constructor(config: Config) {
    this.config = config;
    this.queueFile = join(config.dataDir, "queue.json");
    this.state = {
      pending: [],
      active: new Map(),
      completed: [],
      failed: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Initialize queue from disk and start workers
   */
  async initialize(): Promise<void> {
    await mkdir(this.config.dataDir, { recursive: true });
    await this.loadState();
    logger.info("Queue initialized", {
      pending: this.state.pending.length,
      active: this.state.active.size,
      workers: this.config.maxConcurrent,
    });
  }

  /**
   * Set the task handler function (called for each task)
   */
  setTaskHandler(handler: (task: Task) => Promise<void>): void {
    this.taskHandler = handler;
  }

  /**
   * Start worker pool
   */
  startWorkers(): void {
    if (!this.taskHandler) {
      throw new Error("Task handler must be set before starting workers");
    }

    logger.info("Starting worker pool", { count: this.config.maxConcurrent });
    for (let i = 0; i < this.config.maxConcurrent; i++) {
      this.workers.push(this.runWorker(i));
    }
  }

  /**
   * Enqueue a task with priority ordering
   */
  async enqueue(task: Task): Promise<void> {
    await this.mutex.runExclusive(async () => {
      // Check queue capacity
      if (this.state.pending.length >= this.config.maxQueueSize) {
        logger.warn("Queue at capacity", {
          size: this.state.pending.length,
          max: this.config.maxQueueSize,
          droppedTask: task.issueId,
        });
        throw new Error("QUEUE_FULL");
      }

      // Check for duplicates
      const exists =
        this.state.pending.some((t) => t.issueId === task.issueId) ||
        this.state.active.has(task.issueId);

      if (exists) {
        logger.debug("Task already in queue", { issueId: task.issueId });
        return;
      }

      // Insert in priority order
      const insertIndex = this.findInsertIndex(task.priority);
      this.state.pending.splice(insertIndex, 0, task);
      await this.persist();

      logger.info("Task enqueued", {
        issueId: task.issueId,
        priority: task.priority,
        position: insertIndex,
        queueSize: this.state.pending.length,
      });
    });
  }

  /**
   * Get queue status
   */
  getStatus(): {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    paused: boolean;
    uptime: number;
  } {
    return {
      pending: this.state.pending.length,
      active: this.state.active.size,
      completed: this.state.completed.length,
      failed: this.state.failed.length,
      paused: this.paused,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Get all tasks with optional status filter
   */
  getTasks(status?: TaskStatus): Task[] {
    const tasks: Task[] = [];

    if (!status || status === "pending") {
      tasks.push(...this.state.pending);
    }
    if (!status || status === "active") {
      tasks.push(...Array.from(this.state.active.values()));
    }
    if (!status || status === "completed") {
      tasks.push(...this.state.completed);
    }
    if (!status || status === "failed") {
      tasks.push(...this.state.failed);
    }

    return tasks;
  }

  /**
   * Get a specific task by ID
   */
  getTask(id: string): Task | undefined {
    return (
      this.state.pending.find((t) => t.id === id) ||
      this.state.active.get(id) ||
      this.state.completed.find((t) => t.id === id) ||
      this.state.failed.find((t) => t.id === id)
    );
  }

  /**
   * Pause the queue (workers finish current tasks but don't pick up new ones)
   */
  pause(): void {
    this.paused = true;
    logger.info("Queue paused");
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.paused = false;
    logger.info("Queue resumed");
  }

  /**
   * Gracefully shutdown (wait for active tasks to complete)
   */
  async shutdownGracefully(): Promise<void> {
    logger.info("Initiating graceful shutdown", {
      activeTasks: this.state.active.size,
    });
    this.shutdown = true;
    this.paused = true;

    // Wait for all workers to finish
    await Promise.all(this.workers);
    await this.persist();
    logger.info("Queue shutdown complete");
  }

  private findInsertIndex(priority: Priority): number {
    const priorityValue = PRIORITY_ORDER[priority];
    let insertIndex = this.state.pending.length;

    for (let i = 0; i < this.state.pending.length; i++) {
      if (PRIORITY_ORDER[this.state.pending[i].priority] > priorityValue) {
        insertIndex = i;
        break;
      }
    }

    return insertIndex;
  }

  private async runWorker(id: number): Promise<void> {
    logger.debug("Worker started", { workerId: id });

    while (!this.shutdown) {
      try {
        if (this.paused) {
          await this.sleep(1000);
          continue;
        }

        // Atomic task acquisition
        const task = await this.mutex.runExclusive(async () => {
          const t = this.state.pending.shift();
          if (t) {
            t.status = "active";
            t.startedAt = new Date();
            this.state.active.set(t.id, t);
            await this.persist();
          }
          return t;
        });

        if (!task) {
          await this.sleep(1000);
          continue;
        }

        logger.info("Worker processing task", {
          workerId: id,
          issueId: task.issueId,
          attempt: task.attempt,
        });

        try {
          await this.taskHandler!(task);
          await this.completeTask(task);
        } catch (error) {
          await this.handleTaskError(task, error);
        }
      } catch (error) {
        // Worker-level error - log and continue
        logger.error("Worker error", {
          workerId: id,
          error: error instanceof Error ? error.message : String(error),
        });
        await this.sleep(5000);
      }
    }

    logger.debug("Worker stopped", { workerId: id });
  }

  private async completeTask(task: Task): Promise<void> {
    await this.mutex.runExclusive(async () => {
      this.state.active.delete(task.id);
      task.status = "completed";
      task.completedAt = new Date();
      task.updatedAt = new Date();
      this.state.completed.push(task);

      // Keep only last 100 completed tasks in memory
      if (this.state.completed.length > 100) {
        this.state.completed.shift();
      }

      await this.persist();
    });

    logger.info("Task completed", { issueId: task.issueId, id: task.id });
  }

  private async handleTaskError(task: Task, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRetryable = this.isRetryableError(error);

    await this.mutex.runExclusive(async () => {
      this.state.active.delete(task.id);
      task.attempt++;
      task.error = errorMessage;
      task.updatedAt = new Date();

      if (isRetryable && task.attempt < task.maxAttempts) {
        // Re-queue with backoff
        task.status = "pending";
        const insertIndex = this.findInsertIndex(task.priority);
        this.state.pending.splice(insertIndex, 0, task);

        logger.warn("Task will be retried", {
          issueId: task.issueId,
          attempt: task.attempt,
          maxAttempts: task.maxAttempts,
          error: errorMessage,
        });
      } else {
        // Move to failed
        task.status = "failed";
        this.state.failed.push(task);

        // Keep only last 100 failed tasks in memory
        if (this.state.failed.length > 100) {
          this.state.failed.shift();
        }

        logger.error("Task failed permanently", {
          issueId: task.issueId,
          attempts: task.attempt,
          error: errorMessage,
        });
      }

      await this.persist();
    });
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Network errors, rate limits, timeouts are retryable
      return (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("rate limit") ||
        message.includes("429") ||
        message.includes("503") ||
        message.includes("econnreset") ||
        message.includes("enotfound")
      );
    }
    return false;
  }

  private async persist(): Promise<void> {
    this.state.lastUpdated = new Date();

    const serializable = {
      pending: this.state.pending,
      active: Array.from(this.state.active.entries()),
      completed: this.state.completed.slice(-100), // Keep last 100
      failed: this.state.failed.slice(-100),
      lastUpdated: this.state.lastUpdated,
    };

    await writeFile(this.queueFile, JSON.stringify(serializable, null, 2));
  }

  private async loadState(): Promise<void> {
    if (!existsSync(this.queueFile)) {
      logger.debug("No existing queue state, starting fresh");
      return;
    }

    try {
      const data = await readFile(this.queueFile, "utf-8");
      const parsed = JSON.parse(data);

      this.state = {
        pending: parsed.pending || [],
        active: new Map(parsed.active || []),
        completed: parsed.completed || [],
        failed: parsed.failed || [],
        lastUpdated: new Date(parsed.lastUpdated || Date.now()),
      };

      // Move any previously active tasks back to pending (server restart recovery)
      if (this.state.active.size > 0) {
        logger.info("Recovering interrupted tasks", {
          count: this.state.active.size,
        });
        for (const task of this.state.active.values()) {
          task.status = "pending";
          this.state.pending.unshift(task);
        }
        this.state.active.clear();
        await this.persist();
      }
    } catch (error) {
      logger.error("Failed to load queue state", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
