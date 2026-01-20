---
name: golang-performance
version: 1.0.0
description: Use when profiling Go applications (pprof), running benchmarks, optimizing memory/CPU usage, or debugging performance bottlenecks in production Go code.
keywords:
  - Go performance
  - profiling
  - pprof
  - benchmarking
  - optimization
  - memory optimization
  - CPU profiling
  - performance tuning
plugin: dev
updated: 2026-01-20
---

# Go Performance Optimization

## Overview

This skill provides comprehensive guidance for profiling, benchmarking, and optimizing Go applications. Use this skill when working on performance-critical code, investigating bottlenecks, or optimizing production systems.

**When to Use This Skill**:
- Profiling application performance
- Benchmarking code changes
- Investigating memory leaks or high allocations
- Optimizing hot paths
- Tuning garbage collection
- Reducing latency in production

**Core Tools**:
- `pprof` - CPU, memory, and goroutine profiling
- `go test -bench` - Benchmarking framework
- `go build -gcflags` - Escape analysis
- `GOGC` and `GOMEMLIMIT` - GC tuning

---

## 1. Profiling with pprof

### 1.1 CPU Profiling

**Enable CPU Profiling in Code**:
```go
import (
    "os"
    "runtime/pprof"
)

func main() {
    f, err := os.Create("cpu.prof")
    if err != nil {
        log.Fatal("could not create CPU profile: ", err)
    }
    defer f.Close()

    if err := pprof.StartCPUProfile(f); err != nil {
        log.Fatal("could not start CPU profile: ", err)
    }
    defer pprof.StopCPUProfile()

    // Your application code here
    runApplication()
}
```

**CLI Profiling**:
```bash
# Profile a test
go test -cpuprofile=cpu.prof -bench=.

# Profile a binary
go test -c
./myapp.test -test.cpuprofile=cpu.prof -test.bench=.
```

**Analysis Commands**:
```bash
# Interactive web UI (recommended)
go tool pprof -http=:8080 cpu.prof

# Text output - top functions by CPU time
go tool pprof -top cpu.prof

# Top 20 with cumulative time
go tool pprof -top -cum cpu.prof | head -20

# Call graph visualization
go tool pprof -svg cpu.prof > cpu.svg

# Focus on specific function
go tool pprof -focus=processData cpu.prof

# Exclude standard library
go tool pprof -ignore=runtime cpu.prof
```

**Interpreting CPU Profiles**:
- **flat**: Time spent in function itself (excludes callees)
- **flat%**: Percentage of total runtime
- **sum%**: Cumulative percentage
- **cum**: Time spent in function and callees
- **cum%**: Cumulative time percentage

**Example Output**:
```
Showing nodes accounting for 2.50s, 83.33% of 3.00s total
      flat  flat%   sum%        cum   cum%
     0.80s 26.67% 26.67%      1.20s 40.00%  processData
     0.60s 20.00% 46.67%      0.90s 30.00%  parseJSON
     0.50s 16.67% 63.34%      0.50s 16.67%  validateInput
```

Focus optimization on functions with high `flat` (own time) or `cum` (total time).

---

### 1.2 Memory Profiling

**Heap Profiling**:
```go
import (
    "os"
    "runtime/pprof"
)

func captureHeapProfile() {
    f, err := os.Create("mem.prof")
    if err != nil {
        log.Fatal("could not create memory profile: ", err)
    }
    defer f.Close()

    // Force GC before capturing heap
    runtime.GC()

    if err := pprof.WriteHeapProfile(f); err != nil {
        log.Fatal("could not write memory profile: ", err)
    }
}
```

**Memory Profiling via CLI**:
```bash
# Profile memory allocations during test
go test -memprofile=mem.prof -bench=.

# Run benchmark multiple times for stable results
go test -memprofile=mem.prof -bench=. -benchtime=10s
```

**Analysis Commands**:
```bash
# Web UI showing allocation sites
go tool pprof -http=:8080 mem.prof

# Top allocators
go tool pprof -top mem.prof

# Focus on allocations (inuse_space)
go tool pprof -sample_index=inuse_space -top mem.prof

# Focus on allocation counts (inuse_objects)
go tool pprof -sample_index=inuse_objects -top mem.prof

# Show cumulative allocations (alloc_space)
go tool pprof -sample_index=alloc_space -top mem.prof

# Compare two profiles (before/after)
go tool pprof -base=before.prof after.prof
```

