# PPV + Paystack Access Control Plan

## Goals

- All PPV-enabled titles (movies + series) should show **“Buy now – ₦price”** instead of **“Play”** until purchased.
- After purchase, the same title shows **“Play”** and behaves like normal content.
- Direct access to a PPV title or player by URL without purchase:
  - Redirects back to home (or series/movies listing) with a clear warning.
  - Logs a **PPV violation**; after 3 violations the account is **barred**.
- Admin can see PPV status, purchases, and flagged/banned accounts.
- Implementation uses **Paystack** for African customers (NGN billing) and **Flutterwave** for customers outside Africa (USD billing, price derived from NGN).

---

## Data Model & Backend Changes

### 1. Title metadata (PPV flags)

Extend `Title` model (movies + series) to support PPV:

- `isPpv: boolean` – true if title requires purchase.
- `ppvPriceNaira: number | null` – integer in Naira (e.g. 1500).
- `ppvCurrency: string` – default `"NGN"`.
- Optional: `ppvDescription: string | null` – copy to show on Buy UI.

Expose these fields in:

- `/titles` listing (used by home/series pages).
- `/titles/:id` detail endpoint (used by title detail page).

### 2. PPV purchase records

New table `PpvPurchase`:

- `id` (primary key).
- `userId` (FK → User).
- `titleId` (FK → Title).
- `amountNaira` (integer).
- `currency` (string, `"NGN"`).
- `paystackRef` (string, unique) – Paystack `reference` we generate.
- `paystackTrxId` (string | null) – Paystack transaction id when confirmed.
- `status` (`PENDING` | `SUCCESS` | `FAILED` | `CANCELLED`).
- `rawPayload` (JSON) – last Paystack response/webhook for debugging.
- `createdAt`, `updatedAt`.
- `accessExpiresAt` (Date) – when viewing rights for this title expire.

Behavior:

- A user may have multiple purchases for the same title; only the latest **SUCCESS** with `accessExpiresAt > now` matters.
- DB-level unique constraint (userId, titleId, status='SUCCESS') is optional but helpful.

### 3. PPV violation tracking & account barring

Add fields to `User`:

- `ppvStrikeCount: number` – total recorded violations.
- `ppvLastStrikeAt: Date | null`.
- `ppvBanned: boolean` – when true, user cannot stream PPV content (and optionally any content).

New table `PpvViolation`:

- `id`, `userId`, `titleId`, `path`, `ipAddress`, `userAgent`, `createdAt`.

Logic:

- On unauthorized PPV access (see “Access guard” section):
  - Insert `PpvViolation` row.
  - Increment `user.ppvStrikeCount` and update `ppvLastStrikeAt`.
  - If `ppvStrikeCount >= 3`, set `ppvBanned = true`.

### 4. Paystack integration endpoints

#### Environment variables (backend)

Set in `.env`:

```env
# Paystack (TEST KEYS)
PAYSTACK_SECRET_KEY="sk_test_0ef926682cbfe50035ea57619c830199339e275e"
PAYSTACK_PUBLIC_KEY="pk_test_01afc03329c5659c8d76a99a2017c0bc04986c2f"
PAYSTACK_CALLBACK_URL="https://wanzami.vercel.app/payment/callback"
PAYSTACK_WEBHOOK_SECRET="test-paystack-webhook-secret"   # choose any long random string

# Flutterwave (TEST KEYS)
FLW_PUBLIC_KEY="5a4c60e4-fbd4-4c8c-9316-71c2af0fd3de"
FLW_SECRET_KEY="YITpht9fUoRDLHkoN4gkh14EvbmdfGUz"
FLW_ENCRYPTION_KEY="+PQDDFGeQVYe1oZnmHKcrftQivrN6aH6BtptgptR/0g="
FLW_BASE_URL="https://api.flutterwave.com"
FLW_WEBHOOK_SECRET="test-flutterwave-webhook-secret"     # choose any long random string
```

