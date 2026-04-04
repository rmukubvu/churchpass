# Sanctuary — Church Events Portal & NFC Check-in App
## Design Document

---

## Context

**Problem:** Churches lack a consumer-grade event experience for attendees, especially first-time visitors. Existing tools (Planning Center, Breeze, ChurchTrac) are admin-facing staff tools — not attendee-facing products. The guest experience is an afterthought.

**Goal:** Build `sanctuary` — a two-sided platform that gives churches an Eventbrite-quality public event portal and NFC-powered check-in, with a data layer that enables real follow-up with first-time visitors.

**Outcome:** A first-time visitor should RSVP to a church event in under 30 seconds, arrive feeling welcomed, and the church should have the data to follow up — all without Planning Center.

---

## Product Layers (Phased)

### Phase 1 — Public RSVP Portal (Launch)
### Phase 2 — NFC Check-in
### Phase 3 — Data & Analytics Dashboard
### Phase 4 — Network Effects (multi-church)

---

## Target Users

| User | Description |
|------|-------------|
| **First-timer** | New visitor — signs in via OAuth (Google/Apple/Facebook/Instagram) to RSVP |
| **Member** | Regular attendee, linked OAuth account + optional NFC credential |
| **Event Coordinator** | Church volunteer/staff who creates and manages events |
| **Pastor / Welcome Team** | Receives first-timer alerts, reviews attendance trends |
| **Church Admin** | Manages church profile, members, billing, integrations |

**Authentication:** No anonymous RSVP. All attendees sign in via OAuth through **Clerk** (Google, Apple, Facebook, Instagram). This gives every attendee a persistent identity across events and churches — critical for first-timer detection, return-visit tracking, and the network effects play.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  Web Portal (Next.js)  │  Admin Dashboard  │  NFC Kiosk App │
│  (public event pages)  │  (React + Expo)   │  (React Native) │
└────────────┬───────────┴────────┬──────────┴───────┬─────────┘
             │                   │                  │
             ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (REST + WebSocket)          │
│                     Next.js API Routes / tRPC               │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌───────────┐    ┌──────────────┐   ┌──────────────┐
  │  Postgres │    │  Redis Cache │   │  File Storage│
  │(Supabase/ │    │  (sessions,  │   │  (R2/S3)     │
  │   Neon)   │    │  NFC tokens) │   │  (images)    │
  └───────────┘    └──────────────┘   └──────────────┘
        │
  ┌─────┴─────────────────────────┐
  │        Background Workers     │
  │  - SMS (Twilio)               │
  │  - Email (Resend)             │
  │  - Wallet Pass generation     │
  │  - First-timer detection      │
  └───────────────────────────────┘
```

---

## Tech Stack

### Why TypeScript, not Java?

Java (Spring Boot) is a valid choice for large enterprise backends — strong typing, mature ecosystem, excellent concurrency. But for this product at this stage:

- **Full-stack type safety in a monorepo** — TypeScript across web, mobile, and API means types are shared directly. Java would require a type boundary layer (OpenAPI codegen or manual DTOs) that adds ongoing maintenance overhead.
- **Deployment simplicity** — Next.js API routes + Vercel/Railway deploy in minutes. Spring Boot needs containerization and a separate CI pipeline before you've shipped anything.
- **Stateless and scalable** — Redis for session/NFC token lookup, Postgres for all persistent data. Individual services can be extracted and rewritten (Go, Java, whatever) behind the API gateway when the load profile demands it.
- **When to revisit Java:** If the backend team is primarily Java engineers, or if denominational-scale multi-tenancy (10,000+ churches) requires JVM concurrency guarantees — re-evaluate then.

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Monorepo | Turborepo | Shared types/utils across web, mobile, API |
| Web Portal | Next.js 15 (App Router) | SSR for public event page SEO |
| Admin Dashboard | Next.js (same app, `/admin`) | Reuse components |
| NFC Kiosk App | React Native + Expo | iOS/Android kiosk mode, HCE support |
| API | tRPC + Next.js API Routes | End-to-end type safety, no codegen |
| Auth | **Clerk** | OAuth (Google, Apple, Facebook, Instagram) + session mgmt |
| Database | Postgres (Supabase or Neon) | Row-level security, Realtime subscriptions |
| Cache / NFC tokens | Redis (Upstash) | Sub-ms token lookup at the door |
| SMS | Twilio | Reminders + first-timer welcome texts |
| Email | Resend | Transactional email |
| Wallet Passes | `passkit-generator` (npm) | Apple Wallet + Google Wallet |
| Payments | Stripe | Paid events + church SaaS billing |
| File Storage | Cloudflare R2 | Event banners, church assets |
| Background Jobs | Inngest or pg-boss | SMS scheduling, pass generation |

**Scalability path:**
- API tier is stateless → horizontal scale via Vercel/Railway
- NFC checkin endpoint extractable to a standalone edge function if door-tap latency becomes critical
- Postgres read replicas (Supabase/Neon) when analytics queries grow
- All async work runs in background queues — no sync bottlenecks on the RSVP path

---

## Data Models

### `churches`
```
id, name, slug, logo_url, timezone, address, created_at
plan: free | starter | growth | network
```

### `members`
```
id, church_id
clerk_user_id  (FK → Clerk, globally unique per person)
email, phone, first_name, last_name  (synced from Clerk profile)
nfc_token      (nullable — set when physical card enrolled)
wallet_pass_id (nullable)
joined_at, is_active
```
> Clerk owns authentication. `clerk_user_id` is the stable cross-church identity. Same person visiting two churches = same `clerk_user_id`, two `member` rows (one per church).

### `events`
```
id, church_id, title, description, banner_url
starts_at, ends_at, location, capacity
rsvp_required: bool
is_public: bool
created_by (member_id)
```

### `rsvps`
```
id, event_id, member_id
wallet_pass_token  (unique per RSVP — used for NFC/QR at door)
status: pending | confirmed | cancelled | attended
is_first_timer: bool
created_at
```

### `checkins`
```
id, event_id, rsvp_id
member_id
method: nfc_card | nfc_wallet | nfc_hce | qr | manual
checked_in_at
reader_id
```

### `family_units`
```
id, church_id, name
members: member_id[]  (head + dependents)
```

---

## Core Flows

### Flow 1: RSVP (Phase 1)

```
1. Attendee lands on /[church-slug]/events/[event-id]
   → Public event page visible to anyone (no auth to view)

