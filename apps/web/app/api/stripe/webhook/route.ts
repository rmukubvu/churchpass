/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events. Registered in the Stripe dashboard.
 * Key events:
 *  - payment_intent.succeeded → create RSVP + payment record + send confirmation
 *  - account.updated → sync stripeConnectStatus
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { payments, rsvps, attendees, events, churches } from "@sanctuary/db";
import { eq } from "drizzle-orm";
import { sendRsvpConfirmation } from "@/lib/sendgrid";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://churchpass.events";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { eventId, clerkUserId, email, firstName, lastName, tierId } = pi.metadata;
        if (!eventId || !clerkUserId || !email || !firstName || !lastName) break;

        // Load church via event
        const [churchRow] = await db
          .select({
            id: churches.id,
            slug: churches.slug,
            name: churches.name,
            brandColour: churches.brandColour,
          })
          .from(churches)
          .innerJoin(events, eq(events.churchId, churches.id))
          .where(eq(events.id, eventId))
          .limit(1);

        if (!churchRow) break;

        // Upsert attendee (churchId is required)
        const inserted = await db
          .insert(attendees)
          .values({ churchId: churchRow.id, clerkUserId, email, firstName, lastName })
          .onConflictDoUpdate({
            target: [attendees.churchId, attendees.clerkUserId],
            set: { email, firstName, lastName },
          })
          .returning();

        const attendee = inserted[0];
        if (!attendee) break;

        // Create RSVP
        const rsvpInserted = await db
          .insert(rsvps)
          .values({
            eventId,
            attendeeId: attendee.id,
            status: "confirmed",
            ticketTierId: tierId ?? null,
          })
          .onConflictDoNothing()
          .returning();

        const rsvp = rsvpInserted[0];
        if (!rsvp) break;

        // Record payment
        const connectedAccountId = pi.transfer_data?.destination;
        await db.insert(payments).values({
          rsvpId: rsvp.id,
          stripePaymentIntentId: pi.id,
          stripeAccountId: typeof connectedAccountId === "string" ? connectedAccountId : null,
          amountTotal: pi.amount,
          amountFee: pi.application_fee_amount ?? 0,
          currency: pi.currency,
          status: "succeeded",
        });

        // Send confirmation email
        const [ev] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        if (!ev) break;

        await sendRsvpConfirmation({
          firstName,
          email,
          churchName: churchRow.name,
          churchSlug: churchRow.slug,
          appUrl: BASE_URL,
          events: [
            {
              id: ev.id,
              title: ev.title,
              startsAt: ev.startsAt,
              endsAt: ev.endsAt,
              location: ev.location ?? null,
              bannerUrl: ev.bannerUrl ?? null,
            },
          ],
          walletPassTokens: [rsvp.walletPassToken],
        });
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const status = account.charges_enabled ? "active" : "pending";
        await db
          .update(churches)
          .set({ stripeConnectStatus: status })
          .where(eq(churches.stripeAccountId, account.id));
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  return NextResponse.json({ received: true });
}
