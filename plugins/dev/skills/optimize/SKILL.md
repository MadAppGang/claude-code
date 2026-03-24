---
name: optimize
description: "Profiles build times, analyzes bundle sizes, identifies runtime bottlenecks, and generates prioritized optimization reports with before/after metrics. Use when improving performance, reducing bundle size, optimizing database queries, or diagnosing slow API endpoints."
---

# Optimize Skill

## Overview

The optimize skill provides comprehensive on-demand performance and optimization analysis for your codebase. It identifies bottlenecks, slow builds, large bundles, inefficient code patterns, and opportunities for performance improvements across all supported technology stacks.

**When to Use**:
- Performance issues and slow response times
- Large bundle sizes and slow page loads
- Long build and compile times
- High memory usage
- Database query optimization
- API endpoint performance tuning
- CI/CD pipeline optimization

**Technology Coverage**:
- React/TypeScript/JavaScript (Vite, Webpack, Rollup)
- Go applications (build time, runtime performance)
- Rust projects (compile time, binary size)
- Python codebases (runtime optimization)
- Full-stack applications
- Database queries (SQL, ORM)

## Optimization Categories

### 1. Build Performance

**What Gets Analyzed**:
- Build duration and bottlenecks
- Dependency resolution time
- TypeScript compilation speed
- Asset processing (images, fonts)
- Code splitting effectiveness
- Cache utilization

**Common Issues**:
- Unnecessary re-builds of unchanged code
- Large dependency trees
- Inefficient TypeScript configuration
- Missing build caching
- Redundant asset processing

**Optimization Targets**:
- Reduce build time by 30-50%
- Enable incremental builds
- Optimize dependency resolution
- Improve cache hit rates

### 2. Bundle Size

**What Gets Measured**:
- Total bundle size (uncompressed/gzipped)
- Individual chunk sizes
- Duplicate dependencies
- Tree-shaking effectiveness
- Unused code in bundles
- Third-party library sizes

**Bundle Analysis**:
```
Bundle Size Breakdown:
├── vendor.js: 847 KB (312 KB gzipped)
│   ├── react-dom: 142 KB
│   ├── lodash: 71 KB (should use lodash-es)
│   ├── moment: 67 KB (consider date-fns)
│   └── ...
├── main.js: 234 KB (89 KB gzipped)
└── [lazy chunks]: 156 KB total
```

**Optimization Goals**:
- Keep initial bundle under 200 KB (gzipped)
- Lazy load non-critical code
- Remove duplicate dependencies
- Use lighter alternatives

### 3. Runtime Performance

**What Gets Profiled**:
- Function execution time
- Component render performance
- Memory allocation patterns
- Garbage collection pressure
- Event loop blocking
- Async operation efficiency

**Performance Metrics**:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

**Detection Methods**:
- Profiling data analysis
- Flame graph generation
- Hot path identification
- Memory leak detection

### 4. Memory Usage

**What Gets Monitored**:
- Heap allocation patterns
- Memory leaks
- Large object retention
- Closure memory overhead
- Cache memory usage
- Buffer allocation

**Red Flags**:
- Growing heap over time (leak)
- Excessive garbage collection
- Large retained objects
- Detached DOM nodes (React)
- Unclosed connections/subscriptions

### 5. API and Database Performance

**What Gets Analyzed**:
- Query execution time
- N+1 query problems
- Missing database indexes
- API response times
- Network round trips
- Cache effectiveness

**Database Optimization**:
- Slow query identification
- Index recommendations
- Query plan analysis
- Connection pooling efficiency

## Analysis Patterns

### Identifying Bottlenecks

**Step 1: Measure Current Performance**

Collect baseline metrics:
- Build time: `time npm run build`
- Bundle size: Analyze with webpack-bundle-analyzer
- Runtime: Browser DevTools Performance tab
- API: Response time logs

**Step 2: Profile and Identify Hot Paths**

