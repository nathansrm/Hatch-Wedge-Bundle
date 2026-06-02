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
| 2026-06-02 | `.gitignore` | Added bare `.env` to ignore list (lines ~45–46) | IndieKit's `.gitignore` ignored `.env.*` but missed bare `.env`, which shipped tracked with test keys. Prevents committing real keys to the public fork. | Re-add the `.env` line if upstream resets `.gitignore`. |
| 2026-06-02 | `.env` (untracked) | `git rm --cached .env` — stopped tracking; local file preserved | Same as above. Real keys live here now and must never be committed. | If upstream re-adds `.env` to the tree, re-run `git rm --cached .env`. |
| 2026-06-02 | `.agent/` (deleted) | Removed entire dir — byte-mirror of `.claude/skills/` with no sync (OPEN-ISSUES #6) | `.claude/` is the canonical superset (also has agents/commands/settings). Mirror would drift. | If upstream re-adds `.agent/`, re-delete: `git rm -r .agent`. |
| 2026-06-02 | `.cursor/rules/core-rules.mdc`, `.windsurf/rules/core-rules.md` (deleted) | Removed the "contemplator" persona prompt (10,000-char monologue, OPEN-ISSUES #7) | Pure persona noise; fights Nathan's terse global style; zero engineering value. Other Cursor/Windsurf rules kept. | If upstream re-adds these, re-delete. Do NOT re-delete the other rule files. |

---

## Pending in-place edits (planned, not yet done)

These are known upstream-file edits coming on the roadmap — pre-recorded so we don't forget to log them when they land:

- `docker/prod/Dockerfile` — fix secret-baking (OPEN-ISSUES #1, P0)
- Stripe webhook handler — fail-closed on missing `STRIPE_WEBHOOK_SECRET` (OPEN-ISSUES #5)
- `src/db/index.ts` — driver swap `neon-http` → `neon-serverless`/`pg` (Path C RLS prerequisite)
- `src/lib/auth/` org wrapper — inject `SET LOCAL app.organization_id` (Path C RLS)
- `src/lib/credits/index.ts` (`deductCredits`) — one line to dispatch the meter-event Inngest event (the rest of the meter bridge is new files)

See `03 - RESOURCES/Knowledge Base/IndieKit/OPEN-ISSUES.md` and `DECISION.md` in the vault for full context.