**Memory Profile Types**:
- `inuse_space`: Memory currently in use (default)
- `inuse_objects`: Objects currently in use
- `alloc_space`: Total allocations since start
- `alloc_objects`: Total object allocations

---

### 1.3 Goroutine Profiling

**Detect Goroutine Leaks**:
```go
import (
    "os"
    "runtime/pprof"
)

func captureGoroutineProfile() {
    f, err := os.Create("goroutine.prof")
    if err != nil {
        log.Fatal("could not create goroutine profile: ", err)
    }
    defer f.Close()

    if err := pprof.Lookup("goroutine").WriteTo(f, 0); err != nil {
        log.Fatal("could not write goroutine profile: ", err)
    }
}
```

**Analysis**:
```bash
go tool pprof -http=:8080 goroutine.prof
go tool pprof -top goroutine.prof
```

**Goroutine Leak Indicators**:
- Steadily increasing goroutine count
- Many goroutines blocked on channel recv/send
- Goroutines without termination mechanism

---

### 1.4 HTTP Profiling Endpoint (Production-Safe)

**Enable pprof HTTP Server**:
```go
import (
    _ "net/http/pprof"
    "net/http"
)

func main() {
    // Start pprof server on separate port (localhost only)
    go func() {
        log.Println("pprof server listening on localhost:6060")
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()

    // Your application here
    runServer()
}
```

**Access Profiles via HTTP**:
```bash
# CPU profile (30 seconds)
curl http://localhost:6060/debug/pprof/profile?seconds=30 > cpu.prof

# Heap profile
curl http://localhost:6060/debug/pprof/heap > heap.prof

# Goroutine profile
curl http://localhost:6060/debug/pprof/goroutine > goroutine.prof

# Analyze immediately
go tool pprof http://localhost:6060/debug/pprof/profile

# Web UI
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile
```

**Available Endpoints**:
- `/debug/pprof/` - Index of all profiles
- `/debug/pprof/profile` - CPU profile
- `/debug/pprof/heap` - Heap profile
- `/debug/pprof/goroutine` - Goroutine stack traces
- `/debug/pprof/threadcreate` - Thread creation profile
- `/debug/pprof/block` - Blocking profile
- `/debug/pprof/mutex` - Mutex contention profile

**Production Security**:
```go
// Only expose on localhost
http.ListenAndServe("localhost:6060", nil)

// Or use SSH port forwarding
// ssh -L 6060:localhost:6060 user@production-host
// Then access http://localhost:6060/debug/pprof/
```

---

## 2. Benchmarking

### 2.1 Basic Benchmarks

**Simple Benchmark**:
```go
func BenchmarkStringConcat(b *testing.B) {
    for i := 0; i < b.N; i++ {
        result := "hello" + " " + "world"
        _ = result // Prevent compiler optimization
    }
}
```

**Benchmark with Setup**:
```go
func BenchmarkProcessData(b *testing.B) {
    data := generateTestData(1000)
    b.ResetTimer() // Exclude setup time

    for i := 0; i < b.N; i++ {
        processData(data)
    }
}
```

**Running Benchmarks**:
```bash
# Run all benchmarks
go test -bench=.

# Run specific benchmark
go test -bench=BenchmarkStringConcat

# Benchmark with memory statistics
go test -bench=. -benchmem

# Run multiple iterations for stability
go test -bench=. -count=5

# Longer benchmark time for accurate results
go test -bench=. -benchtime=10s

# CPU profile during benchmark
go test -bench=. -cpuprofile=cpu.prof
```

---

### 2.2 Sub-Benchmarks

**Compare Multiple Implementations**:
```go
func BenchmarkStringBuilding(b *testing.B) {
    items := []string{"hello", "world", "foo", "bar"}

    b.Run("Concat", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            result := ""
            for _, item := range items {
                result += item
            }
            _ = result
        }
    })

    b.Run("StringBuilder", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            var sb strings.Builder
            for _, item := range items {
                sb.WriteString(item)
            }
            _ = sb.String()
        }
    })

    b.Run("Join", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            result := strings.Join(items, "")
            _ = result
        }
    })
}
```