Find where time is spent:
- CPU profiling for computation
- Heap snapshots for memory
- Network waterfall for I/O
- Flame graphs for call stacks

**Step 3: Prioritize Optimizations**

Focus on:
1. Highest impact (largest bottleneck)
2. Lowest effort (quick wins)
3. Most frequent (called often)

**Step 4: Measure Impact**

After optimization:
- Re-run benchmarks
- Compare before/after metrics
- Validate improvements

### Tools and Commands

**JavaScript/TypeScript**:
```bash
# Bundle analysis
npx webpack-bundle-analyzer dist/stats.json

# Build performance
npm run build -- --profile --json > stats.json

# Runtime profiling
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

**Go**:
```bash
# Build time analysis
go build -x 2>&1 | ts '[%Y-%m-%d %H:%M:%S]'

# CPU profiling
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof -bench=.
go tool pprof mem.prof
```

**Rust**:
```bash
# Compile time analysis
cargo build --timings

# Binary size analysis
cargo bloat --release

# Runtime profiling
cargo flamegraph --bench benchmark_name
```

## Optimization Report Format

### Performance Report Structure

```markdown
# Performance Optimization Report

**Generated**: 2026-01-28 14:32:00
**Scope**: Full application analysis
**Baseline**: Established 2026-01-21

## Executive Summary

**Overall Performance Score**: 67/100 (Needs Improvement)

**Key Findings**:
- Build time: 142s (Target: <60s) - 58% slower
- Bundle size: 1.2 MB gzipped (Target: <200 KB) - 6x over
- LCP: 3.8s (Target: <2.5s) - Poor
- API p95: 847ms (Target: <500ms) - Slow

**Estimated Impact of Recommendations**:
- Build time: -65s (46% improvement)
- Bundle size: -800 KB (67% reduction)
- LCP: -1.5s (39% improvement)
- API p95: -400ms (47% improvement)

## Critical Bottlenecks

### [PERF-001] Lodash Full Library Import
**Category**: Bundle Size
**Impact**: HIGH
**Effort**: LOW

**Issue**: Full lodash library imported, adding 71 KB to bundle.

**Current**:
```typescript
import _ from 'lodash';
const result = _.debounce(handler, 300);
```

**Problem**: Imports entire library for single function.

**Recommendation**: Use lodash-es with tree-shaking.

**Optimized**:
```typescript
import { debounce } from 'lodash-es';
const result = debounce(handler, 300);
```

**Savings**: -65 KB gzipped

---

### [PERF-002] Moment.js for Simple Date Formatting
**Category**: Bundle Size
**Impact**: MEDIUM
**Effort**: LOW

**Issue**: moment.js adds 67 KB for basic date formatting.

**Current**:
```typescript
import moment from 'moment';
const formatted = moment(date).format('YYYY-MM-DD');
```

**Recommendation**: Replace with date-fns or native Intl.

**Optimized**:
```typescript
import { format } from 'date-fns';
const formatted = format(date, 'yyyy-MM-dd');
```

**Savings**: -60 KB gzipped

---

### [PERF-003] TypeScript Compilation Bottleneck
**Category**: Build Time
**Impact**: HIGH
**Effort**: MEDIUM

**Issue**: TypeScript taking 89s of 142s build time (63%).

**Current Config**:
```json
{
  "compilerOptions": {
    "incremental": false,
    "skipLibCheck": false
  }
}
```

**Problems**:
- No incremental compilation
- Checking all .d.ts files
- No build cache

