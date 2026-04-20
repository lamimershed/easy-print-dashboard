# Common Module

Shared infrastructure used across the entire application. Not a NestJS module itself — contains adapters, filters, configuration, and utilities that are registered at the application bootstrap level.

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [SocketIoAdapter](#socketioadapter)
4. [HttpExceptionFilter](#httpexceptionfilter)
5. [Environment Validation](#environment-validation)
6. [Swagger Setup](#swagger-setup)

---

## Overview

The `src/common/` directory holds cross-cutting infrastructure:

| File                               | Purpose                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| `adapters/socket-io.adapter.ts`    | Custom Socket.IO adapter with 10 MB buffer and CORS allowlist   |
| `filters/http-exception.filter.ts` | Global HTTP exception filter — standardizes all error responses |
| `config/env.validation.ts`         | Joi schema — validates all environment variables at startup     |
| `config/swagger.config.ts`         | Swagger / OpenAPI setup                                         |

Everything in `src/common/` is registered in `src/main.ts` during bootstrap — it is not imported as a NestJS module.

---

## Directory Structure

```
src/common/
├── COMMON.md
├── adapters/
│   └── socket-io.adapter.ts          ← Custom IoAdapter: 10 MB buffer + CORS
├── filters/
│   └── http-exception.filter.ts      ← Global error response normalizer
└── config/
    ├── env.validation.ts             ← Joi validation schema for .env
    └── swagger.config.ts             ← Swagger/OpenAPI configuration
```

---

## SocketIoAdapter

**File:** `src/common/adapters/socket-io.adapter.ts`

Extends NestJS's `IoAdapter` to apply two settings that cannot be configured via decorators alone:

1. **`maxHttpBufferSize: 10 MB`** — Required for file chunk transfers. The Socket.IO default (1 MB) is too small for binary file chunks.
2. **CORS allowlist** — Controls which origins can open WebSocket connections (mirrors the HTTP CORS policy).

**CORS origin source:**

Origins are loaded from the `ALLOWED_ORIGINS` environment variable (comma-separated). Defaults to `http://localhost:5173` for local development.

```ts
// .env example
ALLOWED_ORIGINS=https://app.easyprint.com,https://companion.easyprint.com
```

The same `allowedOrigins` array is exported and used by the HTTP CORS config in `main.ts`, ensuring WebSocket and HTTP origins are always in sync.

**Registration in `main.ts`:**

```ts
app.useWebSocketAdapter(new SocketIoAdapter(app));
```

---

## HttpExceptionFilter

**File:** `src/common/filters/http-exception.filter.ts`

A `@Catch()` global filter that normalizes all errors — both `HttpException` instances from NestJS and unexpected runtime errors — into a consistent JSON response shape.

**Standard error response:**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Session not found"
}
```

**Validation error response** (from `ValidationPipe`):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be an email" },
    { "field": "password", "message": "password must be longer than or equal to 8 characters" }
  ]
}
```

**Unhandled errors** (500):

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

Internal error details are logged via `this.logger.error()` but never exposed in the response body.

**Registration in `main.ts`:**

```ts
app.useGlobalFilters(new HttpExceptionFilter());
```

---

## Environment Validation

**File:** `src/common/config/env.validation.ts`

A [Joi](https://joi.dev) schema validates all environment variables at startup. If any required variable is missing or invalid, the application **fails fast with a clear error** rather than silently running with bad config.

**Variables validated:**

| Variable                 | Type                                    | Default                 | Required                    |
| ------------------------ | --------------------------------------- | ----------------------- | --------------------------- |
| `NODE_ENV`               | `development` \| `production` \| `test` | `development`           | No                          |
| `PORT`                   | number (1–65535)                        | `3001`                  | No                          |
| `ALLOWED_ORIGINS`        | string (comma-separated URLs)           | `http://localhost:5173` | No                          |
| `DATABASE_URL`           | URI string                              | —                       | **Yes**                     |
| `JWT_SECRET`             | string                                  | —                       | **Yes**                     |
| `JWT_EXPIRES_IN`         | string (e.g. `15m`)                     | `15m`                   | No                          |
| `JWT_REFRESH_EXPIRES_IN` | string (e.g. `30d`)                     | `30d`                   | No                          |
| `STORAGE_DRIVER`         | `local` \| `s3`                         | `local`                 | No                          |
| `UPLOADS_DIR`            | string                                  | `uploads`               | No                          |
| `UPLOAD_MAX_SIZE_MB`     | number (1–50)                           | `5`                     | No                          |
| `PUBLIC_URL`             | URI string                              | `http://localhost:3001` | No                          |
| `AWS_S3_BUCKET`          | string                                  | —                       | Only if `STORAGE_DRIVER=s3` |
| `AWS_S3_REGION`          | string                                  | `us-east-1`             | Only if `STORAGE_DRIVER=s3` |
| `AWS_ACCESS_KEY_ID`      | string                                  | —                       | Only if `STORAGE_DRIVER=s3` |
| `AWS_SECRET_ACCESS_KEY`  | string                                  | —                       | Only if `STORAGE_DRIVER=s3` |
| `AWS_CLOUDFRONT_URL`     | URI string                              | —                       | No                          |

**Registration in `AppModule`:**

```ts
ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema });
```

See `.env.example` at the project root for a template with all variables.

---

## Swagger Setup

**File:** `src/common/config/swagger.config.ts`

Configures and mounts the Swagger UI for API documentation.

- **URL:** `http://localhost:3001/docs`
- **Available in:** `development` and `production` environments
- **Populated by:** `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` decorators on all controllers

**Registration in `main.ts`:**

```ts
setupSwagger(app);
```

The Swagger UI documents all REST endpoints under `/*`. WebSocket events are not included in Swagger — see `docs/print/PRINT.md` for the full Socket.IO event reference.
