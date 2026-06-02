---
name: next-search-params-shell
description: App Router pages that read URL query params via useSearchParams — server Suspense shell, layout-matched shimmer (Skeleton), and co-located *-client.tsx (optional *-form.tsx). Use for magic-link flows (?token), credit/payment errors (?code, ?message), OAuth returns, and any interactive page driven by search params without marking page.tsx as use client.
tools: Read, Write, Edit
model: inherit
---

# Next search params shell

## When to use

- **`page.tsx`** would otherwise be `'use client'` **only** to call **`useSearchParams()`**.
- Links or redirects append **query strings** (`token`, `code`, `message`, step flags).

## Instructions

### 1. Split the segment

Keep everything **next to `page.tsx`** in the same route folder:

- **`page.tsx`** — Server Component: wrap the client entry in **`<Suspense fallback={YourShimmer}>`**. No `'use client'`.
- **`{feature}-client.tsx`** — `'use client'`: **`useSearchParams()`**, normalize/validate params, branch **invalid** vs **main UI**.
- **`{feature}-form.tsx`** — optional `'use client'`: large **`react-hook-form`** / mutation logic; props like **`token: string`** when the mutation always requires it.

Naming should match the route (see [.claude/rules/next-app-router-search-params-shell.md](../../rules/next-app-router-search-params-shell.md)).

### 2. Build the shimmer

- Mirror **container, Card, typography blocks, gaps, button sizes** — not a lone spinner unless the layout truly has no stable chrome.
- Use **`@/components/ui/skeleton`**.
- Root: **`aria-busy`** and **`aria-label`**.

### 3. Client param handling

- Read with **`searchParams.get('…')`**; **`trim()`** string tokens/codes before treating as missing.
- **Invalid/missing**: render dedicated UI immediately (no **`useEffect`** only to set error state).

### 4. Do not

- Add fake **`async` `page`**/`searchParams` props if **all** branching is client-side unless you intentionally add SSR for copy or prefetch.
- Duplicate server + client param parsing without a documented reason.

## Reference

Detailed rationale, anti-patterns, file table, and code skeletons: [reference.md](reference.md).

In-repo implementations:

1. `src/app/(auth)/reset-password/confirm/` — **`page.tsx`**, **`reset-password-confirm-client.tsx`**, **`reset-password-confirm-form.tsx`**
2. `src/app/(auth)/sign-up/set-password/` — **`page.tsx`**, **`set-password-client.tsx`**, **`set-password-form.tsx`**
3. `src/app/(in-app)/app/credits/buy/error/` — **`page.tsx`**, **`credits-buy-error-client.tsx`** _(indie-kit)_
4. `src/app/(in-app)/(organization)/app/credits/buy/error|success/` — same client naming under org layout _(b2b-kit)_
5. `src/app/(in-app)/app/subscribe/billing-form/` — **`billing-form`** split _(both kits)_
6. `src/app/(auth)/sign-in` & **`sign-up`** — **`Suspense`** + **`auth-flow-skeletons.tsx`** _(both kits)_

**b2b-kit parity:** mirrors **indie-kit** patterns; Paddle checkout lives under **indie-kit** only unless added to **b2b-kit**.