**Optimized**:
```json
{
  "compilerOptions": {
    "incremental": true,
    "skipLibCheck": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

**Savings**: -45s build time (first build), -70s (subsequent)

---

### [PERF-004] N+1 Query in User Profile API
**Category**: API Performance
**Impact**: CRITICAL
**Effort**: LOW

**Issue**: Loading user posts in a loop, causing 100+ database queries.

**Current**:
```typescript
const users = await db.getUsers();
for (const user of users) {
  user.posts = await db.getPostsByUserId(user.id); // N+1!
}
```

**Problem**: 1 query + N queries = 101 total for 100 users.

**Optimized**:
```typescript
const users = await db.getUsers();
const userIds = users.map(u => u.id);
const posts = await db.getPostsByUserIds(userIds); // 1 query
const postsByUser = groupBy(posts, 'userId');
users.forEach(user => {
  user.posts = postsByUser[user.id] || [];
});
```

**Savings**: 99 database queries eliminated, 95% faster

## Build Performance Analysis

### Current Build Breakdown

```
Total Build Time: 142s

Phase Breakdown:
├── Dependencies (npm install): 23s (16%)
├── TypeScript Compilation: 89s (63%)
├── Asset Processing: 18s (13%)
├── Bundling (Webpack): 9s (6%)
└── Minification: 3s (2%)

Bottleneck: TypeScript (63% of time)
```

### Optimization Recommendations

**1. Enable Incremental TypeScript** (HIGH IMPACT)
- Savings: -70s on subsequent builds
- Add `incremental: true` to tsconfig.json

**2. Parallelize Asset Processing** (MEDIUM IMPACT)
- Savings: -10s
- Use worker threads for image optimization

**3. Use SWC Instead of Babel** (MEDIUM IMPACT)
- Savings: -5s
- 20x faster than Babel

**Total Potential Savings**: -85s (60% improvement)

**Target Build Time**: 57s

## Bundle Size Analysis

### Current Bundle Breakdown

```
Total Bundle Size: 1.2 MB gzipped

Dependencies:
├── react + react-dom: 142 KB (12%)
├── lodash: 71 KB (6%)
├── moment: 67 KB (6%)
├── chart.js: 54 KB (5%)
├── Other vendor: 445 KB (37%)
└── Application code: 421 KB (34%)

Issues:
- Lodash not tree-shaken
- Moment.js unnecessary
- Large chart library for simple use
```

### Optimization Recommendations

**1. Replace Heavy Dependencies** (HIGH IMPACT)
- lodash → lodash-es: -65 KB
- moment → date-fns: -60 KB
- chart.js → lightweight-charts: -40 KB
- Total: -165 KB (14% reduction)

**2. Code Splitting** (HIGH IMPACT)
- Lazy load admin panel: -200 KB from initial
- Lazy load dashboard charts: -150 KB from initial
- Total: -350 KB from initial load (29% reduction)

**3. Tree Shaking Improvements** (MEDIUM IMPACT)
- Fix sideEffects in package.json
- Remove unused exports
- Estimated: -100 KB (8% reduction)

**Total Potential Savings**: -615 KB (51% reduction)

**Target Bundle Size**: 585 KB gzipped

## Runtime Performance Analysis

### Core Web Vitals

```
Current Performance:
- LCP: 3.8s (Poor) - Target: <2.5s
- FID: 120ms (Needs Improvement) - Target: <100ms
- CLS: 0.05 (Good) - Target: <0.1

Time to Interactive: 5.2s (Poor) - Target: <3.5s
```

### Bottlenecks Identified

**1. Large Initial JavaScript Bundle** (CRITICAL)
- 1.2 MB blocks rendering
- Recommendation: Code split, lazy load

**2. Heavy Initial Data Fetch** (HIGH)
- 847 KB JSON downloaded before first paint
- Recommendation: Pagination, defer non-critical data

**3. Expensive Re-renders** (MEDIUM)
- UserList component re-renders 47 times on page load
- Recommendation: React.memo, useMemo

## API Performance Analysis

### Slow Endpoints

```
Top 5 Slowest Endpoints (p95):

1. GET /api/users (with posts)
   - Current: 1,247ms
   - Target: <300ms
   - Issue: N+1 queries
   - Fix: Batch query + caching

2. GET /api/dashboard
   - Current: 892ms
   - Target: <400ms
   - Issue: Sequential queries
   - Fix: Parallel query execution

