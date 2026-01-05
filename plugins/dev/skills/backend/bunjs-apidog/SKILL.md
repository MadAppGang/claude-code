# Bun.js OpenAPI and Apidog Integration

**Skill**: bunjs-apidog
**Plugin**: dev
**Version**: 1.0.0

## Overview

This skill covers OpenAPI specification creation and Apidog integration for Bun.js TypeScript backend applications. Learn how to document APIs with OpenAPI 3.0, use Apidog-specific extensions, import specifications via REST API, and maintain synchronized API documentation.

**When to use this skill:**
- Creating OpenAPI specifications for API documentation
- Synchronizing API specs with Apidog projects
- Importing endpoints and schemas to Apidog
- Managing API documentation lifecycle

**See also:**
- **dev:bunjs** - Core Bun patterns, HTTP servers, database access
- **dev:bunjs-architecture** - Layered architecture, camelCase conventions
- **dev:bunjs-production** - Production deployment patterns

## Why Apidog

Apidog is a comprehensive API development platform that combines:
- **API Design** - Visual OpenAPI editor
- **API Documentation** - Auto-generated, always up-to-date docs
- **API Testing** - Built-in testing tools
- **API Mocking** - Mock servers for frontend development
- **Team Collaboration** - Shared workspace for teams

## Environment Variables

**Required:**
```bash
APIDOG_PROJECT_ID=your-project-id     # From Apidog project settings
APIDOG_API_TOKEN=your-api-token       # From Apidog account settings
```

**How to get these:**
1. **APIDOG_PROJECT_ID**: Open your Apidog project → Settings → Project ID
2. **APIDOG_API_TOKEN**: Apidog Account → Settings → API Tokens → Generate Token

## OpenAPI Spec Creation

### Basic Structure

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: API for managing resources

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:3000
    description: Development server

components:
  schemas:
    # Define reusable data models here
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  # Define API endpoints here
```

### Field Naming: camelCase (CRITICAL)

**ALWAYS use camelCase for all JSON API field names in OpenAPI specs.**

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - userId
        - emailAddress
      properties:
        userId:              # ✅ camelCase
          type: string
          format: uuid
        emailAddress:        # ✅ camelCase
          type: string
          format: email
        firstName:           # ✅ camelCase
          type: string
        lastName:            # ✅ camelCase
          type: string
        phoneNumber:         # ✅ camelCase
          type: string
        isActive:            # ✅ camelCase boolean
          type: boolean
        createdAt:           # ✅ camelCase timestamp
          type: string
          format: date-time
        updatedAt:           # ✅ camelCase timestamp
          type: string
          format: date-time

    # ❌ WRONG: snake_case
    # user_id, email_address, first_name, created_at

    # ❌ WRONG: PascalCase
    # UserId, EmailAddress, FirstName, CreatedAt
```

**Why camelCase:**
- Native to JavaScript/JSON ecosystem
- Industry standard (Google, Microsoft, AWS)
- TypeScript friendly (1:1 mapping)
- OpenAPI/Swagger convention
- Auto-generated clients expect it

### Schema Design

**Define reusable schemas in `components.schemas`:**

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - userId
        - emailAddress
        - firstName
        - lastName
      properties:
        userId:
          type: string
          format: uuid
          description: Unique user identifier
        emailAddress:
          type: string
          format: email
          description: User email address
        firstName:
          type: string
          minLength: 2
          maxLength: 100
        lastName:
          type: string
          minLength: 2
          maxLength: 100
        phoneNumber:
          type: string
          pattern: '^\+?[1-9]\d{1,14}$'
        role:
          type: string
          enum: [user, admin, moderator]
          default: user
        isActive:
          type: boolean
          default: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateUserRequest:
      type: object
      required:
        - emailAddress
        - password
        - firstName
        - lastName
      properties:
        emailAddress:
          type: string
          format: email
        password:
          type: string
          format: password
          minLength: 8
        firstName:
          type: string
          minLength: 2
        lastName:
          type: string
          minLength: 2
        phoneNumber:
          type: string
        role:
          type: string
          enum: [user, admin, moderator]

    UserListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        pageSize:
          type: integer
          minimum: 1
          maximum: 100
        total:
          type: integer
        totalPages:
          type: integer

    ErrorResponse:
      type: object
      properties:
        statusCode:
          type: integer
        type:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
