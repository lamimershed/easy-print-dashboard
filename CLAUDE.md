# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Commit Policy

**Never commit or push code without explicit user approval.**

- Always show the user what will be committed (files changed, commit message) and wait for confirmation before running `git commit`.
- When in doubt, stage the changes and present a diff summary for review instead of committing.

## Stack

React 19, Vite 7, TypeScript 5.7 (strict), TailwindCSS v4, shadcn/ui (new-york), React Router v7, TanStack Query v5, Zustand v5, React Hook Form v7 + Zod v4, Axios, Socket.IO Client.

## Architecture

### Feature-Based Structure

All business logic lives in `src/features/[feature-name]/`:

```
features/[feature]/
├── components/   # Feature UI
├── config/       # Feature-level constants and nav config
├── pages/        # Page components — compose components only, no business logic
├── routes/       # Route definitions for the feature
├── schemas/      # Zod schemas for form validation only
├── services/     # TanStack Query hooks (useQuery / useMutation)
├── types/        # TypeScript interfaces for API response shapes
└── index.ts      # Barrel export — only public API
```

Current features: `auth`, `dashboard`, `profile`, `analytics`, `upload`, `print-monitor`.

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

Routes are lazy-loaded per feature in `App.tsx`. Auth guard is `<AuthCheck />` (`components/layouts/session-check.tsx`) — it wraps all protected routes as a layout, not per-page.

Each feature exports its own `<Routes>` component from its `routes/` folder, imported as a lazy barrel export.

### State Management

| Concern                          | Tool                  | Location                          |
| -------------------------------- | --------------------- | --------------------------------- |
| Server state (API data)          | TanStack Query        | `features/*/services/`            |
| Auth (token + user)              | Zustand `auth-store`  | `src/stores/auth-store.ts`        |
| App UI (sidebar, visited routes) | Zustand `app-store`   | `src/stores/app-store.ts`         |
| Form state                       | React Hook Form + Zod | Component + `features/*/schemas/` |

Never store server data in Zustand. Never use React Context for frequently updating state.

### `auth-store` shape

```ts
type AuthStore = {
  accessToken: string | null;
  user: TAuthUser | null;
  setAuth: (token: string, user: TAuthUser) => void;
  clearAuth: () => void;
};
```

## API Layer

### Base URL

```
VITE_API_BASE_URL=http://localhost:3001
```

All REST endpoints rooted directly at `VITE_API_BASE_URL` — **no `/api` prefix**:

```
http://localhost:3001/auth/login
http://localhost:3001/clients/me
http://localhost:3001/analytics/me
```

### Axios Instance — `src/services/api.ts`

- `withCredentials: true` is mandatory on every request (sends the httpOnly `refreshToken` cookie).
- Request interceptor: attaches `Authorization: Bearer <accessToken>` from `auth-store`.
- Response interceptor: on 401 → `POST /auth/refresh` → replay queued requests (single-flight pattern).
- There is **no `Restaurant-ID` header** — Easy Print has no multi-location concept.
- `POST /auth/refresh` requires **no request body** — server reads the cookie.

### Auth Endpoints

| Step     | Method + Path         | Notes                                                                        |
| -------- | --------------------- | ---------------------------------------------------------------------------- |
| Register | `POST /auth/register` | Returns `{ accessToken, user }`. Server sets httpOnly `refreshToken` cookie. |
| Login    | `POST /auth/login`    | `{ email, password }`. Rate-limited 5 req/min.                               |
| Refresh  | `POST /auth/refresh`  | No body. Returns `{ accessToken }`. Rotates cookie.                          |
| Logout   | `POST /auth/logout`   | No body. Returns 204.                                                        |
| Get self | `GET /auth/me`        | Requires Bearer. Returns `TAuthUser`.                                        |

### Key Types

```ts
type TAuthResponse = { accessToken: string; user: TAuthUser };
type TAuthUser = {
  id: string;
  email: string;
  role: 'CLIENT' | 'SUPER_ADMIN';
  client?: TClientProfile;
};

type TClientProfile = {
  id: string;
  slug: string;
  companyName: string;
  phoneNumber: string;
  plan: 'FREE' | 'STARTER' | 'PRO';
  logoUrl: string | null;
  googleProfileLink: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};
```