**Output**:
```
BenchmarkStringBuilding/Concat-8          500000    3245 ns/op    96 B/op    5 allocs/op
BenchmarkStringBuilding/StringBuilder-8   2000000    825 ns/op    64 B/op    1 allocs/op
BenchmarkStringBuilding/Join-8            2000000    780 ns/op    48 B/op    1 allocs/op
```

---

### 2.3 Memory Reporting

**Track Allocations**:
```go
func BenchmarkWithAllocs(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        data := make([]int, 1000)
        _ = data
    }
}
```

**Output Interpretation**:
```
BenchmarkWithAllocs-8    200000    8234 ns/op    8192 B/op    1 allocs/op
                         ------    ----           ----         ----
                         iters     ns/op          bytes/op     allocs/op
```

- **ns/op**: Nanoseconds per operation
- **B/op**: Bytes allocated per operation
- **allocs/op**: Number of allocations per operation

**Zero Allocation Goal**:
```go
// Bad: 2 allocations
func process(data string) string {
    upper := strings.ToUpper(data) // 1 alloc
    return strings.TrimSpace(upper) // 1 alloc
}

// Better: 1 allocation (reuse buffer)
func process(data string) string {
    var sb strings.Builder
    sb.Grow(len(data))
    for _, r := range data {
        if !unicode.IsSpace(r) {
            sb.WriteRune(unicode.ToUpper(r))
        }
    }
    return sb.String()
}
```

---

### 2.4 Benchmark Analysis with benchstat

**Compare Before/After**:
```bash
# Baseline
go test -bench=. -count=10 > old.txt

# After optimization
go test -bench=. -count=10 > new.txt

# Statistical comparison
go install golang.org/x/perf/cmd/benchstat@latest
benchstat old.txt new.txt
```

**Example Output**:
```
name                old time/op    new time/op    delta
StringConcat-8      3.24µs ± 2%    0.82µs ± 1%   -74.69%  (p=0.000 n=10+10)

name                old alloc/op   new alloc/op   delta
StringConcat-8       96.0B ± 0%     64.0B ± 0%   -33.33%  (p=0.000 n=10+10)

name                old allocs/op  new allocs/op  delta
StringConcat-8        5.00 ± 0%      1.00 ± 0%   -80.00%  (p=0.000 n=10+10)
```

**Interpretation**:
- `±2%` - Variance across runs
- `(p=0.000)` - Statistical significance (p < 0.05 = significant)
- `n=10+10` - Number of samples used

---

## 3. Memory Optimization

### 3.1 Pre-allocate Slices

**Problem: Repeated Reallocation**:
```go
// Bad: 14 reallocations for 10,000 items
func inefficient() []int {
    var data []int
    for i := 0; i < 10000; i++ {
        data = append(data, i)
    }
    return data
}
```

**Solution: Pre-allocate Capacity**:
```go
// Good: 1 allocation
func efficient() []int {
    data := make([]int, 0, 10000)
    for i := 0; i < 10000; i++ {
        data = append(data, i)
    }
    return data
}
```

**Transformation Pattern**:
```go
func transformItems(input []string) []Result {
    output := make([]Result, 0, len(input))
    for _, item := range input {
        output = append(output, transform(item))
    }
    return output
}
```

**Estimated Capacity**:
```go
func filterItems(input []string, minLen int) []string {
    // Estimate ~50% will pass
    output := make([]string, 0, len(input)/2)
    for _, item := range input {
        if len(item) >= minLen {
            output = append(output, item)
        }
    }
    return output
}
```

**Benchmark Impact**: 5x faster for 10,000 items

---

### 3.2 strings.Builder for Concatenation

**Problem: O(N²) String Concatenation**:
```go
// Bad: Creates new string on every iteration
func badConcat(items []string) string {
    result := ""
    for _, item := range items {
        result += item // New allocation each time
    }
    return result
}
```

**Solution: strings.Builder (O(N))**:
```go
// Good: Single allocation with growth
func goodConcat(items []string) string {
    var sb strings.Builder

    // Pre-allocate if size known
    totalLen := 0
    for _, item := range items {
        totalLen += len(item)
    }
    sb.Grow(totalLen)

    for _, item := range items {
        sb.WriteString(item)
    }
    return sb.String()
}
```

**Benchmark**: 50x faster for 100 concatenations

