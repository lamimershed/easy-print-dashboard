# Copilot Instructions — Easy Print Client Dashboard

## Commands

```bash
pnpm dev            # Start dev server (network-exposed via --host)
pnpm build          # Type-check + production build (output: build/)
pnpm build:staging  # Type-check + staging build
pnpm type-check     # TypeScript strict check (no emit)
pnpm lint           # ESLint
pnpm format         # Prettier write
pnpm format:check   # Prettier check (CI)
```

No test suite is configured. Husky runs `type-check`, `lint`, and `format:check` on pre-commit.

## Architecture

**Stack:** React 19, Vite 7, TypeScript 5.7 (strict), TailwindCSS v4, shadcn/ui (new-york), React Router v7, TanStack Query v5, Zustand v5, React Hook Form v7 + Zod v4, Axios, Socket.IO Client.

### Feature-Based Structure

All business logic lives in `src/features/[feature-name]/`:

```
features/[feature]/
├── components/   # Feature UI, sub-folders per concern
├── config/       # Feature-level constants and nav config
├── pages/        # Page components — compose components only, no business logic
├── routes/       # Route definitions for the feature
├── schemas/      # Zod schemas for form validation only
├── services/     # TanStack Query hooks (useQuery / useMutation)
├── types/        # TypeScript interfaces for API response shapes
└── index.ts      # Barrel export — only public API
```

Current features: `auth`, `dashboard`, `profile`, `analytics`, `upload`.

### Component Hierarchy

```
src/components/ui/          → Radix/shadcn primitives (never modify directly)
src/components/common/      → Cross-feature shared components
src/components/form/        → Reusable form field wrappers
src/components/data-table/  → TanStack Table wrappers
features/*/components/      → Feature-specific UI
features/*/pages/           → Page composition only
```

Pages compose components. Business logic lives in services. Never skip hierarchy levels.

### Routing

Routes are lazy-loaded per feature in `App.tsx`. Auth guard is `<AuthCheck />` (in `components/layouts/session-check.tsx`) — it wraps all protected routes as a layout, not per-page.

```tsx
// App.tsx pattern
const FeatureRoutes = lazy(() =>
  import('./features/my-feature').then((m) => ({ default: m.FeatureRoutes }))
);

<Route element={<AuthCheck />}>
  <Route path="/my-feature/*" element={<FeatureRoutes />} />
</Route>;
```

Each feature exports its own `<Routes>` component from its `routes/` folder.

---

## API Layer

### Base URL

```
VITE_API_BASE_URL=http://localhost:3001
```

All REST endpoints are rooted directly at `VITE_API_BASE_URL` — there is **no `/api` prefix**:

```
http://localhost:3001/auth/login
http://localhost:3001/clients/me
http://localhost:3001/analytics/me
```

### Axios Instance — `src/services/api.ts`

```ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // REQUIRED — sends the httpOnly refreshToken cookie
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401 → POST /auth/refresh → replay queued requests
// (implement queue + single-flight pattern)

export default api;
```

**Key rules:**

- `withCredentials: true` is mandatory on every request so the httpOnly `refreshToken` cookie is sent automatically on `/auth/refresh`.
- There is **no `Restaurant-ID` header** — Easy Print has no multi-location context.
- The refresh endpoint (`POST /auth/refresh`) requires **no request body** — the server reads the cookie.

### Auth Flow

| Step     | Method + Path         | Notes                                                                                                                         |
| -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Register | `POST /auth/register` | Body: `RegisterDto`. Returns `{ accessToken, user }`. Server sets `refreshToken` httpOnly cookie (30d, path `/auth/refresh`). |
| Login    | `POST /auth/login`    | Body: `{ email, password }`. Same response shape. Rate-limited to 5 req/min.                                                  |
| Refresh  | `POST /auth/refresh`  | No body. Cookie sent automatically. Returns `{ accessToken }`. Server rotates cookie.                                         |
| Logout   | `POST /auth/logout`   | No body. Server revokes DB token and clears cookie. Returns 204.                                                              |
| Get self | `GET /auth/me`        | Requires `Authorization: Bearer`. Returns `TAuthUser`.                                                                        |

**`TAuthResponse`:**

```ts
type TAuthResponse = {
  accessToken: string;
  user: TAuthUser;
};

type TAuthUser = {
  id: string;
  email: string;
  role: 'CLIENT' | 'SUPER_ADMIN';
  client?: TClientProfile; // always present for CLIENT role
};
```

**`RegisterDto` shape:**

```ts
type TRegisterRequest = {
  email: string;
  password: string; // min 8 chars, must contain upper, lower, digit, special char
  companyName: string; // max 100 chars
  phoneNumber: string; // international format e.g. +1234567890
  logoUrl?: string; // URL from POST /upload/logo/pre-register
  googleProfileLink?: string;
  address?: string; // max 255 chars
  latitude?: number;
  longitude?: number;
};
```

---

## REST Endpoints Reference

### Client Profile (CLIENT role — all require Bearer token)

