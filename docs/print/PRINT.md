# Print Module

Handles all real-time print job brokering via Socket.IO. Relays file data directly from customers to clients without buffering, and persists print job metadata to PostgreSQL.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [WebSocket Connection](#websocket-connection)
5. [Socket.IO Event Reference](#socketio-event-reference)
   - [client → Server Events](#client--server-events)
   - [Customer → Server Events](#customer--server-events)
   - [Server → client Events](#server--client-events)
   - [Server → Customer Events](#server--customer-events)
   - [Server → Both Events](#server--both-events)
6. [Full Data Flow](#full-data-flow)
7. [PrintJob Interface](#printjob-interface)
8. [Database Persistence](#database-persistence)
9. [Disconnect Handling](#disconnect-handling)
10. [Analytics Tracking](#analytics-tracking)
11. [Scaling Considerations](#scaling-considerations)

---

## Overview

- **Module:** `src/print/print.module.ts`
- **Gateway:** `src/print/print.gateway.ts` — `@WebSocketGateway()` with all Socket.IO event handlers
- **Service:** `src/print/print.service.ts` — Database persistence for sessions and print jobs
- **Transport:** Socket.IO over WebSocket (with polling fallback)
- **Buffer size:** 10 MB per message (set via `SocketIoAdapter`)

---

## Architecture

```
PrintGateway  ◄──── Socket.IO events from client / customer
      │
      ├── SessionService   (in-memory session state — create, join, update, end)
      └── PrintService
              │
              └── IPrintJobRepository
                        │
                        └── PrismaPrintJobRepository
                              (upserts Session + creates PrintJob in PostgreSQL)
```

File chunks are **never buffered** — `customer:file_chunk` data is relayed immediately to the client socket and then discarded.

---

## Directory Structure

```
src/print/
├── PRINT.md                                     ← this file
├── print.module.ts                              ← NestJS module; imports SessionModule
├── print.gateway.ts                             ← @WebSocketGateway — all Socket.IO handlers
├── print.service.ts                             ← DB persistence (session upsert + print job)
├── interfaces/
│   └── print-job.interface.ts                  ← PrintJob interface
├── repositories/
│   ├── print-job.repository.interface.ts       ← IPrintJobRepository + PRINT_JOB_REPOSITORY token
│   └── prisma-print-job.repository.ts          ← Prisma implementation
└── tests/
    └── print.gateway.spec.ts                   ← Unit tests for PrintGateway
```

---

## WebSocket Connection

**URL:** `ws://localhost:3001` (same port as HTTP, no path prefix)

**client connection (authenticated):**

```ts
const socket = io('http://localhost:3001', {
  auth: { token: `Bearer ${accessToken}` },
});
```

The JWT is validated by `WsJwtGuard` on every client-side event. The decoded payload is attached to `socket.user` (type: `JwtPayload`).

**Customer connection (unauthenticated):**

```ts
const socket = io('http://localhost:3001');
```

Customers join using a session ID from a QR code. No authentication is required.

**Room naming:** Both the client and customer socket are joined to a Socket.IO room named `session:{sessionId}` for broadcast convenience.

---

## Socket.IO Event Reference

### client → Server Events

All client events require a valid JWT via `WsJwtGuard`.

---

#### `client:join`

Join or reconnect with a permanent client identity.

| Property    | Value                                        |
| ----------- | -------------------------------------------- |
| **Auth**    | `WsJwtGuard` required                        |
| **Payload** | `string` — the client's permanent `clientId` |

**Behavior:**

- If no session exists for `clientId` → creates a new permanent session
- If a session already exists → updates the client socket ID (reconnect)
- Attaches `clientId` from JWT payload to the session
- Joins the socket to room `session:{clientId}`

**Server emits back:**

```ts
socket.emit('client:joined', { sessionId: clientId });
```

---

#### `client:create_session`

Create a new ephemeral session (30-minute TTL).

| Property     | Value                                                    |
| ------------ | -------------------------------------------------------- |
| **Auth**     | `WsJwtGuard` required                                    |
| **Payload**  | `any` (ignored)                                          |
| **Callback** | `(data: { sessionId: string; expiresAt: Date }) => void` |

**Behavior:**

- Creates a new session with an 8-char UUID prefix as the ID
- Attaches `clientId` from JWT payload
- Calls the Socket.IO callback with the session info

**Callback response:**

```ts
{ sessionId: "a1b2c3d4", expiresAt: "2026-04-18T18:30:00.000Z" }
```

---

#### `client:print_complete`

Signal that the client has finished printing. Notifies the customer and marks the print job as completed in the database.

| Property    | Value                  |
| ----------- | ---------------------- |
| **Auth**    | `WsJwtGuard` required  |
| **Payload** | `string` — `sessionId` |

**Emits to customer:**

```ts
socket.to(customerSocketId).emit('print:success');
```

**Side effects:**

- Updates session status to `'completed'`
- Calls `PrintService.completePrintJob(dbJobId)` to mark DB `PrintJob` as `COMPLETED`
- **Resets the session** — customer socket cleared, current job cleared, status reset to `'waiting'` so the customer can send another file without rescanning the QR code
- Tracks `print_completed` analytics event

---

#### `client:print_error`

Signal a print error. Notifies the customer with an error message.

| Property    | Value                                  |
| ----------- | -------------------------------------- |
| **Auth**    | `WsJwtGuard` required                  |
| **Payload** | `{ sessionId: string; error: string }` |

**Emits to customer:**

```ts
socket.to(customerSocketId).emit('print:error', { error: string });
```

**Side effects:** Tracks `print_failed` analytics event.

---

#### `session:end`

Explicitly end the session (client-initiated). Terminates the session for both parties.

| Property    | Value                  |
| ----------- | ---------------------- |
| **Auth**    | `WsJwtGuard` required  |
| **Payload** | `string` — `sessionId` |

**Emits to room:**

```ts
server.to(`session:${sessionId}`).emit('session:ended');
```

**Side effects:** Calls `SessionService.endSession()` — session is removed from memory.

---

### Customer → Server Events

Customer events do not require authentication.

---

#### `customer:join_session`

Join an existing session as a customer.

| Property     | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| **Auth**     | None                                                                     |
| **Payload**  | `{ sessionId: string; customerId?: string }`                             |
| **Callback** | `(data: { valid: boolean; sessionId?: string; error?: string }) => void` |

**Success callback:**

```ts
{ valid: true, sessionId: "a1b2c3d4" }
```

**Failure callback** (session not found, expired, or already occupied):

```ts
{ valid: false, error: "Invalid or expired session" }
```

**On success, emits to client:**

```ts
server.to(clientSocketId).emit('customer:joined', { sessionId, connectedAt: Date });
```

---

#### `customer:file_metadata`

Send file metadata before streaming chunks. The client receives a preview of what's being sent, and a DB print job record is created.

| Property    | Value     |
| ----------- | --------- |
| **Auth**    | None      |
| **Payload** | See below |

**Payload:**

```ts
{
  sessionId: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  copies: number;
  colorMode: 'color' | 'blackwhite';
}
```

**Emits to client:**

```ts
server.to(clientSocketId).emit('print:incoming', {
  fileName,
  fileType,
  fileSize,
  copies,
  colorMode,
});
```

**Side effects:**

- Creates DB `PrintJob` with status `PENDING`
- Updates session status to `'transferring'`
- Calls `PrintService.persistPrintJob()` — upserts DB `Session`, creates DB `PrintJob` (status: `PENDING`)
- Sets `session.currentJob` with print metadata + `dbJobId`
- Tracks `print_started` analytics event

---

#### `customer:file_chunk`

Stream a single chunk of file data. Relayed immediately to the client — no buffering.

| Property    | Value     |
| ----------- | --------- |
| **Auth**    | None      |
| **Payload** | See below |

**Payload:**

```ts
{
  sessionId: string;
  chunk: ArrayBuffer; // raw binary data
  chunkIndex: number; // 0-indexed
  totalChunks: number;
}
```

**Emits to client:**

```ts
server.to(clientSocketId).emit('print:chunk', { chunk, chunkIndex, totalChunks });
```

**Emits progress back to customer:**

```ts
socket.emit('transfer:progress', { progress: number }); // 0–100
```

---

#### `customer:file_complete`

Signal that all chunks have been sent. The client should now assemble and print the file.

| Property     | Value                                  |
| ------------ | -------------------------------------- |
| **Auth**     | None                                   |
| **Payload**  | `{ sessionId: string }`                |
| **Callback** | `(data: { success: boolean }) => void` |

**Emits to client:**

```ts
server.to(clientSocketId).emit('print:ready');
```

**Side effects:** Updates session status to `'printing'`. Updates DB `PrintJob` status to `PRINTING`.

---

### Server → client Events

| Event             | Payload                                                           | Trigger                            |
| ----------------- | ----------------------------------------------------------------- | ---------------------------------- |
| `client:joined`   | `{ sessionId: string }`                                           | client connects / reconnects       |
| `customer:joined` | `{ sessionId: string; connectedAt: Date }`                        | Customer joins session             |
| `customer:left`   | _(none)_                                                          | Customer disconnects               |
| `print:incoming`  | `{ fileName, fileType, fileSize, copies, colorMode }`             | Customer sends file metadata       |
| `print:chunk`     | `{ chunk: ArrayBuffer; chunkIndex: number; totalChunks: number }` | Customer sends a file chunk        |
| `print:ready`     | _(none)_                                                          | Customer signals transfer complete |

---

### Server → Customer Events

| Event               | Payload                | Trigger                            |
| ------------------- | ---------------------- | ---------------------------------- |
| `transfer:progress` | `{ progress: number }` | After each chunk relay (0–100%)    |
| `print:success`     | _(none)_               | client signals print complete      |
| `print:error`       | `{ error: string }`    | client signals print error         |
| `session:ended`     | `{ reason?: string }`  | client disconnects or ends session |

---

### Server → Both Events

| Event           | Payload               | Trigger                                                                         |
| --------------- | --------------------- | ------------------------------------------------------------------------------- |
| `session:ended` | `{ reason?: string }` | Broadcast to `session:{id}` room when client disconnects or calls `session:end` |

---

## Full Data Flow

```
1. client connects with JWT → emits client:join OR client:create_session
        │
        └── Session created in memory, client socket joined to room

2. Customer scans QR code
        │
        └── GET /api/session/:id/validate → { valid: true }

3. Customer connects → emits customer:join_session { sessionId, customerId? }
        │
        └── Session joined, client receives customer:joined

4. Customer emits customer:file_metadata
        │
        ├── client receives print:incoming
        ├── DB: Session upserted, PrintJob created (status: PENDING)
        ├── session.currentJob set in memory
        └── Analytics: print_started tracked

5. Customer emits customer:file_chunk × N
        │
        ├── client receives print:chunk × N
        └── Customer receives transfer:progress (0 → 100%)

6. Customer emits customer:file_complete
        │
        ├── client receives print:ready → prints the file
        └── DB: PrintJob status → PRINTING

7. client emits client:print_complete
        │
        ├── Customer receives print:success
        ├── DB: PrintJob marked COMPLETED
        ├── Session resets (customer cleared, job cleared, status → 'waiting')
        └── Analytics: print_completed tracked
```

---

## PrintJob Interface

**File:** `src/print/interfaces/print-job.interface.ts`

```ts
interface PrintJob {
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  copies: number;
  colorMode: 'color' | 'blackwhite';
  dbJobId?: string; // DB PrintJob.id, set after persistPrintJob() succeeds
}
```

This is the **in-memory** representation stored on the session. It maps to (but is not the same as) the DB `PrintJob` model.

---

## Database Persistence

**File:** `src/print/print.service.ts`

DB writes are **best-effort** — failures are logged with `logger.warn` but do not interrupt the real-time file relay.

### `persistPrintJob(session, data)`

Called when `customer:file_metadata` is received.

1. Upserts a DB `Session` row using the in-memory session ID
   - `isEphemeral`: `true` if session ID is 8 chars, `false` for permanent sessions
   - Links to `clientId` if present
2. Creates a DB `PrintJob` row with status `PRINTING`
3. Returns `PrintJob.id` → stored as `session.currentJob.dbJobId`

### `completePrintJob(dbJobId)`

Called when `client:print_complete` is received. Marks the DB `PrintJob` as `COMPLETED` and sets `completedAt`.

---

## Disconnect Handling

`handleDisconnect(client)` is called by Socket.IO when any socket closes.

**If the disconnected socket is the client:**

- Broadcasts `session:ended` to the entire `session:{id}` room
- Calls `SessionService.endSession()` — session removed from memory

**If the disconnected socket is the customer:**

- Calls `SessionService.leaveSession()` — customer removed, status reset to `'waiting'`
- Emits `customer:left` to the client socket
- If disconnected mid-transfer (`status: 'transferring'` or `'printing'`), calls `PrintService.failPrintJob(dbJobId)` → DB `PrintJob` marked `FAILED`

---

## Analytics Tracking

`PrintGateway` fires analytics events via `AnalyticsService.trackEvent()` at key points in the print lifecycle. All calls are **fire-and-forget** (`void`) — failures are logged but never interrupt the WebSocket flow.

| Event             | Trigger                           | Metadata                                                                |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `print_started`   | `customer:file_metadata` received | `filename`, `fileSize`, `mimeType`, `copies`, `colorMode`, `tempUserId` |
| `print_completed` | `client:print_complete` received  | `dbJobId`, `tempUserId`                                                 |
| `print_failed`    | `client:print_error` received     | `error`, `tempUserId`                                                   |

Analytics events are persisted to the `AnalyticsEvent` table and queryable via `GET /api/analytics/summary` and `GET /api/analytics/events`.

---

## Scaling Considerations

The current implementation is designed for a **single Railway instance** and is production-ready at that scale. The following are known tradeoffs that only matter when scaling horizontally:

| Concern              | Current Approach                                              | Scale-out Upgrade                                         |
| -------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| Session store        | In-memory `Map` — lost on restart                             | Redis + `socket.io-redis-adapter`                         |
| Session expiry       | `setTimeout` — not restart-safe                               | Redis TTL or DB-backed scheduled sweep                    |
| Chunk ordering       | Assumed in-order (Socket.IO guarantee over single connection) | Server-side sequence validation if corruption is observed |
| Reconnect resumption | Failed jobs must be fully restarted                           | Chunked-upload resume logic                               |

None of these are blockers for a single-instance deploy. The `SessionService` is already isolated behind its own service class, making the Redis upgrade path clean when needed.
