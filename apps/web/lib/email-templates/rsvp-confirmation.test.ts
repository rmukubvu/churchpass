import { describe, it, expect } from "vitest";
import { buildRsvpConfirmationEmail } from "./rsvp-confirmation";

describe("buildRsvpConfirmationEmail", () => {
  it("uses the actual churchSlug in event card link and calendar links", () => {
    const data = {
      firstName: "John",
      email: "john@example.com",
      churchName: "Grace Community Church",
      churchSlug: "grace-community-custom-slug",
      appUrl: "https://churchpass.events",
      events: [
        {
          id: "evt_1",
          title: "Sunday Worship",
          startsAt: new Date("2026-06-01T10:00:00Z"),
          endsAt: new Date("2026-06-01T12:00:00Z"),
          location: "Main Sanctuary",
          bannerUrl: "https://example.com/banner.jpg",
        },
      ],
    };

    const result = buildRsvpConfirmationEmail(data);

    // Verify subject line
    expect(result.subject).toContain("Sunday Worship");

    // Verify HTML contains the correct custom slug URL and NOT hyphenated churchName
    expect(result.html).toContain("https://churchpass.events/grace-community-custom-slug/events/evt_1");
    expect(result.html).not.toContain("https://churchpass.events/grace-community-church/events/evt_1");

    // Verify calendar link details parameter contains correct custom slug URL
    expect(result.html).toContain("grace-community-custom-slug/events/evt_1");
  });
});
