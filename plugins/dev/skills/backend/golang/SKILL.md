---
name: golang
version: 2.0.0
description: Use when building Go backend services, implementing goroutines/channels, handling errors idiomatically, writing tests with testify, or following Go best practices for APIs/CLI tools.
keywords:
  - Go
  - Golang
  - concurrency
  - goroutines
  - channels
  - error handling
  - testing
  - backend
  - API
plugin: dev
updated: 2026-01-20
---

# Go Development Best Practices

**Version**: 2.0.0
**Purpose**: Comprehensive Go development patterns covering idioms, error handling, concurrency, testing, and quality
**Scope**: Backend development with Go - API services, CLI tools, system software
**Prerequisites**: Basic Go syntax knowledge

## Overview

Go (Golang) is designed for simplicity, explicit error handling, and safe concurrent programming. This skill covers production-ready patterns validated by the Go community, official documentation, and industry standards (Uber Engineering, Google).

**Core Philosophy**:
- **Simplicity**: "Clear is better than clever" - favor readable code over abstractions
- **Explicit over implicit**: No exceptions, no hidden control flow, visible errors
- **Composition over inheritance**: Interfaces and embedding, not class hierarchies
- **Built-in concurrency**: Goroutines and channels as first-class primitives
- **Tooling-first**: Format, vet, test, and benchmark built into the language

**Key Design Principles**:
1. Small interfaces (1-3 methods ideal)
2. Consumer-side interface placement
3. Error values, not exceptions
4. Happy path at left margin
5. Goroutines must have explicit termination

---

## 1. Idiomatic Go Patterns

### 1.1 Naming Conventions

**Package Names**:
```go
// ✅ GOOD: Package names are single lowercase identifiers
// Import path: "net/url" → package name: url
// Import path: "encoding/json" → package name: json
package url      // from "net/url"
package json     // from "encoding/json"
package strings

// ❌ BAD
package urls            // No plural
package encodingjson    // Don't smash words together
package stringutils     // Too verbose
```

**Getters and Setters**:
```go
type Account struct {
    balance int
}

// ✅ GOOD: No "Get" prefix
func (a *Account) Balance() int {
    return a.balance
}

func (a *Account) SetBalance(amount int) {
    a.balance = amount
}

// ❌ BAD: Java-style getters
func (a *Account) GetBalance() int {
    return a.balance
}
```

**Error Variables**:
```go
// Exported sentinel errors (capitalized)
var ErrNotFound = errors.New("not found")
var ErrTimeout = errors.New("timeout")

// Unexported internal errors (lowercase)
var errInternal = errors.New("internal error")
```

**Interface Naming**:
```go
// ✅ GOOD: Short, descriptive
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// ❌ BAD: Verbose or unclear
type DataReader interface { ... }
type IReader interface { ... }  // No "I" prefix
```

---

### 1.2 Interface Design - "The Bigger the Interface, the Weaker the Abstraction"

**Core Principle**: Small, consumer-side interfaces provide maximum flexibility.

**Single-Method Interfaces** (Ideal):
```go
// Standard library examples
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// Compose interfaces
type ReadCloser interface {
    Reader
    Closer
}
```

**Consumer-Side Interface Placement**:
```go
// ❌ WRONG: Producer defines interface
package store

type CustomerStorage interface {
    StoreCustomer(Customer) error
    GetCustomer(string) (Customer, error)
    UpdateCustomer(Customer) error
    // 10+ methods...
}

type PostgresStore struct {}
func (s *PostgresStore) StoreCustomer(...) { ... }

// ✅ CORRECT: Consumer defines what it needs
package client

type customerGetter interface {
    GetCustomer(string) (store.Customer, error)
}

func ProcessCustomer(cg customerGetter) {
    customer, _ := cg.GetCustomer("123")
    // Only depends on GetCustomer method
}
```

