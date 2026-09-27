# Splitwise Backend

A production-ready backend for a Splitwise-style expense-sharing application, built with Node.js, TypeScript, Express, and MongoDB. It is designed to be consumed by a separate Next.js (or any) frontend over a REST API.

## Features

- Email/password authentication with JWT (OAuth-ready architecture)
- User profiles and preferences
- Groups, group membership, and role-based permissions (OWNER / ADMIN / MEMBER)
- Email invitations with secure, expiring tokens
- Expenses with **EQUAL**, **PERCENTAGE**, and **CUSTOM** splitting
- Server-side balance engine ("who owes whom")
- Greedy debt-simplification algorithm ("simplify debts")
- Settlements with full audit trail
- Activity feed / audit log per group
- Notifications (invites, expenses, settlements)
- Spending analytics (overview, monthly, by category, by group, trends)
- CSV and PDF expense report export
- Receipt/attachment metadata with upload validation
- Global search (groups, expenses, users, settlements), scoped to what the caller is authorized to see
- Centralized error handling, Zod validation, rate limiting, Helmet/CORS hardening

## Architecture

Layered architecture, each layer with a single responsibility:

```
Routes  →  Middleware (auth/role/validation)  →  Controllers  →  Services  →  Repositories  →  Mongoose Models  →  MongoDB
                                                                       ↑
                                                              Algorithms (pure, DB-free)
```

- **Controllers** are thin: they parse `req`, call a service, and shape the response. No business logic lives here.
- **Services** hold all business logic and authorization checks. They are the only layer allowed to orchestrate multiple repositories/models together.
- **Repositories** (`user`, `group`, `expense`, `settlement`, `notification`) are the *only* place that talks to Mongoose for their respective models. This isolation is what would let the database layer be swapped for PostgreSQL + Prisma later without touching services/controllers.
- **Algorithms** (`splitCalculation`, `balanceCalculation`, `debtSimplification`) are pure functions with **no** database access at all. This is what makes them trivially and thoroughly unit-testable (see `tests/algorithms`).
- A few models without a dedicated repository (`Invitation`, `Activity`, `Attachment`) are accessed directly from their corresponding service, per the project's specified file structure.

## Technology stack

| Concern              | Choice                                   |
|----------------------|-------------------------------------------|
| Language             | TypeScript (strict mode)                  |
| HTTP framework       | Express.js                                |
| Database             | MongoDB via Mongoose                      |
| Validation           | Zod                                       |
| Auth                 | JWT (`jsonwebtoken`) + `bcrypt`            |
| Security             | Helmet, CORS, express-rate-limit          |
| Logging              | Morgan (HTTP access logs) + a small custom logger |
| File uploads         | Multer (disk storage)                     |
| PDF export           | PDFKit                                    |
| Testing              | Jest + ts-jest + Supertest                |

## Folder structure

```
splitwise-backend/
├── src/
│   ├── config/            # env loading, MongoDB connection, logger
│   ├── controllers/       # thin HTTP handlers (one per resource)
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers, wired with middleware
│   ├── services/          # business logic + authorization
│   ├── algorithms/        # pure, DB-free financial algorithms
│   ├── middleware/        # auth, role checks, validation, errors, rate limiting
│   ├── validators/        # Zod request schemas
│   ├── repositories/      # the only layer that queries Mongoose models
│   ├── utils/             # money precision, pagination, dates, errors, transactions
│   ├── types/             # shared TypeScript types + Express request augmentation
│   ├── app.ts             # Express app wiring (no listen())
│   └── server.ts          # connects to MongoDB, then starts listening
│
├── tests/
│   ├── algorithms/        # full unit coverage of split/balance/debt algorithms
│   ├── utils/              # money precision unit tests
│   ├── validators/         # Zod schema unit tests
│   └── auth, groups, expenses, settlements/   # HTTP-level tests (see "Testing" below)
│
├── scripts/seed.ts        # deterministic, idempotent database seeding
├── uploads/               # local receipt storage (gitignored)
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.ts
├── README.md
└── API.md
```

## Database schema

10 Mongoose collections, matching the spec exactly:

`User`, `Group`, `GroupMember`, `Invitation`, `Expense`, `ExpenseParticipant`, `Settlement`, `Notification`, `Activity`, `Attachment`.

Key design decisions:

