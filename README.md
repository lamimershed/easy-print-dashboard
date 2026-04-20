# Admin Dashboard v2

A production-grade React admin dashboard boilerplate built with modern best practices.

## Tech Stack

- **Framework**: React 19 + Vite 6
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **State Management**: Zustand (global) + TanStack Query (server)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v7
- **Language**: TypeScript 5.7 (strict mode)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Build for production
pnpm build
```

## Project Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
│   ├── ui/          # shadcn/ui primitives
│   ├── common/      # Shared components
│   ├── form/        # Form components
│   └── layouts/     # Layout wrappers
├── config/          # App configuration
├── features/        # Feature-based modules
│   └── [feature]/
│       ├── components/
│       ├── pages/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       ├── types/
│       └── index.ts
├── hooks/           # Global custom hooks
├── lib/             # Shared utilities
├── providers/       # Context providers
├── services/        # Global API services
├── stores/          # Global Zustand stores
├── types/           # Global TypeScript types
└── utils/           # Utility functions
```

## Adding New Features

1. Create a new folder under `src/features/[feature-name]/`
2. Add the standard subfolders: `schemas/`, `types/`, `services/`, `pages/`, `routes/`, `components/`
3. Create an `index.ts` barrel export for the public API
4. Add the feature routes to `src/App.tsx`

See `src/features/example-feature/` for a complete template.

## Environment Variables

```env
VITE_API_BASE_URL=https://api.staging.restaurant.jlts.com
VITE_BASE_PATH=/
VITE_API_RESTAURANT_ADMIN_ROLE_ID=
```

## Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `pnpm dev`           | Start development server     |
| `pnpm build`         | Build for production         |
| `pnpm build:staging` | Build for staging            |
| `pnpm type-check`    | Run TypeScript type checking |
| `pnpm lint`          | Run ESLint                   |
| `pnpm format`        | Format code with Prettier    |
| `pnpm format:check`  | Check formatting             |

## License

Private - All rights reserved.
