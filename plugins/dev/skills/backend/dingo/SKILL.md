# Dingo Language Patterns

**Skill**: dingo
**Plugin**: dev
**Version**: 1.0.0

## Overview

Dingo is a meta-language for Go that transpiles `.dingo` files to `.go` files, providing modern language features while maintaining 100% Go ecosystem compatibility.

**Repository:** https://github.com/MadAppGang/dingo

**When to use Dingo:**
- You want concise error handling with the `?` operator
- You need sum types (enums) and pattern matching
- You prefer functional patterns with lambdas
- You want `Option[T]` and `Result[T,E]` types
- You need safe navigation (`?.`) and null coalescing (`??`)

**Key Philosophy:**
Dingo makes common Go patterns more concise and safer without departing from Go idioms. The transpiled Go code is clean and idiomatic.

## Project Structure

```
project/
├── cmd/
│   └── api/
│       └── main.dingo         # Entry point
├── internal/
│   ├── handlers/              # HTTP handlers (.dingo files)
│   ├── services/              # Business logic
│   ├── repositories/          # Data access
│   └── models/                # Domain models
├── pkg/                       # Public packages
├── configs/                   # Configuration
├── go.mod                     # Go module file
├── go.sum                     # Go dependencies
└── .dingo/                    # Generated .go files (gitignored)
```

## Build & Development Workflow

### Commands

```bash
dingo build          # Transpile to Go and build binary
dingo run main.dingo # Transpile and run directly
dingo go             # Generate .go files only (for CI/CD)
dingo fmt            # Format Dingo files
```

### Development Cycle

1. **Write**: Edit `.dingo` files
2. **Transpile**: Run `dingo go` to generate `.go` files in `.dingo/`
3. **Type Check**: gopls works on generated `.go` files for IDE support
4. **Build**: `dingo build` or `go build` on generated files

### IDE Integration

gopls (Go language server) works on the generated `.go` files:
```bash
# After dingo go, gopls sees:
.dingo/
├── cmd/api/main.go
├── internal/handlers/user.go
└── internal/services/user.go
```

Configure your editor to watch `.dingo/` for Go analysis.

### CI/CD Pipeline

```yaml
# GitHub Actions example
steps:
  - name: Install Dingo
    run: go install github.com/MadAppGang/dingo/cmd/dingo@latest

  - name: Generate Go files
    run: dingo go

  - name: Build
    run: go build -o app ./.dingo/cmd/api

  - name: Test
    run: go test ./.dingo/...
```

### Transpilation Errors

Dingo reports errors with source locations in `.dingo` files:

```
error: mismatched types in match expression
  --> internal/handlers/user.dingo:42:5
   |
42 |     match status {
   |     ^^^^^ expected Status, found string
```

Fix errors in `.dingo` source, then re-run `dingo go`.

## Built-in Types

**Important:** `Option[T]`, `Result[T,E]`, `Some()`, `None()`, `Ok()`, `Err()` are **built-in Dingo syntax**, not Go imports. The transpiler generates all necessary type definitions.

```dingo
// These are built-in - no import needed
func findUser(id string) Option[User] {
    // ...
    return Some(user)  // Built-in function
    return None()      // Built-in function
}

func divide(a, b int) Result[int, string] {
    if b == 0 {
        return Err("division by zero")  // Built-in
    }
    return Ok(a / b)  // Built-in
}
```

Only import `dgo` if writing **pure Go code** that interoperates with Dingo-generated types.

## Error Propagation (? Operator)

The `?` operator provides concise error handling, similar to Rust.

### Basic Propagation

```dingo
// Before: verbose Go pattern
func loadUser(id string) (*User, error) {
    user, err := db.FindByID(id)
    if err != nil {
        return nil, err
    }
    return user, nil
}

// After: concise Dingo
func loadUser(id string) (*User, error) {
    user := db.FindByID(id)?
    return user, nil
}
```

### Error Context

Add context to propagated errors:

```dingo
func processOrder(id string) (*Order, error) {
    // Wrap error with message
    order := db.FindOrder(id) ? "failed to find order"

    // Validates and wraps
    validated := validateOrder(order) ? "order validation failed"

    // Process with full context
    result := processPayment(validated) ? "payment processing failed"

    return result, nil
}
```

### Error Transform

Transform errors with closures:

```dingo
func createUser(input CreateUserInput) (*User, error) {
    // Rust-style closure
    user := db.Create(input) ? |e| fmt.Errorf("db error: %w", e)

    // TypeScript-style arrow
    profile := createProfile(user.ID) ? e => AppError.Wrap(e, "profile creation")

    return user, nil
}
```

