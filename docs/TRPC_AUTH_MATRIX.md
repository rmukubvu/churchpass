# tRPC Authorization Matrix

Audit of every `protectedProcedure` in `apps/web/server/trpc/routers/`.  
**Legend:** `signed-in` = any authenticated user; `church-admin` = `isChurchAdmin(slug)`; `system-admin` = `isSystemAdmin()`; `owner` = resource owned by `ctx.clerkUserId`.

Guards live in `apps/web/lib/auth/guards.ts` (added as part of this audit).

## Summary

| Authorization | Count | Notes |
|---------------|-------|-------|
| Correct by design (attendee/owner) | 14 | RSVP, waitlist self-service, provider self-service |
| Church admin required | 12 | Events, social, tiers, check-ins admin, payments admin |
| System admin required | 8 | Ads review, featured events, provider platform admin |
| Previously sign-in only (fixed) | 12 | See “Gaps fixed” below |

## By router

### `rsvps`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `create` | signed-in | Attendee RSVP; any user for any public event |
| `createBatch` | signed-in | Same; validates same `churchId` |
| `list` | church-admin | `isChurchAdmin` on event’s church |
| `cancel` | owner **or** church-admin | |

### `checkins`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `create` | **public** | QR/kiosk; token is the credential |
| `manual` | church-admin | Guest list |
| `undoManual` | church-admin | Guest list |
| `list` | church-admin | Event check-in list |

### `events`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `create` | church-admin | `requireChurchAdminForChurchId(input.churchId)` |
| `update` | church-admin | Via event’s church |
| `generateRecurring` | church-admin | Via parent event’s church |
| `setFeatured` | system-admin | Platform homepage slider |

### `attendees`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `list` | church-admin | Already had check |

### `social`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `getConnections` | church-admin | `churchSlug` input |
| `setAutoPost` | church-admin | |
| `disconnectAccount` | church-admin | |

### `ticketTiers`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `upsert` | church-admin | Via `eventId` |

### `payments`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `listByEvent` | church-admin | |
| `refund` | church-admin | Via payment → event’s church |
| `myPayment` | signed-in (own RSVP) | Joins `attendees.clerkUserId === ctx.clerkUserId` |

### `waitlist`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `join` | signed-in | Scoped to `ctx.clerkUserId` |
| `cancel` | owner | `clerkUserId` match |
| `promoteNext` | church-admin | Admin promotes next waiter |
| `myStatus` | signed-in | Own waitlist row |

### `ads`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `mine` | owner | `ads.clerkUserId` |
| `pendingReview` | system-admin | |
| `all` | system-admin | |
| `approve` | system-admin | |
| `reject` | system-admin | |

### `providers`

| Procedure | Authorization | Notes |
|-----------|---------------|-------|
| `register` | signed-in | Creates provider for self |
| `update` | owner | `clerkUserId` match |
| `myProfile` | signed-in | Own profile |
| `sendInquiry` | signed-in | Church sends inquiry (no church-admin gate on router) |
| `myInquiries` | owner | Provider owns inquiries |
| `replyInquiry` | owner | |
| `markRead` | owner | Weak: no provider ownership check on inquiry id alone |
| `all` | system-admin | |
| `verify` | system-admin | |
| `setStatus` | system-admin | |

### `accommodations`

No `protectedProcedure` — public `nearby` query only.

## Page-level vs tRPC

| Surface | Protection |
|---------|------------|
| `/admin/*` | `middleware.ts` + `isSystemAdmin` in layout |
| `/{slug}/admin/*` | Per-page `isChurchAdmin(slug)` — **not** in middleware |
| REST `api/export/...` | `isChurchAdmin` in route handler |

Admin UI can hide links, but **tRPC must enforce** the same rules (now applied for church/platform mutations above).

## Gaps fixed (this audit)

Procedures that previously only required sign-in now call guards:

- `events.create`, `update`, `generateRecurring`
- `events.setFeatured` → `requireSystemAdmin`
- `social.*` → `requireChurchAdmin(slug)`
- `ticketTiers.upsert`
- `checkins.manual`, `undoManual`, `list`
- `payments.listByEvent`, `refund`
- `waitlist.promoteNext`
- `ads.pendingReview`, `all`, `approve`, `reject`
- `providers.all`, `verify`, `setStatus`

## Remaining recommendations

1. **`providers.sendInquiry`** — optional `requireChurchAdminForChurchId(churchId)`.
2. **`providers.markRead`** — verify inquiry belongs to provider owned by user.
3. Rename `clerkUserId` / `ctx.clerkUserId` to `userId` in schema and context.
4. Middleware: optionally guard `/{slug}/admin` paths (defense in depth).

## Helper reference

```ts
// apps/web/lib/auth/guards.ts
requireChurchAdmin(churchSlug)
requireChurchAdminForChurchId(db, churchId)
requireChurchAdminForEventId(db, eventId)
requireSystemAdmin()
```