3. POST /api/orders
   - Current: 673ms
   - Target: <500ms
   - Issue: Synchronous email sending
   - Fix: Background job queue

4. GET /api/reports/monthly
   - Current: 2,134ms
   - Target: <1000ms
   - Issue: Large dataset, no pagination
   - Fix: Streaming response, pagination

5. GET /api/search
   - Current: 524ms
   - Target: <300ms
   - Issue: Full table scan
   - Fix: Add database index
```

### Database Query Optimization

**Missing Indexes Detected**:
```sql
-- Query: SELECT * FROM orders WHERE user_id = ? AND status = 'pending'
-- Execution time: 847ms (table scan)
-- Recommendation: Add composite index

CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Estimated improvement: 98% faster (15ms)
```

## Memory Usage Analysis

### Memory Leaks Detected

**1. Event Listener Not Cleaned Up** (HIGH)
```typescript
// Leak in useEffect
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
});

// Fix:
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**2. Growing Cache Without Limits** (MEDIUM)
```typescript
// Unbounded cache grows forever
const cache = new Map();
function memoize(key, fn) {
  if (!cache.has(key)) {
    cache.set(key, fn());
  }
  return cache.get(key);
}

// Fix: Use LRU cache with size limit
import LRU from 'lru-cache';
const cache = new LRU({ max: 500 });
```

## Optimization Priority Matrix

```
Impact vs Effort:

HIGH IMPACT, LOW EFFORT (Do First):
- Replace lodash import
- Replace moment.js
- Enable TS incremental
- Fix N+1 query
- Add database index

HIGH IMPACT, MEDIUM EFFORT (Do Soon):
- Code splitting
- Lazy loading
- Background job queue

MEDIUM IMPACT, LOW EFFORT (Quick Wins):
- React.memo on heavy components
- Image optimization
- Enable compression

LOW PRIORITY:
- Micro-optimizations
- Premature abstractions
```

## Recommendations Summary

### Immediate Actions (This Week)

1. Fix N+1 query in /api/users
2. Replace lodash with lodash-es
3. Enable TypeScript incremental
4. Add database index for orders query

**Expected Impact**: 40% performance improvement

### Short Term (This Month)

1. Implement code splitting
2. Replace moment.js with date-fns
3. Lazy load admin panel
4. Add React.memo to UserList

**Expected Impact**: Additional 30% improvement

### Long Term (This Quarter)

1. Implement caching layer (Redis)
2. Add CDN for static assets
3. Database query optimization audit
4. Consider server-side rendering

**Expected Impact**: Additional 20% improvement

**Total Expected Improvement**: 90% (Score: 67 → 127)
```

## Integration with Dev Plugin

### With Audit Skill

Combine performance and security:

```
Run optimization analysis and check performance implications of security fixes
```

### With Test Coverage

Ensure optimizations don't break functionality:

```
Optimize bundle size and verify test coverage remains above 80%
```

### With Code Analysis

Use enrichment for better context:

```
Enrich codebase with claudemem, then identify performance bottlenecks
```

## Best Practices

### 1. Measure Before Optimizing

Always establish baseline:
- Current build time
- Current bundle size
- Current runtime metrics
- Current API response times

**Anti-pattern**: Optimizing without measuring

### 2. Focus on User-Perceived Performance

Prioritize metrics that affect users:
- LCP (loading)
- FID (interactivity)
- CLS (visual stability)

**Anti-pattern**: Optimizing server metrics that users don't notice

### 3. Optimize the Critical Path

Focus on:
- Initial page load
- Time to interactive
- First contentful paint

**Anti-pattern**: Optimizing rarely-used features

### 4. Use Performance Budgets

Set hard limits:
- Max bundle size: 200 KB gzipped
- Max build time: 60s
- Max API response: 500ms p95

**Enforcement**: CI/CD checks fail if exceeded

### 5. Monitor in Production

Use real user monitoring (RUM):
- Track Core Web Vitals
- Monitor API response times
- Alert on regressions

**Tools**: Lighthouse CI, Sentry, DataDog

## Examples

### Example 1: Slow React Application

**Request**:
```
Our React app takes 8 seconds to load. Please identify bottlenecks.
```

**Analysis Process**:
1. Measure bundle size: 2.1 MB gzipped
2. Analyze bundle composition
3. Profile React rendering
4. Check network waterfall

**Findings**:
- Main bundle too large (no code splitting)
- Entire Material-UI library imported
- Heavy initial data fetch (1.2 MB JSON)
- Expensive UserList re-renders

**Optimizations**:
```typescript
// 1. Code splitting
const AdminPanel = lazy(() => import('./AdminPanel'));

