/**
 * Static dev-data — used when the database is unavailable in development.
 * Mirrors the Koinonia seed (packages/db/src/seed.ts) so the UI is always
 * populated during local development without a live DB connection.
 *
 * Production: this module is never imported by server routes.
 * Development: [slug]/page.tsx catches DB errors and falls back here.
 */
import type { Church } from "@sanctuary/db";
import type { Event } from "@sanctuary/db";

const CHURCH_ID = "koinonia_global_seed_v1";

export const devChurch: Church = {
  id: CHURCH_ID,
  name: "Koinonia Global",
  slug: "koinonia",
  brandColour: "#C41E3A",
  timezone: "UTC",
  address: "Worldwide",
  plan: "growth",
  logoUrl: null,
  ownerClerkUserId: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export const devEvents: Event[] = [
  {
    id: "sor_2026_uk_seed_v1",
    churchId: CHURCH_ID,
    title: "The Sound of Revival — United Kingdom Apostolic Conference",
    description:
      "The Sound of Revival 2026 with Apostle Joshua Selman, Pastor William McDowell, and Pastor Nathaniel Bassey. Theme: Ezekiel 37:10.",
    bannerUrl: "/banners/sound-of-revival-uk.png",
    location: "M & S Bank Arena, Kings Dock, Liverpool Waterfront, Liverpool, England",
    latitude: 53.4014,
    longitude: -2.9843,
    category: "conference",
    startsAt: new Date("2026-05-22T17:00:00+01:00"),
    endsAt: new Date("2026-05-23T22:00:00+01:00"),
    capacity: 11_000,
    parentEventId: null,
    conditions: null,
    searchVector: null,
    rsvpRequired: true,
    isPublic: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "sor_2026_ca_seed_v1",
    churchId: CHURCH_ID,
    title: "The Sound of Revival — Canada Apostolic Conference",
    description:
      "Four days of worship, prayer, and apostolic ministry with Apostle Joshua Selman at the International Conference Center. Theme: Ezekiel 37:10.",
    bannerUrl: "/banners/sound-of-revival-canada.png",
    location: "The International Conference Center (ICC), Mississauga, Toronto, Canada",
    latitude: 43.5890,
    longitude: -79.6441,
    category: "conference",
    startsAt: new Date("2026-08-13T17:00:00-04:00"),
    endsAt: new Date("2026-08-16T12:00:00-04:00"),
    capacity: 5_000,
    parentEventId: null,
    conditions: null,
    searchVector: null,
    rsvpRequired: true,
    isPublic: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "sor_2026_usa_seed_v1",
    churchId: CHURCH_ID,
    title: "The Sound of Revival — USA Apostolic Conference",
    description:
      "The Sound of Revival 2026 arrives in the United States. Two powerful days of apostolic ministry with Apostle Joshua Selman. Theme: Ezekiel 37:10.",
    bannerUrl: "/banners/sound-of-revival-usa.png",
    location: "United States (Venue TBA)",
    latitude: null,
    longitude: null,
    category: "conference",
    startsAt: new Date("2026-08-20T17:00:00-04:00"),
    endsAt: new Date("2026-08-21T22:00:00-04:00"),
    capacity: 5_000,
    parentEventId: null,
    conditions: null,
    searchVector: null,
    rsvpRequired: true,
    isPublic: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
  },
];

/** Returns dev church + events for a given slug, or null if not found */
export function getDevData(slug: string): { church: Church; events: Event[] } | null {
  if (slug === "koinonia") {
    return { church: devChurch, events: devEvents };
  }
  return null;
}