### Error Propagation in Lambdas

When using `?` inside lambda bodies, the error propagates to the enclosing function:

```dingo
func processAllUsers(ids []string) (*Summary, error) {
    // Error in lambda propagates to processAllUsers
    results := map(ids, |id| {
        user := db.FindUser(id)?  // Propagates to processAllUsers, not the lambda
        return transform(user)
    })

    return summarize(results), nil
}

// For lambdas that should handle errors internally:
func processAllUsersSafe(ids []string) []Result[User, error] {
    return map(ids, |id| {
        user, err := db.FindUser(id)
        if err != nil {
            return Err(err)
        }
        return Ok(user)
    })
}
```

**Important:** The `?` operator inside lambdas propagating to the enclosing function is **intentional Dingo design**. When the transpiler sees `?` inside a lambda body, it generates special code that propagates errors to the enclosing function rather than the lambda itself. This is the most common use case for error handling in functional chains. If you need the lambda to handle errors internally (e.g., to return `Result` types), use explicit Go-style error checking as shown in `processAllUsersSafe` above.

## Option[T] Type

Use `Option[T]` for optional values instead of nullable pointers.

### Basic Usage

```dingo
func findUser(id string) Option[User] {
    user, err := db.FindByID(id)
    if err != nil {
        return None()
    }
    return Some(user)
}

// Usage
user := findUser("123")
if user.IsSome() {
    fmt.Println(user.Unwrap().Name)
}

// With default
name := findUser("123").Map(|u| u.Name).UnwrapOr("Anonymous")
```

### Option Methods

```dingo
opt := Some("hello")

opt.IsSome()                    // true
opt.IsNone()                    // false
opt.Unwrap()                    // "hello" (panics if None)
opt.UnwrapOr("default")         // "hello"
opt.UnwrapOrElse(|| "computed") // "hello"
opt.Map(|s| len(s))             // Some(5)
opt.FlatMap(|s| Some(s + "!"))  // Some("hello!")
```

## Result[T, E] Type

Use `Result[T, E]` for explicit error modeling.

**Type Parameter Inference:** Type parameters can be inferred when the context makes them clear (e.g., function return type), but explicit parameters are needed in standalone expressions like `Ok[int, string](42)`.

### Basic Usage

```dingo
func divide(a, b int) Result[int, string] {
    if b == 0 {
        return Err("division by zero")
    }
    return Ok(a / b)
}

// Usage
result := divide(10, 2)
if result.IsOk() {
    fmt.Println(result.Unwrap()) // 5
}

// With default
value := divide(10, 0).UnwrapOr(0) // 0
```

### Result Methods

```dingo
ok := Ok[int, string](42)
err := Err[int, string]("failed")

ok.IsOk()              // true
ok.IsErr()             // false
ok.Unwrap()            // 42
ok.UnwrapErr()         // panics
ok.UnwrapOr(0)         // 42
ok.Map(|n| n * 2)      // Ok(84)

err.UnwrapOr(0)        // 0
err.UnwrapErr()        // "failed"
```

## Sum Types (Enums)

Define algebraic data types with named variants.

### Basic Enum

```dingo
enum Status {
    Pending
    Active
    Suspended { reason: string }
    Deleted { deletedAt: time.Time, deletedBy: string }
}

func (s Status) String() string {
    match s {
        Pending => "pending",
        Active => "active",
        Suspended(reason) => fmt.Sprintf("suspended: %s", reason),
        Deleted(at, by) => fmt.Sprintf("deleted at %v by %s", at, by),
    }
}
```

### Enum Instantiation

Use constructor syntax to create enum variants:

```dingo
// Simple variants (no fields)
status := Status.Pending
active := Status.Active

// Variants with fields - constructor syntax
suspended := Status.Suspended("policy violation")
deleted := Status.Deleted(time.Now(), "admin@example.com")
```

### Event Sourcing Example

```dingo
enum UserEvent {
    Created { userID: int, email: string, createdAt: time.Time }
    EmailChanged { userID: int, oldEmail: string, newEmail: string }
    Deactivated { userID: int, reason: string }
    Reactivated { userID: int }
}

// Creating events - use constructor syntax
func recordUserCreation(id int, email string) UserEvent {
    return UserEvent.Created(id, email, time.Now())
}

func recordEmailChange(id int, old, new string) UserEvent {
    return UserEvent.EmailChanged(id, old, new)
}

func processEvent(event UserEvent) {
    match event {
        Created(id, email, _) => {
            fmt.Printf("User %d created with email %s\n", id, email)
        },
        EmailChanged(id, old, new) => {
            fmt.Printf("User %d changed email from %s to %s\n", id, old, new)
        },
        Deactivated(id, reason) => {
            fmt.Printf("User %d deactivated: %s\n", id, reason)
        },
        Reactivated(id) => {
            fmt.Printf("User %d reactivated\n", id)
        },
    }
}
```

