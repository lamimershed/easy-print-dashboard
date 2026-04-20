# Core Print Session Flow — Reference

> **Status: All phases complete. ✅**
> This document is the authoritative reference for the Easy Print backend's core flow.
> Last updated: after Phase 9 (shop → client rename).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [End-to-End Flow](#2-end-to-end-flow)
3. [REST API Reference](#3-rest-api-reference)
4. [WebSocket Event Reference](#4-websocket-event-reference)
5. [Session Lifecycle](#5-session-lifecycle)
6. [PrintJob Status Machine](#6-printjob-status-machine)
7. [Analytics Events](#7-analytics-events)
8. [File Map](#8-file-map)

---

## 1. System Overview

Easy Print is a print-on-demand relay platform. A **client** (print kiosk / desktop companion app) has a unique ID and a URL-friendly `slug`. Customers scan a QR code at the client location, open the web app, and send a file directly to the client via WebSocket — the server relays chunks in real time with no buffering or file storage.

### Key Actors

| Actor        | Auth         | Identified by                                                     |
| ------------ | ------------ | ----------------------------------------------------------------- |
| **Client**   | JWT (Bearer) | `clientId` — DB UUID, from JWT payload `.clientId`                |
| **Customer** | None         | `customerId` — opaque UUID from browser `localStorage`            |
| **Server**   | —            | Brokers file relay, persists `PrintJob` records, tracks analytics |

### QR Code URL format

```
https://easyprint.app/print/{slug}
```

The frontend reads the `slug` from the URL and starts the flow below.

---

## 2. End-to-End Flow

```
Customer scans QR code → opens https://easyprint.app/print/{slug}
                                │
                                ▼
        ┌──────────────────────────────────────────┐
        │  GET /client/{slug}                   │
        │  ?customerId=<localStorage UUID>          │
        │  → { id, companyName, slug,               │
        │       logoUrl, address,                   │
        │       googleProfileLink, isOnline }       │
        │  Side-effect: AnalyticsEvent(scan)        │
        └──────────────────────────────────────────┘
                                │
                                ▼ (use id as clientId)
        ┌──────────────────────────────────────────┐
        │  POST /sessions/start                 │
        │  { customerId, clientId }                 │
        │  → { sessionId, expiresAt,                │
        │       alreadyExisted }                    │
        │  Returns existing session if < 30 min     │
        └──────────────────────────────────────────┘
                                │
                                ▼
        ┌──────────────────────────────────────────┐
        │  WebSocket connect (no auth)              │
        │  emit: customer:join_session              │
        │  { sessionId, customerId }                │
        │  ack: { valid: true, sessionId }          │
        │  → client receives: customer:joined       │
        └──────────────────────────────────────────┘
                                │
                                ▼
        ┌──────────────────────────────────────────┐
        │  emit: customer:file_metadata             │
        │  { sessionId, fileName, fileType,         │
        │    fileSize, copies, colorMode }          │
        │  Server: creates PrintJob (PENDING)       │
        │  → client receives: print:incoming        │
        │  ack: { success: true }                   │
        └──────────────────────────────────────────┘
                                │
                                ▼
        ┌──────────────────────────────────────────┐
        │  emit: customer:file_chunk × N            │
        │  { sessionId, chunk, chunkIndex,          │
        │    totalChunks }                          │
        │  → client receives: print:chunk × N       │
        │  Customer receives: transfer:progress     │
        └──────────────────────────────────────────┘
                                │
                                ▼
        ┌──────────────────────────────────────────┐
        │  emit: customer:file_complete             │
        │  { sessionId }                            │
        │  Server: PrintJob → PRINTING              │
        │  → client receives: print:ready           │
        │  ack: { success: true }                   │
        └──────────────────────────────────────────┘
                                │
                                ▼ (client prints, then emits)
        ┌──────────────────────────────────────────┐
        │  client emits: client:print_complete      │
        │  sessionId (string)                       │
        │  Server: PrintJob → COMPLETED             │
        │  → customer receives: print:success       │
        │  → AnalyticsEvent(print_completed)        │
        │  → session reset to 'waiting'             │
        └──────────────────────────────────────────┘
```

**Session recovery (page refresh):**

```
GET /sessions/active?customerId=X&clientId=Y
→ { sessionId, expiresAt, status }  — or 404 if expired
```

---

## 3. REST API Reference

### `GET /client/:slug`

Public — no auth required. Called by the customer frontend after scanning the QR code.

**Query params:**

| Param        | Required | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `customerId` | No       | Customer's `localStorage` UUID (used for scan analytics) |

**Response 200:**

```json
{
  "id": "clt_abc123",
  "companyName": "Acme Print",
  "slug": "acme-print-a1b2",
  "logoUrl": "https://...",
  "address": "123 Main St",
  "googleProfileLink": "https://maps.google.com/...",
  "isOnline": true
}
```

`isOnline: true` means the client companion app has an active WebSocket session right now.

**Side-effect:** writes `AnalyticsEvent(scan)` for the client (fire-and-forget).

---

### `POST /sessions/start`

Public — no auth required. Creates or resumes a session for a `customerId + clientId` pair.

Returns **503** if the client is currently offline.

**Request body:**

```json
{ "customerId": "<uuid>", "clientId": "clt_abc123" }
```

**Response 201:**

```json
{
  "sessionId": "<uuid>",
  "expiresAt": "2026-04-19T15:30:00.000Z",
  "alreadyExisted": false
}
```

`alreadyExisted: true` means an existing active session (within 30 min TTL) was returned — no new session was created.

---

### `GET /sessions/active`

Public — no auth required. Recovers an existing session on page refresh.

**Query params:**

| Param        | Required |
| ------------ | -------- |
| `customerId` | Yes      |
| `clientId`   | Yes      |

**Response 200:**

```json
{
  "sessionId": "<uuid>",
  "expiresAt": "2026-04-19T15:30:00.000Z",
  "status": "waiting"
}
```

Returns **404** if no active session exists — call `POST /sessions/start` to create one.

---

### `GET /sessions/status`

Debug/internal use. Returns session state by `sessionId`.

**Query params:** `sessionId`

**Response 200:**

```json
{
  "id": "<uuid>",
  "status": "transferring",
  "hasCustomer": true,
  "expiresAt": "2026-04-19T15:30:00.000Z"
}
```

---

### `GET /analytics/me`

Requires JWT + `CLIENT` role.

**Query params:** `period` — `7d`, `30d`, or `all`

**Response 200:**

```json
{
  "totalScans": 142,
  "totalPrintJobs": 89,
  "completedPrintJobs": 85,
  "failedPrintJobs": 4,
  "uniqueCustomers": 67,
  "period": "30d"
}
```

---

### `GET /analytics/me/events`

Requires JWT + `CLIENT` role. Paginated list of raw analytics events.

**Query params:** `page`, `limit`, `eventType`

---

### `GET /print-jobs/me`

Requires JWT + `CLIENT` role. Paginated print job history.

**Query params:** `page`, `limit`, `status` (PENDING | PRINTING | COMPLETED | FAILED)

**Response 200:**

```json
{
  "data": [
    {
      "id": "...",
      "filename": "document.pdf",
      "fileSize": 204800,
      "mimeType": "application/pdf",
      "copies": 2,
      "colorMode": "blackwhite",
      "status": "COMPLETED",
      "createdAt": "2026-04-19T10:00:00.000Z",
      "completedAt": "2026-04-19T10:01:00.000Z"
    }
  ],
  "total": 89,
  "page": 1,
  "limit": 20
}
```

---

## 4. WebSocket Event Reference

### Client-emitted events (companion app → server)

All require `Authorization: Bearer <token>` in `socket.handshake.auth.token`.

| Event                   | Payload                | Description                                                                                                                 |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `client:join`           | _(none)_               | Join or reconnect to the permanent session keyed by `clientId` (from JWT). Ack: `{ sessionId }` emitted as `client:joined`. |
| `client:create_session` | _(none)_               | Create a new ephemeral session (30-min TTL). Callback: `{ sessionId, expiresAt }`.                                          |
| `client:print_complete` | `sessionId: string`    | Mark print job done. Server emits `print:success` to customer, marks PrintJob COMPLETED.                                    |
| `client:print_error`    | `{ sessionId, error }` | Signal print failure. Server emits `print:error` to customer.                                                               |
| `session:end`           | `sessionId: string`    | End and destroy the session. All participants receive `session:ended`.                                                      |

### Client-received events (server → companion app)

| Event             | Payload                                               | Triggered by                                          |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `client:joined`   | `{ sessionId }`                                       | After `client:join` succeeds                          |
| `customer:joined` | `{ sessionId, connectedAt }`                          | Customer joins the session                            |
| `customer:left`   | _(none)_                                              | Customer disconnects                                  |
| `print:incoming`  | `{ fileName, fileType, fileSize, copies, colorMode }` | Customer sends file metadata                          |
| `print:chunk`     | `{ chunk, chunkIndex, totalChunks }`                  | Each file chunk relayed in real time                  |
| `print:ready`     | _(none)_                                              | Customer finished sending all chunks                  |
| `session:ended`   | `{ reason }`                                          | Session terminated (from disconnect or `session:end`) |

### Customer-emitted events (browser → server)

No auth required.

| Event                    | Payload                                                          | Callback                                                  |
| ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `customer:join_session`  | `{ sessionId, customerId? }`                                     | `{ valid: true, sessionId }` or `{ valid: false, error }` |
| `customer:file_metadata` | `{ sessionId, fileName, fileType, fileSize, copies, colorMode }` | `{ success: true }` or `{ success: false, error }`        |
| `customer:file_chunk`    | `{ sessionId, chunk, chunkIndex, totalChunks }`                  | _(none)_                                                  |
| `customer:file_complete` | `{ sessionId }`                                                  | `{ success: true }`                                       |

### Customer-received events (server → browser)

| Event               | Payload        | Triggered by                         |
| ------------------- | -------------- | ------------------------------------ |
| `transfer:progress` | `{ progress }` | After each chunk is relayed (0–100%) |
| `print:success`     | _(none)_       | Client emits `client:print_complete` |
| `print:error`       | `{ error }`    | Client emits `client:print_error`    |
| `session:ended`     | `{ reason }`   | Session terminated                   |

---

## 5. Session Lifecycle

### In-memory `Session` shape

```typescript
interface Session {
  id: string;
  clientSocketId: string | null; // live Socket.IO connection ID of the companion app
  customerSocketId: string | null; // live Socket.IO connection ID of the browser
  clientId?: string; // DB UUID of the print business
  customerId?: string; // opaque UUID from customer's localStorage
  status: 'waiting' | 'connected' | 'transferring' | 'printing' | 'completed';
  createdAt: Date;
  expiresAt: Date;
  currentJob: PrintJob | null;
}
```

### Session types

| Type                 | Created by                       | TTL    | Key                          |
| -------------------- | -------------------------------- | ------ | ---------------------------- |
| **Permanent**        | `client:join` WS event           | 1 year | `clientId` (same as DB UUID) |
| **Ephemeral (HTTP)** | `POST /sessions/start`           | 30 min | random UUID                  |
| **Ephemeral (WS)**   | `client:create_session` WS event | 30 min | random UUID                  |

### Session status transitions

```
waiting
  └─ customer:join_session → connected
       └─ customer:file_metadata → transferring
            └─ customer:file_complete → printing
                 └─ client:print_complete → completed → reset to waiting
                 └─ client:print_error → (customer notified; session stays in printing)
  └─ customer disconnect (during transferring/printing) → PrintJob marked FAILED
```

### `SessionService` key methods

| Method                                                  | Called by                                                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `startSession(customerId, clientId)`                    | `POST /sessions/start`                                                                              |
| `getActiveSession(customerId, clientId)`                | `GET /sessions/active`                                                                              |
| `joinSession(sessionId, customerSocketId, customerId?)` | `customer:join_session` WS event                                                                    |
| `resetSessionAfterPrint(sessionId)`                     | After `client:print_complete` — clears `customerSocketId`, `currentJob`, resets status to `waiting` |
| `createSessionWithId(clientId, socketId)`               | `client:join` WS event (permanent session)                                                          |
| `updateClientSocket(sessionId, socketId)`               | `client:join` on reconnect                                                                          |

---

## 6. PrintJob Status Machine

```
PENDING    ← created when customer:file_metadata received
   ↓
PRINTING   ← set when customer:file_complete received (all chunks sent)
   ↓
COMPLETED  ← set when client:print_complete received
   ↓
FAILED     ← set when customer disconnects during transferring/printing
```

**PrintJob DB fields:**

| Field         | Type            | Source                                              |
| ------------- | --------------- | --------------------------------------------------- |
| `sessionId`   | String          | In-memory session ID                                |
| `clientId`    | String?         | `session.clientId`                                  |
| `filename`    | String          | `customer:file_metadata` payload                    |
| `fileSize`    | Int             | `customer:file_metadata` payload                    |
| `mimeType`    | String          | `customer:file_metadata` payload                    |
| `copies`      | Int (default 1) | `customer:file_metadata` payload                    |
| `colorMode`   | String?         | `customer:file_metadata` payload                    |
| `tempUserId`  | String?         | `session.customerId` (customer's localStorage UUID) |
| `status`      | Enum            | See state machine above                             |
| `createdAt`   | DateTime        | Auto                                                |
| `completedAt` | DateTime?       | Set on COMPLETED                                    |

---

## 7. Analytics Events

Written via `AnalyticsService.trackEvent()` — fire-and-forget, never throws.

| Event type        | Triggered when                    | Metadata                                                          |
| ----------------- | --------------------------------- | ----------------------------------------------------------------- |
| `scan`            | `GET /client/:slug` called        | `{ slug, customerId }`                                            |
| `print_started`   | `customer:file_metadata` received | `{ filename, fileSize, mimeType, copies, colorMode, tempUserId }` |
| `print_completed` | `client:print_complete` received  | `{ dbJobId, tempUserId }`                                         |
| `print_failed`    | `client:print_error` received     | `{ error, tempUserId }`                                           |

> `tempUserId` in analytics metadata = `session.customerId` (the customer's localStorage UUID).

---

## 8. File Map

### Core flow files

| File                                                       | Responsibility                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/client/client-public.controller.ts`                   | `GET /client/:slug` — public client info + scan analytics                             |
| `src/client/client.service.ts`                             | `findBySlugPublic()` — resolves slug, checks `isOnline` via `SessionService`          |
| `src/client/dto/client-public-response.dto.ts`             | `ClientPublicResponseDto`                                                             |
| `src/session/session.controller.ts`                        | `POST /sessions/start`, `GET /sessions/active`, `GET /sessions/status`                |
| `src/session/session.service.ts`                           | In-memory session store — all session lifecycle methods                               |
| `src/session/interfaces/session.interface.ts`              | `Session` shape + `SessionCreateResponse`, `SessionJoinResponse`                      |
| `src/session/dto/session.dto.ts`                           | `StartSessionDto`, `StartSessionResponseDto`, `ActiveSessionDto`, `SessionStatusDto`  |
| `src/print/print.gateway.ts`                               | All WebSocket event handlers (`client:*`, `customer:*`)                               |
| `src/print/print.service.ts`                               | `persistPrintJob()`, `updatePrintJobStatus()`, `completePrintJob()`, `failPrintJob()` |
| `src/print/print.controller.ts`                            | `GET /print-jobs/me`                                                                  |
| `src/print/repositories/print-job.repository.interface.ts` | `IPrintJobRepository` + `CreatePrintJobData`                                          |
| `src/print/repositories/prisma-print-job.repository.ts`    | Prisma implementation                                                                 |
| `src/analytics/analytics.service.ts`                       | `trackEvent()`, `getSummary()`, `getEvents()`                                         |
| `src/analytics/analytics.controller.ts`                    | `GET /analytics/me`, `GET /analytics/me/events`                                       |

### Supporting files

| File                                       | Responsibility                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `prisma/schema.prisma`                     | DB schema — `PrintJob`, `Session`, `AnalyticsEvent`, `Client`, `User` |
| `prisma/migrations/`                       | Migration history                                                     |
| `src/auth/guards/ws-jwt.guard.ts`          | Guards all `client:*` WebSocket events                                |
| `src/common/adapters/socket-io.adapter.ts` | 10 MB buffer + CORS allowlist                                         |
| `docs/analytics/ANALYTICS.md`              | Analytics module deep-dive                                            |
| `docs/session/SESSION.md`                  | Session module deep-dive                                              |
| `docs/print/PRINT.md`                      | Print gateway deep-dive                                               |

---

> See `docs/todo/ARCHITECTURE_TODO.md` for known improvement areas and future work.
