/**
 * CourseRecordings - the players must survive a re-render.
 *
 * A participant reported (2026-09-07) that on the phone every video on the
 * course page reset to the start whenever they switched back to the browser.
 * Cause: the per-recording component was declared inside CourseRecordings, so
 * each render produced a new component type and React rebuilt every iframe.
 * This test re-renders the section with equal props and checks that the very
 * same iframe DOM nodes are still there.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import CourseRecordings from "@/components/course/CourseRecordings";
import type { CourseRecording } from "@/hooks/useCourseContent";

vi.mock("@/lib/analytics", () => ({ trackVideoView: vi.fn() }));

const recording = (n: number, week: number | null): CourseRecording => ({
  id: `rec-${n}`,
  course_id: "course-1",
  week_number: week,
  session_type: n % 2 ? "main" : "clarification",
  title: `Session ${n}`,
  embed_type: "bunny",
  embed_url: `https://iframe.mediadelivery.net/embed/718352/video-${n}`,
  sort_order: n,
});

function iframesOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll("iframe"));
}

describe("CourseRecordings keeps its players across re-renders", () => {
  it("weekly (accordion) layout: same iframe nodes after a re-render", () => {
    const recs = [recording(1, 1), recording(2, 1), recording(3, 2)];
    const { container, rerender } = render(
      <CourseRecordings recordings={recs} courseId="course-1" />
    );
    const before = iframesOf(container);
    expect(before).toHaveLength(3);

    // Equal props, new array identity - what a refetch or a context update produces
    rerender(<CourseRecordings recordings={[...recs]} courseId="course-1" />);

    const after = iframesOf(container);
    expect(after).toHaveLength(3);
    after.forEach((node, i) => expect(node).toBe(before[i]));
  });

  it("ungrouped (plain list) layout: same iframe nodes after a re-render", () => {
    const recs = [recording(1, null), recording(2, null)];
    const { container, rerender } = render(
      <CourseRecordings recordings={recs} courseId="course-1" />
    );
    const before = iframesOf(container);
    expect(before).toHaveLength(2);

    rerender(<CourseRecordings recordings={[...recs]} courseId="course-1" />);

    const after = iframesOf(container);
    after.forEach((node, i) => expect(node).toBe(before[i]));
  });
});