```

### Endpoint Definitions

**Define endpoints in `paths`:**

```yaml
paths:
  /users:
    get:
      summary: List users
      description: Retrieve paginated list of users
      operationId: listUsers
      tags:
        - Users
      security:
        - bearerAuth: []
      x-apidog-folder: User Management/Users
      x-apidog-status: released
      x-apidog-maintainer: backend-team
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: sortBy
          in: query
          schema:
            type: string
            enum: [createdAt, firstName, emailAddress]
        - name: orderBy
          in: query
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    post:
      summary: Create user
      description: Create a new user account
      operationId: createUser
      tags:
        - Users
      x-apidog-folder: User Management/Users
      x-apidog-status: released
      x-apidog-maintainer: backend-team
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: User already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '422':
          description: Validation failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /users/{userId}:
    get:
      summary: Get user
      description: Retrieve a single user by ID
      operationId: getUser
      tags:
        - Users
      security:
        - bearerAuth: []
      x-apidog-folder: User Management/Users
      x-apidog-status: released
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

## Apidog-Specific Extensions

### x-apidog-folder

Organize endpoints in folders using `/` to separate levels:

```yaml
paths:
  /users:
    post:
      x-apidog-folder: User Management/Users

  /users/{userId}/profile:
    get:
      x-apidog-folder: User Management/Users/Profile

  /orders:
    post:
      x-apidog-folder: Order Management/Orders
```

**Escaping special characters:**
- Use `\/` for `/`
- Use `\\` for `\`

### x-apidog-status

Endpoint lifecycle status:

| Status | Description |
|--------|-------------|
| `designing` | Being designed |
| `pending` | Pending implementation |
| `developing` | In development |
| `integrating` | Integration phase |
| `testing` | Being tested |
| `tested` | Testing complete |
| `released` | Production release |
| `deprecated` | Marked for deprecation |
| `exception` | Has issues |
| `obsolete` | No longer used |
| `to be deprecated` | Will be deprecated |

```yaml
paths:
  /users:
    post:
      x-apidog-status: released     # Fully implemented
  /beta/feature:
    post:
      x-apidog-status: testing      # In testing phase
  /legacy/api:
    get:
      x-apidog-status: deprecated   # Being phased out
```

### x-apidog-maintainer

Specify owner/maintainer (use Apidog username or nickname):

```yaml
paths:
  /users:
    post:
      x-apidog-maintainer: backend-team

  /admin/settings:
    put:
      x-apidog-maintainer: john-doe
```

## Importing to Apidog via REST API

### Import Process

**Step 1: Prepare OpenAPI Spec**

Create a complete OpenAPI 3.0 spec in JSON format:

```bash
# Save spec to file
cat > /tmp/api-spec.json << 'EOF'
{
  "openapi": "3.0.0",
  "info": { ... },
  "paths": { ... }
}
EOF
```

**Step 2: Import via REST API**

```bash
#!/bin/bash

# Environment variables (from .env)
APIDOG_PROJECT_ID="your-project-id"
APIDOG_API_TOKEN="your-api-token"

# Read OpenAPI spec
OPENAPI_SPEC=$(cat /tmp/api-spec.json | jq -c .)

# Import to Apidog
curl -X POST "https://api.apidog.com/v1/projects/${APIDOG_PROJECT_ID}/import-openapi" \
  -H "Authorization: Bearer ${APIDOG_API_TOKEN}" \
  -H "X-Apidog-Api-Version: 2024-03-28" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": \"${OPENAPI_SPEC}\",
    \"options\": {
      \"endpointOverwriteBehavior\": \"AUTO_MERGE\",
      \"schemaOverwriteBehavior\": \"AUTO_MERGE\",
      \"updateFolderOfChangedEndpoint\": false,
      \"prependBasePath\": false
    }
  }"
