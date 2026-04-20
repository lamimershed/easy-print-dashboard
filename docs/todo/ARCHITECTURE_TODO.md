# Architecture TODO

Remaining architecture improvements for Easy Print backend. Items here were identified during the architecture review and deferred for a future sprint. Each item has a priority, affected files, and a clear description of the fix.

---

## Legend

| Priority  | Meaning                        |
| --------- | ------------------------------ |
| 🟠 Medium | Real improvement, address soon |
| 🟡 Low    | Polish / scale concern         |
| 🔵 Future | Nice to have, non-blocking     |
| ✅ Fixed  | Resolved and committed         |

---

## Open Items

### 🟠 No Rate Limiting on WebSocket Events

**File:** `src/print/print.gateway.ts`
**Status:** Open

**Problem:**
The global `ThrottlerGuard` only covers HTTP routes. The WebSocket gateway has no per-socket or per-event throttling. A malicious client could flood `customer:file_chunk` events and saturate the server's relay pipeline.

**Fix required:**
Option A — Custom WS throttle guard:

```typescript
@Injectable()
export class WsThrottleGuard implements CanActivate {
  private readonly counters = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const now = Date.now();
    const entry = this.counters.get(client.id) ?? { count: 0, resetAt: now + 60_000 };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + 60_000;
    }

    entry.count++;
    this.counters.set(client.id, entry);

    if (entry.count > 200) {
      client.emit('error', { message: 'Too many requests' });
      return false;
    }
    return true;
  }
}
```

Option B — Apply `@UseGuards(WsThrottleGuard)` to high-frequency handlers (`customer:file_chunk`) individually.

Apply the guard on `PrintGateway` or per-handler. Clean up the `counters` map on `handleDisconnect`.

---

### 🟡 No Pagination on Admin List Endpoints

**Files:** `src/admin/admin.service.ts`, `src/admin/admin.controller.ts`, `src/client/client.service.ts`, `src/user/user.service.ts`
**Status:** Open

**Problem:**
`GET /api/admin/clients`, `GET /api/admin/users`, and `GET /api/admin/admins` return all records in a single unbounded query. At scale this causes high memory usage and slow responses.

**Fix required:**

1. Add a shared `PaginationQueryDto`:

```typescript
// src/common/dto/pagination-query.dto.ts
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;
}
```

2. Add a generic `PaginatedResponseDto<T>`:

```typescript
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}
```

3. Update `ClientService.findAll`, `UserService.findAll` to accept `{ page, limit }` and return `{ data, total }`.

4. Update admin controller endpoints to accept `@Query() query: PaginationQueryDto`.

---

### 🔵 No e2e Test Suite

**Files:** `test/` (does not exist yet)
**Status:** Open

**Problem:**
Only 2 unit spec files exist (`session.service.spec.ts`, `print.gateway.spec.ts`). There are no integration or end-to-end tests. Critical flows like auth rotation and session relay have no automated coverage.

**Fix required:**
Create a `test/` directory with `jest-e2e.json` config and the following test suites:

1. **Auth flow** (`test/auth.e2e-spec.ts`):
   - `POST /api/auth/register` → 201, cookie set
   - `POST /api/auth/login` → 200, access token returned
   - `POST /api/auth/refresh` → rotates tokens
   - `POST /api/auth/logout` → cookie cleared
   - `GET /api/auth/me` → returns current user

2. **WebSocket relay flow** (`test/gateway.e2e-spec.ts`):
   - client connects with JWT → `client:create_session` → receives `sessionId`
   - `GET /api/session/:id/validate` → `{ valid: true }`
   - Customer connects → `customer:join_session` → client receives `customer:joined`
   - Customer sends `customer:file_metadata` → client receives `print:incoming`
   - Customer streams `customer:file_chunk` × N → client receives `print:chunk` × N, customer receives `transfer:progress`
   - Customer sends `customer:file_complete` → client receives `print:ready`
   - client sends `client:print_complete` → customer receives `print:success`

Use `@nestjs/testing` `Test.createTestingModule` + `supertest` for HTTP, `socket.io-client` for WebSocket.

---

## Resolved Items ✅

### ✅ Service Layer Violations

**Files:** `src/print/print.gateway.ts`, `src/auth/auth.service.ts`, `src/admin/admin.service.ts`

`PrintGateway` was directly injecting `PrismaService`. `AuthService` was calling `prisma.client.findUnique` directly. `AdminService.updateClientPlan` and `findAllUsers` bypassed the service layer.

**Fix:** Extracted `PrintService` to own all print/session DB operations. `AuthService` now delegates to `ClientService`. `AdminService` uses `ClientService.updatePlan()` and `UserService.findAll()`.

---

### ✅ No WebSocket Authentication on client Events

**Files:** `src/auth/guards/ws-jwt.guard.ts`, `src/print/print.gateway.ts`

Added `WsJwtGuard` that validates JWT from `socket.handshake.auth.token`. Applied via `@UseGuards(WsJwtGuard)` on all 5 client-side event handlers: `client:join`, `client:create_session`, `client:print_complete`, `client:print_error`, `session:end`. Customer events remain unauthenticated by design.

---

### ✅ Inconsistent Route Prefix

**File:** `src/main.ts`, `src/session/session.controller.ts`

Set `app.setGlobalPrefix('api', { exclude: ['health'] })`. Removed the manual `api/` prefix from `SessionController`.

---

### ✅ `JWT_REFRESH_EXPIRES_IN` Env Var Not Used

**File:** `src/auth/auth.service.ts`

`issueRefreshToken` was hardcoding `30 * 24 * 60 * 60 * 1000`. Now reads `JWT_REFRESH_EXPIRES_IN` from `ConfigService`.

---

### ✅ Refresh Token Bcrypt Scan Not Capped

**File:** `src/auth/auth.service.ts`

Added `take: 10` to the `findMany` call in `refresh()` and `logout()` to bound the bcrypt loop.

---

### ✅ `NODE_ENV` Missing from Joi Validation Schema

**File:** `src/common/config/env.validation.ts`

Added `NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development')`.

---

### ✅ `COOKIE_OPTIONS` Used `process.env` Directly

**File:** `src/auth/auth.controller.ts`

Module-level constant replaced with a getter using `this.configService.get('NODE_ENV')`. Cookie path updated to `/api/auth/refresh` to match global prefix.

---

### ✅ `SessionController` Bypassed NestJS Interceptors

**File:** `src/session/session.controller.ts`

Replaced `@Res()` + `res.json()` pattern with standard controller returns and `NotFoundException` / `ConflictException` throws.

---

### ✅ `Session.clientId` Never Populated

**Files:** `src/session/interfaces/session.interface.ts`, `src/session/session.service.ts`, `src/print/print.service.ts`, `src/print/print.gateway.ts`

Added `clientId?` to the `Session` interface. Set from JWT payload when client connects. Passed to the DB session `upsert` in `PrintService`.

---

### ✅ `@types/express` in Production Dependencies

**File:** `package.json`

Moved from `dependencies` to `devDependencies`.

---

### ✅ `console.error` in `HttpExceptionFilter`

**File:** `src/common/filters/http-exception.filter.ts`

Replaced with `this.logger.error(...)` using NestJS `Logger`.