- **All money is stored as integer minor currency units** (e.g. paise for INR), never as floats. See "Money precision" below.
- `GroupMember` has a unique compound index on `(groupId, userId)` — a user cannot be added to the same group twice.
- `ExpenseParticipant` has a unique compound index on `(expenseId, userId)`.
- `Expense` uses a soft delete (`deletedAt`) so historical financial data is never actually destroyed.
- Indexes are added exactly where the spec calls for them (see section 37 of the original spec): `User.email`, `Group.ownerId`, `GroupMember.{groupId,userId}`, `Expense.{groupId,paidBy,date}`, `ExpenseParticipant.{expenseId,userId}`, `Settlement.{groupId,fromUser,toUser}`, `Notification.{userId,read}`.

## Money precision

All financial calculations use **integer minor currency units** (paise for INR) exclusively. `src/utils/currency.ts` provides:

- `toMinorUnits(100.50) === 10050`
- `fromMinorUnits(10050) === 100.50`
- `formatMoney(10050, "INR")` → a locale-formatted string, used only at the API/export boundary.

Nothing in `algorithms/` or `services/` ever does arithmetic on decimal rupee amounts — floats never touch a balance calculation.

## Authentication

- `POST /api/auth/register`, `POST /api/auth/login` issue a JWT (`Authorization: Bearer <token>`).
- `requireAuth` middleware verifies the token, and **every** downstream handler reads the caller's identity from `req.user`, never from a client-supplied `userId` in the body/query.
- `GET /api/auth/me` returns the current user.
- `POST /api/auth/logout` is a no-op today (JWTs are stateless) but is structured as a seam — `authService.logout()` — where a Redis token-blocklist could be added later without changing the API surface.
- **Adding Google OAuth / Auth.js later**: `authService` already isolates "verify credentials, then issue a token" from the HTTP layer. A `loginWithGoogle(profile)` method could be added next to `login()`/`register()`, funnel into the same `issueToken()` helper, and nothing else in the app (middleware, controllers) would need to change.

## Authorization

Group-level permissions are enforced **server-side**, never trusted from the client:

| Role   | Permissions |
|--------|-------------|
| OWNER  | Everything, including deleting the group and changing member roles |
| ADMIN  | Manage members, create/edit/delete any expense, view analytics, manage settlements |
| MEMBER | View the group, create expenses, view balances, create settlements they are a party to |

`middleware/role.middleware.ts` provides `requireGroupMember()`, `requireAdmin()`, `requireOwner()` for routes with a `:groupId` URL segment, plus a non-middleware `assertGroupRole()` helper for services that authorize against a `groupId` supplied in the request body (e.g. creating an expense or settlement).

## Expense splitting

`src/algorithms/splitCalculation.ts` implements all three split types as pure functions, each of which **guarantees** the resulting shares sum exactly to the expense amount (see `tests/algorithms/splitCalculation.test.ts` for the full spec, including rounding edge cases):

- **EQUAL** — floor-divides the amount, then distributes the leftover minor units one-by-one to the first participants (deterministic).
- **PERCENTAGE** — validates percentages sum to 100 (within floating-point tolerance), then distributes any rounding remainder to the largest percentage holders first.
- **CUSTOM** — the caller specifies exact shares; a mismatched total is rejected outright rather than silently adjusted.

The backend, not the client, always calculates the final shares (spec section 49 / 50): a request only ever supplies `amount`, `paidBy`, `splitType`, and `participants` — never a pre-computed `shareAmount` total.

## Balance engine

`src/algorithms/balanceCalculation.ts` computes each member's net balance from raw aggregates (fetched by `services/balance.service.ts`):

```
netBalance = totalPaid − totalOwed + settlementsPaid − settlementsReceived
```

> **Note on the settlement sign convention:** the original spec listed this formula with the settlement terms in the opposite order (`+ settlementsReceived − settlementsPaid`). That version would cause *paying off a debt to make the debt worse* — mathematically inconsistent with the spec's own requirement that "settlements must correctly change outstanding balances" and that "sum of all member net balances = 0". This implementation uses the corrected formula so that a settlement always moves both parties' balances *towards* zero. This is covered explicitly in `tests/algorithms/balanceCalculation.test.ts`.

The invariant `sum(all member net balances) === 0` is checked on every read via `assertBalancesSumToZero()` — if it ever fails, the API returns a `500 INVARIANT_VIOLATION` rather than silently returning incorrect financial data.

## Debt simplification algorithm

