# Base App — Framework Guide

This monorepo is the canonical starting point for new web applications. Clone it, rename packages, and build on the scaffold. Do not add features to this base unless they belong in every app.

---

## Stack

| Layer | Tool | Version |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | turbo ^2, pnpm ^9 |
| Frontend | Next.js (App Router) | ^15 |
| API | tRPC | ^11 |
| Styling | Tailwind CSS | ^4 |
| Components | shadcn/ui (Radix UI primitives) | own the code |
| Database | Drizzle ORM + PostgreSQL | ^0.38 |
| Auth | Better Auth | ^1 |
| Server state | TanStack Query | ^5 |
| Client state | Zustand | ^5 |
| Testing | Vitest + Playwright | ^2 |
| Language | TypeScript (strict) | ^5.7 |

---

## Monorepo Structure

```
base-app/
├── apps/
│   └── web/                        # Next.js 15 application
│       ├── app/                    # App Router: layouts, pages, route handlers
│       ├── components/             # App-specific React components
│       ├── lib/
│       │   ├── env.ts              # Type-safe env vars (t3-env)
│       │   ├── store.ts            # Zustand global state
│       │   └── trpc/
│       │       ├── client.ts       # tRPC React client
│       │       └── server.ts       # tRPC server caller (RSC use)
│       └── tests/                  # Vitest unit/integration tests
│
├── packages/
│   ├── ui/                         # Shared design system
│   │   └── src/
│   │       ├── components/         # shadcn/ui base components
│   │       └── lib/utils.ts        # cn() helper
│   │
│   ├── db/                         # Database layer
│   │   ├── src/
│   │   │   ├── schema/             # Drizzle table definitions
│   │   │   └── client.ts           # Drizzle db client
│   │   └── drizzle.config.ts
│   │
│   ├── auth/                       # Auth configuration
│   │   └── src/
│   │       ├── index.ts            # Server auth instance
│   │       └── client.ts           # Browser auth client
│   │
│   ├── api/                        # tRPC routers
│   │   └── src/
│   │       ├── trpc.ts             # Context, procedures, middleware
│   │       └── routers/            # Feature routers
│   │           └── index.ts        # Root appRouter
│   │
│   └── config/
│       ├── typescript/             # Shared tsconfig bases
│       ├── eslint/                 # Shared ESLint flat configs
│       └── tailwind/               # Shared Tailwind preset + theme tokens
│
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml              # Local Postgres + Redis
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker (for local database)

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start local services
docker compose up -d

# 3. Copy and fill env file
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local — at minimum set DATABASE_URL and BETTER_AUTH_SECRET

# 4. Push schema to database (first time) or run migrations
pnpm db:push

# 5. Start dev server
pnpm dev
```

### Common commands

```bash
pnpm dev              # Start all apps in watch mode (Turborepo)
pnpm build            # Production build
pnpm lint             # Run ESLint across all packages
pnpm lint:fix         # Auto-fix lint errors
pnpm format           # Prettier format all files
pnpm typecheck        # tsc --noEmit across all packages
pnpm test             # Vitest unit tests across all packages
pnpm clean            # Delete all build artifacts and node_modules

# Database (targets @base-app/db)
pnpm db:generate      # Generate migration files from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:push          # Push schema directly (dev only, no migration files)
pnpm --filter @base-app/db run db:studio  # Open Drizzle Studio
```

---

## Starting a New App from This Base

```bash
# 1. Clone
git clone <this-repo> my-new-app
cd my-new-app

# 2. Rename the package name throughout
# Replace "@base-app" with "@my-new-app" in all package.json files

# 3. Reset git history
rm -rf .git && git init && git add -A && git commit -m "chore: init from base-app scaffold"

# 4. Follow the Getting Started steps above
```

---

## Adding a New App

Place it under `apps/`. Copy the structure from `apps/web` as a reference.

```bash
mkdir -p apps/dashboard
# Add apps/dashboard/package.json with name "@base-app/dashboard"
# Add apps/dashboard/tsconfig.json extending @base-app/typescript-config/nextjs
```

---

## Adding a New Package

Place shared code under `packages/`. The package must:

1. Have a `package.json` with a scoped name (`@base-app/<name>`)
2. Export via the `exports` field (not `main`)
3. Declare workspace dependencies with `workspace:*`

```bash
mkdir -p packages/email/src
# Add packages/email/package.json
# Add packages/email/tsconfig.json
```

---

## Database: Drizzle ORM

### Adding a table

Create a new file under `packages/db/src/schema/`:

```ts
// packages/db/src/schema/posts.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```

Then export it from `packages/db/src/schema/index.ts`, and run:

```bash
pnpm db:generate   # creates migration file
pnpm db:migrate    # applies migration
```

### Rules
- Every table must have `id` (uuid, defaultRandom), `createdAt`, and `updatedAt`.
- Foreign keys must declare `onDelete` behaviour explicitly.
- Never use `db:push` in production — always use `db:generate` + `db:migrate`.
- Schema lives in `packages/db`; query logic lives in the relevant `packages/api` router or server action.

