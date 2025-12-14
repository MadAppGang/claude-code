---
name: architect-detective
description: "⚡ PRIMARY TOOL for: 'what's the architecture', 'system design', 'how are layers organized', 'find design patterns', 'audit structure', 'map dependencies'. REPLACES grep/glob for architecture analysis. Uses claudemem v0.2.0 INDEXED MEMORY with LLM enrichment. GREP/FIND/GLOB ARE FORBIDDEN."
allowed-tools: Bash, Task, Read, AskUserQuestion
---

# ⛔⛔⛔ CRITICAL: INDEXED MEMORY ONLY ⛔⛔⛔

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🧠 THIS SKILL USES INDEXED MEMORY (claudemem v0.2.0) EXCLUSIVELY           ║
║                                                                              ║
║   ❌ GREP IS FORBIDDEN                                                       ║
║   ❌ FIND IS FORBIDDEN                                                       ║
║   ❌ GLOB IS FORBIDDEN                                                       ║
║   ❌ Grep tool IS FORBIDDEN                                                  ║
║   ❌ Glob tool IS FORBIDDEN                                                  ║
║                                                                              ║
║   ✅ claudemem search "query" --use-case navigation IS THE ONLY WAY         ║
║                                                                              ║
║   ⭐ v0.2.0: Leverages file_summary for architecture discovery              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# Architect Detective Skill

**Version:** 2.0.0
**Role:** Software Architect
**Purpose:** Deep architectural investigation using INDEXED MEMORY with LLM enrichment

## Role Context

You are investigating this codebase as a **Software Architect**. Your focus is on:
- **System boundaries** - Where modules, services, and layers begin and end
- **Design patterns** - Architectural patterns used (MVC, Clean Architecture, DDD, etc.)
- **Dependency flow** - How components depend on each other
- **Abstraction layers** - Interfaces, contracts, and abstractions
- **Scalability patterns** - Caching, queuing, microservices boundaries

## Claudemem v0.2.0 Integration

<skill name="claudemem" version="0.2.0">
<purpose>
Semantic code search using vector embeddings WITH LLM enrichment.
Finds code by MEANING AND PURPOSE, not just text matching.
Use INSTEAD of grep/find for: architecture discovery, pattern matching, understanding codebases.
</purpose>

<document_types>
- **code_chunk**: Raw AST code (functions, classes, methods)
- **file_summary** ⭐NEW: LLM-generated file purpose, exports, patterns
- **symbol_summary** ⭐NEW: LLM-generated function docs with params, returns, side effects
</document_types>

<search_mode>
ALWAYS use --use-case navigation for agent tasks.
Weights: symbol_summary (35%) + file_summary (30%) + code_chunk (20%)
This prioritizes UNDERSTANDING over raw code.
</search_mode>

<tools>
CLI:
  claudemem index --enrich            # Index with LLM enrichment
  claudemem enrich                     # Run enrichment on existing index
  claudemem search "query" --use-case navigation  # Agent-optimized search
  claudemem status                     # Check index AND enrichment status
  claudemem ai architect               # Get architecture-focused instructions

MCP (Claude Code integration):
  search_code        query, limit?, language?, autoIndex?
  index_codebase     path?, force?, model?
  get_status         path?
</tools>
</skill>

## Architecture-Focused Search Patterns (v0.2.0)

### Why file_summary is Perfect for Architecture

The `file_summary` document type contains:
- **File purpose**: "Core authentication middleware"
- **Exports**: "AuthMiddleware, validateToken, refreshSession"
- **Dependencies**: "JWT, Redis, UserService"
- **Patterns**: "Middleware chain, session management"

This is exactly what architects need to understand system structure.

### Layer Discovery (Leveraging file_summary)
```bash
# Find service layer implementations
claudemem search "service layer business logic domain operations" --use-case navigation

# Find repository/data access layer
claudemem search "repository pattern data access database query" --use-case navigation

# Find controller/handler layer
claudemem search "controller handler endpoint request response" --use-case navigation

# Find presentation layer
claudemem search "view component template rendering UI display" --use-case navigation
```

