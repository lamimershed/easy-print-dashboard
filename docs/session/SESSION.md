# Session Module

Manages print sessions — the in-memory connection state between a client (kiosk/companion app) and a customer (mobile browser). Provides a REST API for session validation and a service consumed by the WebSocket gateway.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Session Model](#session-model)
5. [Session Types](#session-types)
6. [Session Lifecycle](#session-lifecycle)
7. [API Reference](#api-reference)
8. [Key Methods](#key-methods)
9. [Persistence](#persistence)

---

## Overview

- **Module:** `src/session/session.module.ts`
- **Controller:** `src/session/session.controller.ts`
- **Service:** `src/session/session.service.ts`
- **Routes prefix:** `/session`
- **Storage:** In-memory `Map<string, Session>` — sessions are not persisted to the database (metadata is written to PostgreSQL by `PrintService` when a print job starts)

---

## Architecture

```
SessionController  ──────────────────► SessionService
                                          │
                                          ├── sessions: Map<sessionId, Session>
                                          └── socketToSession: Map<socketId, sessionId>

PrintGateway  ──────────────────────────► SessionService
  (Socket.IO events)                         (creates, joins, updates, ends sessions)
```

`SessionService` is a singleton (`@Injectable()`) shared across `SessionModule` (which exports it) and `PrintModule` (which imports it). All state lives in the two Maps.

---

## Directory Structure

```
src/session/
├── SESSION.md                        ← this file
├── session.module.ts                 ← NestJS module; exports SessionService
├── session.controller.ts             ← REST: GET /session/:id and /:id/validate
├── session.service.ts                ← In-memory session store and lifecycle management
├── interfaces/
│   └── session.interface.ts          ← Session, SessionCreateResponse, SessionJoinResponse
├── dto/
│   └── session.dto.ts                ← SessionStatusDto, SessionValidateDto, ErrorDto
└── tests/
    └── session.service.spec.ts       ← Unit tests for SessionService
```

---

## Session Model

**File:** `src/session/interfaces/session.interface.ts`

```ts
interface Session {
  id: string; // 8-char UUID prefix (ephemeral) or clientId (permanent)
  clientSocketId: string | null; // Current Socket.IO socket ID of the client
  customerSocketId: string | null; // Current Socket.IO socket ID of the customer
  clientId?: string; // DB Client.id — set from JWT when client connects
  status: SessionStatus;
  createdAt: Date;
  expiresAt: Date;
  currentJob: PrintJob | null; // Active print job (set when customer sends metadata)
}

type SessionStatus = 'waiting' | 'connected' | 'transferring' | 'printing' | 'completed';
```

---

## Session Types

### Ephemeral Session

- Created by the client via `client:create_session` WebSocket event
- **ID:** First 8 characters of a UUID (e.g. `a1b2c3d4`)
- **TTL:** 30 minutes — auto-expires via `setTimeout`
- **Use case:** Single-use, temporary sessions (e.g. walk-up kiosk)

### Permanent Session

- Created or reconnected by the client via `client:join` with a `clientId`
- **ID:** The caller-supplied `clientId` string (stable across reconnects)
- **TTL:** 1 year (effectively permanent)
- **Use case:** Companion desktop app with a persistent client identity
- **Reconnect:** If the client reconnects with the same `clientId`, `updateclientSocket()` replaces the `clientSocketId` without changing the session ID or expiry

---

## Session Lifecycle

```
1. client emits client:join OR client:create_session
        │
        ▼
   SessionService.createSession() OR createSessionWithId()
   → session status: 'waiting'

2. Customer calls GET /session/:id/validate
        │
        ▼
   SessionController validates session exists and has no customer

3. Customer emits customer:join_session
        │
        ▼
   SessionService.joinSession()
   → session status: 'connected'
   → clientSocketId receives 'customer:joined' event

4. Customer emits customer:file_metadata
        │
        ▼
   SessionService.updateSessionStatus('transferring')
   SessionService.setCurrentJob(...)

5. Customer streams customer:file_chunk × N
        │ (relayed directly to client — no status change)

6. Customer emits customer:file_complete
        │
        ▼
   SessionService.updateSessionStatus('printing')

7. client emits client:print_complete
        │
        ▼
   SessionService.updateSessionStatus('completed')

8. client disconnects OR emits session:end
        │
        ▼
   SessionService.endSession()
   → both socketToSession entries removed
   → session deleted from Map
```

---

## API Reference

### `GET /session/:sessionId`

Get the current status of a session.

| Property | Value |
| -------- | ----- |
| **Auth** | None  |

**Response `200`:**

```json
{
  "id": "a1b2c3d4",
  "status": "waiting",
  "hasCustomer": false,
  "expiresAt": "2026-04-18T18:30:00.000Z"
}
```

**Errors:** `404 Not Found` — session does not exist or has expired.

---

### `GET /session/:sessionId/validate`

Validate a session for a customer attempting to join via QR code. Call this before connecting via WebSocket.

| Property | Value |
| -------- | ----- |
| **Auth** | None  |

**Response `200`:**

```json
{ "valid": true, "sessionId": "a1b2c3d4" }
```

**Errors:**
| Status | Reason |
|---|---|
| `404 Not Found` | Session not found or expired |
| `409 Conflict` | Session already has a customer connected |

---

## Key Methods

All methods are synchronous except `scheduleExpiry` (uses `setTimeout`).

| Method                                           | Description                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `createSession(clientSocketId)`                  | Creates a new ephemeral session (8-char ID, 30-min TTL).                                    |
| `createSessionWithId(sessionId, clientSocketId)` | Creates a permanent session with a caller-supplied ID (1-year TTL). No expiry timer.        |
| `updateclientSocket(sessionId, clientSocketId)`  | Updates the client's socket ID on reconnect. Resets TTL to 1 year.                          |
| `joinSession(sessionId, customerSocketId)`       | Assigns a customer to the session. Returns `null` if session not found or already occupied. |
| `leaveSession(sessionId, socketId)`              | Removes the customer from the session; resets status to `'waiting'`.                        |
| `endSession(sessionId)`                          | Removes the session and both socket index entries.                                          |
| `getSession(sessionId)`                          | O(1) lookup by session ID.                                                                  |
| `getSessionBySocketId(socketId)`                 | O(1) reverse lookup via `socketToSession` map.                                              |
| `setClientId(sessionId, clientId)`               | Attaches a DB `Client.id` to the session (called after client JWT is decoded).              |
| `setCurrentJob(sessionId, job)`                  | Attaches the active `PrintJob` to the session.                                              |
| `updateSessionStatus(sessionId, status)`         | Updates the session's status field.                                                         |

---

## Persistence

In-memory sessions are **not** directly persisted to PostgreSQL. Database records are written by `PrintService` when a print job starts (`customer:file_metadata`):

1. `PrintService.persistPrintJob()` upserts a `Session` row in PostgreSQL (using the in-memory session ID as the DB session ID)
2. Creates a `PrintJob` row linked to that session
3. Returns the `PrintJob.id` → stored in `session.currentJob.dbJobId`

When the job completes (`client:print_complete`), `PrintService.completePrintJob()` marks the DB `PrintJob` as `COMPLETED`.

See `docs/print/PRINT.md` for the full data flow.