`src/algorithms/debtSimplification.ts` implements the classic **greedy min-cash-flow** heuristic:

1. Split members into debtors (balance < 0) and creditors (balance > 0).
2. Repeatedly match the *largest* debtor with the *largest* creditor.
3. Transfer `min(|debtor|, creditor)` between them.
4. Whoever hits zero drops out; repeat until everyone is at zero.

This produces at most `n − 1` transactions for `n` non-zero balances and is a well-known heuristic for this problem (the true minimum-transaction variant is NP-hard in general, and this greedy result is exactly what "simplify debts" means to end users). Every code path is commented in-place, and `verifySimplification()` is used defensively by the service layer to confirm money is conserved before ever returning a result to the API.

### Algorithm complexity

| Algorithm | Time complexity | Notes |
|---|---|---|
| `calculateEqualSplit` / `calculatePercentageSplit` / `calculateCustomSplit` | O(n) | n = number of participants |
| `computeMemberBalances` | O(n) | n = number of group members |
| `computeDirectDebts` / pairwise netting | O(e) | e = number of expense-participant rows in the group |
| `simplifyDebts` | O(n² log n) worst case | n = number of non-zero balances; re-sorts on each of up to n−1 iterations. Fast enough for realistic group sizes (tens to low hundreds of members). |

## Settlements

Creating a settlement validates both users belong to the group, records the settlement, writes an `Activity` entry, and notifies both parties. Settlements **never** mutate historical `Expense` documents — they are an independent ledger entry that the balance engine reads alongside expenses, which is what keeps "settlements must not change historical expense amounts" true by construction.

## Analytics

`GET /api/analytics/{overview,monthly,categories,groups,trends}` compute every figure live from MongoDB (`Expense`/`ExpenseParticipant` documents) — nothing is hardcoded or fabricated. For very large datasets, the current query-then-reduce-in-JS approach could be pushed into a MongoDB aggregation pipeline (`$group`/`$lookup`) for better scalability; it's implemented this way for clarity given typical expense-group data volumes.

## Notifications

Notifications are created (via `services/notification.service.ts`) whenever: a user is invited or joins a group, an expense is created/updated/deleted, and a settlement is created (both the payer and the payee are notified).

## Exports