### Pattern Detection (Leveraging file_summary patterns)
```bash
# Find dependency injection setup
claudemem search "dependency injection container provider factory" --use-case navigation

# Find factory patterns
claudemem search "factory creation pattern object instantiation" --use-case navigation

# Find observer/event patterns
claudemem search "event emitter observer pattern publish subscribe" --use-case navigation

# Find strategy patterns
claudemem search "strategy pattern algorithm selection behavior" --use-case navigation

# Find adapter patterns
claudemem search "adapter wrapper converter external integration" --use-case navigation
```

### Boundary Analysis (Leveraging file_summary exports)
```bash
# Find module boundaries
claudemem search "module export public interface boundary" --use-case navigation

# Find API boundaries
claudemem search "API endpoint contract interface external" --use-case navigation

# Find domain boundaries
claudemem search "domain model entity aggregate bounded context" --use-case navigation
```

### Configuration Architecture
```bash
# Find configuration loading
claudemem search "configuration environment variables settings initialization" --use-case navigation

# Find feature flags
claudemem search "feature flag toggle conditional enablement" --use-case navigation

# Find plugin/extension points
claudemem search "plugin extension hook customization point" --use-case navigation
```

## Workflow: Architecture Discovery (v0.2.0)

### Phase 0: Verify Enrichment Status ⭐CRITICAL

```bash
# Check if enriched (must have file_summary > 0)
claudemem status

# If file_summary = 0, run enrichment first
claudemem enrich
```

**Architecture discovery relies heavily on file_summary. Without enrichment, results are degraded.**

### Phase 1: Index and Overview

```bash
# 1. Check/create enriched index
claudemem status || claudemem index --enrich

# 2. Find entry points (file_summary shows purpose)
claudemem search "main entry point application bootstrap initialization" -n 10 --use-case navigation

# 3. Map high-level structure (file_summary shows exports)
claudemem search "module definition export public interface" -n 15 --use-case navigation
```

### Phase 2: Layer Mapping (file_summary driven)

```bash
# Map each architectural layer
claudemem search "controller handler route endpoint" -n 10 --use-case navigation    # Presentation
claudemem search "service business logic domain" -n 10 --use-case navigation         # Business
claudemem search "repository database query persistence" -n 10 --use-case navigation # Data
claudemem search "entity model schema type definition" -n 10 --use-case navigation   # Domain
```

### Phase 3: Dependency Analysis

```bash
# Find dependency injection
claudemem search "inject dependency container provider" -n 10 --use-case navigation

# Find imports between layers (file_summary shows dependencies)
claudemem search "import from service repository controller" -n 15 --use-case navigation

# Find circular dependency risks
claudemem search "circular import bidirectional dependency" -n 5 --use-case navigation
```

### Phase 4: Design Pattern Identification

```bash
# Search for common patterns
claudemem search "singleton instance global state" -n 5 --use-case navigation
claudemem search "factory create new instance builder" -n 5 --use-case navigation
claudemem search "strategy algorithm policy selection" -n 5 --use-case navigation
claudemem search "decorator wrapper middleware enhance" -n 5 --use-case navigation
claudemem search "observer listener event subscriber" -n 5 --use-case navigation
```

## Output Format: Architecture Report

### 1. System Overview
```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                   │
├─────────────────────────────────────────────────────────┤
│  Entry Point: src/index.ts                              │
│  Architecture Style: Clean Architecture / Hexagonal    │
│  Primary Patterns: Repository, Factory, Strategy       │
│  Search Method: claudemem v0.2.0 (enriched)            │
│  Enrichment: ✅ file_summary + symbol_summary          │
└─────────────────────────────────────────────────────────┘
```

