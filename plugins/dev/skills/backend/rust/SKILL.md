---
name: rust
version: 1.0.0
description: Use when building Axum applications, implementing type-safe handlers, working with SQLx, setting up error handling with thiserror, or writing Rust backend services.
keywords:
  - Rust
  - Axum
  - SQLx
  - tokio
  - async
  - type safety
  - backend
  - thiserror
plugin: dev
updated: 2026-01-20
---

# Rust Backend Patterns

## Overview

Rust patterns for building backend services with Axum.

## Project Structure

```
project/
├── src/
│   ├── main.rs               # Entry point
│   ├── lib.rs                # Library root
│   ├── config.rs             # Configuration
│   ├── error.rs              # Error types
│   ├── routes/               # Route handlers
│   │   ├── mod.rs
│   │   └── users.rs
│   ├── services/             # Business logic
│   ├── repositories/         # Data access
│   ├── models/               # Domain models
│   └── middleware/           # HTTP middleware
├── migrations/               # SQLx migrations
├── tests/                    # Integration tests
├── Cargo.toml
└── .env
```

## Axum Application

### Main Application

```rust
// src/main.rs
use axum::{
    routing::{get, post},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

mod config;
mod error;
mod routes;
mod services;
mod repositories;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::init();

    let config = Config::from_env()?;

    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    let state = AppState {
        db: pool,
        config: Arc::new(config),
    };

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest("/api/users", routes::users::router())
        .with_state(state)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}
```

### Configuration

```rust
// src/config.rs
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
}

#[derive(Debug, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    #[serde(default = "default_expiry")]
    pub expiry_hours: u64,
}

fn default_max_connections() -> u32 { 10 }
fn default_expiry() -> u64 { 24 }

impl Config {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        config::Config::builder()
            .add_source(config::Environment::default().separator("__"))
            .build()?
            .try_deserialize()
    }
}
```

## Error Handling

```rust
// src/error.rs
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Database error")]
    Database(#[from] sqlx::Error),

    #[error("Internal error")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized".into()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "FORBIDDEN", "Forbidden".into()),
            AppError::Database(e) => {
                tracing::error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Database error".into())
            }
            AppError::Internal(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Internal error".into())
            }
        };

        (
            status,
            Json(json!({
                "error": {
                    "code": code,
                    "message": message
                }
            })),
        ).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
```

## Models and DTOs

```rust
// src/models/user.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUser {
    #[validate(length(min = 2, max = 100))]
    pub name: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUser {
    #[validate(length(min = 2, max = 100))]
    pub name: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
        }
    }
}
```

## Repository Pattern

```rust
// src/repositories/user.rs
use sqlx::PgPool;
use uuid::Uuid;
use crate::error::{AppError, Result};
use crate::models::user::{User, CreateUser, UpdateUser};

pub struct UserRepository<'a> {
    pool: &'a PgPool,
}

impl<'a> UserRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<User>> {
        sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
            .fetch_optional(self.pool)
            .await
            .map_err(AppError::Database)
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        sqlx::query_as!(User, "SELECT * FROM users WHERE email = $1", email)
            .fetch_optional(self.pool)
            .await
            .map_err(AppError::Database)
    }

    pub async fn find_all(&self, limit: i64, offset: i64) -> Result<Vec<User>> {
        sqlx::query_as!(
            User,
            "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit,
            offset
        )
        .fetch_all(self.pool)
        .await
        .map_err(AppError::Database)
    }

    pub async fn create(&self, input: &CreateUser, password_hash: &str) -> Result<User> {
        sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
            input.name,
            input.email,
            password_hash
        )
        .fetch_one(self.pool)
        .await
        .map_err(AppError::Database)
    }

    pub async fn update(&self, id: Uuid, input: &UpdateUser) -> Result<Option<User>> {
        sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET name = COALESCE($2, name),
                email = COALESCE($3, email),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
            id,
            input.name,
            input.email
        )
        .fetch_optional(self.pool)
        .await
        .map_err(AppError::Database)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query!("DELETE FROM users WHERE id = $1", id)
            .execute(self.pool)
            .await
            .map_err(AppError::Database)?;

        Ok(result.rows_affected() > 0)
    }
}
```

## Route Handlers

```rust
// src/routes/users.rs
use axum::{
    extract::{Path, Query, State},
    routing::{get, post, delete},
    Json, Router,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    error::{AppError, Result},
    models::user::{CreateUser, UpdateUser, UserResponse},
    repositories::user::UserRepository,
    services::user::UserService,
    AppState,
};

#[derive(Debug, serde::Deserialize)]
pub struct ListQuery {
    #[serde(default = "default_page")]
    page: i64,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_page() -> i64 { 1 }
fn default_limit() -> i64 { 20 }

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/:id", get(get_user).patch(update_user).delete(delete_user))
}

async fn list_users(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Vec<UserResponse>>> {
    let repo = UserRepository::new(&state.db);
    let offset = (query.page - 1) * query.limit;
    let users = repo.find_all(query.limit, offset).await?;
    Ok(Json(users.into_iter().map(Into::into).collect()))
}

async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>> {
    let repo = UserRepository::new(&state.db);
    let user = repo
        .find_by_id(id)
        .await?
        .ok_or_else(|| AppError::NotFound("User".into()))?;
    Ok(Json(user.into()))
}

async fn create_user(
    State(state): State<AppState>,
    Json(input): Json<CreateUser>,
) -> Result<Json<UserResponse>> {
    input.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let service = UserService::new(&state.db);
    let user = service.create(input).await?;
    Ok(Json(user.into()))
}

async fn update_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdateUser>,
) -> Result<Json<UserResponse>> {
    input.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let repo = UserRepository::new(&state.db);
    let user = repo
        .update(id, &input)
        .await?
        .ok_or_else(|| AppError::NotFound("User".into()))?;
    Ok(Json(user.into()))
}

async fn delete_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<()> {
    let repo = UserRepository::new(&state.db);
    if !repo.delete(id).await? {
        return Err(AppError::NotFound("User".into()));
    }
    Ok(())
}
```

## Testing

```rust
// tests/users.rs
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;
use serde_json::json;

#[tokio::test]
async fn test_list_users() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/users")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_create_user() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/users")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&json!({
                        "name": "John Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }))
                    .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}
```

---

*Rust Axum patterns for backend development*