// 2. Tree-shakeable imports
import Button from '@mui/material/Button'; // Not: import { Button } from '@mui/material';

// 3. Pagination
const users = await fetchUsers({ page: 1, limit: 20 }); // Not: all users

// 4. Memoization
const UserList = React.memo(({ users }) => { ... });
```

**Results**:
- Bundle: 2.1 MB → 420 KB (80% reduction)
- Load time: 8s → 1.9s (76% improvement)
- LCP: 7.2s → 2.1s (71% improvement)

### Example 2: Slow TypeScript Build

**Request**:
```
TypeScript compilation takes 3 minutes. Speed it up.
```

**Analysis**:
1. Profile build with `--extendedDiagnostics`
2. Identify slow files
3. Check tsconfig.json

**Findings**:
- No incremental compilation
- Checking all node_modules types
- Large union types causing slowness
- No build cache

**Optimizations**:
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules", "dist"]
}
```

**Results**:
- First build: 180s → 95s (47% improvement)
- Subsequent builds: 180s → 12s (93% improvement)

### Example 3: Database Query Optimization

**Request**:
```
The /api/orders endpoint is timing out under load
```

**Analysis**:
1. Enable query logging
2. Identify slow queries
3. Analyze query plans
4. Check for missing indexes

**Findings**:
```sql
-- Slow query (12s for 1M rows)
SELECT * FROM orders
WHERE user_id = 12345
  AND status IN ('pending', 'processing')
  AND created_at > '2026-01-01'
ORDER BY created_at DESC
LIMIT 20;

-- Query plan: FULL TABLE SCAN (bad)
```

**Optimization**:
```sql
-- Add composite index
CREATE INDEX idx_orders_user_status_date
ON orders(user_id, status, created_at);

-- Query plan now: INDEX SCAN (good)
-- Execution time: 12s → 23ms (99.8% faster)
```

## Stack-Specific Optimization Patterns

### React/TypeScript

**Common Bottlenecks**:
- Large bundle size (heavy dependencies)
- Unnecessary re-renders
- Expensive computations in render
- Large lists without virtualization

**Optimization Tools**:
- webpack-bundle-analyzer
- React DevTools Profiler
- Lighthouse
- Chrome Performance tab

### Go

**Common Bottlenecks**:
- Unnecessary allocations
- Blocked goroutines
- Lock contention
- Inefficient algorithms

**Optimization Tools**:
- `go tool pprof`
- `go tool trace`
- Benchmarks with `-bench`
- Race detector with `-race`

### Rust

**Common Bottlenecks**:
- Large binary size
- Slow compile times
- Unnecessary cloning
- Allocations in hot paths

**Optimization Tools**:
- `cargo build --timings`
- `cargo bloat`
- `cargo flamegraph`
- Criterion benchmarks

## Conclusion

The optimize skill provides comprehensive performance analysis and actionable recommendations. Use it regularly to maintain optimal performance, reduce costs, and improve user experience.

**Key Takeaways**:
- Measure before optimizing
- Focus on high-impact, low-effort wins
- Prioritize user-perceived performance
- Set performance budgets
- Monitor in production

For security analysis, see the `audit` skill. For test gaps, see the `test-coverage` skill.
