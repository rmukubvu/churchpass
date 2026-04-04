# Sanctuary — Project Memory

## What this is
A church event management platform (Next.js 16 App Router + tRPC 11 + Drizzle ORM + Clerk auth + Supabase PostgreSQL). Think Ticketmaster Travel but for church events — attendees can browse events, RSVP to multiple sessions in one shot, see nearby hotel stays, and get a branded confirmation email.

## Monorepo layout
```
apps/web          — Next.js 16 app (main product)
packages/db       — Drizzle schema + Supabase client
packages/wallet   — Apple/Google Wallet pass generation (stubbed)
packages/ui       — shared Tailwind components
packages/types    — shared TypeScript types
```

## Key tech decisions
- **Next.js 16 App Router** — Server Components by default; `"use client"` only at leaf boundaries
- **tRPC 11** — raw `fetch("/api/trpc/router.procedure", { method:"POST", body: JSON.stringify({ json: input }) })` pattern (no React Query provider)
- **Drizzle ORM** — `inArray`, `ilike`, `onConflictDoUpdate` patterns used throughout
- **Clerk** — `auth()` / `currentUser()` server-side; `useAuth()` client-side; `protectedProcedure` in tRPC
- **Dark theme** — `#0f0f0f` bg, `#1a1a1a` cards, `#4F46E5` indigo accent
- **SendGrid** (`@sendgrid/mail`) — transactional email; graceful no-op when `SENDGRID_API_KEY` is empty
- **Google Places API** — nearby hotel search on event detail pages
- **Google Geocoding API** — auto-geocodes `location` field on event create/update

## Database (Supabase — us-west-2)
```
DATABASE_URL=postgresql://postgres.ukvsxkjkehciegkowskt:skman%402026%23@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```
Tables: `churches`, `events`, `attendees`, `rsvps`, `checkins`, `family_units`

## Dev server
```bash
nohup bash -c 'export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"; pnpm --filter web dev' > /private/tmp/next-dev.log 2>&1 &
# verify:
tail -f /private/tmp/next-dev.log
```
`preview_start` doesn't work (can't find node). Always use the bash pattern above.

---

## ✅ Completed features
| Feature | Key files |
|---|---|
| Nearby hotel stays on event detail page | `lib/google-places.ts`, `components/events/NearbyStays.tsx`, `server/trpc/routers/accommodations.ts` |
| Home page hero + keyword/city search bar | `components/browse/HeroSearchBar.tsx`, `components/browse/FeaturedEventsBanner.tsx` |
| `/search` results page | `app/search/page.tsx` |
| Live upcoming events feed on home page | `app/page.tsx`, `components/browse/UpcomingEventsGrid.tsx` |
| Multi-event RSVP (tap-to-select + batch) | `components/events/SelectableEventSection.tsx`, `components/events/SelectableEventCard.tsx`, `components/rsvp/MultiRsvpBar.tsx`, `server/trpc/routers/rsvps.ts` → `createBatch` |
| SendGrid confirmation email (dark template, per-event cards, Google Calendar links) | `lib/email-templates/rsvp-confirmation.ts`, `lib/sendgrid.ts` |
| Category tab filtering on church page | Absorbed into `SelectableEventSection` — tabs are dynamic (only show used categories) |
| Event creation form | `app/[slug]/admin/events/new/page.tsx`, `components/admin/CreateEventForm.tsx` |
| Single-RSVP email now includes church name | `server/trpc/routers/rsvps.ts` → `create` mutation |

---

## 🔴 Outstanding — in priority order

### ~~1. Attendee dashboard~~ ✅ DONE
- `app/[slug]/admin/page.tsx` — overview with stats, RSVP counts, check-in progress bars
- `app/[slug]/admin/events/[id]/attendees/page.tsx` — full guest list with check-in toggle
- `app/api/export/[slug]/events/[id]/route.ts` — CSV export (auth-gated)
- `components/admin/CheckInButton.tsx` — client toggle calls `checkins.manual` / `checkins.undoManual`
- `checkins` router extended with `manual` and `undoManual` mutations

