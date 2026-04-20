# Auth Module

Handles all authentication and authorization for the Easy Print backend. Implements JWT access tokens with httpOnly refresh token cookies, bcrypt password hashing, and role-based access control.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [JWT Strategy](#jwt-strategy)
5. [Refresh Token Rotation](#refresh-token-rotation)
6. [Guards](#guards)
7. [Decorators](#decorators)
8. [API Reference](#api-reference)
9. [Environment Variables](#environment-variables)
10. [WebSocket Authentication](#websocket-authentication)
11. [Roles & Permissions](#roles--permissions)
12. [Security Notes](#security-notes)

---

## Overview

- **Module:** `src/auth/auth.module.ts`
- **Controller:** `src/auth/auth.controller.ts`
- **Service:** `src/auth/auth.service.ts`
- **Routes prefix:** `/auth`
- **Access token:** Short-lived JWT (default 15 min), sent in `Authorization: Bearer <token>` header
- **Refresh token:** Long-lived opaque token (default 30 days), stored as httpOnly cookie at path `/auth/refresh`
- **Password hashing:** bcrypt, cost factor 12 (registration), 10 (refresh tokens)

---

## Architecture

```
AuthController  ─────────────────────────► AuthService
                                              │
                                              ├── UserService       (create / find users)
                                              ├── ClientService     (create / find client profiles)
                                              ├── JwtService        (sign / verify tokens)
                                              └── IRefreshTokenRepository
                                                        │
                                                        └── PrismaRefreshTokenRepository
                                                              (RefreshToken table in DB)
```

The module uses the **repository pattern** — `AuthService` depends on `IRefreshTokenRepository` injected via the `REFRESH_TOKEN_REPOSITORY` token. The concrete implementation is `PrismaRefreshTokenRepository`.

---

## Directory Structure

```
src/auth/
├── AUTH.md                                    ← this file
├── auth.module.ts                             ← NestJS module wiring
├── auth.controller.ts                         ← REST endpoints
├── auth.service.ts                            ← Core auth logic
├── strategies/
│   └── jwt.strategy.ts                        ← Passport JWT strategy + JwtPayload interface
├── guards/
│   ├── jwt-auth.guard.ts                      ← HTTP guard (extends AuthGuard('jwt'))
│   ├── roles.guard.ts                         ← Role-based access control guard
│   └── ws-jwt.guard.ts                        ← WebSocket JWT guard (used in PrintGateway)
├── decorators/
│   ├── current-user.decorator.ts              ← @CurrentUser() param decorator
│   └── roles.decorator.ts                     ← @Roles() metadata decorator
├── dto/
│   ├── login.dto.ts                           ← { email, password }
│   ├── register.dto.ts                        ← { email, password, companyName, phoneNumber, ... }
│   └── auth-response.dto.ts                   ← AuthResponseDto + AuthUserDto
└── repositories/
    ├── refresh-token.repository.interface.ts  ← IRefreshTokenRepository interface + token
    └── prisma-refresh-token.repository.ts     ← Prisma implementation
```

---

## JWT Strategy

**File:** `src/auth/strategies/jwt.strategy.ts`

Tokens are extracted from the `Authorization: Bearer <token>` header. The `JwtPayload` interface:

```ts
interface JwtPayload {
  sub: string; // userId (cuid)
  email: string;
  role: UserRole; // 'CLIENT' | 'SUPER_ADMIN'
  clientId?: string; // present only when role === 'CLIENT'
}
```

The `validate()` method returns the payload as-is. It becomes the `request.user` object, accessible via `@CurrentUser()`.

---

## Refresh Token Rotation

Every login and token refresh issues a **new** refresh token and invalidates the previous one (rotation).

**Token format:** `{userId}.{uuidv4()}` (raw, never stored)  
**Stored in DB:** bcrypt hash of the raw token (cost 10), with `expiresAt`

**Refresh flow:**

1. Extract `userId` from the `.` prefix of the raw token (O(1) lookup without scanning all tokens)
2. Load all active (non-expired) tokens for that user
3. `bcrypt.compare` each until a match is found
4. Delete the matched token, issue a new access + refresh token pair

**Logout flow:**

1. Same bcrypt scan to find the matching token
2. Delete it — subsequent refresh attempts with the old token will fail

The `findActiveByUserId` repository method uses `take: 10` to cap the bcrypt loop and prevent timing attacks.

---

## Guards

### `JwtAuthGuard`

**File:** `src/auth/guards/jwt-auth.guard.ts`

Standard Passport JWT guard for HTTP routes. Validates the `Authorization: Bearer` token. Throws `401 Unauthorized` if missing or invalid.

```ts
@UseGuards(JwtAuthGuard)
```

### `RolesGuard`

**File:** `src/auth/guards/roles.guard.ts`

Checks `request.user.role` against roles declared via `@Roles()`. Must be used **after** `JwtAuthGuard` (which populates `request.user`).

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
```

### `WsJwtGuard`

**File:** `src/auth/guards/ws-jwt.guard.ts`

WebSocket equivalent of `JwtAuthGuard`. Reads the token from `socket.handshake.auth.token` (format: `Bearer <token>` or bare token). Attaches the decoded payload to `socket.user`.

client clients must connect with:

```ts
const socket = io(url, { auth: { token: `Bearer ${accessToken}` } });
```

Applied to all client-side events in `PrintGateway` via `@UseGuards(WsJwtGuard)`. Customer events do **not** require authentication.

---

## Decorators

### `@CurrentUser(key?)`

**File:** `src/auth/decorators/current-user.decorator.ts`

Extracts the authenticated user (or a specific field) from `request.user`.

```ts
@CurrentUser()             // returns the full JwtPayload
@CurrentUser('sub')        // returns userId string
@CurrentUser('role')       // returns UserRole
@CurrentUser('clientId')   // returns clientId (undefined for admins)
```

### `@Roles(...roles)`

**File:** `src/auth/decorators/roles.decorator.ts`

Sets required roles metadata consumed by `RolesGuard`.

```ts
@Roles(UserRole.CLIENT)
@Roles(UserRole.SUPER_ADMIN)
@Roles(UserRole.CLIENT, UserRole.SUPER_ADMIN)  // either role allowed
```

---

## API Reference

All routes are under `/auth`. Auth routes have a tighter throttle: **5 requests/min** per IP on login and register (vs. 30/min globally).

---

### `POST /auth/register`

Register a new client account. Creates a `User`, a `Client` profile, and issues tokens.

| Property       | Value            |
| -------------- | ---------------- |
| **Auth**       | None             |
| **Rate limit** | 5 req/min per IP |
| **Response**   | `201 Created`    |

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "Secret@123",
  "companyName": "Acme Print Co.",
  "phoneNumber": "+1234567890",
  "logoUrl": "http://localhost:3001/uploads/pre-register/.../logo.jpg",
  "googleProfileLink": "https://maps.google.com/?cid=...",
  "address": "123 Main St",
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

> `logoUrl`, `googleProfileLink`, `address`, `latitude`, `longitude` are optional.

**Response `201`:**

```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "clxxx",
    "email": "user@example.com",
    "role": "CLIENT",
    "client": { "id": "clyyy", "companyName": "Acme Print Co.", "slug": "acme-print-co-a1b2c3", ... }
  }
}
```

Sets `refreshToken` as an httpOnly cookie (path: `/auth/refresh`, 30 days).

**Errors:** `409 Conflict` — email already registered.

---

### `POST /auth/login`

Login with email and password.

| Property       | Value            |
| -------------- | ---------------- |
| **Auth**       | None             |
| **Rate limit** | 5 req/min per IP |
| **Response**   | `200 OK`         |

**Request body:**

```json
{ "email": "user@example.com", "password": "Secret@123" }
```

**Response `200`:** Same shape as `/register`. Sets `refreshToken` cookie.

**Errors:** `401 Unauthorized` — invalid credentials.

---

### `POST /auth/refresh`

Exchange the refresh token cookie for a new access token (and rotated refresh token).

| Property     | Value                          |
| ------------ | ------------------------------ |
| **Auth**     | `refreshToken` httpOnly cookie |
| **Response** | `200 OK`                       |

**Response `200`:**

```json
{ "accessToken": "eyJ..." }
```

Sets a new `refreshToken` cookie. The old token is invalidated.

**Errors:** `401 Unauthorized` — cookie missing, invalid, or expired.

---

### `POST /auth/logout`

Revoke the current refresh token and clear the cookie.

| Property     | Value                                                   |
| ------------ | ------------------------------------------------------- |
| **Auth**     | `Authorization: Bearer <token>` + `refreshToken` cookie |
| **Response** | `204 No Content`                                        |

---

### `GET /auth/me`

Get the current authenticated user's profile (user + client or admin data).

| Property     | Value                           |
| ------------ | ------------------------------- |
| **Auth**     | `Authorization: Bearer <token>` |
| **Response** | `200 OK`                        |

**Response `200`:**

```json
{
  "id": "clxxx",
  "email": "user@example.com",
  "role": "CLIENT",
  "createdAt": "...",
  "updatedAt": "...",
  "client": { ... }
}
```

---

## Environment Variables

| Variable                 | Default | Description                            | Required |
| ------------------------ | ------- | -------------------------------------- | -------- |
| `JWT_SECRET`             | —       | Secret key for signing JWTs            | **Yes**  |
| `JWT_EXPIRES_IN`         | `15m`   | Access token TTL (e.g. `15m`, `1h`)    | No       |
| `JWT_REFRESH_EXPIRES_IN` | `30d`   | Refresh token TTL in days (e.g. `30d`) | No       |

---

## WebSocket Authentication

client-side WebSocket events are protected by `WsJwtGuard`. Customer events are unauthenticated by design (customers connect via QR code, no account required).

**Protected events (client):**

- `client:join`
- `client:create_session`
- `client:print_complete`
- `client:print_error`
- `session:end`

**Unprotected events (customer):**

- `customer:join_session`
- `customer:file_metadata`
- `customer:file_chunk`
- `customer:file_complete`

See `docs/print/PRINT.md` for the full WebSocket event reference.

---

## Roles & Permissions

| Role          | Description            | Key permissions                                                |
| ------------- | ---------------------- | -------------------------------------------------------------- |
| `CLIENT`      | Print client owner     | Manage own profile, upload logos, connect client via WebSocket |
| `SUPER_ADMIN` | Platform administrator | Full access to all clients, users, plan management             |

Role is stored in the `User.role` DB column and embedded in every JWT. The `@Roles()` decorator + `RolesGuard` enforce access at the controller level.

---

## Security Notes

| Concern                      | Mitigation                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Brute force login**        | 5 req/min rate limit via `@Throttle` on `/login` and `/register`                                                      |
| **Refresh token theft**      | httpOnly cookie (JS cannot read it), `sameSite: strict`, `secure: true` in production, scoped to `/auth/refresh` path |
| **Token reuse after logout** | Rotating refresh tokens — each use invalidates the previous token                                                     |
| **Bcrypt timing scan**       | `findActiveByUserId` caps result set at `take: 10` to bound the comparison loop                                       |
| **Password storage**         | bcrypt with cost 12 (registration). Passwords are never returned in any response                                      |
| **JWT secret exposure**      | Validated at startup via Joi schema — app will crash on boot if `JWT_SECRET` is missing                               |