**Builder Methods**:
```go
var sb strings.Builder
sb.WriteString("hello")    // Write string
sb.WriteByte('!')          // Write single byte
sb.WriteRune('✓')          // Write rune (Unicode)
sb.Grow(100)               // Pre-allocate capacity
result := sb.String()       // Get final string
sb.Reset()                  // Reuse builder
```

---

### 3.3 Escape Analysis

**View Escape Decisions**:
```bash
go build -gcflags='-m -m' main.go 2>&1 | grep "escapes to heap"
```

**Stack vs Heap**:
```go
// Stack allocated (fast)
func sumArray() int {
    data := [100]int{} // Stack
    sum := 0
    for _, v := range data {
        sum += v
    }
    return sum
}

// Heap allocated (slower, escapes)
func createData() *Data {
    data := &Data{} // Escapes: pointer returned
    return data
}
```

**Common Escape Scenarios**:
```go
// 1. Returning pointer to local variable
func escape1() *int {
    x := 42
    return &x // Escapes
}

// 2. Interface conversion
func escape2() interface{} {
    x := 42
    return x // Escapes (interface)
}

// 3. Storing in interface field
func escape3(data interface{}) {
    globalVar = data // Escapes
}

// 4. Size too large for stack
func escape4() {
    data := make([]byte, 1<<20) // 1MB, escapes
    _ = data
}

// 5. Slice append beyond capacity
func escape5() {
    data := make([]int, 0, 10)
    for i := 0; i < 100; i++ {
        data = append(data, i) // May escape
    }
}
```

**Reducing Escapes**:
```go
// Before: Escapes to heap
for _, item := range items {
    result := &Result{Value: item}
    process(result)
}

// After: Stack allocated (if process doesn't store it)
var result Result
for _, item := range items {
    result.Value = item
    process(&result)
}
```

---

### 3.4 Reducing Allocations in Hot Paths

**Reuse Buffers**:
```go
// Package-level buffer pool
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func processData(data []byte) string {
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.Reset() // Clear previous content
    defer bufferPool.Put(buf)

    // Use buffer
    buf.Write(data)
    return buf.String()
}
```

**Pre-allocate Maps**:
```go
// Bad: Multiple rehashes
m := make(map[string]Item)
for _, item := range items {
    m[item.ID] = item
}

// Good: Single allocation
m := make(map[string]Item, len(items))
for _, item := range items {
    m[item.ID] = item
}
```

---

## 4. GC Tuning

### 4.1 GOGC Environment Variable

**Default Behavior**:
```bash
# Default: GC when heap grows 100%
GOGC=100 ./myapp
```

**Tuning Options**:
```bash
# Less frequent GC (uses more memory, higher throughput)
GOGC=200 ./myapp

# More frequent GC (uses less memory, lower latency)
GOGC=50 ./myapp

# Disable GC (debugging only)
GOGC=off ./myapp
```

**How GOGC Works**:
- `GOGC=100`: GC triggers when heap doubles
- `GOGC=200`: GC triggers when heap triples
- `GOGC=50`: GC triggers when heap grows 50%

**Example**:
- Current heap: 100MB
- `GOGC=100`: GC at 200MB
- `GOGC=200`: GC at 300MB
- `GOGC=50`: GC at 150MB

---

### 4.2 GOMEMLIMIT (Go 1.19+)

**Set Memory Limit**:
```bash
# Via environment variable
GOMEMLIMIT=10GiB ./myapp

# Programmatically
debug.SetMemoryLimit(10 << 30) // 10GB
```

**Units Supported**:
- `B` - Bytes
- `KiB` - Kibibytes (1024 bytes)
- `MiB` - Mebibytes (1024² bytes)
- `GiB` - Gibibytes (1024³ bytes)
- `TiB` - Tebibytes (1024⁴ bytes)

**How it Works**:
- Soft limit (not hard cap)
- GC becomes more aggressive near limit
- Prevents OOM kills in containers
- Works alongside GOGC

---

### 4.3 GC Tuning Decision Matrix