**Return Concrete Types, Accept Interfaces** (Postel's Law):
```go
// ✅ GOOD
func NewStore() *PostgresStore {
    return &PostgresStore{}
}

func Process(storage CustomerStorage) error {
    // Accepts interface
}

// ❌ BAD: Returning interface
func NewStore() CustomerStorage {
    return &PostgresStore{}
}
```

**When to Create Interfaces**:
- Multiple implementations exist or are planned
- Need for testing (mocking dependencies)
- Decoupling packages
- **NOT for**: Single implementation with no testing need

---

### 1.3 Happy Path Left, Early Returns

**Core Principle**: Align success path to left margin, handle errors first.

```go
// ❌ BAD: Deep nesting
func join(s1, s2 string, max int) (string, error) {
    if s1 == "" {
        return "", errors.New("s1 is empty")
    } else {
        if s2 == "" {
            return "", errors.New("s2 is empty")
        } else {
            concat, err := concatenate(s1, s2)
            if err != nil {
                return "", err
            } else {
                if len(concat) > max {
                    return concat[:max], nil
                } else {
                    return concat, nil
                }
            }
        }
    }
}

// ✅ GOOD: Happy path aligned left
func join(s1, s2 string, max int) (string, error) {
    if s1 == "" {
        return "", errors.New("s1 is empty")
    }
    if s2 == "" {
        return "", errors.New("s2 is empty")
    }

    concat, err := concatenate(s1, s2)
    if err != nil {
        return "", err
    }

    if len(concat) > max {
        return concat[:max], nil
    }
    return concat, nil
}
```

**Guidelines**:
- Maximum 3-4 levels of nesting
- Omit `else` blocks when `if` returns
- Handle errors immediately
- Keep normal flow at lowest indentation

---

### 1.4 Composition Over Inheritance

**Type Embedding** (Struct Composition):
```go
// Embedding for method promotion
type Logger struct {
    *log.Logger
    prefix string
}

func NewLogger(prefix string) *Logger {
    return &Logger{
        Logger: log.New(os.Stdout, "", 0),
        prefix: prefix,
    }
}

// Logger methods automatically available
logger := NewLogger("APP")
logger.Println("message") // Calls embedded log.Logger.Println
```

**Interface Composition**:
```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// Compose interfaces
type ReadCloser interface {
    Reader
    Closer
}
```

**Warning**: Avoid embedding in public APIs:
```go
// ❌ BAD: Exposes implementation details
type MyHandler struct {
    http.Handler // Leaks all Handler methods
}

// ✅ GOOD: Explicit delegation
type MyHandler struct {
    handler http.Handler
}

func (h *MyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // Custom logic
    h.handler.ServeHTTP(w, r)
}
```

---

### 1.5 Key Go Idioms

**Defer for Cleanup**:
```go
func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close() // Guaranteed cleanup

    // Multiple returns, all close file
    if condition {
        return nil // File closed
    }

    return process(f) // File closed
}

// Mutex pattern
func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()

    c.value++ // All paths unlock
}
```

**Critical Rule**: Call `defer` AFTER checking error:
```go
// ❌ WRONG
defer f.Close() // f is nil if Open failed
f, err := os.Open(path)

// ✅ CORRECT
f, err := os.Open(path)
if err != nil {
    return err
}
defer f.Close()
```

**Multiple Return Values**:
```go
// (value, error) - Standard error handling
func GetUser(id string) (*User, error) {
    // ...
}

// (value, bool) - "comma ok" idiom
value, ok := myMap[key]
if !ok {
    // key not found
}

result, ok := someValue.(TargetType)
if !ok {
    // type assertion failed
}

data, ok := <-channel
if !ok {
    // channel closed
}
```

**Blank Identifier `_`**:
```go
// Ignore unwanted values
_, err := os.Open(filename)

// Compile-time interface check
var _ http.Handler = (*MyHandler)(nil)

// Import for side effects
import _ "net/http/pprof"
```

**Useful Zero Values**:
```go
// sync.Mutex - ready to use
var mu sync.Mutex
mu.Lock() // Works immediately

// bytes.Buffer - valid empty buffer
var buf bytes.Buffer
buf.WriteString("hello") // No initialization needed

// Slices - safe to read
var s []int
fmt.Println(len(s)) // 0 (safe)
```

---

## 2. Error Handling

### 2.1 Error Wrapping with %w (Go 1.13+)

**Core Pattern**: Wrap errors with context using `fmt.Errorf` and `%w`.

```go
func processFile(path string) error {
    file, err := os.Open(path)
    if err != nil {
        // Wrap with context using %w
        return fmt.Errorf("failed to open file %s: %w", path, err)
    }
    defer file.Close()

    data, err := io.ReadAll(file)
    if err != nil {
        return fmt.Errorf("failed to read file %s: %w", path, err)
    }

    return processData(data)
}

// Result when error bubbles up:
// "failed to initialize: failed to open file config.json: open config.json: no such file or directory"
```

**Checking Wrapped Errors**:
```go
// errors.Is - Check for specific error in chain
if errors.Is(err, os.ErrNotExist) {
    fmt.Println("File doesn't exist")
}

// errors.As - Extract specific error type
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    fmt.Printf("Path error on: %s\n", pathErr.Path)
}
```

**Critical**: Use `%w`, NOT `%v`:
```go
// ❌ WRONG: Breaks error chain
return fmt.Errorf("failed: %v", err)

// ✅ CORRECT: Preserves chain
return fmt.Errorf("failed: %w", err)
```

---

### 2.2 Sentinel Errors vs Custom Error Types

**Sentinel Errors** (Package-Level Variables):
```go
package db

var (
    ErrConnectionFailed = errors.New("database connection failed")
    ErrRecordNotFound   = errors.New("record not found")
    ErrDuplicateKey     = errors.New("duplicate key violation")
)

func GetUser(id int) (*User, error) {
    // ...
    if notFound {
        return nil, ErrRecordNotFound
    }
    return user, nil
}

// Caller checks with errors.Is
user, err := db.GetUser(123)
if errors.Is(err, db.ErrRecordNotFound) {
    // Handle not found
}
```

**Custom Error Types** (Rich Context):
```go
type ValidationError struct {
    Field   string
    Value   interface{}
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for field '%s': %s (value: %v)",
        e.Field, e.Message, e.Value)
}

func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{
            Field:   "age",
            Value:   age,
            Message: "must be non-negative",
        }
    }
    return nil
}

// Caller extracts rich information
if err := validateAge(-5); err != nil {
    var valErr *ValidationError
    if errors.As(err, &valErr) {
        fmt.Printf("Field: %s, Value: %v\n", valErr.Field, valErr.Value)
    }
}
```

**Decision Guide**:
- **Sentinel errors**: Simple, global error conditions
- **Custom types**: Errors needing structured data or methods

**Important**: Use pointer receivers for error types:
```go
// ✅ CORRECT: Pointer receiver
func (e *ValidationError) Error() string { ... }

// ❌ WRONG: Value receiver (breaks errors.As)
func (e ValidationError) Error() string { ... }
```

---

### 2.3 Handle Errors Once

**Core Principle**: Either log the error OR return it, not both.

```go
// ❌ BAD: Handle twice (log AND return)
if err != nil {
    log.Printf("error: %v", err)  // Logged here
    return err                     // And returned
}

// ✅ GOOD: Return error, let caller handle
if err != nil {
    return fmt.Errorf("process: %w", err)
}

// ✅ GOOD: Log and handle completely
if err != nil {
    log.Printf("non-fatal error: %v", err)
    // Continue execution (error handled)
}
```

**Error Message Conventions**:
```go
// ✅ GOOD
var ErrNotFound = errors.New("configuration file not found")
return fmt.Errorf("failed to read settings for user %d: %w", userID, err)

// ❌ BAD
var ErrNotFound = errors.New("Error: Configuration file not found.") // No prefix, no punctuation
return fmt.Errorf("Error occurred: %v", err) // Too generic
```

---

### 2.4 Panic vs Error Decision Tree

```
Is this condition expected during normal operation?
├─ Yes → Return error
└─ No → Is this a programmer error?
    ├─ Yes → Panic (with clear message)
    └─ No → Is the program in an invalid state?
        ├─ Yes → Panic
        └─ No → Return error
```

**Use Errors When**:
```go
// Expected failures
func readConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }
    return parseConfig(data)
}

// Business logic failures
func createUser(email string) error {
    if !isValidEmail(email) {
        return fmt.Errorf("invalid email format: %s", email)
    }
    return nil
}
```

**Use Panic When**:
```go
// Nil argument (programmer error, document this!)
func ProcessData(data *Data) {
    if data == nil {
        panic("ProcessData: data argument must not be nil")
    }
    // ...
}

// Initialization failure
func init() {
    cfg, err := loadConfig()
    if err != nil {
        panic(fmt.Sprintf("fatal: failed to load config: %v", err))
    }
    globalConfig = cfg
}

// Impossible condition (indicates bug)
func (sm *StateMachine) transition(event Event) {
    newState := sm.computeNextState(event)
    if !sm.isValidTransition(newState) {
        panic(fmt.Sprintf("BUG: invalid state transition from %v to %v",
            sm.currentState, newState))
    }
    sm.currentState = newState
}
```

**Recovery** (Use Sparingly):
```go
// HTTP server recovering from handler panics
func safeHandler(h http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Printf("Handler panic: %v\n%s", rec, debug.Stack())
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        h(w, r)
    }
}
```

---

### 2.5 Concurrent Error Handling

**Pattern 1: errgroup (Coordinated Goroutines)**:
```go
import "golang.org/x/sync/errgroup"

func processFiles(ctx context.Context, files []string) error {
    g, ctx := errgroup.WithContext(ctx)

    for _, file := range files {
        file := file // Capture loop variable
        g.Go(func() error {
            return processFile(ctx, file)
        })
    }

    // Wait for all, return first error
    if err := g.Wait(); err != nil {
        return fmt.Errorf("file processing failed: %w", err)
    }
    return nil
}
```

**Pattern 2: Error Channel (Collect All Errors)**:
```go
func processAll(items []Item) []error {
    errChan := make(chan error, len(items))
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(i Item) {
            defer wg.Done()
            if err := process(i); err != nil {
                errChan <- err
            }
        }(item)
    }

    go func() {
        wg.Wait()
        close(errChan)
    }()

    var errs []error
    for err := range errChan {
        errs = append(errs, err)
    }
    return errs
}
```

---

## 3. Concurrency Patterns

### 3.1 Goroutine Lifecycle and Leak Prevention

**Core Principle**: Every goroutine must have an explicit termination mechanism.

**Pattern: Context Cancellation + WaitGroup**:
```go
func runWorkers(ctx context.Context, n int) {
    var wg sync.WaitGroup

    for i := 0; i < n; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()

            for {
                select {
                case <-ctx.Done():
                    return // Clean exit
                default:
                    doWork(id)
                }
            }
        }(i)
    }

    wg.Wait() // Wait for all goroutines
}

// Usage
ctx, cancel := context.WithCancel(context.Background())
go runWorkers(ctx, 10)

// Later: stop all workers
cancel()
```

**Common Leak: Unbuffered Channel Send**:
```go
// ❌ LEAK: Goroutine blocks forever if no receiver
func leak() {
    ch := make(chan int)
    go func() {
        ch <- 42 // Blocks forever
    }()
    // Function returns, goroutine leaked
}

// ✅ FIX: Buffered channel or ensure receiver
func fixed() {
    ch := make(chan int, 1) // Buffer size 1
    go func() {
        ch <- 42 // Won't block
    }()
}
```

---

### 3.2 Channel Patterns

**Unbuffered vs Buffered Semantics**:
```go
// Unbuffered: Synchronous handoff
done := make(chan bool)
go func() {
    doWork()
    done <- true // Blocks until main receives
}()
<-done // Guaranteed: work completed

// Buffered: Asynchronous
jobs := make(chan Job, 100)
for w := 0; w < numWorkers; w++ {
    go func() {
        for job := range jobs {
            process(job)
        }
    }()
}
```

**Channel Closing Rules**:
```go
// ✅ GOOD: Only sender closes
jobs := make(chan Job)
go func() {
    for _, job := range allJobs {
        jobs <- job
    }
    close(jobs) // Signal: no more jobs
}()

for job := range jobs {
    process(job) // Exits when channel closed
}

// ❌ NEVER: Close from receiver
// ❌ NEVER: Close closed channel (panics)
// ❌ NEVER: Send on closed channel (panics)
```

**Select Pattern for Cancellation**:
```go
func worker(ctx context.Context, jobs <-chan Job) {
    for {
        select {
        case job := <-jobs:
            process(job)
        case <-ctx.Done():
            return // Cancel signal
        }
    }
}
```

---

### 3.3 Context Package for Cancellation

**Context Types**:
```go
// Root contexts
ctx := context.Background() // Main/init
ctx := context.TODO()       // Placeholder

// Cancellation
ctx, cancel := context.WithCancel(parent)
defer cancel() // Always call

// Timeout
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
defer cancel()

// Deadline
ctx, cancel := context.WithDeadline(parent, time.Now().Add(5*time.Second))
defer cancel()

// Values (use sparingly, only for request-scoped data)
ctx = context.WithValue(parent, key, value)
```

**Best Practices**:
```go
// ✅ GOOD: Context as first parameter
func makeRequest(ctx context.Context, url string) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := client.Do(req)
    if err != nil {
        return err // Returns context.DeadlineExceeded on timeout
    }
    defer resp.Body.Close()
    return nil
}

// Check cancellation in loops
func longRunning(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            processChunk()
        }
    }
}
```

**Context Rules**:
1. Pass context as first parameter: `func Do(ctx context.Context, ...)`
2. Never store context in struct
3. Always call cancel function (prevents leak)
4. Use `WithValue` only for request-scoped data, not options

---

### 3.4 Sync Primitives

**sync.Mutex**:
```go
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}
```

**sync.RWMutex** (Read-Heavy Workloads):
```go
type Cache struct {
    mu    sync.RWMutex
    items map[string]Item
}

func (c *Cache) Get(key string) (Item, bool) {
    c.mu.RLock() // Multiple readers allowed
    defer c.mu.RUnlock()
    item, ok := c.items[key]
    return item, ok
}

func (c *Cache) Set(key string, item Item) {
    c.mu.Lock() // Exclusive write
    defer c.mu.Unlock()
    c.items[key] = item
}
```

**sync.WaitGroup**:
```go
var wg sync.WaitGroup

for _, item := range items {
    wg.Add(1) // BEFORE starting goroutine
    go func(i Item) {
        defer wg.Done()
        process(i)
    }(item)
}

wg.Wait() // Block until all complete
```

**sync.Once** (One-Time Initialization):
```go
var (
    instance *Singleton
    once     sync.Once
)

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
        instance.init()
    })
    return instance
}
```

**sync/atomic** (Lock-Free):
```go
type Counter struct {
    value atomic.Int64 // Go 1.19+
}

func (c *Counter) Increment() int64 {
    return c.value.Add(1)
}
```

**When to Use What**:
- **Mutex**: Protecting compound operations, complex state
- **RWMutex**: Read-heavy (10:1 read:write ratio+)
- **WaitGroup**: Waiting for goroutines
- **Once**: Lazy initialization
- **Atomic**: Simple counters, flags
- **Channels**: Communication, coordination

---

### 3.5 Worker Pool Pattern

```go
func workerPool(ctx context.Context, numWorkers int, jobs <-chan Job, results chan<- Result) {
    var wg sync.WaitGroup

    for w := 0; w < numWorkers; w++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for {
                select {
                case job, ok := <-jobs:
                    if !ok {
                        return // Jobs channel closed
                    }
                    result := processJob(job)
                    select {
                    case results <- result:
                    case <-ctx.Done():
                        return
                    }
                case <-ctx.Done():
                    return
                }
            }
        }(w)
    }

    wg.Wait()
    close(results) // Signal completion
}

// Usage
ctx, cancel := context.WithCancel(context.Background())
defer cancel()

jobs := make(chan Job, 100)
results := make(chan Result, 100)

go workerPool(ctx, 10, jobs, results)

// Send jobs
go func() {
    for _, job := range allJobs {
        jobs <- job
    }
    close(jobs)
}()

// Collect results
for result := range results {
    handleResult(result)
}
```

---

### 3.6 Race Detection

**Running Race Detector**:
```bash
go test -race ./...
go build -race
go run -race main.go
```

**Common Race Conditions**:
```go
// ❌ RACE: Unsynchronized map
var cache = make(map[string]string)

func get(key string) string {
    return cache[key] // RACE
}

func set(key, value string) {
    cache[key] = value // RACE
}

// ✅ FIX: Use sync.Map
var cache sync.Map

func get(key string) string {
    val, _ := cache.Load(key)
    return val.(string)
}

// ❌ RACE: Loop variable capture
for _, item := range items {
    go func() {
        process(item) // RACE
    }()
}

// ✅ FIX: Pass as parameter
for _, item := range items {
    go func(i Item) {
        process(i)
    }(item)
}
```

---

## 4. Testing Patterns

### 4.1 Table-Driven Tests

**Standard Pattern**:
```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -2, -3, -5},
        {"mixed signs", -2, 3, 1},
        {"zeros", 0, 0, 0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

**Best Practices**:
- Always use `t.Run()` for subtests
- Descriptive test case names
- Use anonymous structs for test data
- Enable parallel execution with `t.Parallel()`

---

### 4.2 Test Helpers with t.Helper()

```go
func assertEqual(t *testing.T, got, want interface{}) {
    t.Helper() // Error points to caller, not here
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}

func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        t.Fatalf("failed to open test db: %v", err)
    }

    t.Cleanup(func() {
        db.Close() // Automatic cleanup
    })

    return db
}
```

---

### 4.3 Integration vs Unit Testing

**Unit Test** (Fast, Isolated):
```go
func TestCalculatePrice(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name     string
        quantity int
        price    float64
        expected float64
    }{
        {"single item", 1, 10.0, 10.0},
        {"multiple items", 5, 10.0, 50.0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := CalculatePrice(tt.quantity, tt.price)
            if result != tt.expected {
                t.Errorf("got %v, want %v", result, tt.expected)
            }
        })
    }
}
```

**Integration Test** (Build Tag):
```go
//go:build integration
// +build integration

