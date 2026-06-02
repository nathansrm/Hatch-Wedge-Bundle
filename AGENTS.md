---
profile_version: 1
profile_generated_by: project-profile-skill
profile_generated: 2026-06-02
profile_kind: full
readiness_level: 1

# --- Repo identity ---
project_name: "Hatch Theory Metered Offer (foundation)"
vault_hub: "01 - PROJECTS/Hatch Platform/Queued/Hatch Theory Metered Offer/"
repo_root: "C:/Users/natha/Code/hatch/hatch-wedge-bundle"
default_branch: "b2b"
base_branch: "b2b"
remote: "https://github.com/nathansrm/Hatch-Wedge-Bundle.git"

# --- Stack (auto-detected) ---
stack:
  language: "TypeScript"
  framework: "Next.js (App Router, Turbopack)"
  backend: "Auth.js v5 + Drizzle ORM on Neon (Postgres) · Inngest · Stripe usage-based billing"
  test_runner: "(none yet — Vitest planned, OPEN-ISSUES #2)"
  package_manager: "pnpm"

# --- Commands (every entry verified in package.json) ---
commands:
  install: "pnpm install"
  dev: "pnpm dev"
  build: "pnpm build"
  lint: "pnpm lint"
  docker_build: "pnpm docker:build"
  script: "pnpm script"

# --- Delivery-spine readiness ---
review_ready: false      # Level 1 — local edits + scoped review only, no PRs
ship_ready: false        # Level 2+ (needs test floor first)
deploy_ready: false      # Level 3 only (not deployed anywhere yet)

# --- Approval gates ---
required_approvals:
  - "DB schema / Drizzle migration / RLS / auth-wrapper changes: explicit Nathan approval (multi-tenant isolation is load-bearing)"
  - "Stripe billing / meter / Plan-quota config changes: explicit Nathan approval"
  - "Editing any IndieKit upstream file in place (vs adding a new file): approval + log the change in HATCH-CHANGES.md"
  - "Production deploy: explicit Nathan approval (N/A at Level 1)"

risky_surfaces:
  - "src/db/index.ts  # Neon driver — Path C driver swap lands here; upstream conflict point"
  - "src/lib/auth/  # withAuthRequired / withOrganizationAuthRequired / withSuperAdminAuthRequired — RLS injection point"
  - "Stripe webhook handler  # security-critical (OPEN-ISSUES #5, fail-closed)"
  - "docker/prod/Dockerfile  # secret-baking risk (OPEN-ISSUES #1, P0)"

# --- Boundaries ---
off_limits:
  - ".env  # untracked 2026-06-02; real keys live here, never commit (.env.example is the committable template)"
  - ".env.*  # never commit, never echo"
  - "*.key"
  - "credentials.*"
---

# Hatch Theory Metered Offer — Foundation Repo

IndieKit Full Kit (multi-tenant `b2b` variant) — the SaaS foundation for the **Hatch Theory Metered Offer**: a free-to-install client portal for trades where automation toggles ("wedges") bill only on a clean verified outcome, at per-client custom pricing. This repo is the data + auth + dashboard layer; the outcome-detection engine is separate. **Concept/prep stage — not deployed, no paying clients yet.**

## Goal

Prepare and harden the IndieKit foundation so it can host the metered-billing product: wire Stripe meter-events, add Postgres RLS (Path C) before the first paying client, and close the pre-ship security punch-list — all while keeping the fork cleanly updatable against IndieKit upstream.

## Stack

- Framework: Next.js (App Router, Turbopack)
- Language: TypeScript
- Backend: Auth.js v5 + Drizzle ORM on Neon (Postgres)
- Background jobs: Inngest (local dev on port 8288)
- Billing: Stripe (usage-based metering — bridge not yet wired)
- Email: react-email (dev preview port 3001)
- Package manager: pnpm

## Dev Commands

```bash
pnpm install
pnpm dev            # next dev (turbopack) + inngest-cli + email preview, concurrently
pnpm build          # next build
pnpm lint           # eslint .
pnpm docker:build   # docker build -f docker/prod/Dockerfile
pnpm script         # tsx bootstrap runner (scripts/_bootstrap)
```

No `test` command yet — adding a Vitest floor is OPEN-ISSUES #2 and is what unlocks safe upstream merges + Level 2.

## Control Plane

- Vault hub: `01 - PROJECTS/Hatch Platform/Queued/Hatch Theory Metered Offer/` (notes 00–11)
- Briefs: `01 - PROJECTS/Hatch Platform/Queued/Hatch Theory Metered Offer/_briefs/`
- Decisions / repo dissection: `03 - RESOURCES/Knowledge Base/IndieKit/` — `DECISION.md`, `OPEN-ISSUES.md`, `repo-0X-*.md`
- Project status: `01 - PROJECTS/PROJECT_STATUS.md`
- Execution model: vault brief → `/codex:dispatch` (or CodexApp) → repo work → vault handoff update.
- Keep repo work local to this folder. Vault holds canon, decisions, briefs.

## Key Patterns

