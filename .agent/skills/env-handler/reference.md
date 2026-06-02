# Environment Variables Reference

## Files & Purpose

| File | Git Status | Purpose | Content Style |
|------|------------|---------|---------------|
| `.env.example` | Committed ✅ | **Template for new developers** | Placeholders; copy to `.env.local` |
| `.env.local` | Ignored 🚫 | **Secrets & local overrides** | Real API keys and overrides |
| `.env` | Often local / ignored | Legacy local defaults | Prefer `.env.example` + `.env.local` |

## Optional service clients (lazy initialization)

Optional integrations must **not** instantiate SDK clients at module load — otherwise `pnpm build` fails when env vars are unset on a fresh clone.

| Service | Getter | Module | Runtime requirement |
|---------|--------|--------|---------------------|
| Stripe | `getStripe()` | `@/lib/stripe` | `STRIPE_SECRET_KEY` |
| Dodo Payments | `getDodoClient()` | `@/lib/dodopayments/client` | `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_API_URL` |
| S3 | `getS3Client()` | `@/lib/s3/client` | `AWS_REGION` |
| Polar | `getPolar()` | `@/lib/polar/client` | `POLAR_ACCESS_TOKEN` |
| Paddle | `getPaddleClient()` | `@/lib/paddle/client` | `PADDLE_API_KEY` (returns `null` if unset) |

Call getters **inside** route handlers, server actions, or functions — never at module top level in new code.

## Best Practices

### 1. Variable Naming
-   **Server Secrets**: `UPPER_CASE` (e.g., `STRIPE_SECRET_KEY`)
-   **Public/Client**: Prefix with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_STRIPE_KEY`)

### 2. Security
-   Never commit real API keys to `.env.example`.
-   If you accidentally commit a key, rotate it immediately.

### 3. CI (GitHub Actions)
-   Push/PR builds run only when `github.repository_owner == 'Indie-Kit'`.
-   Forks skip the build job; use **Actions → CI → Run workflow** manually.
-   Configure `CI_*` secrets/vars in the upstream repo for automatic CI.

### 4. Deployment (Vercel)
-   Add `.env.local` values to **Project Settings → Environment Variables** in production.

## Example

**Local development:**

`.env.example` (committed):
```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`.env.local` (git-ignored):
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
STRIPE_SECRET_KEY="sk_test_..."
```