package myapp_test

func TestDatabaseOperations(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }

    db := setupTestDatabase(t)
    defer db.Close()

    err := InsertUser(db, &User{Name: "John"})
    if err != nil {
        t.Fatalf("failed to insert user: %v", err)
    }
}
```

**Running Tests**:
```bash
go test ./...                      # Unit tests only
go test -short ./...               # Skip slow tests
go test -tags=integration ./...    # Integration tests
```

---

## 5. Quality Checks

### 5.1 golangci-lint Configuration

**Recommended .golangci.yml**:
```yaml
run:
  timeout: 5m

linters:
  enable:
    - errcheck      # Unchecked errors
    - gosimple      # Simplify code
    - govet         # Go vet
    - staticcheck   # Static analysis
    - unused        # Unused code
    - gofmt         # Formatting
    - goimports     # Imports
    - revive        # Fast linter
    - gosec         # Security
    - errorlint     # Error wrapping

linters-settings:
  errcheck:
    check-type-assertions: true
    check-blank: true

  govet:
    enable-all: true

  revive:
    rules:
      - name: error-strings
      - name: error-naming
      - name: exported
      - name: indent-error-flow

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
        - gosec
```

---

### 5.2 Running Quality Checks

**Standard Workflow**:
```bash
# Format Go code
go fmt ./...

