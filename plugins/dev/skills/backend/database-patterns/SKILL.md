# Database Patterns

**Skill**: database-patterns
**Plugin**: dev
**Version**: 1.0.0

## Overview

Database design and access patterns for relational and NoSQL databases.

## Schema Design

### Normalization Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| 1NF | Atomic values, no repeating groups | Base requirement |
| 2NF | No partial dependencies | Most applications |
| 3NF | No transitive dependencies | OLTP systems |
| Denormalized | Redundant data for reads | Read-heavy, analytics |

### Common Table Patterns

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Soft delete pattern
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- Audit columns
ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN updated_by UUID REFERENCES users(id);
```

### Relationships

```sql
-- One-to-Many
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_user ON orders(user_id);

-- Many-to-Many
CREATE TABLE order_products (
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

-- Self-referential (tree/hierarchy)
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id)
);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

## Indexing Strategies

### Index Types

| Type | Use Case | Example |
|------|----------|---------|
| B-tree | Range, equality | Most columns |
| Hash | Equality only | Exact matches |
| GIN | Arrays, JSON, full-text | JSONB, text search |
| GiST | Geometric, range types | PostGIS, IP ranges |

### Index Guidelines

```sql
-- Primary key (automatic)
CREATE TABLE users (id UUID PRIMARY KEY);

-- Foreign keys
CREATE INDEX idx_orders_user ON orders(user_id);

-- Frequent filters
CREATE INDEX idx_users_status ON users(status);

-- Composite for multi-column queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Partial index for common queries
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- Expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

### When NOT to Index

- Small tables (< 1000 rows)
- Frequently updated columns
- Low cardinality columns
- Columns rarely used in WHERE

## Query Patterns

### Efficient Queries

```sql
-- Use specific columns, not *
SELECT id, name, email FROM users WHERE id = $1;

-- Limit results
SELECT * FROM users ORDER BY created_at DESC LIMIT 20;

-- Exists vs COUNT
SELECT EXISTS(SELECT 1 FROM users WHERE email = $1);

-- Batch inserts
INSERT INTO users (name, email) VALUES
    ('User 1', 'user1@example.com'),
    ('User 2', 'user2@example.com'),
    ('User 3', 'user3@example.com');
```

### Pagination

```sql
-- Offset pagination (simple but slow for large offsets)
SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 100;

-- Cursor pagination (better performance)
SELECT * FROM users
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT 20;

-- Keyset pagination with tie-breaker
SELECT * FROM users
WHERE (created_at, id) < ($cursor_time, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### Common Query Patterns

```sql
-- Upsert (INSERT or UPDATE)
INSERT INTO users (email, name)
VALUES ($1, $2)
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- Soft delete
UPDATE users SET deleted_at = NOW() WHERE id = $1;
SELECT * FROM users WHERE deleted_at IS NULL;

-- Lock for update (prevent race conditions)
SELECT * FROM accounts WHERE id = $1 FOR UPDATE;

-- Bulk update
UPDATE orders SET status = 'shipped'
WHERE id = ANY($1::uuid[]);
```

## Repository Pattern

### Interface

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filter: UserFilter, pagination: Pagination): Promise<PaginatedResult<User>>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### Implementation

```typescript
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateUserInput): Promise<User> {
    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.email, await hashPassword(data.password)]
    );
    return result.rows[0];
  }
}
```

## Transaction Patterns

### Basic Transaction

```typescript
async function transferFunds(fromId: string, toId: string, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock accounts
    await client.query(
      'SELECT * FROM accounts WHERE id IN ($1, $2) FOR UPDATE',
      [fromId, toId]
    );

    // Debit
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );

    // Credit
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|------------|---------------------|--------------|
| Read Uncommitted | Yes | Yes | Yes |
| Read Committed | No | Yes | Yes |
| Repeatable Read | No | No | Yes |
| Serializable | No | No | No |

```sql
-- Set isolation level
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

## Migration Patterns

### Migration Structure

```
migrations/
├── 001_create_users.sql
├── 002_add_user_status.sql
├── 003_create_orders.sql
└── 004_add_order_index.sql
```

### Migration Best Practices

```sql
-- Always reversible
-- UP
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- DOWN
ALTER TABLE users DROP COLUMN phone;

-- Non-blocking index creation
CREATE INDEX CONCURRENTLY idx_users_phone ON users(phone);

-- Safe column renames (PostgreSQL)
ALTER TABLE users RENAME COLUMN name TO full_name;

-- Add NOT NULL safely
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
UPDATE users SET status = 'active' WHERE status IS NULL;
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

## Connection Pooling

### Pool Configuration

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Best Practices

- Use connection pool (don't create new connections)
- Release connections promptly
- Set appropriate pool size (CPU cores * 2-4)
- Handle connection errors gracefully

## NoSQL Patterns (MongoDB/DynamoDB)

### Document Design

```javascript
// Embedded (for one-to-few)
{
  _id: ObjectId("..."),
  name: "John",
  addresses: [
    { type: "home", street: "123 Main St" },
    { type: "work", street: "456 Office Blvd" }
  ]
}

// Referenced (for one-to-many)
{
  _id: ObjectId("..."),
  name: "John",
  orderIds: [ObjectId("..."), ObjectId("...")]
}
```

### DynamoDB Single-Table Design

```
PK              | SK                | Attributes
----------------|-------------------|------------------
USER#123        | METADATA          | name, email, ...
USER#123        | ORDER#001         | total, status, ...
USER#123        | ORDER#002         | total, status, ...
ORDER#001       | METADATA          | userId, total, ...
ORDER#001       | ITEM#1            | productId, qty, ...
```

---

*Database design and access patterns*