## Pattern Matching (match)

Exhaustive pattern matching with guards.

### Basic Matching

```dingo
func describe(n int) string {
    match n {
        0 => "zero",
        1 => "one",
        _ if n < 0 => "negative",
        _ if n > 100 => "large",
        _ => "other",
    }
}
```

### With Enum Destructuring

```dingo
enum Shape {
    Circle { radius: float64 }
    Rectangle { width: float64, height: float64 }
    Triangle { base: float64, height: float64 }
}

func area(shape Shape) float64 {
    match shape {
        Circle(r) => 3.14159 * r * r,
        Rectangle(w, h) => w * h,
        Triangle(b, h) => 0.5 * b * h,
    }
}
```

### Nested Match with Guards

Complex matching scenarios with nested patterns:

```dingo
enum Response {
    Success { data: Option[User], cached: bool }
    Error { code: int, message: string }
}

func handleResponse(resp Response) string {
    match resp {
        // Nested pattern: match on enum variant AND option state
        Success(Some(user), true) => {
            fmt.Sprintf("Cached user: %s", user.Name)
        },
        Success(Some(user), false) => {
            fmt.Sprintf("Fresh user: %s", user.Name)
        },
        Success(None(), _) => "No user data",

        // Guard on nested field
        Error(code, msg) if code >= 500 => {
            fmt.Sprintf("Server error %d: %s", code, msg)
        },
        Error(code, msg) if code >= 400 => {
            fmt.Sprintf("Client error %d: %s", code, msg)
        },
        Error(code, msg) => {
            fmt.Sprintf("Unknown error %d: %s", code, msg)
        },
    }
}
```

### Wildcard Ignoring

```dingo
func getOrderSummary(event OrderEvent) string {
    match event {
        OrderPlaced(id, _, amount) => fmt.Sprintf("Order %s: $%.2f", id, amount),
        OrderShipped(id, _, _) => fmt.Sprintf("Order %s shipped", id),
        _ => "Unknown event",
    }
}
```

## Lambda Expressions

Concise function literals with two syntax styles.

### Rust-Style (Pipe Syntax)

```dingo
users := []User{...}

// Single argument
activeUsers := filter(users, |u| u.Active)

// Multiple arguments
sorted := sort(users, |a, b| a.Name < b.Name)

// With block body
processed := map(users, |u| {
    name := strings.ToUpper(u.Name)
    return fmt.Sprintf("%s (%d)", name, u.Age)
})
```

### TypeScript-Style (Arrow Syntax)

```dingo
// Single argument
activeUsers := filter(users, u => u.Active)

// Multiple arguments (parentheses required)
sorted := sort(users, (a, b) => a.CreatedAt.Before(b.CreatedAt))

// With block
processed := map(users, u => {
    return u.Name + " - " + u.Email
})
```

### Practical Examples

```dingo
// Filtering
adults := filter(people, |p| p.Age >= 18)

// Mapping
names := map(users, |u| u.Name)

// Reducing
total := reduce(orders, 0, |sum, o| sum + o.Amount)

// Chaining with Option
result := findUser(id)
    .Map(|u| u.Profile)
    .FlatMap(|p| p.Avatar)
    .UnwrapOr(defaultAvatar)
```

## Safe Navigation (?.) and Null Coalescing (??)

Handle nullable chains safely.

### Safe Navigation

```dingo
type Config struct {
    Database *DatabaseConfig
}

type DatabaseConfig struct {
    Primary *ConnectionInfo
}

type ConnectionInfo struct {
    Host string
    Port int
}

// Safe navigation through nullable chain
host := config?.Database?.Primary?.Host ?? "localhost"
port := config?.Database?.Primary?.Port ?? 5432
```

### Chained Safe Navigation with Null Coalescing

```dingo
// Deep chain with fallback
dbHost := appConfig?.Database?.Primary?.Host
    ?? appConfig?.Database?.Fallback?.Host
    ?? envConfig?.DbHost
    ?? "localhost"

// Method chains
userName := response?.Data?.User?.Profile?.DisplayName
    ?? response?.Data?.User?.Name
    ?? "Anonymous"

// With function calls in fallback
timeout := config?.Timeout ?? getDefaultTimeout()
```