| Scenario | GOGC | GOMEMLIMIT | Rationale |
|----------|------|------------|-----------|
| **High throughput batch** | 200-400 | 80% of RAM | Reduce GC overhead, use available memory |
| **Memory-constrained (container)** | 50-100 | Limit - 10% | Prevent OOM, more frequent GC |
| **Latency-sensitive API** | 100 | Not set | Default balance between memory and pause |
| **Large heap (>4GB)** | 100-200 | 80% of RAM | Reduce GC frequency for large heaps |
| **Short-lived processes** | 400+ | Not set | Maximize speed, process ends soon |

**Example: Container with 2GB RAM**:
```bash
GOGC=75 GOMEMLIMIT=1800MiB ./myapp
```

**Example: Batch Processing**:
```bash
GOGC=300 GOMEMLIMIT=24GiB ./batch-processor
```

**Monitoring GC**:
```go
import "runtime/debug"

// Get GC stats
var stats debug.GCStats
debug.ReadGCStats(&stats)
fmt.Printf("Last GC: %v\n", stats.LastGC)
fmt.Printf("Num GC: %d\n", stats.NumGC)
```

---

## 5. Performance Anti-Patterns

### 5.1 String Concatenation in Loops

**Anti-Pattern**:
```go
// Bad: O(N²) complexity
func buildString(items []string) string {
    result := ""
    for _, item := range items {
        result += item // New allocation each iteration
    }
    return result
}
```

**Solution**:
```go
// Good: O(N) complexity
func buildString(items []string) string {
    var sb strings.Builder
    for _, item := range items {
        sb.WriteString(item)
    }
    return sb.String()
}
```

---

### 5.2 Unnecessary Allocations

**Anti-Pattern 1: Creating Pointers in Loops**:
```go
// Bad: N allocations
for _, item := range items {
    ptr := &item
    process(ptr)
}

// Good: Reuse pointer
var ptr *Item
for i := range items {
    ptr = &items[i]
    process(ptr)
}
```

**Anti-Pattern 2: Converting to Interface**:
```go
// Bad: Causes allocation
func printAll(items []MyStruct) {
    for _, item := range items {
        fmt.Println(item) // Interface conversion
    }
}

// Better: Pass pointer to avoid copy
func printAll(items []MyStruct) {
    for i := range items {
        fmt.Println(&items[i])
    }
}
```

---

### 5.3 Defer Overhead in Hot Paths

**Anti-Pattern**:
```go
// Bad: Defer has overhead in hot loops
func processMany(items []Item) {
    for _, item := range items {
        mu.Lock()
        defer mu.Unlock() // Accumulates, never runs until function exits
        process(item)
    }
}
```

**Solution**:
```go
// Good: Manual unlock in loop
func processMany(items []Item) {
    for _, item := range items {
        mu.Lock()
        process(item)
        mu.Unlock()
    }
}

// Or: Extract to function with defer
func processMany(items []Item) {
    for _, item := range items {
        processOne(item)
    }
}

func processOne(item Item) {
    mu.Lock()
    defer mu.Unlock()
    process(item)
}
```

---

## Quick Reference

### Profiling Commands
```bash
# CPU profile
go test -cpuprofile=cpu.prof -bench=.
go tool pprof -http=:8080 cpu.prof

# Memory profile
go test -memprofile=mem.prof -bench=.
go tool pprof -http=:8080 mem.prof

# HTTP profiling (production)
curl http://localhost:6060/debug/pprof/profile?seconds=30 > cpu.prof
```

### Benchmarking Commands
```bash
# Run benchmarks with memory stats
go test -bench=. -benchmem

# Compare before/after
go test -bench=. -count=10 > old.txt
benchstat old.txt new.txt
```

### Optimization Checklist
- [ ] Profile before optimizing (identify hot paths)
- [ ] Pre-allocate slices with known capacity
- [ ] Use `strings.Builder` for string concatenation
- [ ] Check escape analysis with `-gcflags='-m'`
- [ ] Reduce allocations in hot loops
- [ ] Reuse buffers with `sync.Pool`
- [ ] Benchmark changes with `-benchmem`
- [ ] Tune GOGC/GOMEMLIMIT for workload

---

**Related Skills**:
- `golang` - Core Go idioms and patterns
- `database-patterns` - Database performance optimization
- `api-design` - API performance best practices

**Sources**:
- Go Diagnostics Guide: https://go.dev/doc/diagnostics
- Go Blog: Profiling Go Programs
- runtime/pprof package documentation
- Go 1.19 Memory Limit blog post
- benchstat tool documentation
