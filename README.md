# Splitwise Frontend

A production-quality Next.js frontend for a Splitwise-style expense-sharing app, built in the **Liquid Obsidian** design language. It's designed to connect directly to the companion `splitwise-backend` REST API.

## Features

- **Auth**: JWT login/register, protected dashboard routes, a deterministic **Explore Demo** mode that needs no backend at all
- **Groups**: create/edit/delete, membership management (add by email, invite, remove, change role), permission-aware UI
- **Expenses**: full CRUD, with a real **Equal / Percentage / Custom** split editor that mirrors the backend's live validation
- **Balances & debts**: per-group balances, direct "who owes whom," and the backend's debt-simplification algorithm visualized as an animated before/after comparison
- **Settlements**: a settle-up flow (amount, payment method, note) and settlement history
- **Analytics**: overview, monthly (with month navigation), category and per-group breakdowns, and insights computed from the fetched data - never fabricated
- **Notifications**: unread-count badge, mark read/unread, delete
- **Global search**: `Ctrl/⌘+K` command palette plus a full search page
- **Exports**: CSV/PDF download, driven entirely by the backend
- Loading skeletons, error states (mapped by HTTP status), empty states, and confirm dialogs used consistently across every view
- Fully responsive: sidebar + top navbar on desktop, bottom nav + floating add button on mobile, bottom-sheet modals on small screens

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v3 + hand-authored shadcn-style primitives on Radix UI |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | Sonner |
| Font | [Geist](https://www.npmjs.com/package/geist) (self-hosted, no network fetch at build time) |
| Testing | Jest (`next/jest`) + React Testing Library |

**Version notes (deliberate, documented choices):**
- **Next.js 14, not 15/16.** Next 15+ was available, but pinning 14 avoided taking on the React 19 / Next 15 ecosystem-wide migration this late in a large build, in favor of a combination with very well-established behavior. One consequence: `next.config.ts` isn't supported until Next 15, so config lives in **`next.config.mjs`** instead (same content, different extension - see the comment in that file).
- **Geist instead of next/font/google's Inter.** This sandboxed build environment has no network access to `fonts.googleapis.com`, so `next/font/google` would fail at build time. The `geist` npm package ships its font files locally and needs no network fetch, and was one of the two fonts the spec suggested - no compromise on the actual typography.
- **Tailwind v3, not v4.** v4 replaces the JS config file with a CSS-first config model; the spec explicitly asks for a `tailwind.config.ts` file, so v3 was the better fit.

## Architecture

```
Pages (App Router)  →  Hooks (TanStack Query)  →  lib/api/*  →  lib/api/client.ts  →  splitwise-backend
                              ↑                         ↓
                        Zod validation           lib/demo/* (when Explore Demo is active)
```

- **`lib/api/client.ts`** is the *only* place that calls `fetch`. Every other module in `lib/api/` (one file per backend resource) goes through it, attaches the JWT, and normalizes every failure into a single `ApiError` shape. No component ever calls `fetch` directly.
- **`hooks/*`** wrap TanStack Query around `lib/api/*` - one hook file per resource, matching the spec's required set (`useAuth`, `useGroups`, `useExpenses`, `useBalances`, `useDebts`, `useSettlements`, `useAnalytics`, `useNotifications`). Mutations invalidate every view a financial change can affect (see `hooks/useExpenses.ts` for the clearest example: creating an expense invalidates the expense list, this group's balances/debts, analytics, and notifications together).
- **Server state vs UI state**: everything from the backend lives in TanStack Query's cache (never duplicated into React context or global state). Purely local UI state (modal open/closed, the selected split type mid-edit, the search dialog) is plain `useState`/component state - see `providers/` for the only two things that *are* global: auth and the query client.
- **The backend is the only source of truth for money.** The frontend never computes a balance or a debt - `SplitTypeSelector`'s live totals are clearly commented as a *preview* to give immediate form feedback; the actual `POST /expenses` call sends raw participant input, and the shares that get stored come back from the backend's response.
- **Demo mode** (`lib/demo/`): a `localStorage` flag that every `lib/api/*` module checks first. When active, each module returns a fixture from `lib/demo/data.ts` instead of calling `client.ts`. The fixture data was computed and verified by hand so that every group's balances actually sum to zero and the featured debt-simplification example is mathematically consistent - it isn't random, and it isn't disconnected from what the rest of the UI shows.