### Null Coalescing

```dingo
// Simple default
name := user.Nickname ?? user.Name ?? "Anonymous"

// With function call
timeout := config.Timeout ?? getDefaultTimeout()

// Combined with safe navigation
dbHost := appConfig?.Database?.Host ?? envConfig?.DbHost ?? "localhost"
```

## Ternary Operator

Simple conditional expressions.

```dingo
// Basic ternary
status := user.Active ? "Active" : "Inactive"

// Nested (use sparingly)
role := user.IsAdmin ? "Admin" : user.IsModerator ? "Moderator" : "User"

// In function calls
greet(user.Preferred ? user.Nickname : user.FullName)

// With expressions
discount := order.Total > 100 ? order.Total * 0.1 : 0
```

## Tuples

Lightweight compound values.

### Tuple Types

```dingo
type Point2D = (float64, float64)
type Range = (int, int)
type NamedResult = (string, int, error)
```

### Tuple Destructuring

```dingo
func getCoordinates() (float64, float64) {
    return (42.5, 73.2)
}

// Destructure in assignment
(x, y) := getCoordinates()

// Ignore values with _
(lat, _) := getCoordinates()

// Multiple return handling
(user, err) := fetchUser(id)
if err != nil {
    return err
}
```

### Tuple in Functions

```dingo
func minMax(numbers []int) (int, int) {
    min := numbers[0]
    max := numbers[0]
    for _, n := range numbers {
        if n < min { min = n }
        if n > max { max = n }
    }
    return (min, max)
}

(lo, hi) := minMax([]int{3, 1, 4, 1, 5, 9})
```

## Guard Statement

Early returns with clear error handling.

**Error Binding Rules:**
- Use `guard x := f() else |err| { ... }` when `f()` returns `(T, error)` or `Result[T, E]` - the error value is bound to `err` for custom handling
- Use `guard x := f() else { ... }` when `f()` returns `Option[T]` - `None` has no error value to bind

### Basic Guard

```dingo
func processUser(id string) Result[User, error] {
    // Guard with error handling
    guard user := findUser(id) else |err| {
        return Err(fmt.Errorf("user not found: %w", err))
    }

    guard profile := user.Profile else {
        return Err(errors.New("user has no profile"))
    }

    // Both user and profile are now available
    return Ok(user)
}
```

### Guard with Option

```dingo
func getDisplayName(userId string) string {
    guard user := findUser(userId) else {
        return "Unknown User"
    }

    guard nickname := user.Nickname else {
        return user.FullName
    }

    return nickname
}
```

### Multiple Guards

```dingo
func createOrder(req CreateOrderRequest) (*Order, error) {
    guard user := findUser(req.UserID) else |err| {
        return nil, fmt.Errorf("invalid user: %w", err)
    }

    guard cart := getCart(user.ID) else |err| {
        return nil, fmt.Errorf("cart not found: %w", err)
    }

    guard len(cart.Items) > 0 else {
        return nil, errors.New("cart is empty")
    }

    guard total := calculateTotal(cart) else |err| {
        return nil, fmt.Errorf("calculation failed: %w", err)
    }

    return createOrderFromCart(user, cart, total)
}
```

## HTTP Handler Patterns

### Handler with Error Propagation

```dingo
// Standard Go imports apply - import net/http, encoding/json, etc.
import "github.com/go-chi/chi/v5"

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    user := h.userService.FindByID(r.Context(), id) ? |e| {
        h.handleError(w, e)
        return
    }

    h.respond(w, http.StatusOK, user)
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    json.NewDecoder(r.Body).Decode(&req) ? |e| {
        h.respondError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    user := h.userService.Create(r.Context(), req) ? |e| {
        h.handleError(w, e)
        return
    }

    h.respond(w, http.StatusCreated, user)
}
```

### Service Layer with Result Types

```dingo
type UserService struct {
    repo UserRepository
}

func (s *UserService) FindByID(ctx context.Context, id string) Result[User, error] {
    guard user := s.repo.FindByID(ctx, id) else |err| {
        if errors.Is(err, sql.ErrNoRows) {
            return Err(NotFoundError("user"))
        }
        return Err(InternalError(err))
    }

    return Ok(user)
}

func (s *UserService) Create(ctx context.Context, req CreateUserRequest) Result[User, error] {
    // Check if email exists
    existing := s.repo.FindByEmail(ctx, req.Email)
    if existing.IsSome() {
        return Err(ConflictError("email already exists"))
    }

    hashedPassword := hashPassword(req.Password)?

    user := s.repo.Create(ctx, User{
        Email:        req.Email,
        PasswordHash: hashedPassword,
        Name:         req.Name,
    })?

    return Ok(user)
}
```