```

### Import Behavior Options

| Option | Description |
|--------|-------------|
| `AUTO_MERGE` | Automatically merge changes (recommended) |
| `OVERWRITE_EXISTING` | Replace existing endpoints/schemas completely |
| `KEEP_EXISTING` | Skip changes, keep existing |
| `CREATE_NEW` | Create new endpoints/schemas (duplicates existing) |

**Recommendation: Use `AUTO_MERGE`** for intelligent merging without losing existing data.

### API Response Format

```json
{
  "data": {
    "counters": {
      "endpointCreated": 3,
      "endpointUpdated": 2,
      "endpointFailed": 0,
      "endpointIgnored": 0,
      "schemaCreated": 5,
      "schemaUpdated": 1,
      "schemaFailed": 0,
      "schemaIgnored": 0,
      "endpointFolderCreated": 1,
      "endpointFolderUpdated": 0,
      "schemaFolderCreated": 0,
      "schemaFolderUpdated": 0
    },
    "errors": []
  }
}
```

### Error Handling

| Status Code | Meaning |
|-------------|---------|
| 401 | Token is invalid or expired |
| 404 | Project ID not found |
| 422 | OpenAPI spec validation failed |

**Check `data.errors` array for detailed error messages.**

## Workflow

### 1. Create OpenAPI Spec from Code

**Step 1: Analyze existing endpoints**

```bash
# List all route files
find src/routes -name "*.ts" -type f

# Read route definitions
cat src/routes/user.routes.ts
```

**Step 2: Extract schemas from Zod**

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  emailAddress: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string()
});

// Convert to OpenAPI schema manually or use zod-to-json-schema
```

**Step 3: Build OpenAPI spec**

Map routes to OpenAPI paths, schemas to components, camelCase fields.

### 2. Validate Spec

```bash
# Use online validator
# https://editor.swagger.io/

# Or use CLI tool
npm install -g swagger-cli
swagger-cli validate api-spec.yaml
```

### 3. Import to Apidog

```bash
# Via REST API (automated)
./scripts/import-to-apidog.sh

# Or manually in Apidog UI
# Import → OpenAPI → Upload file
```

### 4. Verify in Apidog

1. Open Apidog project: `https://app.apidog.com/project/{APIDOG_PROJECT_ID}`
2. Check imported endpoints appear in correct folders
3. Verify schemas are properly structured
4. Test endpoints with Apidog's testing tools
5. Update descriptions and add examples

### 5. Set Endpoint Status

Update `x-apidog-status` based on implementation progress:
- `designing` → `developing` → `testing` → `released`

### 6. Share with Team

Share Apidog project with team members for:
- Frontend integration (use mock servers)
- API testing
- Documentation review

## Automation Script

**scripts/import-to-apidog.sh:**