## Folder structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx (landing), loading.tsx, error.tsx, not-found.tsx
│   ├── (auth)/                    # login, register, forgot-password (own layout, redirects if already authenticated)
│   └── (dashboard)/               # every authenticated route (own layout: sidebar + navbar + mobile nav + route guard)
│       ├── dashboard/
│       ├── groups/ , groups/[groupId]/{expenses,balances,members,analytics}/
│       ├── expenses/ , expenses/[expenseId]/
│       ├── settlements/ , analytics/ , notifications/ , search/ , settings/ , profile/
│
├── components/
│   ├── ui/            # hand-authored shadcn-style primitives (Button, Input, Dialog, Select, Tabs, DropdownMenu, ...)
│   ├── glass/          # the spec's required Liquid Obsidian components: GlassCard, GlassPanel, LiquidButton,
│   │                   #   GlassInput, GlassSelect, GlassModal, GlassDropdown, GlassTabs, GlassSidebar, GlassNavbar
│   ├── layout/         # Sidebar, Navbar, MobileBottomNav, DashboardShell (route guard + Ctrl+K + quick-add), Logo, UserMenu
│   ├── common/         # StatCard, MemberAvatar, MemberList, EmptyState, ErrorState, LoadingSkeleton, ConfirmDialog, PageHeader, CountUp
│   └── dashboard/ groups/ expenses/ balances/ debts/ settlements/ analytics/ notifications/ search/ profile/ settings/
│
├── hooks/              # useAuth, useGroups, useExpenses, useBalances, useDebts, useSettlements, useAnalytics, useNotifications, + useMediaQuery/useDebounce/useDashboardSummary
│
├── lib/
│   ├── api/            # client.ts, errors.ts, auth.ts, users.ts, groups.ts, expenses.ts, balances.ts, debts.ts, settlements.ts, analytics.ts, notifications.ts, search.ts, exports.ts
│   ├── auth/           # token.ts (localStorage JWT persistence)
│   ├── demo/           # mode.ts, data.ts (deterministic fixtures)
│   ├── formatters/     # currency.ts, date.ts
│   ├── validations/    # Zod schemas: auth, group, expense, settlement, profile
│   └── utils/          # cn.ts, constants.ts, query-keys.ts
│
├── providers/          # QueryProvider.tsx, AuthProvider.tsx
├── types/              # user, group, expense, balance, debt, settlement, notification, analytics, search, api
└── styles/globals.css  # Liquid Obsidian design tokens

tests/                  # validations/, formatters/, lib/, components/
```

## Environment setup

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

This is the only environment variable the app needs, and it's intentionally `NEXT_PUBLIC_*` since the browser calls the backend directly - no secrets live here or anywhere else in client code.

## Backend connection

Point `NEXT_PUBLIC_API_URL` at a running `splitwise-backend` (see the sibling project). Every request goes through `lib/api/client.ts`, which attaches `Authorization: Bearer <jwt>` automatically once you're logged in.

**One route adaptation worth knowing about:** the spec's assumed contract listed exports at `/api/export/groups/:groupId/csv`. The actual backend built alongside this frontend exposes them nested under the group instead, at `/api/groups/:groupId/export/csv` (consistent with its other group sub-resources like `/balances` and `/debts`). `lib/api/exports.ts` targets the real route and documents this in a comment - exactly the "adapter layer" approach the spec calls for when a backend's actual shape differs slightly from what was assumed, so nothing outside that one file needed to know about it.

If you don't have a backend running yet, click **Explore Demo** on the login page or landing page - the whole app works against the local, deterministic fixture data instead.

## Running locally

```bash
npm install
npm run dev
```

Opens on `http://localhost:3000`. With no backend reachable, every page still renders correctly and shows proper error states (see `components/common/ErrorState.tsx`) rather than crashing - or just use Explore Demo to see the app fully populated.

## Authentication

`providers/AuthProvider.tsx` holds the current user and auth status (`loading` / `authenticated` / `unauthenticated`), persists the JWT via `lib/auth/token.ts` (a single localStorage wrapper), and registers a global 401 handler with the API client so that an expired/invalid token anywhere in the app triggers a clean logout. `components/layout/DashboardShell.tsx` is where every `(dashboard)` route is actually gated - unauthenticated visitors are redirected to `/login`; the `(auth)` layout does the inverse (an already-logged-in visitor to `/login` is redirected to `/dashboard`).