> These are **test keys** from the dashboards; they can be safely committed for non‑production use. For production, use separate live keys and keep them in environment variables or a secrets manager only. The mappings are:
>
> - Paystack:
>   - Test Secret Key (`sk_test_0ef926682cbfe50035ea57619c830199339e275e`) → `PAYSTACK_SECRET_KEY`
>   - Test Public Key (`pk_test_01afc03329c5659c8d76a99a2017c0bc04986c2f`) → `PAYSTACK_PUBLIC_KEY`
> - Flutterwave:
>   - Client ID → `FLW_PUBLIC_KEY` (`5a4c60e4-fbd4-4c8c-9316-71c2af0fd3de`)
>   - Client Secret → `FLW_SECRET_KEY` (`YITpht9fUoRDLHkoN4gkh14EvbmdfGUz`)
>   - Encryption Key → `FLW_ENCRYPTION_KEY` (`+PQDDFGeQVYe1oZnmHKcrftQivrN6aH6BtptgptR/0g=`)

#### Endpoint: initiate purchase

`POST /api/ppv/paystack/initiate`

Input:

- `titleId`.

Server logic:

1. Authenticate user (must have `userId` + active profile).
2. Fetch title:
   - If not PPV (`isPpv` false) → 400.
3. Check `PpvPurchase` for existing `SUCCESS` for this user+title → if found, return 409 with message “Already purchased”.
4. Create **Paystack transaction** via their API:
   - `amount = ppvPriceNaira * 100` (kobo).
   - `currency = "NGN"`.
   - `email = user.email`.
   - `reference = "PPV-" + titleId + "-" + randomString` (store this as `paystackRef`).
   - `callback_url = PAYSTACK_CALLBACK_URL`.
5. Save `PpvPurchase` row with `PENDING` status and `paystackRef`.
6. Return `{ authorizationUrl, reference }` to the frontend.

#### Endpoint: Paystack webhook

`POST /api/ppv/paystack/webhook`

Behavior:

1. Validate Paystack signature using `PAYSTACK_WEBHOOK_SECRET` or IP whitelist.
2. Parse event:
   - For `charge.success`:
     - Look up `PpvPurchase` by `data.reference`.
     - Verify `amount` matches expected (`ppvPriceNaira * 100`).
     - Set `status = SUCCESS`, `paystackTrxId = data.id`, store `rawPayload`.
     - Compute `accessExpiresAt = now + 30 days` (configurable via env, e.g. `PPV_ACCESS_DAYS=30`).
   - For failure or cancellation events: mark `status = FAILED` or `CANCELLED`.
3. (Optional) Notify user via email or in-app message.

> Note: Callback URL (`PAYSTACK_CALLBACK_URL`) can simply redirect the user back to `/title/:id` and let the app re-check entitlement; the webhook is the authoritative source of truth.

### 5. Access guard for PPV playback

Add a reusable guard used by both `/title/:id` data and `/player/:id` load:

- New endpoint `GET /api/ppv/access/:titleId` returning:
  - `isPpv: boolean`.
  - `hasAccess: boolean` (true if not PPV or user has SUCCESS purchase).
  - `priceNaira`, `currency`.
  - `userPpvBanned: boolean`.
  - `ppvStrikeCount`.

Guard logic (used server-side or via this endpoint):

1. If user `ppvBanned` → deny and return reason.
2. If title is not PPV → `hasAccess = true`.
3. If title is PPV:
   - Check latest `PpvPurchase` with `status = SUCCESS`:
     - If found and `accessExpiresAt > now` → `hasAccess = true`.
     - If found but `accessExpiresAt <= now` → treat as **expired** (show upsell; do not increment strikes).
   - If no active purchase, `hasAccess = false`:
      - Record `PpvViolation` and increment strikes.
      - If strikes >= 3, set `ppvBanned = true`.

### 6. Location detection & gateway selection

We already infer a `country` for catalog and recommendations using `resolveCountry(req)` (IP headers and fallbacks). For PPV payments we will:

- Use **this same country resolution** (plus an override when the user explicitly selects a billing country).
- Maintain a list of **African ISO country codes** (e.g. `["NG", "GH", "ZA", ...]`).
- For **African countries**:
  - Use **Paystack** as the primary provider.
  - Charge in **NGN** using `ppvPriceNaira`.
- For **non‑African countries**:
  - Use **Flutterwave** as the primary provider.
  - Charge in **USD**, deriving price from NGN with a fixed rate:
    - Base: **₦3,000 = $5.00** → conversion factor `USD = NGN * (5 / 3000)`.
    - For a given `ppvPriceNaira`, compute:
      - `usdAmount = roundToCents(ppvPriceNaira * 5 / 3000)`.
    - Example: ₦1,500 → $2.50, ₦6,000 → $10.00.