```bash
#!/bin/bash
set -e

# Load environment variables
source .env

# Check required variables
if [ -z "$APIDOG_PROJECT_ID" ] || [ -z "$APIDOG_API_TOKEN" ]; then
  echo "Error: APIDOG_PROJECT_ID and APIDOG_API_TOKEN must be set"
  exit 1
fi

# Generate OpenAPI spec (customize based on your needs)
SPEC_FILE="/tmp/api-spec-$(date +%Y%m%d-%H%M%S).json"
echo "Generating OpenAPI spec..."
# Add your spec generation logic here
# For example: ts-node scripts/generate-openapi.ts > $SPEC_FILE

# Read spec
OPENAPI_SPEC=$(cat $SPEC_FILE | jq -c .)

# Import to Apidog
echo "Importing to Apidog..."
RESPONSE=$(curl -s -X POST \
  "https://api.apidog.com/v1/projects/${APIDOG_PROJECT_ID}/import-openapi" \
  -H "Authorization: Bearer ${APIDOG_API_TOKEN}" \
  -H "X-Apidog-Api-Version: 2024-03-28" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": ${OPENAPI_SPEC},
    \"options\": {
      \"endpointOverwriteBehavior\": \"AUTO_MERGE\",
      \"schemaOverwriteBehavior\": \"AUTO_MERGE\"
    }
  }")

# Parse response
ENDPOINT_CREATED=$(echo $RESPONSE | jq -r '.data.counters.endpointCreated')
ENDPOINT_UPDATED=$(echo $RESPONSE | jq -r '.data.counters.endpointUpdated')
SCHEMA_CREATED=$(echo $RESPONSE | jq -r '.data.counters.schemaCreated')
SCHEMA_UPDATED=$(echo $RESPONSE | jq -r '.data.counters.schemaUpdated')
ERRORS=$(echo $RESPONSE | jq -r '.data.errors | length')

# Display summary
echo ""
echo "✅ Import Complete!"
echo ""
echo "Endpoints:"
echo "  Created: $ENDPOINT_CREATED"
echo "  Updated: $ENDPOINT_UPDATED"
echo ""
echo "Schemas:"
echo "  Created: $SCHEMA_CREATED"
echo "  Updated: $SCHEMA_UPDATED"
echo ""
echo "Errors: $ERRORS"
echo ""
echo "🔗 View in Apidog: https://app.apidog.com/project/${APIDOG_PROJECT_ID}"

# Exit with error if there were errors
if [ "$ERRORS" != "0" ]; then
  echo ""
  echo "⚠️  Import had errors. Check response:"
  echo $RESPONSE | jq '.data.errors'
  exit 1
fi
```

## Error Scenarios & Solutions

### Missing Environment Variables

**Problem:** `APIDOG_PROJECT_ID` or `APIDOG_API_TOKEN` not set

**Solution:**
```bash
# Add to .env file
APIDOG_PROJECT_ID=your-project-id
APIDOG_API_TOKEN=your-api-token

# Restart application
```

### Schema Conflicts

**Problem:** New schema conflicts with existing schema

**Solution:**
- Use `allOf` to extend existing schemas
- Or create with different name
- Or use `OVERWRITE_EXISTING` behavior (carefully)

### Import Failures

**Problem:** Automated import fails

**Solution:**
- Check API token validity
- Verify project ID
- Validate OpenAPI spec syntax
- Check `data.errors` in response for details

### Invalid OpenAPI Spec

**Problem:** Generated spec has validation errors

**Solution:**
```bash
# Validate before importing
swagger-cli validate api-spec.yaml

# Fix validation errors
# Common issues:
# - Missing required fields
# - Invalid $ref paths
# - Incorrect enum values
# - Wrong data types
```

## Best Practices

### 1. Schema Reuse

```yaml
# ✅ CORRECT: Reuse schemas with $ref
paths:
  /users/{userId}:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'

# ❌ WRONG: Duplicate schema definitions
paths:
  /users/{userId}:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: object
                    properties:
                      userId: { type: string }
                      # ... duplicated fields
```

### 2. Comprehensive Descriptions

```yaml
# ✅ CORRECT: Clear descriptions
paths:
  /users:
    post:
      summary: Create user
      description: |
        Creates a new user account with email verification.

        The password must meet the following requirements:
        - At least 8 characters
        - Contains uppercase and lowercase letters
        - Contains at least one number
        - Contains at least one special character

        Upon successful creation, a verification email is sent to the provided email address.
```

### 3. Response Examples

```yaml
responses:
  '200':
    description: Successful response
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
        example:
          data:
            userId: "550e8400-e29b-41d4-a716-446655440000"
            emailAddress: "john@example.com"
            firstName: "John"
            lastName: "Doe"
            isActive: true
            createdAt: "2025-01-06T12:00:00Z"
```

### 4. Security Schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT access token obtained from /auth/login

# Apply globally
security:
  - bearerAuth: []

# Or per endpoint
paths:
  /public/health:
    get:
      security: []  # No auth required
```

### 5. Version Your API

```yaml
servers:
  - url: https://api.example.com/v1
    description: Version 1 (current)
  - url: https://api.example.com/v2
    description: Version 2 (beta)
```

---

*OpenAPI and Apidog integration for Bun.js TypeScript backend. For core patterns, see dev:bunjs. For architecture, see dev:bunjs-architecture.*
