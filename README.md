# Salty Cowboy Adventures 🤠🌊

Production-ready charter-booking platform for **Salty Cowboy Adventures Inc.** — fishing
charters, sunset cruises, dolphin & wildlife tours, and private coastal adventures.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma ·
Stripe Checkout + webhooks · Resend · Zod · React Hook Form · date-fns · Vitest**.

---

## Feature overview

**Customer-facing**
- Marketing site: home, trips catalog, trip detail pages with live availability calendars,
  FAQ, contact, and seven policy pages (placeholder legal copy — see disclaimer below).
- Multi-step booking flow: date/time → guest details → add-ons (dynamic pricing) →
  waiver acceptance (versioned + timestamped) → Stripe Checkout (Apple Pay / Google Pay
  supported automatically).
- Deposit **or** full payment (configurable per package: full-only / deposit-only / choice).
- Confirmation page with confirmation number, Google Calendar link, downloadable `.ics`,
  print-friendly view, and contact-captain button.
- Secure self-service booking management via confirmation # + email → emailed magic link
  (hashed, 72-hour expiry). Customers can pay balances, reschedule, cancel, and update
  details. No predictable URLs.

**Admin (`/admin`)**
- Dashboard: today's/upcoming trips, monthly bookings & revenue, outstanding balances,
  weather holds, recent cancellations.
- Booking calendar (month/week/day), full booking detail with status changes,
  reschedule, manual payments, internal notes, reminder emails, and Stripe refunds.
- Trip package & add-on management (create/edit/disable, prices, capacity, deposit rules).
- Availability: weekly departure schedules (global or per-trip), seasonal windows,
  blocked dates and time ranges; min-notice/max-window/turnaround in Settings.
- Customer directory with booking, payment, and waiver history.
- CSV reports: bookings, revenue by month, bookings by trip, cancellation rate,
  outstanding balances, customers, tax totals.

**Engineering**
- Double-booking protection: Postgres advisory lock per date + in-transaction
  revalidation + unique `slotKey` constraint. Unpaid bookings hold a slot only until
  `holdExpiresAt`.
- Bookings are confirmed **only** by the signature-verified, idempotent Stripe webhook
  (`WebhookEvent` table de-duplicates deliveries).
- All money handled as integer cents; pricing recomputed server-side at checkout.
- Emails: confirmation, receipt, payment failed, trip reminders (7d/24h, configurable),
  balance reminder, rescheduled, cancelled, refund issued, weather delay/cancellation,
  magic link — all logged in `EmailLog`. Without `RESEND_API_KEY`, emails log to console.
- Security: bcrypt admin credentials + JWT session cookie (middleware + per-route
  guards), rate limiting, Zod validation on every input, audit log for admin actions,
  no card data stored, safe error responses.
- SEO: metadata + canonical URLs everywhere, LocalBusiness/Product/FAQ JSON-LD,
  sitemap, robots.txt.
- 43 Vitest unit tests over pricing, availability/double-booking, and security logic.

> **Auth note:** the spec suggested Clerk/Supabase; this implements equivalent
> self-hosted admin auth (AdminUser + bcrypt + `jose` JWT cookie) so the app runs with
> zero third-party auth keys. Swap `lib/auth.ts` + `middleware.ts` if you prefer Clerk.

---

## Local development

### 1. Prerequisites
- Node.js 20.9+
- PostgreSQL 14+ (local, or Neon/Supabase/Vercel Postgres)

### 2. Setup

```bash
npm install
cp .env.example .env        # then fill in values (see below)
npm run db:push             # create tables (use db:migrate for migration history)
npm run db:seed             # sample trip packages, add-ons, schedules
npm run create-admin -- --email you@example.com --name "Owner" --password "a-strong-password"
npm run dev                 # http://localhost:3000
```

### 3. Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `http://localhost:3000` |
| `AUTH_SECRET` | 32+ char random secret (`openssl rand -base64 48`) |
| `CRON_SECRET` | Secret protecting `/api/cron/reminders` |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `RESEND_API_KEY` | Optional in dev — emails log to console when unset |
| `EMAIL_FROM` | From address, e.g. `Salty Cowboy <bookings@yourdomain.com>` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_META_PIXEL_ID` | Optional — analytics stay disabled until set |

## Stripe setup

1. Create a Stripe account → Dashboard → **Developers → API keys** (test mode) and copy
   both keys into `.env`.
2. **Local webhooks** (required to confirm bookings in dev):
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
3. **Production webhooks:** Dashboard → Developers → Webhooks → Add endpoint
   `https://yourdomain.com/api/webhooks/stripe` with events:
   `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`, `charge.refunded`. Use that endpoint's signing
   secret in the production env.

### Test payments
Use Stripe test cards on the checkout page:
- `4242 4242 4242 4242` — succeeds (any future expiry, any CVC, any ZIP)
- `4000 0000 0000 9995` — declined (insufficient funds)
- `4000 0025 0000 3155` — requires 3-D Secure authentication

A booking stays **Awaiting payment** until the webhook lands; the success page polls and
flips to the confirmation view automatically.

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Provision Postgres (Vercel Postgres/Neon/Supabase) and set every env var from
   `.env.example` in Vercel → Project → Settings → Environment Variables
   (`NEXT_PUBLIC_SITE_URL` = your production domain).
3. Run migrations against the production DB:
   `DATABASE_URL=… npx prisma migrate deploy` (or `npx prisma db push` for a first deploy),
   then `DATABASE_URL=… npx prisma db seed` and create your admin with
   `DATABASE_URL=… npm run create-admin -- --email … --password …`.
4. Add the production Stripe webhook endpoint (above).
5. `vercel.json` schedules `/api/cron/reminders` daily at 13:00 UTC; Vercel Cron
   automatically sends `Authorization: Bearer $CRON_SECRET`.
6. Deploy. Sign in at `/admin/login`.

## Testing

```bash
npm test            # vitest run
npm run typecheck   # tsc --noEmit
npm run lint
```

## Project structure

```
app/
  (site)/            public pages: home, trips, book/[slug], booking/success,
                     manage (+ magic-link page), faq, contact, policies/[policy]
  admin/             dashboard, calendar, bookings, trips, availability,
                     customers, reports, settings, login
  api/               availability, checkout, booking-status, calendar (.ics),
                     contact, manage lookup/actions, webhooks/stripe,
                     cron/reminders, admin/* (auth, bookings, refunds, packages,
                     addons, availability rules, blocked dates, settings, reports)
components/          brand, layout, shared, trips, booking, manage, admin, analytics
lib/                 pricing & availability engines, auth, tokens, stripe, email,
                     validation (zod), csv/ics helpers, rate limiting, audit
prisma/              schema.prisma, seed.ts
scripts/             create-admin.ts
tests/               vitest unit tests
```

## Placeholders to customize before launch

- Company phone, email, marina address, service area, socials → **Admin → Settings**
  (DB-backed) and `lib/site.ts` (static fallbacks used in the footer/SEO).
- Trip photography: `components/shared/ScenicImage.tsx` renders branded SVG scenes —
  replace with real photos via `next/image`.
- Logo: `components/brand/Logo.tsx` + `public/favicon.svg` are placeholder marks drawn
  to the brand description — swap in the real Salty Cowboy logo files.
- **Legal pages are placeholder content and must be reviewed by a qualified attorney
  before launch** (each page displays this notice).