2. Taps "RSVP"
   → Clerk auth modal: sign in with Google / Apple / Facebook / Instagram
   → New Clerk user → member record auto-created
     → is_first_timer = true (church_id + clerk_user_id pair is new)
   → Returning user → member record found, is_first_timer = false

3. Post-auth (one tap, no form):
   → RSVP record created (status: confirmed)
   → Wallet pass generated with embedded NFC/QR token
   → "Add to Apple Wallet / Google Wallet" shown
   → Calendar invite (.ics) sent to email
   → SMS reminders scheduled (24h + 1h before event)

4. Day of event:
   → Attendee taps wallet pass (NFC) or scans QR at entrance
   → Redis lookup: token → rsvp_id → member_id
   → Checkin record written
   → If is_first_timer: trigger welcome automation (text to welcome team)
```

### Flow 2: Member NFC Check-in (Phase 2)

**Smartphone — primary path (no hardware cost to member):**
```
1. Member gets membership Wallet pass (Apple or Google) on joining
   OR installs Sanctuary Android app (HCE mode)
2. Member taps phone at entrance reader
3. NFC payload → member token
4. POST /api/checkin { token, event_id, reader_id }
5. Redis lookup: token → member_id
6. Checkin written; if family_unit exists → whole family enrolled
7. Visual + audio confirmation on kiosk screen
```

**Physical NFC card — optional path (accessibility):**
```
1. Admin enrolls member → writes token to NTAG213 card/fob via kiosk app
2. Member taps card at entrance → same checkin flow from step 3 above
3. Card tokens and phone tokens share the same API endpoint
```

### Flow 3: First-Timer Follow-up (Phase 3)

```
1. Checkin event fires → check is_first_timer
2. Welcome team dashboard: "3 new visitors today"
   → Name, profile photo (from Clerk), which service
3. One-click actions:
   → Send welcome text (pre-filled template)
   → Assign to connect team
   → Mark as connected
4. 7-day return queue: did they check in again the following Sunday?
```

---

## Monorepo Structure

```
sanctuary/
├── apps/
│   ├── web/                    # Next.js — public portal + admin dashboard
│   │   ├── app/
│   │   │   ├── [slug]/         # Public church pages
│   │   │   │   └── events/[id] # Public event page
│   │   │   ├── admin/          # Church admin dashboard
│   │   │   └── api/            # tRPC + REST endpoints
│   │   └── components/
│   └── kiosk/                  # React Native Expo — NFC reader kiosk
│       ├── app/
│       └── services/nfc.ts
├── packages/
│   ├── db/                     # Drizzle ORM schema + migrations (Postgres)
│   ├── types/                  # Shared TypeScript types
│   ├── wallet/                 # Wallet pass generation (Apple + Google)
│   └── ui/                     # Shared UI components (shadcn base)
├── turbo.json
└── package.json
```

---

## API Endpoints (tRPC Routers)

```
events.list({ churchId, upcoming })
events.get({ eventId })
events.create({ ... })                         # admin only
events.update({ ... })                         # admin only

rsvps.create({ eventId })                      # authenticated user
rsvps.cancel({ rsvpId })                       # self-service
rsvps.list({ eventId })                        # admin only