# Static analysis
go vet ./...

# Comprehensive linting (if golangci-lint installed)
golangci-lint run

# Run tests with race detector
go test -race ./...

# Coverage
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

**CI/CD Integration (GitHub Actions)**:
```yaml
- name: golangci-lint
  uses: golangci/golangci-lint-action@v3
  with:
    version: latest

- name: Tests
  run: go test -race -coverprofile=coverage.out ./...

- name: Coverage
  run: |
    COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      exit 1
    fi
```

---

## 6. Structured Logging Patterns

### 6.1 Structured Logging with slog (Go 1.21+)

**Basic Usage**:
```go
import "log/slog"

func main() {
    // JSON handler for production
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    logger.Info("server starting",
        slog.String("port", "8080"),
        slog.Int("workers", 10))

    // With context
    logger.InfoContext(ctx, "request processed",
        slog.String("method", "GET"),
        slog.String("path", "/api/users"),
        slog.Duration("latency", 45*time.Millisecond))
}
```

**Log Levels**:
```go
logger.Debug("debug message")    // Development
logger.Info("info message")      // General info
logger.Warn("warning message")   // Warnings
logger.Error("error message")    // Errors
```

**Request Context Logging**:
```go
func requestLogger(ctx context.Context, logger *slog.Logger) *slog.Logger {
    requestID := ctx.Value("request_id").(string)
    return logger.With(
        slog.String("request_id", requestID),
        slog.String("user_id", getUserID(ctx)),
    )
}

// Usage in handler
func handleRequest(w http.ResponseWriter, r *http.Request) {
    log := requestLogger(r.Context(), baseLogger)

    log.Info("processing request",
        slog.String("path", r.URL.Path),
        slog.String("method", r.Method))

    // All logs include request_id and user_id
    log.Error("database query failed",
        slog.String("error", err.Error()))
}
```

