/**
 * Seed script — multi-church demo data (UK, Canada, USA)
 * 30 events spanning April–December 2026 for pagination testing.
 *
 * Run with:  pnpm --filter @sanctuary/db db:seed
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { churches, events } from "./schema/index";
import { eq } from "drizzle-orm";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const client = postgres(databaseUrl, { ssl: "require" });
const db = drizzle(client, { schema });

// ─── Churches ────────────────────────────────────────────────────────────────

const churchesData = [
  {
    id: "koinonia_global_seed_v1",
    name: "Koinonia Global",
    slug: "koinonia",
    brandColour: "#C41E3A",
    timezone: "UTC",
    address: "Worldwide",
    plan: "growth" as const,
    logoUrl: null,
  },
  {
    id: "revival_uk_seed_v1",
    name: "Revival Church UK",
    slug: "revival-uk",
    brandColour: "#2563EB",
    timezone: "Europe/London",
    address: "London, UK",
    plan: "growth" as const,
    logoUrl: null,
  },
  {
    id: "gateway_canada_seed_v1",
    name: "Gateway Church Toronto",
    slug: "gateway-toronto",
    brandColour: "#7C3AED",
    timezone: "America/Toronto",
    address: "Toronto, Canada",
    plan: "growth" as const,
    logoUrl: null,
  },
  {
    id: "elevation_usa_seed_v1",
    name: "Elevation Church USA",
    slug: "elevation-usa",
    brandColour: "#059669",
    timezone: "America/New_York",
    address: "Charlotte, NC, USA",
    plan: "growth" as const,
    logoUrl: null,
  },
];

// ─── Events ──────────────────────────────────────────────────────────────────

const eventsData = [
  // ── KOINONIA GLOBAL (existing) ────────────────────────────────────────────
  {
    id: "sor_2026_uk_seed_v1",
    churchId: "koinonia_global_seed_v1",
    title: "The Sound of Revival — United Kingdom",
    description: "Canada Apostolic Conference presents The Sound of Revival 2026 with Apostle Joshua Selman, Pastor William McDowell, and Pastor Nathaniel Bassey. Theme: Ezekiel 37:10.",
    bannerUrl: "/banners/sound-of-revival-uk.png",
    location: "M&S Bank Arena, Kings Dock, Liverpool, L3 4FP, UK",
    latitude: 53.4014,
    longitude: -2.9843,
    category: "conference" as const,
    startsAt: new Date("2026-05-22T17:00:00+01:00"),
    endsAt: new Date("2026-05-23T22:00:00+01:00"),
    capacity: 11_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "sor_2026_ca_seed_v1",
    churchId: "koinonia_global_seed_v1",
    title: "The Sound of Revival — Canada",
    description: "The Sound of Revival 2026 comes to Canada. Four days of worship, prayer, and apostolic ministry with Apostle Joshua Selman. Theme: Ezekiel 37:10.",
    bannerUrl: "/banners/sound-of-revival-canada.png",
    location: "International Conference Center, Mississauga, Toronto, Canada",
    latitude: 43.589,
    longitude: -79.6441,
    category: "conference" as const,
    startsAt: new Date("2026-08-13T17:00:00-04:00"),
    endsAt: new Date("2026-08-16T12:00:00-04:00"),
    capacity: 5_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "sor_2026_usa_seed_v1",
    churchId: "koinonia_global_seed_v1",
    title: "The Sound of Revival — USA",
    description: "The Sound of Revival 2026 arrives in the United States. Two powerful days of apostolic ministry with Apostle Joshua Selman. Theme: Ezekiel 37:10.",
    bannerUrl: "/banners/sound-of-revival-usa.png",
    location: "United States (Venue TBA)",
    category: "conference" as const,
    startsAt: new Date("2026-08-20T17:00:00-04:00"),
    endsAt: new Date("2026-08-21T22:00:00-04:00"),
    capacity: 5_000,
    rsvpRequired: true,
    isPublic: true,
  },

  // ── REVIVAL CHURCH UK ─────────────────────────────────────────────────────
  {
    id: "ruk_worship_april_v1",
    churchId: "revival_uk_seed_v1",
    title: "Night of Worship — London",
    description: "An intimate evening of live worship at Wembley Arena. Featuring some of the UK's most anointed worship leaders.",
    location: "Wembley Arena, Wembley, London, HA9 0DH, UK",
    latitude: 51.5560,
    longitude: -0.2796,
    category: "worship" as const,
    startsAt: new Date("2026-04-24T19:00:00+01:00"),
    endsAt: new Date("2026-04-24T22:30:00+01:00"),
    capacity: 3_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "ruk_youth_may_v1",
    churchId: "revival_uk_seed_v1",
    title: "Rise Youth Conference — Manchester",
    description: "A weekend conference for young people aged 16–30. Workshops, worship, and powerful ministry sessions.",
    location: "Manchester Central Convention Complex, Manchester, M2 3GX, UK",
    latitude: 53.4757,
    longitude: -2.2439,
    category: "youth" as const,
    startsAt: new Date("2026-05-08T10:00:00+01:00"),
    endsAt: new Date("2026-05-09T18:00:00+01:00"),
    capacity: 1_500,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "ruk_outreach_june_v1",
    churchId: "revival_uk_seed_v1",
    title: "City Outreach — Birmingham",
    description: "Join us as we take the gospel to the streets of Birmingham. Free food, prayer, and community connection.",
    location: "Centenary Square, Birmingham, B1 2EP, UK",
    latitude: 52.4800,
    longitude: -1.9025,
    category: "outreach" as const,
    startsAt: new Date("2026-06-13T11:00:00+01:00"),
    endsAt: new Date("2026-06-13T17:00:00+01:00"),
    capacity: 500,
    rsvpRequired: false,
    isPublic: true,
  },
  {
    id: "ruk_family_july_v1",
    churchId: "revival_uk_seed_v1",
    title: "Family Fun Day — Leeds",
    description: "A day for the whole family. Games, food stalls, live music, and a short family service at sunset.",
    location: "Roundhay Park, Leeds, LS8 2HH, UK",
    latitude: 53.8333,
    longitude: -1.5040,
    category: "family" as const,
    startsAt: new Date("2026-07-11T12:00:00+01:00"),
    endsAt: new Date("2026-07-11T20:00:00+01:00"),
    capacity: 2_000,
    rsvpRequired: false,
    isPublic: true,
  },
  {
    id: "ruk_conference_sep_v1",
    churchId: "revival_uk_seed_v1",
    title: "Awakening Conference — Glasgow",
    description: "Three days of powerful preaching, prayer, and worship in Scotland. Guest speakers from across the UK and Africa.",
    location: "SEC Centre, Glasgow, G3 8YW, Scotland, UK",
    latitude: 55.8609,
    longitude: -4.2896,
    category: "conference" as const,
    startsAt: new Date("2026-09-18T17:00:00+01:00"),
    endsAt: new Date("2026-09-20T21:00:00+01:00"),
    capacity: 4_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "ruk_worship_nov_v1",
    churchId: "revival_uk_seed_v1",
    title: "Worship Collective — Bristol",
    description: "A monthly worship gathering open to all. Come as you are.",
    location: "Colston Hall, Bristol, BS1 5AR, UK",
    latitude: 51.4545,
    longitude: -2.5879,
    category: "worship" as const,
    startsAt: new Date("2026-11-06T19:00:00+00:00"),
    endsAt: new Date("2026-11-06T22:00:00+00:00"),
    capacity: 800,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "ruk_christmas_dec_v1",
    churchId: "revival_uk_seed_v1",
    title: "Christmas Carol Night — London",
    description: "A festive evening of carols, readings, and community. All are welcome — bring family and friends.",
    location: "Royal Albert Hall, Kensington, London, SW7 2AP, UK",
    latitude: 51.5009,
    longitude: -0.1774,
    category: "worship" as const,
    startsAt: new Date("2026-12-19T19:00:00+00:00"),
    endsAt: new Date("2026-12-19T22:00:00+00:00"),
    capacity: 5_000,
    rsvpRequired: true,
    isPublic: true,
  },

  // ── GATEWAY CHURCH TORONTO ────────────────────────────────────────────────
  {
    id: "gca_worship_april_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Praise Night — Toronto",
    description: "An electric night of praise and worship at the Scotiabank Arena. Come ready to encounter God.",
    location: "Scotiabank Arena, 40 Bay St, Toronto, ON M5J 2X2, Canada",
    latitude: 43.6435,
    longitude: -79.3791,
    category: "worship" as const,
    startsAt: new Date("2026-04-17T19:00:00-04:00"),
    endsAt: new Date("2026-04-17T22:00:00-04:00"),
    capacity: 6_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "gca_youth_may_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Youth Summit — Vancouver",
    description: "Canada's largest youth gathering for 2026. Three days of purpose, identity, and kingdom vision.",
    location: "Vancouver Convention Centre, 1055 Canada Pl, Vancouver, BC V6C 0C3, Canada",
    latitude: 49.2888,
    longitude: -123.1117,
    category: "youth" as const,
    startsAt: new Date("2026-05-15T09:00:00-07:00"),
    endsAt: new Date("2026-05-17T18:00:00-07:00"),
    capacity: 3_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "gca_conference_jun_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Kingdom Builders Summit — Calgary",
    description: "A leadership and discipleship conference for pastors, leaders, and marketplace ministers.",
    location: "BMO Centre, Stampede Park, Calgary, AB T2G 2W1, Canada",
    latitude: 51.0376,
    longitude: -114.0519,
    category: "conference" as const,
    startsAt: new Date("2026-06-26T17:00:00-06:00"),
    endsAt: new Date("2026-06-28T20:00:00-06:00"),
    capacity: 2_500,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "gca_outreach_aug_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Back to School Outreach — Ottawa",
    description: "Free school supplies, food, and prayer for families in Ottawa. A community blessing event.",
    location: "Major's Hill Park, Ottawa, ON K1N 8J5, Canada",
    latitude: 45.4268,
    longitude: -75.6952,
    category: "outreach" as const,
    startsAt: new Date("2026-08-29T10:00:00-04:00"),
    endsAt: new Date("2026-08-29T16:00:00-04:00"),
    capacity: 1_000,
    rsvpRequired: false,
    isPublic: true,
  },
  {
    id: "gca_family_oct_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Harvest Family Festival — Toronto",
    description: "A fall festival for families with games, food trucks, pumpkin carving, and a short message.",
    location: "Woodbine Park, Toronto, ON M4L 3N9, Canada",
    latitude: 43.6629,
    longitude: -79.3056,
    category: "family" as const,
    startsAt: new Date("2026-10-10T12:00:00-04:00"),
    endsAt: new Date("2026-10-10T18:00:00-04:00"),
    capacity: 1_500,
    rsvpRequired: false,
    isPublic: true,
  },
  {
    id: "gca_worship_nov_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Encounter Night — Montreal",
    description: "A night of deep worship and soaking prayer. Come hungry for more of God.",
    location: "Place des Arts, 175 Rue Sainte-Catherine O, Montréal, QC H2X 1Y8, Canada",
    latitude: 45.5088,
    longitude: -73.5678,
    category: "worship" as const,
    startsAt: new Date("2026-11-20T19:00:00-05:00"),
    endsAt: new Date("2026-11-20T22:30:00-05:00"),
    capacity: 2_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "gca_christmas_dec_v1",
    churchId: "gateway_canada_seed_v1",
    title: "Christmas Celebration — Toronto",
    description: "Celebrate Christmas with Gateway Toronto. A night of carols, giving, and the Christmas story.",
    location: "Meridian Hall, 1 Front St E, Toronto, ON M5E 1B2, Canada",
    latitude: 43.6474,
    longitude: -79.3725,
    category: "worship" as const,
    startsAt: new Date("2026-12-12T18:00:00-05:00"),
    endsAt: new Date("2026-12-12T21:00:00-05:00"),
    capacity: 2_800,
    rsvpRequired: true,
    isPublic: true,
  },

  // ── ELEVATION CHURCH USA ──────────────────────────────────────────────────
  {
    id: "elev_worship_apr_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Open Heaven Worship Night — New York",
    description: "A night of uninterrupted worship at Madison Square Garden. Join thousands as we usher in the presence of God.",
    location: "Madison Square Garden, 4 Pennsylvania Plaza, New York, NY 10001, USA",
    latitude: 40.7505,
    longitude: -73.9934,
    category: "worship" as const,
    startsAt: new Date("2026-04-10T19:00:00-04:00"),
    endsAt: new Date("2026-04-10T22:00:00-04:00"),
    capacity: 12_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_conference_may_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Thrive Women's Conference — Charlotte",
    description: "Two days designed for women to grow, heal, and be equipped. Powerful speakers, worship, and community.",
    location: "Charlotte Convention Center, 501 S College St, Charlotte, NC 28202, USA",
    latitude: 35.2257,
    longitude: -80.8465,
    category: "conference" as const,
    startsAt: new Date("2026-05-01T09:00:00-04:00"),
    endsAt: new Date("2026-05-02T18:00:00-04:00"),
    capacity: 4_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_youth_jun_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Ignite Youth Weekend — Atlanta",
    description: "A high-energy weekend for teens. Concerts, speakers, team challenges, and night sessions.",
    location: "Georgia World Congress Center, Atlanta, GA 30313, USA",
    latitude: 33.7537,
    longitude: -84.3973,
    category: "youth" as const,
    startsAt: new Date("2026-06-05T17:00:00-04:00"),
    endsAt: new Date("2026-06-07T15:00:00-04:00"),
    capacity: 5_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_outreach_jul_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Summer Block Party — Houston",
    description: "Free community block party with food, games, giveaways, and a short gospel message. Bring the whole neighbourhood.",
    location: "Discovery Green, 1500 McKinney St, Houston, TX 77010, USA",
    latitude: 29.7535,
    longitude: -95.3677,
    category: "outreach" as const,
    startsAt: new Date("2026-07-04T14:00:00-05:00"),
    endsAt: new Date("2026-07-04T20:00:00-05:00"),
    capacity: 3_000,
    rsvpRequired: false,
    isPublic: true,
  },
  {
    id: "elev_conference_aug_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Elevation Experience Conference — Los Angeles",
    description: "Three days of revival at the Crypto.com Arena. Apostolic teaching, healing services, and a night of worship.",
    location: "Crypto.com Arena, 1111 S Figueroa St, Los Angeles, CA 90015, USA",
    latitude: 34.0430,
    longitude: -118.2673,
    category: "conference" as const,
    startsAt: new Date("2026-08-07T17:00:00-07:00"),
    endsAt: new Date("2026-08-09T22:00:00-07:00"),
    capacity: 8_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_family_sep_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Family Weekend — Chicago",
    description: "A weekend retreat for families. Parenting workshops, kids programme, couples session, and Sunday celebration.",
    location: "McCormick Place, 2301 S Lake Shore Dr, Chicago, IL 60616, USA",
    latitude: 41.8527,
    longitude: -87.6158,
    category: "family" as const,
    startsAt: new Date("2026-09-26T17:00:00-05:00"),
    endsAt: new Date("2026-09-27T17:00:00-05:00"),
    capacity: 3_500,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_worship_oct_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Praise & Prayer Night — Dallas",
    description: "A monthly gathering of worship and intercession for the city. Come and pray for America.",
    location: "Kay Bailey Hutchison Convention Center, Dallas, TX 75207, USA",
    latitude: 32.7767,
    longitude: -96.8080,
    category: "worship" as const,
    startsAt: new Date("2026-10-23T19:00:00-05:00"),
    endsAt: new Date("2026-10-23T22:00:00-05:00"),
    capacity: 5_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_conference_nov_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Leaders Summit — Washington DC",
    description: "A gathering of church leaders, pastors, and ministry workers. Sessions on leadership, church growth, and spiritual formation.",
    location: "Walter E. Washington Convention Center, 801 Mt Vernon Pl NW, Washington, DC 20001, USA",
    latitude: 38.9042,
    longitude: -77.0229,
    category: "conference" as const,
    startsAt: new Date("2026-11-13T09:00:00-05:00"),
    endsAt: new Date("2026-11-14T18:00:00-05:00"),
    capacity: 2_000,
    rsvpRequired: true,
    isPublic: true,
  },
  {
    id: "elev_christmas_dec_v1",
    churchId: "elevation_usa_seed_v1",
    title: "Christmas at Elevation — Charlotte",
    description: "Our annual Christmas spectacular. Live nativity, choir, orchestra, and a message of hope. All are welcome.",
    location: "Spectrum Center, 333 E Trade St, Charlotte, NC 28202, USA",
    latitude: 35.2251,
    longitude: -80.8393,
    category: "worship" as const,
    startsAt: new Date("2026-12-05T18:00:00-05:00"),
    endsAt: new Date("2026-12-05T21:00:00-05:00"),
    capacity: 9_000,
    rsvpRequired: true,
    isPublic: true,
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`🌱  Seeding ${churchesData.length} churches and ${eventsData.length} events...\n`);

  for (const church of churchesData) {
    const [existing] = await db
      .select({ id: churches.id })
      .from(churches)
      .where(eq(churches.slug, church.slug))
      .limit(1);

    if (existing) {
      console.log(`   ↩  Church already exists: ${church.name}`);
    } else {
      await db.insert(churches).values(church);
      console.log(`   ✅  Inserted church: ${church.name}`);
    }
  }

  console.log("");

  for (const event of eventsData) {
    await db
      .insert(events)
      .values(event)
      .onConflictDoUpdate({
        target: events.id,
        set: {
          title: event.title,
          location: event.location,
          latitude: event.latitude ?? null,
          longitude: event.longitude ?? null,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        },
      });
    console.log(`   ✅  Upserted: ${event.title}`);
  }

  console.log(`\n🎉  Seed complete! ${eventsData.length} events across ${churchesData.length} churches.`);
  console.log("\nChurch pages:");
  for (const c of churchesData) {
    console.log(`  http://localhost:3000/${c.slug}`);
  }
}

seed()
  .catch(console.error)
  .finally(() => client.end());