checkins.create({ token, eventId, readerId })  # kiosk
checkins.list({ eventId })                     # admin only

members.enroll({ ... })                        # admin — issue NFC card
members.list({ churchId })                     # admin only

analytics.attendance({ churchId, range })
analytics.firstTimers({ churchId, range })
analytics.retention({ churchId })
```

---

## NFC Check-in — Device Strategy

### Tier 1: Smartphone NFC (default — free, no hardware required)

**iPhone (iOS 13+):**
- Membership/RSVP Wallet pass has NFC payload embedded
- Tap phone to reader — same experience as a tap-to-pay card
- Works for first-timers (RSVP pass) and members (persistent membership pass)

**Android (4.4+):**
- Option A: Google Wallet pass with NFC payload
- Option B: Sanctuary app in **HCE (Host Card Emulation)** mode — phone acts as an NFC card natively, no Wallet pass required

### Tier 2: Physical NFC Card (optional — accessibility & convenience)

Intended for:
- Elderly members who prefer a keychain fob
- Children (wristband or card issued by church)
- Members without smartphones

**Cost:** NTAG213 cards/fobs are $0.30–$1 in bulk. A 200-person church spends ~$150 one-time. Cards are optional — the church decides whether to offer them.

### Reader Hardware (church-side)

| Option | Cost | Notes |
|--------|------|-------|
| Android phone in kiosk mode | ~$0 (reuse old device) | Best starting point |
| ACR122U USB reader + tablet | $40–60 | More reliable for busy entrances |
| ACR1252U (ISO 14443/15693) | $60–80 | Higher compatibility, faster reads |

Church starts with a spare Android phone. Upgrades to dedicated reader hardware only when traffic demands it.

### Token Security
- Smartphone wallet pass tokens: cryptographically random 128-bit UUID, hashed in Redis
- Android HCE tokens: same random UUID sent via APDU, same Redis lookup
- Physical card tokens: NDEF-encoded UUID written once at enrollment
- All tokens: Redis TTL = event end time (prevents replay attacks after the event)

---

## Wallet Pass Integration

Library: `passkit-generator` (npm)

- **Apple Wallet:** `.pkpass` bundle signed with Apple WWDR certificate
- **Google Wallet:** JWT-based pass via Google Wallet API
- Pass contains: event name, time, location, QR code (fallback for older readers), NFC payload
- Pass updates automatically if event details change (APNs push update for Apple, FCM for Google)

---

## Pricing Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 church, 2 events/mo, 50 checkins/mo |
| Starter | $29/mo | Unlimited events, 500 checkins/mo, SMS reminders |
| Growth | $79/mo | Unlimited checkins, analytics, first-timer automation |
| Network | Custom | Multi-church, denominational rollups |

NFC reader hardware sold separately or via a hardware partner.

---

## Phase 1 MVP Scope

**Build:**
- [ ] Public event page (`/[slug]/events/[id]`)
- [ ] Clerk OAuth RSVP (Google, Apple, Facebook, Instagram)
- [ ] First-timer detection on RSVP
- [ ] Apple Wallet + Google Wallet pass generation
- [ ] SMS reminders via Twilio (24h + 1h before)
- [ ] Calendar invite (.ics) on confirmation email
- [ ] Church admin: create/edit events, view RSVPs
- [ ] Clerk auth for church admins (separate org role)

**Defer to Phase 2:**
- NFC kiosk app (React Native)
- Physical card enrollment
- Android HCE integration
- Family unit check-in

**Defer to Phase 3:**
- Analytics dashboard
- First-timer follow-up queue
- Retention curves
- Giving correlation (opt-in)

---

## Verification Plan

### Phase 1
1. Create a test church at `/admin`, publish an event
2. Visit the public event URL (logged out) — confirm page renders
3. Click RSVP → Clerk modal → sign in with Google
4. Confirm wallet pass downloads and contains correct event data
5. Confirm SMS is queued in Twilio sandbox
6. Confirm RSVP appears in admin dashboard with `is_first_timer = true`
7. RSVP again with same account → `is_first_timer = false`

### Phase 2
1. Enroll a test member with physical NFC card via admin kiosk
2. Run kiosk app in Expo Go against local API
3. Tap card → checkin created, kiosk shows confirmation
4. Tap wallet pass (NFC) on same reader → same checkin flow
5. Test Android HCE: Sanctuary app running on Android → tap to reader → confirm checkin

---

## Open Questions

1. **Hardware sales model** — partner with a reseller vs. sell direct? Decide before Phase 2 launch.
2. **Children's check-in routing** — family units captured in schema at Phase 2; dedicated UI deferred to Phase 3.
3. **Giving correlation** — opt-in Phase 3 feature; needs Stripe or Planning Center integration to be useful.
4. **Denominational rollups** — Phase 4 only; no multi-org complexity in the Phase 1 data model.