---

## 7. Anti-Patterns to Avoid

### Critical Anti-Patterns with Severity Tags

**1. [CRITICAL] Swallowing Errors**:
```go
// ❌ WRONG
data, _ := fetchData()

// ✅ CORRECT
data, err := fetchData()
if err != nil {
    return fmt.Errorf("fetch failed: %w", err)
}
```

**2. [CRITICAL] Using %v Instead of %w**:
```go
// ❌ WRONG: Breaks error chain
return fmt.Errorf("failed: %v", err)

// ✅ CORRECT
return fmt.Errorf("failed: %w", err)
```

**3. [HIGH] Defer in Hot Loops**:
```go
// ❌ WRONG: Defers accumulate
for _, item := range items {
    mu.Lock()
    defer mu.Unlock() // Never executes until function returns
    process(item)
}

// ✅ CORRECT
for _, item := range items {
    mu.Lock()
    process(item)
    mu.Unlock()
}
```

**4. [CRITICAL] Goroutine Leaks**:
```go
// ❌ WRONG: No way to stop
go func() {
    for {
        doWork()
    }
}()

// ✅ CORRECT: Context cancellation
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            doWork()
        }
    }
}()
```

**5. [CRITICAL] Loop Variable Capture**:
```go
// ❌ WRONG: All goroutines see last value
for _, item := range items {
    go func() {
        process(item) // RACE
    }()
}

// ✅ CORRECT: Pass as parameter
for _, item := range items {
    go func(i Item) {
        process(i)
    }(item)
}
```

