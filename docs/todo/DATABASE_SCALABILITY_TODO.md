# Database Scalability TODO

Tracked scalability concerns found during schema review of Easy Print backend. Each item has a severity, status, problem description, and required fix. Address **High** priority items before expecting significant user growth.

---

## Legend

| Severity  | Meaning                                                     |
| --------- | ----------------------------------------------------------- |
| 🔴 High   | Will cause serious degradation at scale — fix before growth |
| 🟡 Medium | Real risk, address in near term                             |
| 🟢 Low    | Minor improvement / hardening                               |
| ✅ Fixed  | Resolved and committed                                      |

---

## Open Issues

### 🔴 `AnalyticsEvent` Unbounded Growth

**File:** `prisma/schema.prisma` → `model AnalyticsEvent`
**Status:** Open

**Problem:**
`AnalyticsEvent` is an append-only event log with no TTL, no partitioning, and no archiving strategy. Every user action appends a row indefinitely. With active clients this table will grow to millions of rows and degrade query performance over time.

**Fix required:**

1. Implement a **data retention policy** — schedule a cron job to delete events older than a configurable window (e.g. 90 days)
2. For long-term analytics: move historical events to a dedicated analytics store (ClickHouse, BigQuery, or Timescale)
3. For heavy workloads: apply **PostgreSQL time-based table partitioning** (`PARTITION BY RANGE(createdAt)`) so old partitions can be dropped cheaply

```sql
-- Example: delete events older than 90 days (run as scheduled job)
DELETE FROM "AnalyticsEvent" WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

---

### 🟡 `Session` Table Accumulates Expired Rows

**File:** `prisma/schema.prisma` → `model Session`
**Status:** Open

**Problem:**
Sessions have an `expiresAt` timestamp and a `EXPIRED` status but expired rows are never deleted from the database. Over time, `EXPIRED` sessions accumulate and inflate table size, slowing index scans and backups.

**Fix required:**

1. Add a **scheduled cleanup job** (NestJS `@Cron` or a pg_cron query) to delete sessions where `status = 'EXPIRED'` or `expiresAt < NOW()`
2. Run at low-traffic hours (e.g. nightly)

```typescript
// Example: NestJS scheduled task
@Cron('0 3 * * *') // 3am daily
async purgeExpiredSessions() {
  await this.prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
```

---

### 🟡 `PrintJob.clientId` Denormalization

**File:** `prisma/schema.prisma` → `model PrintJob`
**Status:** Open

**Problem:**
`PrintJob` stores `clientId` directly even though `clientId` is already reachable via `sessionId → Session → clientId`. This denormalization risks data inconsistency if a session is ever reassigned or migrated. It also creates two FK paths to `Client` from the same record.

**Fix required:**

- **Option A (Preferred):** Remove `clientId` from `PrintJob` and always derive it via the session join. Add a `(clientId, createdAt)` index on `Session` to keep this query fast.
- **Option B:** Keep the denormalization but enforce consistency with a PostgreSQL trigger or application-layer assertion that `PrintJob.clientId == PrintJob.session.clientId`.

---

### 🟡 `Payment` Has No Plan or Subscription Context

**File:** `prisma/schema.prisma` → `model Payment`
**Status:** Open

**Problem:**
`Payment` is linked only to a `Client`. There is no record of _what the payment was for_ (which plan tier, upgrade, renewal, or add-on). As billing grows this makes it impossible to audit or reconcile payments to plan changes.

**Fix required:**

1. Add a `planSnapshot ClientPlan?` field to `Payment` to record the plan at time of purchase
2. Or introduce a `Subscription` model to track recurring billing state (`currentPlan`, `renewsAt`, `canceledAt`) and link `Payment → Subscription`

```prisma
model Payment {
  // ... existing fields
  planSnapshot ClientPlan? // plan purchased in this transaction
}
```

---

### 🟡 `ClientPlan` Is a PostgreSQL Enum

**File:** `prisma/schema.prisma` → `enum ClientPlan`
**Status:** Open

**Problem:**
PostgreSQL enums require a schema migration to add or rename values. The `ALTER TYPE ... ADD VALUE` command cannot be run inside a transaction, which complicates zero-downtime deployments. If plan tiers become configurable (e.g. custom enterprise plans), an enum is the wrong abstraction.

**Fix required:**

- **Short term:** Keep the enum but document that any new tier requires a coordinated migration
- **Long term:** Replace with a `Plan` table (`id`, `name`, `maxSessions`, `maxStorage`, `price`) and store `planId String` on `Client`. This allows plans to be added/modified without a schema migration

---

### 🟢 Missing Composite Indexes

**File:** `prisma/schema.prisma`
**Status:** Open

**Problem:**
Common query patterns filter by multiple columns but only single-column indexes exist:

- `Session` queries almost always filter by both `clientId` **and** `status`
- `PrintJob` queries filter by both `clientId` **and** `status`
- `AnalyticsEvent` time-range queries per client need `(clientId, createdAt)`

Without composite indexes, PostgreSQL performs an index scan on one column then filters the rest in memory.

**Fix required:**
Add the following indexes to `schema.prisma`:

```prisma
model Session {
  @@index([clientId, status])   // add this
}

model PrintJob {
  @@index([clientId, status])   // add this
}

model AnalyticsEvent {
  @@index([clientId, createdAt]) // add this
}
```

---

### 🟢 `RefreshToken` Has No Soft-Revocation Field

**File:** `prisma/schema.prisma` → `model RefreshToken`
**Status:** Open

**Problem:**
Revoking a refresh token currently requires deleting the row. This means there is no audit trail of when and why a token was revoked (e.g. forced logout, suspicious activity, password change). It also prevents "logout from all devices" flows that need to mark all tokens for a user as invalid without immediately deleting them.

**Fix required:**
Add a `revokedAt DateTime?` field. Auth logic should treat any token where `revokedAt IS NOT NULL` or `expiresAt < NOW()` as invalid.

```prisma
model RefreshToken {
  // ... existing fields
  revokedAt DateTime? // null = active, set = revoked
}
```

---

## Resolved Issues ✅

_None yet._