### REST Endpoints Reference

| Method   | Path                        | Description                                       |
| -------- | --------------------------- | ------------------------------------------------- |
| `GET`    | `/clients/me`               | Get own client profile                            |
| `PATCH`  | `/clients/me`               | Update own profile                                |
| `DELETE` | `/clients/me`               | Delete own account (204)                          |
| `GET`    | `/analytics/me`             | Summary stats (`period?: '7d' \| '30d' \| 'all'`) |
| `GET`    | `/analytics/me/events`      | Paginated raw event log                           |
| `POST`   | `/upload/logo/pre-register` | Public — logo upload before registration          |
| `POST`   | `/upload/client-logo`       | Bearer — upload/replace logo                      |

Both upload endpoints: `multipart/form-data`, single `file` field (JPEG/PNG/WebP/GIF, max 5 MB).

### Data Model Reference

```
UserRole:       CLIENT | SUPER_ADMIN
ClientPlan:     FREE | STARTER | PRO
SessionStatus:  WAITING | CONNECTED | PRINTING | COMPLETED | EXPIRED
PrintJobStatus: PENDING | PRINTING | COMPLETED | FAILED
```

All `id` fields are CUID strings. All timestamps are ISO-8601.

## WebSocket (Socket.IO)

Server runs on the same base URL. Auth via `{ auth: { token: accessToken } }`.

Key events the dashboard listens for: `print:incoming`, `print:ready`, `customer:joined`, `customer:left`, `session:ended`.

Key events the dashboard emits: `client:join`, `client:print_complete`, `client:print_error`, `session:end`.

## Electron Integration

The dashboard also runs inside an Electron companion desktop app. Use `isElectron()` from `src/lib/electron-print.ts` to branch behavior. `window.electronAPI` is typed in `src/types/electron.d.ts`.

- `printHtml(html, options)` — silent IPC print in Electron, browser print dialog fallback.
- `useElectronPrinter()` hook — polls printer status/supply levels every 30s via `getDeviceInfo()`.
- Print stage flow: `idle → preparing → spooling → printing → complete | error`.

## Key Conventions

### Types vs Schemas

| Use case            | Where                 | How                                        |
| ------------------- | --------------------- | ------------------------------------------ |
| API response shapes | `features/*/types/`   | Plain TS `type`/`interface`, `T`-prefix    |
| Form validation     | `features/*/schemas/` | Zod schema + `z.infer<>` for the form type |

Never write a Zod schema to describe an API response. Never import API response types from `schemas/`.

### Service Pattern

```ts
// features/[feature]/services/[entity]-service.ts
const queryKeys = { all: ['entity'] as const, me: () => ['entity', 'me'] as const };

const useGetMe = () => useQuery({ queryKey: queryKeys.me(), queryFn: async () => { ... } });

const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ...,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.all }); toast.success(...); },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

export const entityService = { queryKeys, useGetMe, useUpdateMe };
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
// 2. Third-party
// 3. Alias imports (@/ paths)
// 4. Relative imports
```

### Styling

- All colors via CSS variables: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`
- All conditional classes via `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Never hardcode hex colors; never use inline styles

### SVG Imports

```ts
import { ReactComponent as Logo } from '@/assets/images/logo.svg';
```

### Feature Barrel Exports

Each feature's `index.ts` exports only its public API. Other features must import only from `features/[feature]/index.ts`, never from internal paths.

## Path Aliases

`@/*` → `src/*`. Also available: `@components/*`, `@hooks/*`, `@utils/*`, `@stores/*`, `@services/*`, `@lib/*`, `@types/*`, `@assets/*`, `@images/*`, `@svgs/*`, `@config/*`.

## Environment Variables

```
VITE_API_BASE_URL   # Backend base URL, e.g. http://localhost:3001
VITE_BASE_PATH      # SPA base path (default /)
```

Swagger UI (development): `http://localhost:3001/docs`

## Scaffolding New Features

Use `/generate-api` to scaffold `types/`, `schemas/`, and `services/` for a new API-backed feature:

```
/generate-api clientProfile /clients/me A client profile with companyName, phoneNumber, plan, logoUrl, googleProfileLink, address
```
