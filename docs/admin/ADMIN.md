# Admin Module

Provides super-admin management APIs for clients, users, and admin accounts. All routes require the `SUPER_ADMIN` role.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [API Reference](#api-reference)
   - [Clients](#clients)
   - [Users](#users)
   - [Admins](#admins)
5. [DTOs](#dtos)
6. [Creating the First Super Admin](#creating-the-first-super-admin)

---

## Overview

- **Module:** `src/admin/admin.module.ts`
- **Controller:** `src/admin/admin.controller.ts`
- **Service:** `src/admin/admin.service.ts`
- **Routes prefix:** `/admin`
- **Access:** `SUPER_ADMIN` role only (enforced by `JwtAuthGuard` + `RolesGuard` at controller level)

---

## Architecture

```
AdminController  ──────────────────► AdminService
                                          │
                                          ├── ClientService    (client CRUD, plan changes)
                                          ├── UserService      (user listing)
                                          └── PrismaService    (admin user listing — direct query)
```

`AdminService` delegates most work to `ClientService` and `UserService` rather than touching the DB directly. The exception is `findAllAdmins()`, which queries the `AdminUser` table directly via `PrismaService` (since there is no `AdminUserService`).

---

## Directory Structure

```
src/admin/
├── ADMIN.md                            ← this file
├── admin.module.ts                     ← NestJS module; imports ClientModule, UserModule
├── admin.controller.ts                 ← All /admin/* routes
├── admin.service.ts                    ← Orchestrates ClientService + UserService + Prisma
└── dto/
    ├── update-client-plan.dto.ts       ← { plan: ClientPlan }
    └── admin-user-response.dto.ts      ← AdminUser + User fields merged
```

---

## API Reference

All routes require:

- `Authorization: Bearer <token>` (JWT)
- Token must have `role: SUPER_ADMIN`

---

### Clients

#### `GET /admin/clients`

List all client profiles.

| Property     | Value                                   |
| ------------ | --------------------------------------- |
| **Response** | `200 OK` — array of `ClientResponseDto` |

**Response `200`:**

```json
[
  {
    "id": "clyyy",
    "slug": "acme-print-co-a1b2c3",
    "companyName": "Acme Print Co.",
    "phoneNumber": "+1234567890",
    "plan": "FREE",
    "logoUrl": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

> ⚠️ Currently returns all records without pagination. See `docs/todo/ARCHITECTURE_TODO.md` for the pagination improvement plan.

---

#### `GET /admin/clients/:id`

Get a single client by ID.

| Property     | Value                          |
| ------------ | ------------------------------ |
| **Response** | `200 OK` — `ClientResponseDto` |

**Errors:** `404 Not Found` — client does not exist.

---

#### `PATCH /admin/clients/:id`

Update any client profile field (same shape as `PATCH /clients/me` but admin can target any client).

| Property     | Value                                  |
| ------------ | -------------------------------------- |
| **Response** | `200 OK` — updated `ClientResponseDto` |

**Request body** (all fields optional):

```json
{
  "companyName": "New Company Name",
  "phoneNumber": "+1234567890",
  "logoUrl": "https://...",
  "address": "...",
  "latitude": 0.0,
  "longitude": 0.0
}
```

---

#### `PATCH /admin/clients/:id/plan`

Change a client's subscription plan.

| Property     | Value                                  |
| ------------ | -------------------------------------- |
| **Response** | `200 OK` — updated `ClientResponseDto` |

**Request body:**

```json
{ "plan": "PRO" }
```

Valid values: `"FREE"` | `"STARTER"` | `"PRO"`

---

#### `DELETE /admin/clients/:id`

Delete a client and all related data (sessions, print jobs, payments — cascade).

| Property     | Value            |
| ------------ | ---------------- |
| **Response** | `204 No Content` |

**Errors:** `404 Not Found` — client does not exist.

---

### Users

#### `GET /admin/users`

List all user accounts (both `CLIENT` and `SUPER_ADMIN` roles). Password hashes are excluded from the response.

| Property     | Value                                 |
| ------------ | ------------------------------------- |
| **Response** | `200 OK` — array of `UserResponseDto` |

**Response `200`:**

```json
[
  {
    "id": "clxxx",
    "email": "user@example.com",
    "role": "CLIENT",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### Admins

#### `GET /admin/admins`

List all admin users (records in the `AdminUser` table, joined with their `User`).

| Property     | Value                                      |
| ------------ | ------------------------------------------ |
| **Response** | `200 OK` — array of `AdminUserResponseDto` |

**Response `200`:**

```json
[
  {
    "id": "cladmin",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "SUPER_ADMIN",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## DTOs

### `UpdateClientPlanDto`

```ts
class UpdateClientPlanDto {
  plan!: ClientPlan; // 'FREE' | 'STARTER' | 'PRO'
}
```

### `AdminUserResponseDto`

Merges `AdminUser` fields with `User` email and role:

```ts
class AdminUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}
```

---

## Creating the First Super Admin

There is no public registration endpoint for admins. The first `SUPER_ADMIN` is seeded via a CLI script:

```bash
pnpm seed:admin
```

This runs `prisma/seed-admin.ts`, which creates a `User` (role: `SUPER_ADMIN`) and a linked `AdminUser` record. Subsequent admin accounts must be created via the same seed script or directly in the database.