**6. [MEDIUM] Map Without Pre-allocation**:
```go
// ❌ WRONG: Multiple rehashes
m := make(map[string]Item)
for _, item := range items {
    m[item.ID] = item
}

// ✅ CORRECT: Pre-sized
m := make(map[string]Item, len(items))
```

**7. [HIGH] time.After in Loops (Memory Leak)**:
```go
// ❌ WRONG: Creates timer each iteration
for {
    select {
    case <-time.After(5 * time.Second):
        timeout()
    }
}

// ✅ CORRECT: Reuse timer
timer := time.NewTimer(5 * time.Second)
defer timer.Stop()
for {
    select {
    case <-timer.C:
        timeout()
        timer.Reset(5 * time.Second)
    }
}
```

**8. [HIGH] Checking Error Strings**:
```go
// ❌ WRONG: Fragile
if err != nil && strings.Contains(err.Error(), "not found") {
    // ...
}

// ✅ CORRECT: Use errors.Is
if errors.Is(err, sql.ErrNoRows) {
    // ...
}
```

**9. [CRITICAL] Not Calling cancel()**:
```go
// ❌ WRONG: Context leak
ctx, cancel := context.WithCancel(parent)
doWork(ctx)

// ✅ CORRECT: Always defer cancel
ctx, cancel := context.WithCancel(parent)
defer cancel()
doWork(ctx)
```

**10. [MEDIUM] Producer-Side Interfaces**:
```go
// ❌ WRONG
package store
type Storage interface { ... }
type Store struct {}

// ✅ CORRECT
package client
type storage interface { ... } // Define where used
```

---

## References

**Official Documentation**:
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- [Go Blog: Error Handling](https://go.dev/blog/go1.13-errors)
- [Go Blog: Context](https://go.dev/blog/context)

**Industry Standards**:
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [100 Go Mistakes](https://www.manning.com/books/100-go-mistakes-and-how-to-avoid-them)

**Research Source**:
- Comprehensive research: `/ai-docs/sessions/dev-research-golang-best-practices-20260106-233135-773b0173/report.md`
- 15 unanimous consensus patterns
- 42 high-quality sources (100% official/industry standards)
- Zero contradictions found

---

**Skill Version**: 2.0.0
**Last Updated**: January 7, 2026
**Maintainer**: MadAppGang/claude-code