### ~~2. Check-in flow (QR codes)~~ ✅ DONE
- `lib/qrcode.ts` — `generateQrDataUrl(text)` + `checkInUrl(token)` helpers
- `app/check-in/[token]/page.tsx` — public branded scan page; shows attendee name, event, check-in button; handles already-checked-in state
- `components/rsvp/CheckInConfirmButton.tsx` — client button calling `checkins.manual`
- `components/rsvp/MyTicket.tsx` — server component on event detail page; shows QR to signed-in users who have RSVPd
- Confirmation email now embeds a QR code per event (base64 PNG inline image)
- `rsvps.create` + `rsvps.createBatch` both pass `walletPassTokens` to `sendRsvpConfirmation`

### ~~3. Attendee "My Events" page~~ ✅ DONE
- `app/my-events/page.tsx` — server page, fetches all RSVPs across all churches for signed-in user, generates QR codes server-side
- `components/my-events/MyEventsShell.tsx` — client shell with Upcoming/Past tabs, event rows, QR modal (tap QR icon → full-screen modal with branded ticket card)
- "My Events" link added to `SiteHeader` for signed-in users
- Auth-gated: redirects to `/sign-in?redirect_url=/my-events`

### ~~4. Pagination~~ ✅ DONE
- Home page: "Load more" button via tRPC `events.upcomingAll` with offset (client-side append)
- Church page: same pattern via tRPC `events.list` with offset inside `SelectableEventSection`
- Search page: URL-based `?page=N` with Prev/Next links, 12 results per page

### ~~5. Twilio SMS~~ ✅ DONE
- `lib/sms.ts` — `sendRsvpSms()` wrapper; graceful no-op when `TWILIO_*` env vars absent
- Wired into `rsvps.create` and `rsvps.createBatch` (non-blocking, like email)
- SMS includes event list + check-in URL (single event) or `/my-events` link (multi)

### ~~6. Apple/Google Wallet passes~~ ✅ DONE
- `lib/wallet.ts` — `buildWalletLinks()` returns `{ apple, google }` — both null when creds absent
- Apple Wallet: `passkit-generator` creates `.pkpass` buffer; returned as base64 data URL (swap for R2 URL in prod)
- Google Wallet: signed RS256 JWT → `pay.google.com/gp/v/save/{token}` deep link
- "Add to Apple Wallet" + "Save to Google Wallet" buttons in My Events QR modal
- Required env vars added to `.env.local`: `APPLE_PASS_TYPE_ID`, `APPLE_PASS_CERT_BASE64`, `APPLE_PASS_KEY_BASE64`, `APPLE_PASS_WWDR_BASE64`, `GOOGLE_WALLET_ISSUER_ID`

## ✅ ALL PLANNED FEATURES COMPLETE
No remaining outstanding items. Next priorities if continuing:
1. R2/S3 upload for Apple .pkpass files (replace base64 data URL)
2. Role-based admin access (currently any signed-in user can reach /{slug}/admin)
3. Event edit form (update existing events)
4. Push notifications (web push or Expo if mobile app is planned)

---

## Patterns to follow

### tRPC raw fetch (client components)
```ts
const res = await fetch("/api/trpc/rsvps.createBatch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ json: { ...input } }),
});
```

### DB query in Server Component
```ts
import { db } from "@/server/db";
import { churches, events } from "@sanctuary/db";
const rows = await db.select().from(events).where(...);
```

### Protected tRPC mutation
```ts
export const myRouter = router({
  doThing: protectedProcedure
    .input(z.object({ ... }))
    .mutation(async ({ ctx, input }) => {
      // ctx.clerkUserId is guaranteed non-null
      // ctx.db is the Drizzle instance
    }),
});
```

### Attendee upsert pattern
```ts
await db.insert(attendees)
  .values({ churchId, clerkUserId, email, firstName, lastName })
  .onConflictDoUpdate({
    target: [attendees.churchId, attendees.clerkUserId],
    set: { email, firstName, lastName },
  });
```
