# MindPartner — AI Business Co-Pilot

An AI-powered business co-pilot for developers to analyze, pitch, and sell software projects. Import GitHub repos, run AI analysis, generate whitepapers, discover buyers, compose outreach emails, and chat with an AI advisor.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `OPENAI_API_KEY` — for AI features (analyze, chat, whitepaper, outreach generation)
- Optional env: `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` — for actually sending outreach emails

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + Tailwind + shadcn/ui (dark theme, purple primary)
- API: Express 5 at `/api`
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-4o-mini (analyze, whitepaper, suggestions, outreach, chat)
- Email: SendGrid (optional, for actually sending pitch emails)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema: projects, contacts, outreach_emails, chat_messages
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/ai.ts` — OpenAI helper functions
- `artifacts/api-server/src/lib/sendgrid.ts` — SendGrid email helper
- `artifacts/mind-partner/src/` — React frontend
- `artifacts/mind-partner/src/pages/` — Dashboard, projects, contacts, outreach, chat

## Architecture decisions

- AI library lazily initializes OpenAI client (validates OPENAI_API_KEY only on first use, not at import time)
- Chat uses `projectId=0` as the global chat context (not tied to any project)
- GitHub import fetches public repos via the GitHub API (no auth required, rate limited to 60 req/hr unauthenticated)
- The entire app runs dark-only mode (`document.documentElement.classList.add("dark")` in Shell.tsx)
- OpenAPI spec uses entity-shaped body schema names (e.g. `ProjectInput`, not `CreateProjectBody`) to avoid Orval TS2308 collisions

## Product

- **Projects** — Import from GitHub or create manually; AI-analyze to get summary, value prop, target audience & estimated value; generate whitepapers; get AI improvement suggestions
- **Contacts** — Build a network of buyers/investors/collaborators; AI-discover potential contacts per project
- **Outreach** — Compose or AI-generate pitch emails; send via SendGrid; track draft/sent status
- **Global Chat** — Persistent AI co-pilot chat (project-scoped or global)
- **Dashboard** — Command center with pipeline stats and recent activity

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any spec change: run `pnpm --filter @workspace/api-spec run codegen` before using updated types
- AI routes will return 500 if OPENAI_API_KEY is not set — the error is clear in logs
- SendGrid email sending requires SENDGRID_API_KEY + SENDGRID_FROM_EMAIL secrets
- GitHub API is rate-limited (60 req/hr unauthenticated) — importing large orgs may hit limits

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
