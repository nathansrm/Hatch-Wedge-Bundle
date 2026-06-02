# HATCH-CHANGES — In-Place Edits to IndieKit Upstream Files

> **Purpose:** the re-apply checklist after a conflicted `git merge` from IndieKit upstream.
> Updates to this fork are plain git merges. New files we add are safe; *edits to IndieKit's
> own files* are the only things that conflict. Every such edit goes here with file + reason
> so it can be re-applied if an upstream merge clobbers it.
>
> **Rule:** prefer adding a new file over editing theirs. If you must edit theirs, log it here.
> New files we add (utils, Inngest functions, RLS migrations, feature pages) do NOT belong here.

---

## Edits

| Date | File | What changed | Why | Re-apply note |
|---|---|---|---|---|
| 2026-06-02 | `eslint.config.mjs`; `docker/dev/Dockerfile`; subscribe/settings/billing UI files; shared UI components; `src/lib/credits/useBuyCredits.ts`; `src/app/api/webhooks/stripe/route.ts` | Repaired the repo-wide lint baseline and hardened the dev Docker image to run as the built-in `node` user | Enables full `pnpm lint` as a real gate before BRIEF-001 lands; clears Semgrep's root-container finding in the dev Dockerfile. | Re-run `pnpm lint`, `pnpm build`, `pnpm audit --audit-level high`, source-only security sweep, and `git diff --check` after any upstream merge; reapply the React Compiler-safe refactors and `.source/**` ESLint ignore if upstream resets them. |
| 2026-06-02 | `src/lib/credits/recalculate.ts` | After a successful debit, dispatches a typed Inngest meter-report event; dispatch errors are caught so credit deduction still succeeds | Single credit-consumption seam for Stripe Billing Meter reporting. | Re-add the `randomUUID`, `inngest`, and `meterEventReport` imports, then dispatch after the debit `addCreditTransaction(...)` result and return that result. |
| 2026-06-02 | `src/lib/inngest/functions/index.ts` | Registered `reportMeterEventFn` in the sanctioned Inngest functions registry | Enables the additive meter-event Inngest function without changing the client or shared event setup. | Re-add the import and append `reportMeterEventFn` to `functions`. |
| 2026-06-02 | `.gitignore` | Added bare `.env` to ignore list (lines ~45–46) | IndieKit's `.gitignore` ignored `.env.*` but missed bare `.env`, which shipped tracked with test keys. Prevents committing real keys to the public fork. | Re-add the `.env` line if upstream resets `.gitignore`. |
| 2026-06-02 | `.env` (untracked) | `git rm --cached .env` — stopped tracking; local file preserved | Same as above. Real keys live here now and must never be committed. | If upstream re-adds `.env` to the tree, re-run `git rm --cached .env`. |
| 2026-06-02 | `.agent/` (deleted) | Removed entire dir — byte-mirror of `.claude/skills/` with no sync (OPEN-ISSUES #6) | `.claude/` is the canonical superset (also has agents/commands/settings). Mirror would drift. | If upstream re-adds `.agent/`, re-delete: `git rm -r .agent`. |
| 2026-06-02 | `.cursor/rules/core-rules.mdc`, `.windsurf/rules/core-rules.md` (deleted) | Removed the "contemplator" persona prompt (10,000-char monologue, OPEN-ISSUES #7) | Pure persona noise; fights Nathan's terse global style; zero engineering value. Other Cursor/Windsurf rules kept. | If upstream re-adds these, re-delete. Do NOT re-delete the other rule files. |
| 2026-06-02 | `src/app/api/webhooks/stripe/route.ts` | Removed fail-OPEN `else` branch; fail CLOSED — return 500 if `STRIPE_WEBHOOK_SECRET` missing, 400 on bad signature (was 200) (OPEN-ISSUES #5) | Old code processed unverified request bodies when the secret was unset → forged events could grant credits/plans. Validator PASS, High confidence. | If upstream restores the unverified-body `else` branch, re-apply the fail-closed guard. |

---

## Pending in-place edits (planned, not yet done)

These are known upstream-file edits coming on the roadmap — pre-recorded so we don't forget to log them when they land:

- `docker/prod/Dockerfile` — secret-baking fix (OPEN-ISSUES #1) — **DEFERRED to deploy-prep**: multi-stage build means the runtime image doesn't carry `.env`; the proper fix (BuildKit `--mount=type=secret`) changes the build invocation and belongs with deploy-target setup (Level 3). Not a pre-deploy blocker.
- ~~Stripe webhook handler — fail-closed~~ ✅ DONE 2026-06-02 (see Edits table above)
- `src/db/index.ts` — driver swap `neon-http` → `neon-serverless`/`pg` (Path C RLS prerequisite)
- `src/lib/auth/` org wrapper — inject `SET LOCAL app.organization_id` (Path C RLS)
- ~~`src/lib/credits/recalculate.ts` (`deductCredits`) - dispatch the meter-event Inngest event~~ DONE 2026-06-02 (see Edits table above)

See `03 - RESOURCES/Knowledge Base/IndieKit/OPEN-ISSUES.md` and `DECISION.md` in the vault for full context.
