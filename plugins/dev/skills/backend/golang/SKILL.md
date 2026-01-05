# Go Language Patterns

**Skill**: golang
**Plugin**: dev
**Version**: 1.0.0

## Overview

Go language idioms and patterns for building robust backend services.

## Project Structure

```
project/
├── cmd/
│   └── api/
│       └── main.go           # Entry point
├── internal/
│   ├── handlers/             # HTTP handlers
│   ├── services/             # Business logic
│   ├── repositories/         # Data access
│   └── models/               # Domain models
├── pkg/                      # Public packages
├── configs/                  # Configuration
├── migrations/               # Database migrations
├── go.mod
└── go.sum
```

## Error Handling

### Custom Errors

```go
package errors

type AppError struct {
    Code    string
    Message string
    Err     error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Err)
    }
    return e.Message
}

func (e *AppError) Unwrap() error {
    return e.Err
}

// Error constructors
func NotFound(resource string) *AppError {
    return &AppError{
        Code:    "NOT_FOUND",
        Message: fmt.Sprintf("%s not found", resource),
    }
}

func Validation(message string) *AppError {
    return &AppError{
        Code:    "VALIDATION_ERROR",
        Message: message,
    }
}

func Internal(err error) *AppError {
    return &AppError{
        Code:    "INTERNAL_ERROR",
        Message: "internal server error",
        Err:     err,
    }
}
```

### Error Handling Pattern

```go
func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, errors.NotFound("user")
        }
        return nil, errors.Internal(err)
    }
    return user, nil
}

// Handler
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    user, err := h.userService.GetUser(r.Context(), id)
    if err != nil {
        h.handleError(w, err)
        return
    }

    h.respond(w, http.StatusOK, user)
}

func (h *Handler) handleError(w http.ResponseWriter, err error) {
    var appErr *errors.AppError
    if errors.As(err, &appErr) {
        status := errorToStatus(appErr.Code)
        h.respond(w, status, map[string]string{
            "code":    appErr.Code,
            "message": appErr.Message,
        })
        return
    }

    slog.Error("unexpected error", "error", err)
    h.respond(w, http.StatusInternalServerError, map[string]string{
        "code":    "INTERNAL_ERROR",
        "message": "internal server error",
    })
}
```

## HTTP Handlers

### Handler Structure

```go
type Handler struct {
    userService *services.UserService
    logger      *slog.Logger
}

func NewHandler(userService *services.UserService, logger *slog.Logger) *Handler {
    return &Handler{
        userService: userService,
        logger:      logger,
    }
}

func (h *Handler) Routes() chi.Router {
    r := chi.NewRouter()

    r.Route("/users", func(r chi.Router) {
        r.Get("/", h.ListUsers)
        r.Post("/", h.CreateUser)
        r.Route("/{id}", func(r chi.Router) {
            r.Get("/", h.GetUser)
            r.Put("/", h.UpdateUser)
            r.Delete("/", h.DeleteUser)
        })
    })

    return r
}
```

### Request/Response

```go
type CreateUserRequest struct {
    Name  string `json:"name" validate:"required,min=2"`
    Email string `json:"email" validate:"required,email"`
}

type UserResponse struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"createdAt"`
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.handleError(w, errors.Validation("invalid request body"))
        return
    }

    if err := h.validator.Struct(req); err != nil {
        h.handleError(w, errors.Validation(err.Error()))
        return
    }

    user, err := h.userService.Create(r.Context(), req)
    if err != nil {
        h.handleError(w, err)
        return
    }

    h.respond(w, http.StatusCreated, UserResponse{
        ID:        user.ID,
        Name:      user.Name,
        Email:     user.Email,
        CreatedAt: user.CreatedAt,
    })
}
```

## Repository Pattern

```go
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    FindAll(ctx context.Context, filter UserFilter) ([]User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id string) error
}

type postgresUserRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.db.QueryRowContext(ctx,
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        id,
    ).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)

    if err != nil {
        return nil, err
    }
    return &user, nil
}
```

## Context and Cancellation

```go
func (s *Service) LongRunningTask(ctx context.Context) error {
    // Check context before starting
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
    }

    // Use context with timeout for external calls
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    result, err := s.externalAPI.Call(ctx)
    if err != nil {
        return fmt.Errorf("external call failed: %w", err)
    }

    return nil
}
```

## Middleware

```go
func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }

        ctx := context.WithValue(r.Context(), "requestID", requestID)
        w.Header().Set("X-Request-ID", requestID)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func Logger(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

            defer func() {
                logger.Info("request completed",
                    "method", r.Method,
                    "path", r.URL.Path,
                    "status", ww.Status(),
                    "duration", time.Since(start),
                    "requestID", r.Context().Value("requestID"),
                )
            }()

            next.ServeHTTP(ww, r)
        })
    }
}
```

## Configuration

```go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
}

type ServerConfig struct {
    Port         int           `env:"PORT" envDefault:"8080"`
    ReadTimeout  time.Duration `env:"READ_TIMEOUT" envDefault:"5s"`
    WriteTimeout time.Duration `env:"WRITE_TIMEOUT" envDefault:"10s"`
}

type DatabaseConfig struct {
    URL          string `env:"DATABASE_URL,required"`
    MaxOpenConns int    `env:"DB_MAX_OPEN_CONNS" envDefault:"25"`
    MaxIdleConns int    `env:"DB_MAX_IDLE_CONNS" envDefault:"5"`
}

func LoadConfig() (*Config, error) {
    var cfg Config
    if err := env.Parse(&cfg); err != nil {
        return nil, fmt.Errorf("failed to parse config: %w", err)
    }
    return &cfg, nil
}
```

## Testing

```go
func TestUserService_Create(t *testing.T) {
    // Setup
    repo := mocks.NewMockUserRepository(t)
    service := NewUserService(repo)

    req := CreateUserRequest{
        Name:  "John Doe",
        Email: "john@example.com",
    }

    repo.EXPECT().
        Create(mock.Anything, mock.AnythingOfType("*User")).
        Return(nil)

    // Execute
    user, err := service.Create(context.Background(), req)

    // Assert
    require.NoError(t, err)
    assert.Equal(t, "John Doe", user.Name)
    assert.Equal(t, "john@example.com", user.Email)
}

// Integration test
func TestUserHandler_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }

    db := setupTestDB(t)
    handler := setupHandler(db)

    req := httptest.NewRequest("POST", "/users",
        strings.NewReader(`{"name":"John","email":"john@example.com"}`))
    req.Header.Set("Content-Type", "application/json")

    rr := httptest.NewRecorder()
    handler.ServeHTTP(rr, req)

    assert.Equal(t, http.StatusCreated, rr.Code)
}
```

## Concurrency Patterns

```go
// Worker pool
func processItems(ctx context.Context, items []Item, workers int) error {
    g, ctx := errgroup.WithContext(ctx)
    itemCh := make(chan Item, len(items))

    // Start workers
    for i := 0; i < workers; i++ {
        g.Go(func() error {
            for item := range itemCh {
                if err := processItem(ctx, item); err != nil {
                    return err
                }
            }
            return nil
        })
    }

    // Send items
    for _, item := range items {
        itemCh <- item
    }
    close(itemCh)

    return g.Wait()
}

// Fan-out/fan-in
func fetchAll(ctx context.Context, urls []string) ([]Result, error) {
    results := make([]Result, len(urls))
    g, ctx := errgroup.WithContext(ctx)

    for i, url := range urls {
        i, url := i, url // Capture
        g.Go(func() error {
            result, err := fetch(ctx, url)
            if err != nil {
                return err
            }
            results[i] = result
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
```

## Graceful Shutdown

```go
func main() {
    cfg, _ := LoadConfig()

    server := &http.Server{
        Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
        Handler:      setupRouter(),
        ReadTimeout:  cfg.Server.ReadTimeout,
        WriteTimeout: cfg.Server.WriteTimeout,
    }

    // Start server
    go func() {
        slog.Info("server starting", "port", cfg.Server.Port)
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            slog.Error("server error", "error", err)
        }
    }()

    // Wait for shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    // Graceful shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        slog.Error("shutdown error", "error", err)
    }

    slog.Info("server stopped")
}
```

---

*Go language patterns for backend development*
