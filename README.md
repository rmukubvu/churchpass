# Church Pass

> Church event management and ticketing platform — think Ticketmaster for churches.

Attendees browse events, RSVP to multiple sessions in one tap, receive a branded QR ticket by email, and check in at the door by scanning their phone. Church admins get a full dashboard with guest lists, check-in tracking, and CSV exports.

---

## Features

### For Attendees
- **Browse & discover** — home feed of all upcoming events across every church, with category filters (Conference, Worship, Youth, Outreach, Family) and keyword/city search
- **Multi-event RSVP** — tap to select multiple sessions on a church page and RSVP to all of them in one click
- **QR ticket email** — branded SendGrid confirmation email with an inline QR code per event and a Google Calendar link
- **SMS confirmation** — Twilio SMS with event details and check-in link sent on RSVP
- **My Events** — personal dashboard showing upcoming and past RSVPs across all churches, with a full-screen QR modal per ticket
- **Apple Wallet & Google Wallet** — "Add to Wallet" passes generated from RSVP data
- **Nearby Stays** — Google Places hotel carousel on every event detail page, showing accommodation near the venue sorted by distance

### For Church Admins
- **Admin overview** — stats strip (upcoming events, total RSVPs, check-ins) and event tables with RSVP counts and check-in progress bars
- **Guest list** — full attendee list per event with first-timer badges, email, phone, RSVP date, and manual check-in toggle
- **QR code check-in** — public scan page at `/check-in/[token]` — attendee scans, confirms, and is marked attended
- **CSV export** — one-click export of the full guest list with check-in status
- **Event creation & editing** — rich form with title, description, category, location (auto-geocoded), date/time, capacity, and visibility toggles
- **Role-based access** — admin routes locked via Supabase `user_metadata.adminOf` (per-church) or `role` of `admin` / `superadmin`

---

## Architecture

```
churchpass/
├── apps/
│   └── web/                    # Next.js 16 App Router (main product)
│       ├── app/                # Pages and API routes
│       │   ├── [slug]/         # Church public pages + admin
│       │   ├── check-in/       # QR scan check-in page
│       │   ├── my-events/      # Attendee ticket dashboard
│       │   ├── search/         # Global event search
│       │   └── api/trpc/       # tRPC HTTP handler
│       ├── components/         # React components
│       │   ├── accommodation/  # Hotel card + carousel
│       │   ├── admin/          # Dashboard, forms, check-in button
│       │   ├── browse/         # Home feed, search bar, load more
│       │   ├── events/         # Event cards, hero, RSVP section
│       │   ├── layout/         # Site header
│       │   ├── my-events/      # My Events shell + QR modal
│       │   └── rsvp/           # RSVP button, check-in confirm, My Ticket
│       ├── lib/                # Utilities and integrations
│       │   ├── auth/           # Supabase Auth shim, isChurchAdmin, guards
│       │   ├── supabase/       # Browser + server Supabase clients
│       │   ├── email-templates/ # HTML email builder
│       │   ├── geocode.ts      # Google Geocoding API
│       │   ├── google-places.ts # Nearby hotels search
│       │   ├── qrcode.ts       # QR code generation
│       │   ├── sendgrid.ts     # Email sending with CID inline QR
│       │   ├── sms.ts          # Twilio SMS
│       │   └── wallet.ts       # Apple/Google Wallet pass generation
│       └── server/
│           ├── db/             # Drizzle DB instance
│           └── trpc/           # tRPC router + procedures
│               └── routers/    # events, rsvps, checkins, accommodations, attendees
├── packages/
│   ├── db/                     # Drizzle schema + seed data
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared Tailwind components
│   └── wallet/                 # Wallet pass stubs
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| API | tRPC 11 (raw fetch pattern, no React Query) |
| Database | Supabase PostgreSQL (pooler) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (`@supabase/ssr`, Clerk-compatible `auth()` / `useAuth()` shim) |
| Styling | Tailwind CSS v4 |
| Email | SendGrid (`@sendgrid/mail`) |
| SMS | Twilio |
| QR Codes | `qrcode` (server-side PNG generation) |
| Wallet | `passkit-generator` (Apple), `jsonwebtoken` RS256 (Google) |
| Hotels | Google Places Nearby Search + Geocoding APIs |
| Package manager | pnpm workspaces |
| Build | Turborepo |

---

## Database Schema

```
churches        — id, name, slug, brandColour, timezone, plan
events          — id, churchId, title, description, bannerUrl, location,
                  latitude, longitude, category, startsAt, endsAt,
                  capacity, rsvpRequired, isPublic