| Method   | Path          | Description                              |
| -------- | ------------- | ---------------------------------------- |
| `GET`    | `/clients/me` | Get own client profile                   |
| `PATCH`  | `/clients/me` | Update own profile (all fields optional) |
| `DELETE` | `/clients/me` | Delete own account (204)                 |

**`TClientProfile`:**

```ts
type TClientProfile = {
  id: string;
  slug: string; // unique public ID used in QR codes and WS connections
  companyName: string;
  phoneNumber: string;
  plan: 'FREE' | 'STARTER' | 'PRO';
  logoUrl: string | null;
  googleProfileLink: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
};
```

**`TUpdateClientRequest`** (all fields optional, same fields as `TRegisterRequest` minus email/password):

```ts
type TUpdateClientRequest = {
  companyName?: string;
  phoneNumber?: string;
  logoUrl?: string;
  googleProfileLink?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};
```

### Analytics (CLIENT role)

| Method | Path                   | Query params                                      | Description             |
| ------ | ---------------------- | ------------------------------------------------- | ----------------------- |
| `GET`  | `/analytics/me`        | `period?: '7d' \| '30d' \| 'all'` (default `30d`) | Summary stats           |
| `GET`  | `/analytics/me/events` | `page?, limit?, eventType?`                       | Paginated raw event log |

**`TAnalyticsSummary`:**

```ts
type TAnalyticsSummary = {
  totalScans: number;
  totalPrintJobs: number;
  completedPrintJobs: number;
  failedPrintJobs: number;
  uniqueCustomers: number;
  period: '7d' | '30d' | 'all';
};
```

**`TPaginatedAnalyticsEvents`:**

```ts
type TAnalyticsEvent = {
  id: string;
  eventType: string; // e.g. 'print_started' | 'print_completed' | 'print_failed'
  metadata: unknown;
  createdAt: string;
};

type TPaginatedAnalyticsEvents = {
  data: TAnalyticsEvent[];
  total: number;
  page: number;
  limit: number;
};
```

### Upload

| Method | Path                        | Auth            | Description                                                                                                      |
| ------ | --------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `POST` | `/upload/logo/pre-register` | Public          | Upload logo before registration. Returns `{ url: string }`. Pass this URL as `logoUrl` in `POST /auth/register`. |
| `POST` | `/upload/client-logo`       | Bearer (CLIENT) | Upload/replace own logo. Automatically updates `client.logoUrl` in DB. Returns `{ url: string }`.                |

Both endpoints accept `multipart/form-data` with a single `file` field (JPEG/PNG/WebP/GIF, max 5 MB).

```ts
// Example: upload logo
const formData = new FormData();
formData.append('file', file);
const { data } = await api.post<{ url: string }>('/upload/client-logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

### Sessions (read-only from the dashboard)

| Method | Path               | Query params           | Description                                                                                            |
| ------ | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `POST` | `/sessions/start`  | —                      | Body: `{ customerId, clientId }`. Start or resume a print session. Returns `{ sessionId, expiresAt }`. |
| `GET`  | `/sessions/active` | `customerId, clientId` | Recover existing session. 404 if none.                                                                 |
| `GET`  | `/sessions/status` | `sessionId`            | Get session status by ID.                                                                              |

---

## WebSocket (Socket.IO)

The companion desktop app connects over Socket.IO. The client dashboard **may** connect to display real-time print activity. The Socket.IO server runs on the same base URL (no path prefix).

```ts
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

const socket = io(import.meta.env.VITE_API_BASE_URL, {
  auth: { token: useAuthStore.getState().accessToken }, // JWT required for client:* events
  withCredentials: true,
});
```

### Events emitted by the client

| Event                   | Payload                | Guard | Description                                                            |
| ----------------------- | ---------------------- | ----- | ---------------------------------------------------------------------- |
| `client:join`           | `{}`                   | JWT   | Join permanent session (keyed by `clientId`). Ack via `client:joined`. |
| `client:print_complete` | `sessionId: string`    | JWT   | Signal print done. Customer receives `print:success`.                  |
| `client:print_error`    | `{ sessionId, error }` | JWT   | Signal print failure. Customer receives `print:error`.                 |
| `session:end`           | `sessionId: string`    | JWT   | Terminate session. All participants receive `session:ended`.           |

### Events received by the client

| Event             | Payload                                               | Description                          |
| ----------------- | ----------------------------------------------------- | ------------------------------------ |
| `client:joined`   | `{ sessionId }`                                       | Confirmation after `client:join`     |
| `customer:joined` | `{ sessionId, connectedAt }`                          | A customer connected                 |
| `customer:left`   | `{}`                                                  | Customer disconnected                |
| `print:incoming`  | `{ fileName, fileType, fileSize, copies, colorMode }` | Customer is about to stream a file   |
| `print:ready`     | `{}`                                                  | All chunks received — start printing |
| `session:ended`   | `{ reason? }`                                         | Session terminated                   |

---

## State Management

| Concern                          | Tool                  | Location                          |
| -------------------------------- | --------------------- | --------------------------------- |
| Server state (API data)          | TanStack Query        | `features/*/services/`            |
| Auth (token + user)              | Zustand `auth-store`  | `src/stores/auth-store.ts`        |
| App UI (sidebar, visited routes) | Zustand `app-store`   | `src/stores/app-store.ts`         |
| Form state                       | React Hook Form + Zod | Component + `features/*/schemas/` |

> There is **no restaurant/location store** — Easy Print has no multi-location concept.  
> Never store server data in Zustand. Never use React Context for frequently updating state.

### `auth-store` shape

```ts
type AuthStore = {
  accessToken: string | null;
  user: TAuthUser | null;
  setAuth: (token: string, user: TAuthUser) => void;
  clearAuth: () => void;
};
```

---

## Key Conventions

### Types vs Schemas

| Use case            | Where                 | How                                        |
| ------------------- | --------------------- | ------------------------------------------ |
| API response shapes | `features/*/types/`   | Plain TS `type` / `interface`, `T`-prefix  |
| Form validation     | `features/*/schemas/` | Zod schema + `z.infer<>` for the form type |

Never write a Zod schema to describe an API response. Never import API response types from `schemas/`.

### Service Pattern

```ts
// features/[feature]/services/[entity]-service.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/lib/utils';
import type { TClientProfile, TUpdateClientRequest } from '../types';

