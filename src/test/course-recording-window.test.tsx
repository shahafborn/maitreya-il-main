/**
 * CourseRecordings - availability window (course_recordings.available_until).
 *
 * NULL/missing = no limit (every recording before this feature). A future
 * value shows the player plus a small "available until" line; once the moment
 * passes the player is replaced by a short note - and an open page flips on
 * its own, without a reload.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import CourseRecordings from "@/components/course/CourseRecordings";
import type { CourseRecording } from "@/hooks/useCourseContent";
import { formatAvailableUntil } from "@/lib/recordingWindow";

vi.mock("@/lib/analytics", () => ({ trackVideoView: vi.fn() }));

// Saturday 3 Oct 2026, 12:00 Israel time (IDT, UTC+3)
const NOW = new Date("2026-10-03T12:00:00+03:00");
const LATER_TODAY = "2026-10-03T20:00:00+03:00"; // still open
const THIS_MORNING = "2026-10-03T09:00:00+03:00"; // already closed

const HE_NOTE = "ההקלטה הייתה זמינה ל-24 שעות בלבד.";
const EN_NOTE = "The recording was available for 24 hours only.";

const recording = (availableUntil: string | null | undefined): CourseRecording =>
  ({
    id: "rec-1",
    course_id: "course-1",
    week_number: null,
    session_type: "main",
    title: "Initiation day 1",
    embed_type: "bunny",
    embed_url: "https://iframe.mediadelivery.net/embed/718352/video-1",
    sort_order: 1,
    available_until: availableUntil,
  }) as CourseRecording;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CourseRecordings availability window", () => {
  it("no available_until: the player, no extra line", () => {
    const { container } = render(
      <CourseRecordings recordings={[recording(null)]} courseId="course-1" dir="rtl" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.queryByText(/זמינה לצפייה עד/)).toBeNull();
    expect(screen.queryByText(HE_NOTE)).toBeNull();
  });

  it("column missing on the database (undefined) behaves like no limit", () => {
    const { container } = render(
      <CourseRecordings recordings={[recording(undefined)]} courseId="course-1" dir="rtl" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.queryByText(/זמינה לצפייה עד/)).toBeNull();
  });

  it("future available_until on an RTL course: player + Hebrew 'available until' line", () => {
    const { container } = render(
      <CourseRecordings recordings={[recording(LATER_TODAY)]} courseId="course-1" dir="rtl" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.getByText("זמינה לצפייה עד שבת 3.10 בשעה 20:00")).toBeInTheDocument();
    expect(screen.queryByText(/Available until/)).toBeNull();
  });

  it("future available_until on an LTR course: player + English line", () => {
    const { container } = render(
      <CourseRecordings recordings={[recording(LATER_TODAY)]} courseId="course-1" dir="ltr" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.getByText("Available until Sat 3 Oct, 20:00 Israel time")).toBeInTheDocument();
  });

  it("past available_until on an RTL course: no player, Hebrew + English note, title kept", () => {
    const { container } = render(
      <CourseRecordings recordings={[recording(THIS_MORNING)]} courseId="course-1" dir="rtl" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(screen.getByText("Initiation day 1")).toBeInTheDocument();
    expect(screen.getByText(HE_NOTE)).toBeInTheDocument();
    expect(screen.getByText(EN_NOTE)).toBeInTheDocument();
  });

  it("past available_until on an LTR course: English note only", () => {
    const { container } = render(
      <CourseRecordings recordings={[recording(THIS_MORNING)]} courseId="course-1" dir="ltr" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(screen.getByText(EN_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(HE_NOTE)).toBeNull();
  });

  it("an open page flips to the note when the window closes, without a reload", () => {
    const closesSoon = new Date(NOW.getTime() + 30_000).toISOString();
    const { container } = render(
      <CourseRecordings recordings={[recording(closesSoon)]} courseId="course-1" dir="rtl" />
    );
    expect(container.querySelectorAll("iframe")).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(screen.getByText(HE_NOTE)).toBeInTheDocument();
  });
});

describe("formatAvailableUntil", () => {
  it("uses Israel time and a 24h clock whatever the viewer's zone", () => {
    // 21:30 UTC on Sun 4 Oct = 00:30 Mon 5 Oct in Israel
    expect(formatAvailableUntil("2026-10-04T21:30:00Z", "rtl")).toBe(
      "זמינה לצפייה עד שני 5.10 בשעה 00:30"
    );
    expect(formatAvailableUntil("2026-10-04T21:30:00Z", "ltr")).toBe(
      "Available until Mon 5 Oct, 00:30 Israel time"
    );
  });
});
