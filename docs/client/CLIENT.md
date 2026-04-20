# Client Module

Manages print client client profiles. Each `Client` is linked to a `User` account and represents a print client business. Provides self-service CRUD for authenticated clients.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Client Model](#client-model)
5. [Slug Generation](#slug-generation)
6. [ClientPlan Enum](#clientplan-enum)
7. [API Reference](#api-reference)
8. [Repository Pattern](#repository-pattern)
9. [Admin Operations](#admin-operations)

---

## Overview

- **Module:** `src/client/client.module.ts`
- **Controller:** `src/client/client.controller.ts`
- **Service:** `src/client/client.service.ts`
- **Routes prefix:** `/api/clients`
- **Access:** `CLIENT` role only (self-service). Admin routes live in `AdminModule` under `/api/admin/clients`.

---

## Architecture

```
ClientController  ──────────────────► ClientService
                                          │
                                          └── IClientRepository  (CLIENT_REPOSITORY token)
                                                    │
                                                    └── PrismaClientRepository
                                                          (Client table in PostgreSQL)
```

`ClientService` is exported from `ClientModule` and consumed by `AuthModule` (profile creation at registration) and `AdminModule` (admin operations).

---

## Directory Structure

```
src/client/
├── CLIENT.md                                  ← this file
├── client.module.ts                           ← NestJS module; exports ClientService
├── client.controller.ts                       ← REST: /clients/me (GET, PATCH, DELETE)
├── client.service.ts                          ← Business logic + slug generation
├── interfaces/
│   └── client.interface.ts                    ← CreateClientData interface
├── dto/
│   ├── create-client.dto.ts                   ← Used internally by AuthService during registration
│   ├── update-client.dto.ts                   ← Partial update shape (all fields optional)
│   └── client-response.dto.ts                 ← Public response shape (userId omitted)
└── repositories/
    ├── client.repository.interface.ts         ← IClientRepository + CLIENT_REPOSITORY token
    └── prisma-client.repository.ts            ← Prisma implementation
```

---

## Client Model

Each `Client` record represents a print client. It is created automatically during user registration by `AuthService`.

| Field               | Type            | Description                                                   |
| ------------------- | --------------- | ------------------------------------------------------------- |
| `id`                | `string` (cuid) | Unique identifier                                             |
| `userId`            | `string`        | FK → `User.id` (one-to-one, cascade delete)                   |
| `slug`              | `string`        | Unique URL-safe identifier (auto-generated from company name) |
| `companyName`       | `string`        | Display name of the client                                    |
| `phoneNumber`       | `string`        | Contact phone number                                          |
| `plan`              | `ClientPlan`    | Subscription tier (default: `FREE`)                           |
| `logoUrl`           | `string?`       | Public URL of the client logo                                 |
| `googleProfileLink` | `string?`       | Google Business Profile URL                                   |
| `address`           | `string?`       | Physical address                                              |
| `latitude`          | `float?`        | Geographic latitude                                           |
| `longitude`         | `float?`        | Geographic longitude                                          |
| `createdAt`         | `DateTime`      |                                                               |
| `updatedAt`         | `DateTime`      | Auto-updated                                                  |

The `userId` field is **never included** in API responses — `ClientResponseDto` strips it via destructuring.

---

## Slug Generation

A URL-safe slug is auto-generated when a client is created. It is **never updatable** by the client themselves (admin access required to change it).

**Algorithm:**

1. Lowercase the company name
2. Replace non-alphanumeric characters with `-`
3. Strip leading/trailing dashes
4. Append a 6-character UUID fragment for uniqueness

**Example:**

```
"Acme Print & Copy Co." → "acme-print-copy-co-a1b2c3"
```

The slug is used as the stable identity for permanent WebSocket sessions (`client:join` with `clientId = client.slug` or `client.id`).

---

## ClientPlan Enum

```ts
enum ClientPlan {
  FREE     // Default — limited sessions/features
  STARTER  // Paid tier 1
  PRO      // Paid tier 2
}
```

Plans are managed by `SUPER_ADMIN` via `PATCH /api/admin/clients/:id/plan`. Clients cannot change their own plan.

---

## API Reference

All routes require `Authorization: Bearer <token>` with `CLIENT` role.

---

### `GET /api/clients/me`

Get the authenticated client's own profile.

| Property     | Value               |
| ------------ | ------------------- |
| **Auth**     | JWT — `CLIENT` role |
| **Response** | `200 OK`            |

**Response `200`:**

```json
{
  "id": "clyyy",
  "slug": "acme-print-co-a1b2c3",
  "companyName": "Acme Print Co.",
  "phoneNumber": "+1234567890",
  "plan": "FREE",
  "logoUrl": "http://localhost:3001/uploads/clients/clyyy/logo/...",
  "googleProfileLink": null,
  "address": null,
  "latitude": null,
  "longitude": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### `PATCH /api/clients/me`

Update the authenticated client's own profile. All fields are optional.

| Property     | Value               |
| ------------ | ------------------- |
| **Auth**     | JWT — `CLIENT` role |
| **Response** | `200 OK`            |

**Request body** (all optional):

```json
{
  "companyName": "New Name",
  "phoneNumber": "+9876543210",
  "logoUrl": "https://...",
  "googleProfileLink": "https://maps.google.com/...",
  "address": "456 New St",
  "latitude": 40.7128,
  "longitude": -74.006
}
```

> To update `logoUrl`, upload first via `POST /api/upload/client-logo` and pass the returned URL here.

---

### `DELETE /api/clients/me`

Delete the authenticated client's own account. Cascades to related sessions, print jobs, and payments.

| Property     | Value               |
| ------------ | ------------------- |
| **Auth**     | JWT — `CLIENT` role |
| **Response** | `204 No Content`    |

> This also deletes the linked `User` record due to the `onDelete: Cascade` relation in the Prisma schema.

---

## Repository Pattern

`ClientService` depends on `IClientRepository` injected via the `CLIENT_REPOSITORY` DI token.

**Interface methods:**
| Method | Description |
|---|---|
| `create(data)` | Insert a new client row |
| `findAll()` | Return all clients (used by admin) |
| `findById(id)` | Find by primary key |
| `findByUserId(userId)` | Find the client linked to a user |
| `updateById(id, data)` | Partial update by ID |
| `updatePlan(id, plan)` | Update only the `plan` field |
| `deleteById(id)` | Hard delete by ID |

The concrete implementation is `PrismaClientRepository` in `src/client/repositories/prisma-client.repository.ts`.

---

## Admin Operations

Admin-only client operations are exposed through `AdminModule` (not `ClientModule`). `AdminService` delegates to `ClientService` methods.

| Admin route                         | Delegates to                         |
| ----------------------------------- | ------------------------------------ |
| `GET /api/admin/clients`            | `ClientService.findAll()`            |
| `GET /api/admin/clients/:id`        | `ClientService.findById(id)`         |
| `PATCH /api/admin/clients/:id`      | `ClientService.update(id, dto)`      |
| `PATCH /api/admin/clients/:id/plan` | `ClientService.updatePlan(id, plan)` |
| `DELETE /api/admin/clients/:id`     | `ClientService.remove(id)`           |

See `docs/admin/ADMIN.md` for the full admin API reference.