- **Additive over invasive — this protects the update path.** Updates are plain `git merge` from the IndieKit upstream remote. Add *new* files (utils, Inngest fns, RLS migrations, feature pages); avoid editing IndieKit's own files. The few in-place edits we must make get logged in `HATCH-CHANGES.md` (re-apply checklist after a conflicted merge).
- **Tenant ID is already on every business table** (`organizationId` FK) — Path C RLS is feasible with zero column backfills.
- **Security is currently app-layer only:** `withAuthRequired` / `withOrganizationAuthRequired` / `withSuperAdminAuthRequired`. Path C adds Postgres RLS as defense layer 2 — swap `drizzle-orm/neon-http` → `neon-serverless`/`pg` for a real session, then `SET LOCAL app.organization_id` in the org wrapper after the membership check. Trigger: before first paying client.
- **Metered billing is NOT wired.** Slot-in point is `deductCredits()` → fire an Inngest event → new Inngest fn calls `stripe.billing.meterEvents.create()`. ~90 LOC across 4 new-ish files. Create the Stripe Billing Meters in the dashboard first.
- **Credits ledger already exists** (`credit_transactions`, idempotency via `paymentId`, slab pricing). Don't rebuild billing — bridge it.
- **Super-admin already has full org/plan/coupon/user CRUD + recharts stats** — the operator console is largely free.
- **Repo AI config is neutralized by this profile.** IndieKit ships `.claude/`, `.agent/`, `.cursor/`, `.windsurf/` configs — including a "minimum 10,000-character monologue" rule (OPEN-ISSUES #7). It does NOT govern here. Nathan's global `~/.claude/CLAUDE.md` (terse, no hedging) + this profile are authoritative. `.agent/` is a stale byte-mirror of `.claude/` — slated for deletion (#6).

## Off-Limits

- `.env` — untracked as of 2026-06-02; real keys go here, never commit. `.env.example` is the committable template.
- `.env.*` — never commit, never echo
- `*.key`, `credentials.*`

## Approval-Required Actions

- DB schema / Drizzle migration / RLS / auth-wrapper changes — explicit Nathan approval (multi-tenant isolation is load-bearing)
- Stripe billing / meter / Plan-quota config changes — explicit Nathan approval
- Editing any IndieKit upstream file in place (vs adding a new file) — approval + log in `HATCH-CHANGES.md`
- Production deploy — explicit Nathan approval (N/A at Level 1)

## Active Focus

Use `01 - PROJECTS/PROJECT_STATUS.md` and the Hatch Theory Metered Offer vault hub for current brief state. Do not duplicate the active queue here. Near-term prep order: hygiene (`.env` ✓, drop `.agent/`, strip monologue rule) → P0/P1 security (Dockerfile secrets, webhook fail-closed) → meter-events bridge → Path C RLS (before first paying client).

## Broader Context

Query vault-rag with path filter `03 - RESOURCES/Knowledge Base/IndieKit/`:
- "IndieKit Path C RLS multi-tenant isolation driver swap"
- "metered billing meter-events bridge deductCredits Inngest Stripe"
- "Hatch Theory Metered Offer wedge per-client pricing architecture"

---

## Global Skill Binding Contract

Global delivery-spine skills (`/investigate`, `/review`, `/ship`,
`/land-and-deploy`, `/cso`, `/canary`) MUST:

1. **Bind to this repo root before acting.** Treat `repo_root` from
   frontmatter as the only valid working directory for write operations.
2. **Inspect local git state** (`git status`, `git branch --show-current`,
   `git log --oneline -5`) before any write.
3. **Respect `.gitignore`, `.agentsignore`, `off_limits`, and
   `risky_surfaces`.** Never bypass.
4. **Honor `readiness_level`.** Refuse actions beyond the declared level.
   Prompt for `/project-profile upgrade` instead of proceeding.
5. **Require explicit approval** for anything in `required_approvals`.
6. **Read PROJECT_STATUS.md** for the current phase before suggesting
   next actions.

At **Level 1**: local edits, investigation, and scoped review are allowed.
No PRs, no deploys. `/ship` and `/land-and-deploy` must refuse and ask for
`/project-profile upgrade 2` (PRs) or `upgrade 3` (deploys).

---

## Coding Standards

These are a baseline. Override at the project level when project doctrine
conflicts.

### Think before coding
State meaningful assumptions before implementing. If multiple interpretations
exist, present them — don't pick silently. On this repo the recurring fork:
*add a new file vs. edit an IndieKit file?* Default to the new file; if you
must edit theirs, say so and log it.

### Smallest working change
Minimum code that solves the problem. The meter-events bridge is ~90 LOC for a
reason — don't rebuild billing, bridge the existing credits ledger. No
abstractions for single-use code.

### Surgical changes
Touch only what you must. Every changed line traces to the request. In-place
edits to IndieKit's files are the costliest kind here (they conflict on
upstream merge) — keep them to the minimum and record them in HATCH-CHANGES.md.

### Verifiable goals
Convert vague tasks to concrete success criteria. With no test runner yet,
"verify" means: `pnpm build` clean, `pnpm lint` clean, and a stated manual
check for the touched surface. Add a Vitest test alongside any wrapper or
billing change you make.

---

## Surface Notes — CodexApp

CodexApp's role on this repo: build, parallelize, operate, execute.

- Read the brief at `01 - PROJECTS/Hatch Platform/Queued/Hatch Theory Metered Offer/_briefs/<latest>.md` before starting.
- Respect `readiness_level: 1`. Local edits only — do NOT open PRs or deploy.
  Refuse and ask for `/project-profile upgrade` if asked to act beyond level.
- **Additive-over-invasive is enforced here.** Prefer new files. Any in-place
  edit to an IndieKit file must be logged in `HATCH-CHANGES.md` with the file
  path and the reason — this is the re-apply checklist after upstream merges.
- Verify before reporting done: `pnpm build` clean + `pnpm lint` clean + a
  stated manual check for the touched surface. (No test runner yet.)
- Handoff packet to `08 - CODEXAPP WORKSPACE/Project Work/Packet Registry/`
  on completion. Activity Log entry at session end (chronological, top of file).
