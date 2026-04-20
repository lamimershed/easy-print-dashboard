# Database Schema — Easy Print

PostgreSQL database managed via Prisma. Client generated at `src/generated/prisma/`.

---

## Table Map

```
User
 ├── AdminUser        (1:1)
 ├── Client           (1:1)
 │    ├── Session[]   (1:N)
 │    │    └── PrintJob[]   (1:N, also linked directly to Client)
 │    ├── PrintJob[]  (1:N)
 │    ├── Payment[]   (1:N)
 │    └── AnalyticsEvent[]  (1:N)
 └── RefreshToken[]   (1:N)
```

---

## Enums

| Enum             | Values                                                     |
| ---------------- | ---------------------------------------------------------- |
| `UserRole`       | `CLIENT`, `SUPER_ADMIN`                                    |
| `ClientPlan`     | `FREE`, `STARTER`, `PRO`                                   |
| `SessionStatus`  | `WAITING`, `CONNECTED`, `PRINTING`, `COMPLETED`, `EXPIRED` |
| `PrintJobStatus` | `PENDING`, `PRINTING`, `COMPLETED`, `FAILED`               |
| `PaymentStatus`  | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`               |

---

## Tables

### `User`

Central auth identity for all account types.

| Column         | Type            | Notes                                     |
| -------------- | --------------- | ----------------------------------------- |
| `id`           | `String` (cuid) | PK                                        |
| `email`        | `String`        | Unique, indexed                           |
| `passwordHash` | `String`        | bcrypt hash — never returned in responses |
| `role`         | `UserRole`      | Default `CLIENT`                          |
| `createdAt`    | `DateTime`      | Auto                                      |
| `updatedAt`    | `DateTime`      | Auto                                      |

**Relations:** `client` (→ Client), `admin` (→ AdminUser), `refreshTokens` (→ RefreshToken[])

---

### `AdminUser`

Profile extension for `SUPER_ADMIN` users.

| Column      | Type            | Notes                             |
| ----------- | --------------- | --------------------------------- |
| `id`        | `String` (cuid) | PK                                |
| `userId`    | `String`        | Unique FK → User (Cascade delete) |
| `name`      | `String`        | Display name                      |
| `createdAt` | `DateTime`      | Auto                              |
| `updatedAt` | `DateTime`      | Auto                              |

---

### `Client`

Print client profile. Created on registration for `CLIENT` role users.

| Column              | Type            | Notes                                                      |
| ------------------- | --------------- | ---------------------------------------------------------- |
| `id`                | `String` (cuid) | PK                                                         |
| `userId`            | `String`        | Unique FK → User (Cascade delete), indexed                 |
| `slug`              | `String`        | Unique, indexed — used in QR codes & WebSocket connections |
| `companyName`       | `String`        | —                                                          |
| `phoneNumber`       | `String`        | —                                                          |
| `plan`              | `ClientPlan`    | Default `FREE`                                             |
| `logoUrl`           | `String?`       | Optional                                                   |
| `googleProfileLink` | `String?`       | Optional                                                   |
| `address`           | `String?`       | Optional                                                   |
| `latitude`          | `Float?`        | Optional                                                   |
| `longitude`         | `Float?`        | Optional                                                   |
| `createdAt`         | `DateTime`      | Auto                                                       |
| `updatedAt`         | `DateTime`      | Auto                                                       |

**Relations:** `sessions`, `printJobs`, `payments`, `analyticsEvents`

---

### `RefreshToken`

Stores hashed refresh tokens for JWT rotation. One user can have multiple active tokens (multi-device).

| Column      | Type            | Notes                               |
| ----------- | --------------- | ----------------------------------- |
| `id`        | `String` (cuid) | PK                                  |
| `userId`    | `String`        | FK → User (Cascade delete), indexed |
| `tokenHash` | `String`        | Unique bcrypt hash of raw token     |
| `expiresAt` | `DateTime`      | Token expiry                        |
| `createdAt` | `DateTime`      | Auto                                |

---

### `Session`

Represents a print session initiated by a client socket connection. Backed by in-memory state in `SessionService` during its lifetime; written to DB by `PrintService`.

| Column        | Type            | Notes                                                          |
| ------------- | --------------- | -------------------------------------------------------------- |
| `id`          | `String` (cuid) | PK                                                             |
| `clientId`    | `String?`       | FK → Client (Cascade delete), indexed                          |
| `isEphemeral` | `Boolean`       | `true` = 30-min QR session; `false` = permanent client session |
| `status`      | `SessionStatus` | Default `WAITING`, indexed                                     |
| `createdAt`   | `DateTime`      | Auto                                                           |
| `expiresAt`   | `DateTime`      | Set on creation                                                |
| `completedAt` | `DateTime?`     | Set when session ends                                          |

**Relations:** `printJobs`

---

### `PrintJob`

Tracks each file transfer within a session.

| Column        | Type             | Notes                                                                 |
| ------------- | ---------------- | --------------------------------------------------------------------- |
| `id`          | `String` (cuid)  | PK                                                                    |
| `sessionId`   | `String`         | FK → Session (Cascade delete), indexed                                |
| `clientId`    | `String?`        | FK → Client (Cascade delete), indexed                                 |
| `filename`    | `String`         | Original filename                                                     |
| `fileSize`    | `Int`            | Bytes                                                                 |
| `mimeType`    | `String`         | e.g. `application/pdf`                                                |
| `copies`      | `Int`            | Default `1`                                                           |
| `colorMode`   | `String?`        | e.g. `color`, `bw`                                                    |
| `tempUserId`  | `String?`        | Opaque browser localStorage ID, indexed — never validated server-side |
| `status`      | `PrintJobStatus` | Default `PENDING`, indexed                                            |
| `createdAt`   | `DateTime`       | Auto                                                                  |
| `completedAt` | `DateTime?`      | Set on `client:print_complete`                                        |

---

### `Payment`

Subscription / billing record linked to a client.

| Column        | Type            | Notes                                                        |
| ------------- | --------------- | ------------------------------------------------------------ |
| `id`          | `String` (cuid) | PK                                                           |
| `clientId`    | `String`        | FK → Client (Cascade delete), indexed                        |
| `amountCents` | `Int`           | Amount in smallest currency unit                             |
| `currency`    | `String`        | Default `"USD"`                                              |
| `status`      | `PaymentStatus` | Default `PENDING`, indexed                                   |
| `gatewayId`   | `String?`       | Unique — payment provider ref (e.g. Stripe PaymentIntent ID) |
| `metadata`    | `Json?`         | Arbitrary provider metadata                                  |
| `createdAt`   | `DateTime`      | Auto                                                         |
| `updatedAt`   | `DateTime`      | Auto                                                         |

---

### `AnalyticsEvent`

Append-only event log for per-client analytics.

| Column      | Type            | Notes                                                  |
| ----------- | --------------- | ------------------------------------------------------ |
| `id`        | `String` (cuid) | PK                                                     |
| `clientId`  | `String`        | FK → Client (Cascade delete), indexed with `eventType` |
| `eventType` | `String`        | e.g. `session_started`, `print_completed`              |
| `metadata`  | `Json?`         | Arbitrary event payload                                |
| `createdAt` | `DateTime`      | Indexed                                                |

---

## Relationship Summary

| From      | To               | Type     | FK / Notes                |
| --------- | ---------------- | -------- | ------------------------- |
| `User`    | `Client`         | 1 : 0..1 | `Client.userId`           |
| `User`    | `AdminUser`      | 1 : 0..1 | `AdminUser.userId`        |
| `User`    | `RefreshToken`   | 1 : N    | `RefreshToken.userId`     |
| `Client`  | `Session`        | 1 : N    | `Session.clientId`        |
| `Client`  | `PrintJob`       | 1 : N    | `PrintJob.clientId`       |
| `Client`  | `Payment`        | 1 : N    | `Payment.clientId`        |
| `Client`  | `AnalyticsEvent` | 1 : N    | `AnalyticsEvent.clientId` |
| `Session` | `PrintJob`       | 1 : N    | `PrintJob.sessionId`      |

All FK relations use **Cascade delete** — deleting a `User` removes all linked records.

---

## Indexes

| Table            | Index Columns                                   |
| ---------------- | ----------------------------------------------- |
| `User`           | `email`                                         |
| `Client`         | `userId`, `slug`                                |
| `RefreshToken`   | `userId`                                        |
| `Session`        | `clientId`, `status`                            |
| `PrintJob`       | `clientId`, `sessionId`, `status`, `tempUserId` |
| `Payment`        | `clientId`, `status`                            |
| `AnalyticsEvent` | `(clientId, eventType)`, `createdAt`            |
