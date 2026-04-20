# Analytics Module

Tracks customer scan and print lifecycle events for each client. Provides summary and raw event endpoints for client dashboards.

---

## Event Types

| Event type        | When fired                                            | Metadata                                                          |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `scan`            | `GET /api/client/:slug` is called (customer scans QR) | `{ slug, tempUserId? }`                                           |
| `print_started`   | `customer:file_metadata` WS event received            | `{ filename, fileSize, mimeType, copies, colorMode, tempUserId }` |
| `print_completed` | `client:print_complete` WS event received             | `{ dbJobId, tempUserId }`                                         |
| `print_failed`    | `client:print_error` WS event received                | `{ error, tempUserId }`                                           |

All writes are **best-effort fire-and-forget** — failures are logged with `logger.warn` and never interrupt the WebSocket or HTTP response.

---

## Customer Identity (`tempUserId`)

The customer frontend generates a UUID on first visit and stores it in `localStorage`. This is passed:

1. As a query param `?tempUserId=<uuid>` on `GET /api/client/:slug`
2. As part of the `customer:join_session` WebSocket payload: `{ sessionId, tempUserId }`

The server stores `tempUserId` on the in-memory session and persists it to the `PrintJob` DB row. The backend never validates or interprets it — it's treated as an opaque string.

---

## REST Endpoints

All endpoints require `Authorization: Bearer <accessToken>` with `CLIENT` role.

### `GET /api/analytics/me`

Get an analytics summary for the authenticated client's client.

**Query params:**

| Param    | Type                   | Default | Description                 |
| -------- | ---------------------- | ------- | --------------------------- |
| `period` | `7d` \| `30d` \| `all` | `30d`   | Time window for the summary |

**Response `200`:**

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

- `uniqueCustomers` = count of distinct `tempUserId` values in `PrintJob` rows for this client + period

---

### `GET /api/analytics/me/events`

Get a paginated list of raw analytics events.

**Query params:**

| Param       | Type   | Default | Description                        |
| ----------- | ------ | ------- | ---------------------------------- |
| `page`      | number | `1`     | Page number                        |
| `limit`     | number | `20`    | Items per page                     |
| `eventType` | string | —       | Filter by event type (e.g. `scan`) |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "cm...",
      "eventType": "scan",
      "metadata": { "slug": "acme-print-a1b2c3", "tempUserId": "uuid-..." },
      "createdAt": "2026-04-18T10:00:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

## Print Job History

### `GET /api/print-jobs/me`

Get paginated print job history for the authenticated client.

**Query params:**

| Param    | Type                                               | Default | Description      |
| -------- | -------------------------------------------------- | ------- | ---------------- |
| `page`   | number                                             | `1`     | Page number      |
| `limit`  | number                                             | `20`    | Items per page   |
| `status` | `PENDING` \| `PRINTING` \| `COMPLETED` \| `FAILED` | —       | Filter by status |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "cm...",
      "filename": "document.pdf",
      "fileSize": 204800,
      "mimeType": "application/pdf",
      "copies": 2,
      "colorMode": "blackwhite",
      "tempUserId": "uuid-...",
      "status": "COMPLETED",
      "createdAt": "2026-04-18T10:05:00.000Z",
      "completedAt": "2026-04-18T10:05:45.000Z"
    }
  ],
  "total": 89,
  "page": 1,
  "limit": 20
}
```

---

## Public client Endpoint (QR scan landing)

### `GET /api/client/:slug`

Unauthenticated. Called by the customer frontend immediately after QR scan.

**Query params:**

| Param        | Type   | Required | Description                                                     |
| ------------ | ------ | -------- | --------------------------------------------------------------- |
| `tempUserId` | string | No       | Customer's localStorage UUID — used to associate the scan event |

**Response `200`:**

```json
{
  "id": "cm...",
  "companyName": "Acme Print client",
  "slug": "acme-print-a1b2c3",
  "logoUrl": "https://...",
  "address": "123 Main St",
  "googleProfileLink": "https://maps.google.com/...",
  "sessionId": "cm..."
}
```

`sessionId` equals `id` (the client's `clientId`). Use it directly in the WebSocket `customer:join_session` event.

**Side-effect:** Fires an `AnalyticsEvent` of type `scan` with `{ slug, tempUserId }` metadata.

---

## Module Structure

```
src/analytics/
├── analytics.module.ts        # Module definition — exports AnalyticsService
├── analytics.service.ts       # trackEvent(), getSummary(), getEvents()
├── analytics.controller.ts    # GET /analytics/me, GET /analytics/me/events
└── dto/
    ├── analytics-query.dto.ts    # AnalyticsQueryDto, AnalyticsEventsQueryDto
    └── analytics-response.dto.ts # AnalyticsSummaryDto, PaginatedAnalyticsEventsDto
```

`AnalyticsService` is exported and injected into:

- `clientController` (ClientModule) — for `scan` events
- `PrintGateway` (PrintModule) — for `print_started`, `print_completed`, `print_failed` events