### 2. Layer Map (from file_summary data)
```
┌─────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (src/controllers/, src/handlers/)   │
│   └── HTTP Controllers, GraphQL Resolvers, CLI         │
│   └── file_summary: "HTTP request handling, routing"   │
├─────────────────────────────────────────────────────────┤
│ APPLICATION LAYER (src/services/, src/use-cases/)      │
│   └── Business Logic, Orchestration, Commands          │
│   └── file_summary: "Business logic orchestration"     │
├─────────────────────────────────────────────────────────┤
│ DOMAIN LAYER (src/domain/, src/entities/)              │
│   └── Entities, Value Objects, Domain Services         │
│   └── file_summary: "Core domain models"               │
├─────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE LAYER (src/repositories/, src/adapters/)│
│   └── Database, External APIs, File System             │
│   └── file_summary: "Data persistence, external APIs"  │
└─────────────────────────────────────────────────────────┘
```

### 3. Dependency Flow
```
Controller → Service → Repository → Database
     ↓           ↓           ↓
  Validator   Domain     External API
                ↓
            Events → Queue
```

### 4. Design Patterns Detected (from file_summary patterns)
```
| Pattern      | Location                    | Purpose               |
|--------------|-----------------------------|-----------------------|
| Repository   | src/repositories/*.ts       | Data access abstraction|
| Factory      | src/factories/*.ts          | Object creation       |
| Strategy     | src/strategies/*.ts         | Algorithm selection   |
| Middleware   | src/middleware/*.ts         | Request processing    |
| Observer     | src/events/*.ts             | Event-driven decoupling|
```

### 5. Recommendations
```
[Architecture Observations]
✓ Good: Clear separation between layers
✓ Good: Repository pattern for data access
⚠ Consider: Some controllers contain business logic
⚠ Consider: Missing explicit domain events
✗ Issue: Circular dependency between auth and user services
```

## Integration with Detective Agent

When using the codebase-detective agent with this skill:

```typescript
Task({
  subagent_type: "code-analysis:detective",
  description: "Architecture investigation",
  prompt: `
## Architect Investigation (v0.2.0)

Use claudemem with architecture-focused queries:
1. First run: claudemem status (verify enrichment)
2. If file_summary = 0, run: claudemem enrich
3. Search with: --use-case navigation

Focus on:
1. Map system layers and boundaries (use file_summary)
2. Identify design patterns in use
3. Analyze dependency flow
4. Find abstraction points and interfaces

Focus on STRUCTURE and DESIGN, not implementation details.

Generate an Architecture Report with:
- System overview diagram
- Layer map (with file_summary context)
- Dependency flow
- Pattern catalog
- Architecture recommendations
  `
})
```

## Best Practices for Architecture Discovery (v0.2.0)

1. **Verify enrichment first**
   - Run `claudemem status`
   - file_summary count should match file count
   - Without enrichment, architecture discovery is degraded

2. **Leverage file_summary for structure**
   - file_summary contains purpose, exports, patterns
   - Perfect for understanding file roles in architecture
   - Use `--use-case navigation` to prioritize summaries

3. **Start broad, then narrow**
   - Begin with entry points and main modules
   - Drill into specific layers and patterns

4. **Follow the dependencies**
   - file_summary shows imports/dependencies
   - Trace imports to understand coupling
   - Map dependency direction (always down the layers)

5. **Look for abstractions**
   - Interfaces and abstract classes define contracts
   - Find where behavior varies (strategy/factory patterns)

6. **Identify boundaries**
   - Clear boundaries = good architecture
   - Fuzzy boundaries = potential refactoring targets

## Notes

- Requires claudemem CLI v0.2.0+ installed and configured
- **Architecture discovery relies heavily on file_summary**
- Without enrichment, results show only code_chunk (degraded)
- Works best on indexed + enriched codebases
- Focuses on structure over implementation
- Pairs well with developer-detective for implementation details

---

**Maintained by:** MadAppGang
**Plugin:** code-analysis v2.4.0
**Last Updated:** December 2025
