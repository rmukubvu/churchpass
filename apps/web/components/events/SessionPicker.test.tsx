import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SessionPicker } from "./SessionPicker";
import type { Event } from "@sanctuary/db";

// Mock custom auth
vi.mock("@/lib/auth/client", () => ({
  useAuth: () => ({
    isSignedIn: true,
  }),
}));

// Mock Router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock trpc
vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    rsvps: {
      createBatch: {
        mutate: vi.fn(),
      },
    },
  },
}));

const mockSessions: Event[] = [
  {
    id: "sess_1",
    churchId: "ch_1",
    title: "Morning Worship",
    description: null,
    bannerUrl: null,
    location: "Auditorium",
    latitude: null,
    longitude: null,
    category: "worship",
    startsAt: new Date("2026-06-15T09:00:00Z"),
    endsAt: new Date("2026-06-15T11:00:00Z"),
    capacity: 100,
    parentEventId: "evt_1",
    conditions: null,
    searchVector: null,
    rsvpRequired: true,
    isPublic: true,
    createdAt: new Date(),
    timezone: "UTC",
    tags: [],
    visibility: "public",
    secretToken: null,
    isDraft: false,
    locationType: "in_person",
    locationDirections: null,
    locationUrl: null,
    locationTbd: false,
    isRecurring: false,
    recurringFrequency: null,
    recurringEndsAt: null,
    recurringEndsAfter: null,
    waitlistEnabled: false,
    waitlistCapacity: null,
    waitlistAutoPromote: true,
    ticketType: "free",
    processingFeeMode: "absorb",
    donationMinimum: null,
    donationSuggestedAmounts: [],
    refundPolicy: null,
    refundDays: null,
    refundPolicyDetails: null,
    featuredUntil: null,
    featuredOrder: null,
  },
  {
    id: "sess_2",
    churchId: "ch_1",
    title: "Afternoon Workshop",
    description: null,
    bannerUrl: null,
    location: "Hall B",
    latitude: null,
    longitude: null,
    category: "conference",
    startsAt: new Date("2026-06-15T13:00:00Z"),
    endsAt: new Date("2026-06-15T15:00:00Z"),
    capacity: 50,
    parentEventId: "evt_1",
    conditions: null,
    searchVector: null,
    rsvpRequired: true,
    isPublic: true,
    createdAt: new Date(),
    timezone: "UTC",
    tags: [],
    visibility: "public",
    secretToken: null,
    isDraft: false,
    locationType: "in_person",
    locationDirections: null,
    locationUrl: null,
    locationTbd: false,
    isRecurring: false,
    recurringFrequency: null,
    recurringEndsAt: null,
    recurringEndsAfter: null,
    waitlistEnabled: false,
    waitlistCapacity: null,
    waitlistAutoPromote: true,
    ticketType: "free",
    processingFeeMode: "absorb",
    donationMinimum: null,
    donationSuggestedAmounts: [],
    refundPolicy: null,
    refundDays: null,
    refundPolicyDetails: null,
    featuredUntil: null,
    featuredOrder: null,
  },
];

describe("SessionPicker", () => {
  it("renders sessions list and enables select buttons", () => {
    render(
      <SessionPicker
        sessions={mockSessions}
        churchSlug="grace-church"
        churchName="Grace Church"
        brandColour="#4F46E5"
        existingRsvpedSessionIds={[]}
      />
    );

    expect(screen.getByText("Morning Worship")).toBeInTheDocument();
    expect(screen.getByText("Afternoon Workshop")).toBeInTheDocument();
    
    // Buttons should not be disabled
    const buttons = screen.getAllByRole("button");
    // The sessions are buttons. Let's find session buttons by title text.
    const morningBtn = screen.getByText("Morning Worship").closest("button");
    const afternoonBtn = screen.getByText("Afternoon Workshop").closest("button");
    expect(morningBtn).not.toBeDisabled();
    expect(afternoonBtn).not.toBeDisabled();
  });

  it("disables the sessions that the user has already RSVP'd to", () => {
    render(
      <SessionPicker
        sessions={mockSessions}
        churchSlug="grace-church"
        churchName="Grace Church"
        brandColour="#4F46E5"
        existingRsvpedSessionIds={["sess_1"]}
      />
    );

    const morningBtn = screen.getByText("Morning Worship").closest("button");
    const afternoonBtn = screen.getByText("Afternoon Workshop").closest("button");
    
    expect(morningBtn).toBeDisabled();
    expect(afternoonBtn).not.toBeDisabled();
    expect(screen.getByText("Registered")).toBeInTheDocument();
  });

  it("displays 'this event you have already rsvp' if all sessions are RSVP'd", () => {
    render(
      <SessionPicker
        sessions={mockSessions}
        churchSlug="grace-church"
        churchName="Grace Church"
        brandColour="#4F46E5"
        existingRsvpedSessionIds={["sess_1", "sess_2"]}
      />
    );

    const morningBtn = screen.getByText("Morning Worship").closest("button");
    const afternoonBtn = screen.getByText("Afternoon Workshop").closest("button");
    
    expect(morningBtn).toBeDisabled();
    expect(afternoonBtn).toBeDisabled();
    
    expect(screen.getByText("this event you have already rsvp")).toBeInTheDocument();
  });
});