const queryKeys = {
  all: ['client'] as const,
  me: () => ['client', 'me'] as const,
};

const useGetMe = () =>
  useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => {
      const { data } = await api.get<TClientProfile>('/clients/me');
      return data;
    },
  });

const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TUpdateClientRequest) => {
      const { data } = await api.patch<TClientProfile>('/clients/me', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

export const profileService = { queryKeys, useGetMe, useUpdateMe };
```

Always export a service object aggregating all hooks. Use `utils.getApiResponseError(error)` in every `onError`.

### Naming

| Artifact           | Convention              | Example                           |
| ------------------ | ----------------------- | --------------------------------- |
| Folders            | kebab-case              | `print-jobs/`                     |
| Component files    | kebab-case              | `profile-form.tsx`                |
| Component exports  | PascalCase              | `export function ProfileForm`     |
| Types / interfaces | PascalCase + `T` prefix | `TClientProfile`, `TAuthResponse` |
| Zustand stores     | kebab-case file         | `auth-store.ts`                   |
| Schema files       | kebab-case + `-schema`  | `profile-schema.ts`               |

### Import Order

```ts
// 1. React / framework
import { useState } from 'react';
import { useNavigate } from 'react-router';

// 2. Third-party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// 3. Alias imports (@/ paths)
import { useAuthStore } from '@/stores';
import api from '@/services/api';

// 4. Relative imports
import { profileSchema } from '../schemas';
import type { TClientProfile } from '../types';
```

### Styling

- All colors via CSS variables: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`
- All conditional classes via `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Never hardcode hex colors; never use inline styles

### SVG Imports

SVGs are imported as React components via `vite-plugin-svgr` (named export):

```ts
import { ReactComponent as Logo } from '@/assets/images/logo.svg';
```

### Feature Barrel Exports

Each feature's `index.ts` exports only its public API (routes, types, services). Other features must import only from `features/[feature]/index.ts`, never from internal paths.

---

## Path Aliases

`@/*` → `src/*`, `@components/*`, `@hooks/*`, `@utils/*`, `@stores/*`, `@services/*`, `@lib/*`, `@types/*`, `@assets/*`, `@images/*`, `@svgs/*`, `@config/*`

---

## Environment Variables

```
VITE_API_BASE_URL   # Backend base URL, e.g. http://localhost:3001
VITE_BASE_PATH      # SPA base path (default /)
```

---

## Scaffolding New Features

Use the `/generate-api` skill to scaffold `types/`, `schemas/`, and `services/` for a new API-backed feature. Do not hand-write these files from scratch.

```
/generate-api clientProfile /clients/me A client profile with companyName, phoneNumber, plan, logoUrl, googleProfileLink, address
```

---

## Data Model Reference

```
UserRole:       CLIENT | SUPER_ADMIN
ClientPlan:     FREE | STARTER | PRO
SessionStatus:  WAITING | CONNECTED | PRINTING | COMPLETED | EXPIRED
PrintJobStatus: PENDING | PRINTING | COMPLETED | FAILED
```

All `id` fields are CUID strings. All timestamps are ISO-8601 strings in API responses.

---

## Backend Module Map (for reference)

| Module            | Base path    | Notes                                           |
| ----------------- | ------------ | ----------------------------------------------- |
| `AuthModule`      | `/auth`      | JWT auth, refresh cookie rotation               |
| `ClientModule`    | `/clients`   | Self-service profile (`/me` only)               |
| `AnalyticsModule` | `/analytics` | Summary + paginated events                      |
| `UploadModule`    | `/upload`    | Logo upload (pre-register or authenticated)     |
| `SessionModule`   | `/sessions`  | In-memory session management                    |
| `AdminModule`     | `/admin`     | SUPER_ADMIN only — not used in client dashboard |
| `PrintGateway`    | WebSocket    | Socket.IO — companion app + real-time updates   |

Swagger UI (development): `http://localhost:3001/docs`