## Repository Pattern

```dingo
type UserRepository interface {
    FindByID(ctx context.Context, id string) Result[User, error]
    FindByEmail(ctx context.Context, email string) Option[User]
    Create(ctx context.Context, user User) Result[User, error]
    Update(ctx context.Context, user User) Result[User, error]
    Delete(ctx context.Context, id string) Result[bool, error]
}

type postgresUserRepo struct {
    db *sql.DB
}

func (r *postgresUserRepo) FindByID(ctx context.Context, id string) Result[User, error] {
    var user User
    err := r.db.QueryRowContext(ctx,
        "SELECT id, email, name, created_at FROM users WHERE id = $1",
        id,
    ).Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt)

    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return Err(NotFoundError("user"))
        }
        return Err(err)
    }

    return Ok(user)
}

func (r *postgresUserRepo) FindByEmail(ctx context.Context, email string) Option[User] {
    var user User
    err := r.db.QueryRowContext(ctx,
        "SELECT id, email, name FROM users WHERE email = $1",
        email,
    ).Scan(&user.ID, &user.Email, &user.Name)

    if err != nil {
        return None()
    }
    return Some(user)
}
```

## Testing

### Unit Tests with Option/Result

```dingo
func TestUserService_FindByID(t *testing.T) {
    repo := mocks.NewMockUserRepository(t)
    service := NewUserService(repo)

    t.Run("returns user when found", func(t *testing.T) {
        expected := User{ID: "123", Name: "John"}
        repo.EXPECT().FindByID(mock.Anything, "123").Return(Ok(expected))

        result := service.FindByID(context.Background(), "123")

        assert.True(t, result.IsOk())
        assert.Equal(t, expected, result.Unwrap())
    })

    t.Run("returns error when not found", func(t *testing.T) {
        repo.EXPECT().FindByID(mock.Anything, "456").Return(
            Err[User, error](NotFoundError("user")),
        )

        result := service.FindByID(context.Background(), "456")

        assert.True(t, result.IsErr())
        assert.Contains(t, result.UnwrapErr().Error(), "not found")
    })
}
```

### Testing Pattern Matching

```dingo
func TestEventProcessing(t *testing.T) {
    tests := []struct {
        name     string
        event    UserEvent
        expected string
    }{
        {
            name:     "created event",
            event:    UserEvent.Created(1, "test@example.com", time.Now()),
            expected: "User 1 created",
        },
        {
            name:     "deactivated event",
            event:    UserEvent.Deactivated(1, "violation"),
            expected: "User 1 deactivated",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := processEvent(tt.event)
            assert.Contains(t, result, tt.expected)
        })
    }
}
```

## Best Practices

### Prefer Dingo Idioms Over Go Patterns

| Go Pattern | Dingo Idiom |
|------------|-------------|
| `if err != nil { return err }` | `x := f()?` |
| `*T` for optional values | `Option[T]` |
| `(T, error)` returns | `Result[T, E]` for typed errors |
| `interface{}` + type switch | `enum` + `match` |
| `func(x int) int { return x * 2 }` | `\|x\| x * 2` |
| nil checks chain | `?.` safe navigation |
| `if x != nil { x } else { default }` | `x ?? default` |
| Multi-line if-else | `condition ? a : b` |

### Error Handling Guidelines

1. Use `?` for simple propagation
2. Add context with `? "message"` or `? \|e\| wrap(e)`
3. Use `Result[T, E]` when callers need error type information
4. Use `guard` for early returns that simplify the happy path

### Type Safety Guidelines

1. Prefer `Option[T]` over `*T` for optional values
2. Use `Result[T, E]` for operations that can fail
3. Use `enum` for closed sets of variants
4. Always handle all `match` cases (exhaustive matching)

### Lambda Guidelines

1. Use `|x| expr` for simple transforms
2. Use `(a, b) => expr` for multi-arg comparators
3. Add block `{ ... }` for multi-line bodies
4. Prefer named functions for complex logic

### Project Organization

1. Keep `.dingo` files in the same structure as a Go project
2. The `.dingo/` directory contains generated Go files
3. Add `.dingo/` to `.gitignore`
4. Run `dingo go` before `go build` in CI

---

*Dingo language patterns for Go meta-programming*
