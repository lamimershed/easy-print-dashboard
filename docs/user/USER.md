# User Module

Provides user account management as a foundational service consumed by `AuthModule` and `AdminModule`. There are no public-facing user routes — user data is always accessed through `AuthModule` (`/auth/me`) or `AdminModule` (`/admin/users`).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [User Model](#user-model)
5. [UserService API](#userservice-api)
6. [Repository Pattern](#repository-pattern)
7. [UserResponseDto](#userresponsedto)

---

## Overview

- **Module:** `src/user/user.module.ts`
- **Service:** `src/user/user.service.ts`
- **No controller** — this module is purely a service layer
- **Exported:** `UserService` is exported and consumed by `AuthModule` and `AdminModule`

---

## Architecture

```
AuthService  ──────┐
                   ├──► UserService
AdminService ──────┘         │
                             └── IUserRepository  (USER_REPOSITORY token)
                                       │
                                       └── PrismaUserRepository
                                             (User table in PostgreSQL)
```

---

## Directory Structure

```
src/user/
├── USER.md                                  ← this file
├── user.module.ts                           ← NestJS module; exports UserService
├── user.service.ts                          ← User lookup and creation logic
├── dto/
│   └── user-response.dto.ts                ← Public response shape (passwordHash omitted)
└── repositories/
    ├── user.repository.interface.ts        ← IUserRepository + USER_REPOSITORY token
    └── prisma-user.repository.ts           ← Prisma implementation
```

---

## User Model

| Field          | Type            | Description                                          |
| -------------- | --------------- | ---------------------------------------------------- |
| `id`           | `string` (cuid) | Unique identifier                                    |
| `email`        | `string`        | Unique email address                                 |
| `passwordHash` | `string`        | bcrypt hash — **never included in any API response** |
| `role`         | `UserRole`      | `'CLIENT'` or `'SUPER_ADMIN'`                        |
| `createdAt`    | `DateTime`      |                                                      |
| `updatedAt`    | `DateTime`      | Auto-updated                                         |

Relations: `User` has one optional `Client`, one optional `AdminUser`, and many `RefreshToken` records.

---

## UserService API

### `create(data)`

Create a new user. Called by `AuthService.register()`.

```ts
create(data: { email: string; passwordHash: string; role?: UserRole }): Promise<User>
```

Returns the full `User` record including `passwordHash` — callers are responsible for not exposing it.

---

### `findByEmail(email)`

Find a user by email address. Returns `null` if not found. Used by `AuthService.login()` to verify credentials.

```ts
findByEmail(email: string): Promise<User | null>
```

---

### `findById(id)`

Find a user by primary key. Throws `404 NotFoundException` if not found.

```ts
findById(id: string): Promise<User>
```

---

### `findByIdAsDto(id)`

Find a user by ID and return a `UserResponseDto` (without `passwordHash`).

```ts
findByIdAsDto(id: string): Promise<UserResponseDto>
```

---

### `findAll()`

Return all users as `UserResponseDto[]`. Used by `AdminService` for the admin user list.

```ts
findAll(): Promise<UserResponseDto[]>
```

---

## Repository Pattern

`UserService` depends on `IUserRepository` injected via the `USER_REPOSITORY` DI token.

**Interface methods:**

| Method               | Description                  |
| -------------------- | ---------------------------- |
| `create(data)`       | Insert a new user row        |
| `findByEmail(email)` | Lookup by unique email       |
| `findById(id)`       | Lookup by primary key        |
| `findAll()`          | Return all users (admin use) |

The concrete implementation is `PrismaUserRepository` in `src/user/repositories/prisma-user.repository.ts`.

---

## UserResponseDto

The `passwordHash` field is stripped before any user data leaves the service layer.

```ts
class UserResponseDto {
  id!: string;
  email!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
  // passwordHash is intentionally excluded
}
```

The strip happens via object destructuring in `UserService.toResponse()`:

```ts
private toResponse(user: User): UserResponseDto {
  const { passwordHash: _, ...rest } = user;
  return rest as UserResponseDto;
}
```