Gateway choice will be encapsulated in a single initiation endpoint:

- `POST /api/ppv/initiate`:
  - Reads `country` from request context.
  - Chooses Paystack or Flutterwave accordingly.
  - Creates a `PpvPurchase` row with `gateway: "PAYSTACK" | "FLUTTERWAVE"` and returns the correct `authorizationUrl`.

The API does **not** itself redirect; it only returns flags. The frontend decides how to navigate (see below).

---

## Frontend Changes (Wanzami app)

### 1. Expose PPV metadata in title detail

Update title client fetch (`fetchTitleWithEpisodes` or equivalent) to include:

- `isPpv`, `ppvPriceNaira`, `ppvCurrency`.
- An extra call to `GET /api/ppv/access/:titleId` to determine `hasAccess` and `userPpvBanned` for the logged-in user.

Pass this into `MovieDetailPage` as `movie.isPpv`, `movie.ppvPrice`, `movie.ppvHasAccess`, `movie.userPpvBanned`.

### 2. Change primary CTA on detail page

In `MovieDetailPage`:

- If `movie.isPpv` is true and `movie.ppvHasAccess` is false:
  - Show **“Buy now – ₦1,500”** button instead of Play.
  - On click:
    - Call `POST /api/ppv/paystack/initiate` with `titleId`.
    - Redirect browser to the returned `authorizationUrl`.
- If `movie.isPpv` true and `ppvHasAccess` true:
  - Show **Play** button (normal behavior).
- If `userPpvBanned` true:
  - Hide Play/Buy button, show message “Your account has been restricted from PPV access. Please contact support.”

### 3. Restrict direct playback routes

For routes like `/player/[id]` and `/title/[id]`:

- On load (client or server), call `GET /api/ppv/access/:titleId`.
- If `isPpv` true and `hasAccess` false:
  - Show **no player**.
  - Redirect to `/` with a query flag (e.g. `?ppvDenied=1&title=125`).
  - On the home page, read this flag and show a toast: “You haven’t purchased this title yet. Buy it first to watch.”

> This call also records the PPV violation and increments strike count in the backend.

### 4. Series behavior

For PPV series:

- Treat the **series title** as the PPV product (one purchase unlocks all episodes).
- The same `ppvHasAccess` flag controls whether user can play any episode.
- Episode list still renders, but Play buttons and player checks use `ppvHasAccess`.

### 5. My Movies library

Add a dedicated **My Movies** page and nav entry:

- Replace the existing `Blog` item in the main nav with **My Movies**.
- Route: `/mymovies` (or `/my-movies`).
- Backend endpoint: `GET /api/ppv/my-titles` (auth required), returning:
  - `activePurchases`: list of titles where latest `PpvPurchase.status = SUCCESS` and `accessExpiresAt > now`.
    - Include: title metadata, `accessExpiresAt`, `ppvPriceNaira`.
  - `expiredPurchases`: optional list of titles with `accessExpiresAt <= now` (to allow re‑purchase upsell).
  - Suggested items: optional `recommended` array using `Because you watched` data seeded by purchased titles.

My Movies page layout:

- Section 1: **Active purchases**
  - Grid of cards (similar to Home), each showing:
    - Poster, title, “Play” button, and “Expires in X days” label.
  - Clicking a card goes to `/title/:id` as normal (where PPV guard still applies).
- Section 2: **Previously purchased (expired)** (optional)
  - Separate row with cards showing “Expired – Buy again” CTA.
- Section 3: **Movies you may like**
  - Row backed by `Because you watched`; clicking behaves like normal catalog titles (PPV or non‑PPV depending on metadata).

---

## Admin & Moderation

### 1. Admin titles UI

In Admin `MoviesManagement` / `SeriesManagement`:

- Add PPV configuration fields:
  - Toggle: `PPV enabled?`.
  - Input: `PPV price (NGN)`.
- Display a badge on cards for PPV titles (e.g. “PPV ₦1,500”).

### 2. Admin users / moderation

Expose PPV-specific information:

- In `UserManagement` or `Moderation`:
  - Show `ppvStrikeCount` and `ppvBanned` flags.
  - List recent `PpvViolation` entries for that user (title name, time, URL).
  - Ability to:
    - Manually **reset strikes**.
    - **Unban** account.

### 3. Logs

Add PPV-specific log events:

- `PPV_PURCHASE_INITIATED`, `PPV_PURCHASE_SUCCESS`, `PPV_PURCHASE_FAILED`.
- `PPV_VIOLATION` with userId, titleId, path, IP.

---

## Paystack Configuration Notes

- **Keys:**
  - `PAYSTACK_SECRET_KEY` → backend only.
  - `PAYSTACK_PUBLIC_KEY` → frontend (if you need inline JS checkout), but for server-initiated checkout it can remain only in frontend config.

- **Callback URL:**
  - Set in Paystack dashboard as:
    - `https://wanzami.vercel.app/payment/callback`
  - This route can just redirect user back to `title/:id` and show a “Payment processing” message while the webhook finalizes.

- **Webhook URL:**
  - `https://wanzami.duckdns.org/api/ppv/paystack/webhook`
  - Configure in Paystack dashboard and ensure backend route validates signature.

- **IP Whitelist:**
  - Optionally restrict `/api/ppv/paystack/webhook` to Paystack IP ranges in security group or using IP checks.

---

## Flutterwave Configuration Notes

- **Keys (from Flutterwave dashboard):**
  - `FLW_PUBLIC_KEY`  – maps to “Client ID / Public key”.
  - `FLW_SECRET_KEY`  – maps to “Client Secret”.
  - `FLW_ENCRYPTION_KEY` – maps to “Encryption Key”.
  - `FLW_WEBHOOK_SECRET` – random secret used to verify webhooks (we manage this).

- **Base URL:**
  - Test and live use the same `https://api.flutterwave.com` with different keys.

- **Checkout initiation (server side):**
  - Endpoint: `POST https://api.flutterwave.com/v3/payments`.
  - Payload:
    - `amount` – derived USD amount.
    - `currency` – `"USD"`.
    - `tx_ref` – our `paystackRef` equivalent, e.g. `"PPV-FLW-{titleId}-{random}"`.
    - `redirect_url` – same as `PAYSTACK_CALLBACK_URL` (`/payment/callback` on web app).
    - `customer` – `{ email, name }`.
    - `meta` – `{ titleId, userId }` for later lookup.
  - Store `tx_ref` as `paystackRef`/`gatewayRef` in `PpvPurchase`.

- **Webhook URL:**
  - Configure in Flutterwave dashboard:
    - `https://wanzami.duckdns.org/api/ppv/flutterwave/webhook`
  - Validate using `FLW_WEBHOOK_SECRET` or Flutterwave’s `verif-hash` header.
  - On successful event:
    - Mark `PpvPurchase` as `SUCCESS`, set `accessExpiresAt`, and persist payload.

- **IP / region restrictions:**
  - Optionally restrict the Flutterwave webhook endpoint to Flutterwave IPs or use signature verification only.

---

## Implementation Order

1. **Backend schema changes:**
   - Add PPV fields to `Title` and migrations.
   - Add `PpvPurchase`, `PpvViolation`, and user PPV fields.
2. **Paystack integration:**
   - Add env vars, implement `/ppv/paystack/initiate` and `/ppv/paystack/webhook`.
3. **Access guard:**
   - Implement `GET /ppv/access/:titleId`, violation tracking, and banning logic.
4. **Frontend entitlement:**
   - Wire PPV fields into title detail and series pages.
   - Implement Buy Now button, redirect, and post-purchase refresh.
   - Add guard to `/player/[id]` and `/title/[id]` to enforce redirects/warnings.
5. **Admin UI:**
   - PPV toggle + price fields on titles.
   - Moderation view for strikes and bans.
6. **Testing:**
   - Use Paystack **test keys** and test cards.
   - Cases:
     - Purchase success.
     - Purchase failure/cancel.
     - Unauthorized PPV access 1–3 times (banning behavior).
     - Existing purchases after deployment (migration/compat behavior).
7. **Go live:**
   - Switch to Paystack live keys in production env vars.
   - Verify callback and webhook endpoints in live Paystack dashboard.