Structured for real OAuth later: `AuthProvider` exposes `login`/`register`/`enterDemo` as the only ways components change auth state, all funneling through `lib/api/auth.ts`. Adding Google/Auth.js would mean adding one more method there (e.g. `loginWithGoogle`) - no other file in the app would need to change.

## API integration

Every backend resource has its own file in `lib/api/`, and every response type is a real TypeScript interface in `types/` - nothing from the backend is typed `any`. See "Architecture" above for the request flow and the demo-mode fallback.

## Testing

```bash
npm test
npm run test:watch
```

**80 tests across 13 suites**, covering exactly what the spec asked for:
- Login and registration form validation (`tests/components/LoginPage.test.tsx`, `tests/validations/auth.test.ts`)
- Expense form validation for all three split types - equal, percentage, custom (`tests/validations/expense.test.ts`, `tests/components/SplitTypeSelector.test.tsx`)
- API error handling and status-code-to-message mapping (`tests/lib/api-client.test.ts`, `tests/components/ErrorState.test.tsx`)
- Protected routes (`tests/components/ProtectedRoute.test.tsx`)
- Balance display (`tests/components/BalanceDisplay.test.tsx`)
- The settlement flow (`tests/components/SettleUpModal.test.tsx`)
- Notification read/unread state (`tests/components/NotificationItem.test.tsx`)
- Currency/date formatters and settlement/group validation schemas

One real bug was caught and fixed by this suite: several `<input type="email">`/`type="number"` fields let the browser's native HTML5 constraint validation intercept form submission before React Hook Form's Zod validation ever ran, which would have shown the browser's generic tooltip instead of this app's custom error copy. Every form now sets `noValidate` so the app's own validation is what users actually see.

## Build

```bash
npm run build
npm run lint
```

Both are clean: `next build` type-checks the whole project, runs ESLint, and statically generates all 16 prerenderable routes (the rest - anything under `[groupId]`/`[expenseId]` - are correctly marked dynamic). `npm run lint` reports no errors.

## Deployment

`npm run build && npm start` runs the production server. This is a standard Next.js app - it deploys as-is to Vercel, or as a Node server anywhere else. Set `NEXT_PUBLIC_API_URL` to the deployed backend's URL in your hosting provider's environment configuration before building.

### CRITICAL: Clerk Authentication in Production (Vercel)

If you deploy to a free Vercel domain (`*.vercel.app`) using Clerk **Live** keys, your application will fail to load Clerk (`net::ERR_CONNECTION_CLOSED`) and all authenticated API routes (like `/api/chat`) will return `401 Unauthorized`. 

**Why?** Clerk Live keys demand a CNAME DNS record (e.g., `clerk.your-domain.com`). Vercel does not allow custom DNS records on their free `.vercel.app` subdomains. Therefore, the connection to the Clerk frontend API is forcefully closed by Vercel's edge network.

**The Fix:**
You must choose one of the following before deploying:
1. **Use Test Keys:** Change your Vercel Environment Variables to use your Clerk **Development** keys (`pk_test_...` and `sk_test_...`). These do not require custom DNS and work perfectly on `.vercel.app` domains.
2. **Use a Custom Domain:** Buy a custom domain (e.g., `balancio.com`), assign it to your Vercel project, and configure the 3 CNAME records provided by your Clerk dashboard. Update your Clerk dashboard's domain settings to match your new domain.

*Note: Any time you update environment variables in Vercel (`NEXT_PUBLIC_*`), you MUST trigger a new deployment for them to be baked into the JavaScript bundle.*

## Future improvements

- Real-time updates via WebSockets (the TanStack Query invalidation pattern already used throughout is exactly the seam a WebSocket event handler would hook into - see spec section 75)
- A real password-reset endpoint (the forgot-password page's UI and validation are complete, but honestly disabled - see the comment in `app/(auth)/forgot-password/page.tsx` - since the backend doesn't expose this yet)
- Receipt upload/preview in the expense form (the backend's attachment endpoints exist; the form doesn't yet have a file picker wired to them)
- Optimistic updates for settlement creation and notification read-state, rather than waiting for the round trip
- E2E tests (Playwright/Cypress) covering the full create-group → add-expense → settle flow against a live backend.
