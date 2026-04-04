import { render, screen } from "@testing-library/react";
import { EventCard } from "./EventCard";
import type { Event } from "@sanctuary/db";

const mockEvent: Event = {
  id: "evt_1",
  churchId: "ch_1",
  title: "Sunday Conference 2025",
  description: null,
  bannerUrl: null,
  location: "Main Auditorium",
  latitude: null,
  longitude: null,
  category: "conference",
  startsAt: new Date("2025-06-15T10:00:00Z"),
  endsAt: new Date("2025-06-15T12:00:00Z"),
  capacity: 500,
  rsvpRequired: true,
  isPublic: true,
  createdAt: new Date(),
};

describe("EventCard", () => {
  it("renders the event title", () => {
    render(<EventCard event={mockEvent} churchSlug="grace-church" />);
    expect(screen.getByText("Sunday Conference 2025")).toBeInTheDocument();
  });

  it("renders the event location", () => {
    render(<EventCard event={mockEvent} churchSlug="grace-church" />);
    expect(screen.getByText("Main Auditorium")).toBeInTheDocument();
  });

  it("links to the correct event URL", () => {
    render(<EventCard event={mockEvent} churchSlug="grace-church" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/grace-church/events/evt_1");
  });

  it("renders without a banner image when bannerUrl is null", () => {
    render(<EventCard event={mockEvent} churchSlug="grace-church" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