attendees       — id, churchId, clerkUserId, email, firstName, lastName, phone
rsvps           — id, eventId, attendeeId, status, isFirstTimer, walletPassToken
checkins        — id, rsvpId, eventId, attendeeId, checkedInAt, method
family_units    — id, churchId, name
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- A [Supabase](https://supabase.com) project (PostgreSQL + Auth)
- A [SendGrid](https://sendgrid.com) account (for emails)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy and fill in `apps/web/.env.local`:

```env
# Database
DATABASE_URL=postgresql://...

# Supabase Auth (same project as DATABASE_URL)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# Server-only (optional; anon key used in middleware if unset)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Twilio (optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...

# Apple Wallet (optional)
APPLE_PASS_TEAM_ID=...
APPLE_PASS_TYPE_ID=pass.com.yourapp.event
APPLE_PASS_CERT_BASE64=...
APPLE_PASS_KEY_BASE64=...
APPLE_PASS_WWDR_BASE64=...

# Google Wallet (optional)
GOOGLE_WALLET_CREDENTIALS={"type":"service_account",...}
GOOGLE_WALLET_ISSUER_ID=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Push database schema

```bash
pnpm --filter @sanctuary/db db:push
```

### 4. Seed demo data

```bash
pnpm --filter @sanctuary/db db:seed
```

This creates 4 churches and 26 events across UK, Canada, and USA.

### 5. Start the dev server

```bash
pnpm --filter web dev
```

Visit `http://localhost:3000`.

---

## Key Pages

| URL | Description |
|---|---|
| `/` | Home feed — all upcoming events with category filters and load-more pagination |
| `/search?q=...&city=...` | Full-text event search |
| `/[slug]` | Church page — events grid with multi-RSVP selection |
| `/[slug]/events/[id]` | Event detail — hero, RSVP card, nearby hotels |
| `/check-in/[token]` | Public QR scan check-in page |
| `/my-events` | Attendee ticket dashboard (auth required) |
| `/[slug]/admin` | Church admin overview (role required) |
| `/[slug]/admin/events/[id]/attendees` | Guest list + check-in (role required) |
| `/[slug]/admin/events/new` | Create event (role required) |
| `/[slug]/admin/events/[id]/edit` | Edit event (role required) |

---

## Admin Access

Authorization uses **Supabase Auth `user_metadata`** (exposed as `publicMetadata` in the auth shim). Set metadata at sign-up, via `supabase.auth.updateUser`, or in the Supabase Dashboard.

```json
// Per-church admin (fast path — also stored as churches.owner_clerk_user_id on register)
{ "firstName": "Jane", "lastName": "Doe", "role": "user", "adminOf": ["koinonia", "revival-uk"] }

// Platform admin
{ "role": "admin" }
// or
{ "role": "superadmin" }
```

| Check | Where |
|-------|--------|
| Platform `/admin/*` | `middleware.ts` (signed in) + `isSystemAdmin()` in layout |
| Church `/{slug}/admin/*` | `isChurchAdmin(slug)` on each page |
| tRPC mutations | `lib/auth/guards.ts` — see [docs/TRPC_AUTH_MATRIX.md](docs/TRPC_AUTH_MATRIX.md) |

For local development, allowlist your Supabase user id:

```env
ADMIN_USER_IDS=uuid-from-supabase-auth-users
```

DB columns still named `clerk_user_id` / `owner_clerk_user_id`; values are Supabase `user.id`.

---

## tRPC Routers

| Router | Procedures |
|---|---|
| `events` | `list`, `get`, `upcomingAll`, `search`, `create`, `update` |
| `rsvps` | `create`, `createBatch`, `list`, `cancel` |
| `checkins` | `manual`, `undoManual` |
| `accommodations` | `nearby` |
| `attendees` | `list` |
| `social` | `getConnections`, `setAutoPost`, `disconnectAccount` |
| `ticketTiers` | `list`, `upsert` |
| `payments` | `listByEvent`, `refund`, `myPayment` |
| `ads` | `mine`, `pendingReview`, `approve`, `reject` |
| `providers` | `register`, `update`, `sendInquiry`, … |

See [docs/RSVP_FLOW.md](docs/RSVP_FLOW.md) for the RSVP → email QR → check-in trace.

All client-side tRPC calls use the raw fetch pattern:

```ts
const res = await fetch("/api/trpc/rsvps.createBatch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ json: { eventIds, churchSlug, churchName } }),
});
```

---

## Graceful Degradation

Every optional integration degrades silently:

| Integration | Behaviour when unconfigured |
|---|---|
| SendGrid | Logs email to console instead of sending |
| Twilio | No-op, no error thrown |
| Apple Wallet | `appleWalletUrl` returns `null`, button hidden |
| Google Wallet | `googleWalletUrl` returns `null`, button hidden |
| Google Places | `NearbyStays` section hidden (returns `null`) |
| Missing event coordinates | Hotel section hidden automatically |

---

## Demo Churches

After seeding, four church pages are available:

| Church | URL | Events |
|---|---|---|
| Koinonia Global | `/koinonia` | Sound of Revival — UK, Canada, USA |
| Revival Church UK | `/revival-uk` | 7 events across London, Manchester, Glasgow, Bristol |
| Gateway Church Toronto | `/gateway-toronto` | 7 events across Toronto, Vancouver, Calgary, Ottawa, Montreal |
| Elevation Church USA | `/elevation-usa` | 8 events across New York, Charlotte, Atlanta, Houston, LA, Chicago, Dallas, DC |