---

## API: tRPC

### Adding a router

```ts
// packages/api/src/routers/posts.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc.js'
import { db, posts } from '@base-app/db'
import { eq } from 'drizzle-orm'

export const postsRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return db.select().from(posts).orderBy(posts.createdAt)
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(255), content: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const [post] = await db
        .insert(posts)
        .values({ ...input, authorId: ctx.session.user.id })
        .returning()
      return post
    }),
})
```

Register it in `packages/api/src/routers/index.ts`:

```ts
import { postsRouter } from './posts.js'

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  posts: postsRouter,   // add here
})
```

### Calling from a Server Component (RSC)

```ts
import { api } from '@/lib/trpc/server'

export default async function Page() {
  const posts = await api.posts.list()
  return <PostList posts={posts} />
}
```

### Calling from a Client Component

```ts
'use client'
import { trpc } from '@/lib/trpc/client'

export function PostList() {
  const { data } = trpc.posts.list.useQuery()
  // ...
}
```

### Rules
- Use `publicProcedure` for unauthenticated routes; `protectedProcedure` for anything requiring a session.
- Validate all inputs with Zod. Never trust unvalidated input.
- Routers are feature-scoped — one file per domain (posts, users, billing, etc.).
- Do not put business logic directly in route handlers; put it in the router or a service function called from the router.

---

## Auth: Better Auth

Authentication is pre-wired with email/password and optional OAuth (GitHub, Google).

### Checking a session in a Server Component

```ts
import { auth } from '@base-app/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  return <div>Hello, {session.user.name}</div>
}
```

### Signing in from a Client Component

```ts
'use client'
import { signIn } from '@base-app/auth/client'

await signIn.email({ email, password, callbackURL: '/dashboard' })
await signIn.social({ provider: 'github', callbackURL: '/dashboard' })
```

### Protecting pages with middleware

Create `apps/web/middleware.ts`:

```ts
import { auth } from '@base-app/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  const isAuthed = !!session
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')

  if (!isAuthed && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
```

---

## UI Components: shadcn/ui

Components live in `packages/ui/src/components/`. They are copied into the repo (not installed as a dependency), so you own the code.

### Adding a new component

Follow the shadcn/ui pattern — Radix UI primitive + CVA variants + `cn()`:

```ts
// packages/ui/src/components/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

Export it from `packages/ui/src/index.ts`.

### Rules
- Use `cn()` from `@base-app/ui/lib/utils` for all className merging.
- Components must be accessible (keyboard nav, ARIA attributes via Radix primitives).
- No component should embed business logic or make API calls.

---

## State Management

### Server state — TanStack Query via tRPC

Prefer server state over client state wherever possible. TanStack Query handles caching, revalidation, and optimistic updates automatically through the tRPC integration.

### Client state — Zustand

Use Zustand for UI state that must persist across component unmounts (sidebar open/close, modal state, etc.).

```ts
// apps/web/lib/store.ts
import { create } from 'zustand'