- **CSV** (`GET /api/groups/:groupId/export/csv`) — one row per expense with Date, Expense, Category, Paid By, Participants, Amount, User Share, and a per-expense Balance column (the requesting user's net effect of that specific expense).
- **PDF** (`GET /api/groups/:groupId/export/pdf`) — a formatted report (via PDFKit) with the group name, date range, total spending, every member's balance, full expense history, and full settlement history.

## Security

- **Helmet** for standard security headers, **CORS** locked to `CORS_ORIGIN` (never `*` in production).
- **express-rate-limit**: a general API-wide limiter plus a stricter limiter on `/api/auth/*` to slow down credential stuffing.
- Passwords hashed with **bcrypt** (12 salt rounds); `passwordHash` is `select: false` by default and stripped from every JSON response via a schema-level `toJSON` transform.
- JWTs expire (`JWT_EXPIRES_IN`, default 7 days) and the app **refuses to boot in production** with the default development JWT secret.
- All request bodies/params/query strings are validated with Zod before touching a controller.
- File uploads are restricted by MIME type, extension, and size (`attachment.service.ts`).
- Centralized error handling never leaks stack traces in production (`NODE_ENV=production`).

## MongoDB transactions

Multi-document writes (creating an expense + its participants; creating/deleting a settlement) go through `src/utils/transaction.ts`, which uses a real MongoDB session/transaction **when the deployment supports one** (replica set / mongos — this is the default on MongoDB Atlas). 

**Known limitation:** a bare standalone `mongod` (common for local development) does not support multi-document transactions. When that's detected, `withTransaction()` logs a warning and falls back to sequential, non-transactional writes. In that specific configuration, a failure partway through a multi-write operation could leave partial data. For full atomicity in local development, initialize MongoDB as a single-node replica set (`rs.initiate()`), which is a one-line change and is what most managed MongoDB providers give you by default.

## Financial invariants

These are checked in code, not just asserted in docs:

| Invariant | Enforced by |
|---|---|
| `sum(participant shares) === expense amount` | `splitCalculation.ts` (`assertSharesSumToAmount`), throws `InvalidSplitError` |
| `sum(percentages) === 100` | `calculatePercentageSplit` |
| `sum(all member net balances) === 0` | `balanceCalculation.ts` (`assertBalancesSumToZero`), called on every balance read |
| `sum(original balances) === sum(final balances)` after simplification | `debtSimplification.ts` (`verifySimplification`), used defensively by `debt.service.ts` |
| Settlements never mutate historical expenses | Structural — settlements are a separate collection/ledger, never a write to `Expense` |

If any of these fail, the operation is rejected (typically `400 VALIDATION_ERROR` / `400 INVALID_SPLIT`) or, for balance/debt reads where a violation would indicate an upstream bug, a `500 INVARIANT_VIOLATION` is returned rather than silently serving incorrect numbers.

## Setup instructions

### Prerequisites

- Node.js 18+
- A reachable MongoDB instance (local `mongod`, Docker, or MongoDB Atlas)

### Install

```bash
npm install
cp .env.example .env
```

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `PORT` | HTTP port | `5000` |
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/splitwise` |
| `JWT_SECRET` | Secret used to sign JWTs — **must** be changed for production | *(dev-only placeholder)* |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `MAX_FILE_SIZE` | Max receipt upload size, in bytes | `5242880` (5MB) |
| `UPLOAD_DIR` | Local directory for uploaded receipts | `uploads` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | General API rate limit window/ceiling | `900000` / `300` |
| `LOG_LEVEL` | `info` \| `debug` | `info` |

### Running locally

```bash
npm run dev
```

This starts the server with `ts-node-dev` (auto-restart on file changes) on `http://localhost:5000`. Verify it's up:

```bash
curl http://localhost:5000/api/health
```

If MongoDB isn't reachable yet, the server still starts (so you can iterate on non-DB code), and `/api/health` will report `"database": "disconnected"` until `MONGO_URL` is reachable.

### Seeding the database

```bash
npm run seed
```

This is **deterministic** (same users/groups/expenses every run, computed with the exact same `calculateSplit()` the API uses) and **idempotent** (every write is an upsert keyed on a natural identity — email for users, `(groupId, userId)` for memberships, `(groupId, title, createdBy)` for expenses, etc.) — running it repeatedly updates the same seed data in place rather than creating duplicates. It seeds 5 users (Tanu, Rahul, Priya, Aman, Sneha — all with password `Password123!`), 3 groups (Goa Trip, Apartment, Weekend Squad), a realistic mix of EQUAL/PERCENTAGE/CUSTOM expenses, and a settlement.

### Production deployment

```bash
npm run build
npm start
```

`npm run build` compiles TypeScript to `dist/`; `npm start` runs the compiled `dist/src/server.js`. Ensure `NODE_ENV=production`, a strong `JWT_SECRET`, a real `MONGO_URL`, and a specific `CORS_ORIGIN` are set — the app deliberately refuses to boot in production with the placeholder development JWT secret.

## Testing

```bash
npm test          # run the full Jest suite once
npm run test:watch
npm run build      # compile with strict TypeScript, no emit errors
```

**What's covered without needing a database** (all of this runs in this repo out of the box):

- `tests/algorithms/*` — full coverage of `calculateSplit` (equal/percentage/custom, rounding, invalid input), `computeMemberBalances`/`computeDirectDebts` (including the settlement-direction sign convention), and `simplifyDebts` (the spec's worked example, multiple debtors/creditors, cycles, conservation-of-money checks, malformed input).
- `tests/utils/currency.test.ts` — money precision round-tripping and rounding behavior.
- `tests/validators/*` — Zod schema validation for expenses and settlements.
- `tests/{auth,groups,expenses,settlements}/*.test.ts` — real HTTP-level tests against the actual Express app (via Supertest): authentication middleware, request validation, and error-response shape. These are scoped to request paths that fail **before** reaching MongoDB (missing/invalid auth, malformed payloads), so they run without any external dependency.

**What requires a live MongoDB (not run in this build environment)**: end-to-end happy-path flows — register → create group → add members → create expense → verify balances → simplify debts → settle up → verify balances again. This build environment has no outbound network access to a MongoDB server, so those flows could not be executed here. To run them yourself: point `MONGO_URL` at a real MongoDB instance (`docker run -p 27017:27017 mongo` works well) and extend the existing test files — the app, algorithms, and validation layers underneath them are already fully covered.

## API documentation

See [API.md](./API.md) for every endpoint: method, path, auth requirement, request body/query, response shape, and error responses.
