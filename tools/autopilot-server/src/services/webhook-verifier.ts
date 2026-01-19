/**
 * Webhook signature verification with replay attack protection
 *
 * Linear webhook format:
 * - Header: "Linear-Signature" = HMAC-SHA256 hex of raw body
 * - Body field: "webhookTimestamp" = UNIX timestamp in milliseconds
 *
 * Verification order (security best practice):
 * 1. Verify signature BEFORE parsing JSON
 * 2. Parse JSON
 * 3. Check timestamp from body
 * 4. Check for replay attacks
 */

import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "../utils/logger";

export class WebhookVerifier {
  private readonly secret: string;
  private readonly devMode: boolean;
  private readonly processedSignatures: Set<string> = new Set();
  private readonly maxCacheSize = 10000;
  private readonly maxAgeMs = 5 * 60 * 1000; // 5 minutes

  constructor(secret: string, devMode: boolean = false) {
    this.secret = secret;
    this.devMode = devMode;
  }

  /**
   * Step 1: Verify webhook signature (call BEFORE parsing JSON)
   *
   * @param payload - Raw request body string
   * @param signature - Linear-Signature header value (hex HMAC-SHA256)
   */
  verifySignature(payload: string, signature: string | null): boolean {
    // Dev mode bypass (explicit flag required)
    if (this.devMode && !signature) {
      logger.warn("Webhook verification bypassed in dev mode");
      return true;
    }

    if (!signature) {
      logger.warn("Missing webhook signature");
      return false;
    }

    // Signature validation (HMAC-SHA256, hex encoded)
    const expectedSignature = this.computeSignature(payload);
    const signatureValid = this.timingSafeCompare(expectedSignature, signature);

    if (!signatureValid) {
      logger.warn("Invalid webhook signature");
      return false;
    }

    return true;
  }

  /**
   * Step 2: Check timestamp for freshness (call AFTER parsing JSON)
   *
   * @param webhookTimestamp - webhookTimestamp from parsed body (UNIX ms)
   */
  checkTimestamp(webhookTimestamp?: number): boolean {
    // Dev mode - skip timestamp check
    if (this.devMode) {
      return true;
    }

    // Timestamp is optional but recommended
    if (!webhookTimestamp || typeof webhookTimestamp !== "number") {
      // Allow webhooks without timestamp in non-strict mode
      logger.debug("No webhook timestamp provided");
      return true;
    }

    const now = Date.now();

    if (now - webhookTimestamp > this.maxAgeMs) {
      logger.warn("Webhook too old", { ageMs: now - webhookTimestamp });
      return false;
    }

    // Future timestamp check (with 1 min tolerance for clock skew)
    if (webhookTimestamp - now > 60000) {
      logger.warn("Webhook timestamp in future", { webhookTimestamp });
      return false;
    }

    return true;
  }

  /**
   * Step 3: Check for replay attacks (call after signature + timestamp)
   *
   * @param signature - The signature to check for duplicates
   */
  checkReplay(signature: string): boolean {
    // Dev mode - skip replay check
    if (this.devMode) {
      return true;
    }

    if (this.processedSignatures.has(signature)) {
      logger.warn("Duplicate webhook detected (replay attack prevented)", {
        signature: signature.slice(0, 16) + "...",
      });
      return false;
    }

    // Store signature for deduplication
    this.processedSignatures.add(signature);
    this.cleanupOldSignatures();

    return true;
  }

  /**
   * Legacy: Combined verify method (for backwards compatibility)
   * Prefer using verifySignature + checkTimestamp + checkReplay separately
   */
  verify(payload: string, signature: string | null, webhookTimestamp?: number): boolean {
    if (!this.verifySignature(payload, signature)) {
      return false;
    }
    if (!this.checkTimestamp(webhookTimestamp)) {
      return false;
    }
    if (signature && !this.checkReplay(signature)) {
      return false;
    }
    return true;
  }

  private computeSignature(payload: string): string {
    return createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  private timingSafeCompare(expected: string, actual: string): boolean {
    try {
      const expectedBuffer = Buffer.from(expected, "hex");
      const actualBuffer = Buffer.from(actual, "hex");

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  private cleanupOldSignatures(): void {
    if (this.processedSignatures.size > this.maxCacheSize) {
      // Clear oldest half
      const signatures = Array.from(this.processedSignatures);
      this.processedSignatures.clear();
      const keepCount = Math.floor(this.maxCacheSize / 2);
      signatures.slice(-keepCount).forEach((s) => this.processedSignatures.add(s));
      logger.debug("Cleaned up signature cache", {
        removed: signatures.length - keepCount,
        remaining: keepCount,
      });
    }
  }
}