interface ModalState {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useModalStore = create<ModalState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
```

### Rules
- Do not use Zustand for data that comes from the server — that belongs in TanStack Query.
- Do not use React Context for state that changes frequently — it causes full subtree re-renders.
- Keep stores flat. One store per domain, not one global store.

---

## Environment Variables

All env vars are validated at startup using `t3-env`. The schema is in `apps/web/lib/env.ts`.

- **Server-only** vars: defined in the `server` block, never sent to the browser.
- **Public** vars: must be prefixed with `NEXT_PUBLIC_` and declared in the `client` block.

When adding a new env var:

1. Add it to `apps/web/lib/env.ts` with a Zod validator.
2. Add it to `apps/web/.env.example` with a descriptive comment.
3. Document whether it is required or optional.

Never access `process.env` directly outside of `lib/env.ts`.

---

## Code Quality Rules

### TypeScript

- **Strict mode is non-negotiable.** All packages extend `@base-app/typescript-config/base` which enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitReturns`.
- No `any`. Use `unknown` and narrow it, or use generics.
- No non-null assertions (`!`). Guard properly or restructure.
- Prefer `type` imports: `import type { Foo } from '...'`. ESLint enforces this.
- Export types from the same file as their implementation. No separate `types.ts` files unless the types are shared across many files.

### ESLint

All packages inherit from `@base-app/eslint-config`. The key rules:

| Rule | Severity |
|---|---|
| `@typescript-eslint/no-explicit-any` | error |
| `@typescript-eslint/no-unused-vars` | error (prefix `_` to exempt) |
| `@typescript-eslint/consistent-type-imports` | error |
| `no-console` | warn (only `console.warn`/`console.error` allowed) |
| React Hooks rules | error |
| Next.js Core Web Vitals | error |

Run `pnpm lint:fix` to auto-fix most violations before pushing.

### Formatting

Prettier is the source of truth for formatting. Never hand-format code. Run `pnpm format` or rely on the pre-commit hook.

Config: single quotes, no semis, trailing commas, 100-char line width.

### Comments

Write comments only when the **why** is non-obvious. Do not explain what the code does — well-named identifiers do that. Do not leave TODO comments in committed code; open a ticket instead.

### Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `UserCard.tsx` |
| Files (utils/hooks) | camelCase | `useSession.ts` |
| Files (routes) | kebab-case | `app/sign-in/page.tsx` |
| React components | PascalCase | `UserCard` |
| Functions/variables | camelCase | `getUserById` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| DB tables | snake_case | `user_sessions` |
| tRPC routers | camelCase | `postsRouter` |
| Zod schemas | camelCase + `Schema` suffix | `createPostSchema` |

---

## Testing Rules

### Unit tests (Vitest)

- Every non-trivial utility function must have a unit test.
- Test files live next to source files as `*.test.ts` or in `tests/`.
- Tests must be deterministic. No `Math.random()`, no real network calls, no real DB calls — mock them.
- Aim for 80% line coverage on `packages/*`. Use `pnpm test:coverage` to check.

```ts
// Good: tests behaviour, not implementation
it('returns a greeting for a given name', () => {
  expect(greet('Alice')).toBe('Hello, Alice!')
})

// Bad: tests implementation detail
it('calls the string template literal', () => { ... })
```

### Component tests (Vitest + React Testing Library)

- Test what the user sees and interacts with, not internal component state.
- Use `@testing-library/react`'s `render`, `screen`, and `userEvent`.
- Do not test styling. Test behaviour (button click triggers mutation, form shows error on invalid input).

```ts
it('submits the form with valid input', async () => {
  render(<LoginForm />)
  await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(screen.getByText('Welcome back')).toBeInTheDocument()
})
```

### E2E tests (Playwright)

- Place E2E tests in `apps/web/e2e/`.
- Cover the critical user journeys: sign up, sign in, core feature flows.
- Run against a real local database (seeded with fixtures).
- E2E tests must not be flaky. If a test is flaky, fix it or delete it — do not mark it as skipped.

### What not to test

- Generated Drizzle schema types.
- Next.js framework internals.
- Third-party library behaviour.
- Trivial one-liner functions that are obviously correct.

---

## Git Workflow

### Branch naming

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
refactor/<short-description>
```

### Commit messages (Conventional Commits)

Enforced by Commitlint on every commit:

```
<type>(<optional scope>): <short summary in present tense>

[optional body — wrap at 100 chars]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`

```bash
# Good
git commit -m "feat(auth): add Google OAuth provider"
git commit -m "fix(db): handle null email in user query"
git commit -m "chore: bump drizzle-orm to 0.38.2"

# Bad
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "Update"
```

### Pre-commit hooks

Husky runs two hooks on every commit:

1. **pre-commit** — `lint-staged` runs ESLint + Prettier on staged files only.
2. **commit-msg** — Commitlint validates the commit message format.

If a hook fails, fix the issue before committing. Do not use `--no-verify`.

### Pull requests

- PRs must pass all CI checks (lint, typecheck, test, build) before merge.
- Keep PRs focused — one logical change per PR.
- Squash merge into main.

---

## Adding a New Feature (Checklist)

When adding a feature that spans the stack:

- [ ] Schema: new table(s) in `packages/db/src/schema/`, exported from `schema/index.ts`
- [ ] Migration: `pnpm db:generate` then `pnpm db:migrate`
- [ ] Router: new tRPC router in `packages/api/src/routers/`, registered in `routers/index.ts`
- [ ] Env vars: any new secrets added to `lib/env.ts` and `.env.example`
- [ ] UI: reusable components in `packages/ui/`, app-specific in `apps/web/components/`
- [ ] Tests: unit tests for business logic, component tests for interactive UI
- [ ] Types: exported from the package that owns them

---

## Dependency Policy

- Add dependencies to the package that uses them, not to the root.
- Use `workspace:*` for internal package dependencies.
- Keep the root `package.json` limited to dev tooling (Turbo, Husky, Prettier, Commitlint, TypeScript).
- Before adding a new dependency, check if an existing one already covers the need.
- Prefer packages with: TypeScript types included, active maintenance, small bundle size.
- Never add a dependency that requires a native build step unless absolutely necessary.

---

## Performance Guidelines

- **Prefer Server Components** — only use `'use client'` when you need browser APIs, event listeners, or React hooks.
- **Stream heavy pages** — use `<Suspense>` boundaries to progressively render data-heavy sections.
- **Cache aggressively** — use Next.js `cache()` for repeated server-side data fetches within a request.
- **Optimise images** — always use Next.js `<Image>` with explicit `width`/`height` or `fill`.
- **Bundle size** — run `next build` and check the output for large client chunks. Use dynamic imports for heavy client-only libraries.
