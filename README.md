# Balancio

A modern, full-stack expense sharing application with automated debt simplification and an AI-powered financial assistant. Built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, **Clerk Authentication**, and **Groq AI**, styled in the dark, sleek **Liquid Obsidian** design system.

---

## Features

- **Smart Expense Tracking**:
  - Full expense lifecycle management (create, view, edit, delete).
  - Multi-method splitting: **Equal**, **Percentage**, and **Custom (Exact)** split calculations with client preview and strict server-side validation.
  - Multi-payer support with automated per-participant balance adjustment.

- **Debt Simplification & Balances**:
  - Real-time balance calculations ("who owes whom" across members and groups).
  - Graph-based minimum-cash-flow debt simplification algorithm that reduces total settlement transactions.

- **Settle-Up Workflow**:
  - Record payments between group members with customizable payment methods and notes.
  - Complete settlement history and transaction audit logs.

- **Balancio AI Assistant**:
  - Conversational financial assistant powered by **Groq** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`).
  - Context-aware intent classification and parallel database retrieval for queries regarding monthly spend, unsettled balances, and group debts.
  - Progressive token streaming via Server-Sent Events (SSE).

- **Authentication & Security**:
  - Managed authentication powered by **Clerk** (`@clerk/nextjs`).
  - Edge-level route protection via Next.js Middleware.
  - Strict tenant isolation and group membership checks across all Server Actions.
  - Parameterized database access with Prisma ORM (zero raw SQL injection surface).

- **Analytics & Search**:
  - Visual charts powered by Recharts (monthly spending trends, category breakdowns, net balance summaries).
  - Global Command Palette (`Ctrl/⌘ + K`) for instant navigation and resource search.

- **Responsive Mobile Experience**:
  - Optimized for mobile and desktop viewports.
  - Virtual keyboard-aware search overlay and modal dialogs using dynamic viewport units (`100dvh`, `window.visualViewport`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.2 (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript (Strict mode) |
| **Styling & UI** | Tailwind CSS v3, Radix UI Primitives, Lucide Icons, Sonner |
| **Design Language** | Liquid Obsidian (Dark mode, glassmorphic panels, subtle borders) |
| **Database & ORM** | PostgreSQL (Supabase / Neon) + Prisma ORM 5.x |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **AI Engine** | Groq SDK (`groq-sdk`) |
| **Forms & Validation**| React Hook Form + Zod |
| **Charts** | Recharts |
| **Testing** | Jest (`next/jest`) + React Testing Library (136 tests, 18 suites) |

---

## Architecture

Balancio is structured as a full-stack Next.js 14 application:

```
Browser / Client Components
            │
            ▼
Next.js Edge Middleware (Clerk Session Guard)
            │
    ┌───────┴────────────────────────┐
    ▼                                ▼
Server Actions (`src/lib/actions/*`)   Route Handlers (`src/app/api/*`)
    │                                │
    ├───────────┐                    ├───────────┐
    ▼           ▼                    ▼           ▼
Prisma ORM   Supabase DB          Groq SDK   Streaming AI
(PostgreSQL) (Pooled Conn)        (Llama-3)   Response
```

- **Server Actions**: All mutations and database queries (`expenses.ts`, `groups.ts`, `settlements.ts`, `balances.ts`) run securely on the server with user-session caller verification.
- **Prisma Client Singleton**: Global Prisma instance configured with connection pooling (`pgbouncer`) and automatic connection reuse.
- **Edge Middleware**: Evaluates authentication before requests reach application route trees.

---

## Repository Structure

```
balancio/
├── frontend/                     # Full-stack Next.js application
│   ├── prisma/
│   │   └── schema.prisma         # PostgreSQL schema and relation models
│   ├── public/                   # Static branding assets and icons
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── (auth)/           # Authentication routes (login, register)
│   │   │   ├── (dashboard)/      # Gated dashboard, groups, expenses, analytics
│   │   │   └── api/ai/chat/      # Groq AI streaming route handler
│   │   ├── components/           # UI components (glass, ui, expenses, groups, ai)
│   │   ├── hooks/                # Custom hooks & TanStack Query hooks
│   │   ├── lib/
│   │   │   ├── actions/          # Server Actions (database operations)
│   │   │   ├── ai/               # Groq client, intent parser, prompt builder
│   │   │   ├── db.ts             # Prisma client instance
│   │   │   ├── formatters/       # Currency and date helpers
│   │   │   └── validations/      # Zod validation schemas
│   │   └── middleware.ts         # Edge authentication middleware
│   └── tests/                    # Jest test suites
├── package.json                  # Root proxy scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or newer
- **npm**: v9 or newer
- **PostgreSQL Database**: Supabase, Neon, or local PostgreSQL instance
- **Clerk Account**: For application authentication
- **Groq API Key**: For Balancio AI

### 1. Clone & Install

Clone the repository and install dependencies:

```bash
git clone https://github.com/rathitanishka-tech/balancio.git
cd balancio
npm run install-all
```

*(Or `npm install` within both the root and `frontend/` directory).*

### 2. Environment Variables

Create a `.env.local` file inside the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env.local
```

Configure the following variables in `frontend/.env.local`:

```env
# Database Configuration (PostgreSQL / Supabase / Neon)
POSTGRES_PRISMA_URL="postgresql://user:password@host:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/postgres?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Groq AI Assistant
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Database Migration & Prisma Client

Generate the Prisma client:

```bash
cd frontend
npx prisma generate
```

To sync your database schema:

```bash
npx prisma db push
```

### 4. Run Development Server

From the repository root:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

The project includes an automated test suite verifying form validations, financial calculations, protected route guards, and AI context assembly.

```bash
cd frontend

# Run all test suites
npm test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage**: **18 test suites**, **136 unit & integration tests** passing.

---

## Production Build

To run typechecking and build the production bundle:

```bash
# Typecheck
cd frontend
npx tsc --noEmit

# Production build
npm run build
```

To test the production build locally:

```bash
npm run start
```

---

## Deployment (Vercel)

1. **Import Project**: Link your GitHub repository in the Vercel dashboard.
2. **Root Directory**: Set the root directory to `frontend`.
3. **Framework Preset**: Next.js.
4. **Environment Variables**: Add all variables from your `frontend/.env.local` to Vercel's Environment Variables settings.
5. **Deploy**: Trigger deployment.

### Note on Clerk Keys in Production
- On free `*.vercel.app` domains, use Clerk **Development/Test keys** (`pk_test_...` and `sk_test_...`).
- For Clerk **Live/Production keys** (`pk_live_...`), you must assign a custom domain (e.g. `balancio.com`) and configure the required CNAME DNS records provided in your Clerk dashboard.

---

## License

This project is licensed under the MIT License.
