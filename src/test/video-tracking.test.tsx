/**
 * Interview video events (src/lib/videoTracking.ts): the play / 50% logic, and
 * the wiring from Bunny's player.js postMessages to fbq + gtag.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { Markdown } from "@/site/Markdown";
import { BUNNY_ORIGIN, createWatchTracker, resetVideoTrackingForTests } from "@/lib/videoTracking";

const GUID = "0b3a6f1e-2c4d-4e5f-8a9b-1c2d3e4f5a6b";

describe("createWatchTracker", () => {
  it("fires play once and 50% once watched time reaches half", () => {
    const onPlay = vi.fn();
    const onHalf = vi.fn();
    const t = createWatchTracker({ onPlay, onHalf });
    for (let s = 0; s <= 49; s += 0.25) t.time(s, 100);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onHalf).not.toHaveBeenCalled();
    for (let s = 49; s <= 52; s += 0.25) t.time(s, 100);
    expect(onHalf).toHaveBeenCalledTimes(1);
    for (let s = 52; s <= 60; s += 0.25) t.time(s, 100);
    expect(onHalf).toHaveBeenCalledTimes(1);
  });

  it("does not count a seek ahead as watching", () => {
    const onHalf = vi.fn();
    const t = createWatchTracker({ onPlay: () => {}, onHalf });
    t.time(0, 100);
    t.time(80, 100);
    t.time(80.25, 100);
    expect(onHalf).not.toHaveBeenCalled();
  });

  it("measures half of what is left when the video opens mid-way (t=)", () => {
    const onHalf = vi.fn();
    const t = createWatchTracker({ onPlay: () => {}, onHalf });
    for (let s = 60; s <= 79; s += 0.25) t.time(s, 100);
    expect(onHalf).not.toHaveBeenCalled();
    for (let s = 79; s <= 81; s += 0.25) t.time(s, 100);
    expect(onHalf).toHaveBeenCalledTimes(1);
  });
});

describe("Bunny embed events", () => {
  const fbq = vi.fn();
  const gtag = vi.fn();
  beforeEach(() => {
    resetVideoTrackingForTests();
    fbq.mockReset();
    gtag.mockReset();
    (window as any).fbq = fbq;
    (window as any).gtag = gtag;
    window.history.replaceState(null, "", "/articles/six-yogas-naropa");
  });
  afterEach(() => {
    delete (window as any).fbq;
    delete (window as any).gtag;
  });

  const post = (frame: HTMLIFrameElement, data: unknown, origin = BUNNY_ORIGIN) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", { data: JSON.stringify(data), origin, source: frame.contentWindow }),
      );
    });

  it("subscribes on ready and reports play and 50% once each", () => {
    const { container } = render(<Markdown>{`https://iframe.mediadelivery.net/embed/782699/${GUID}`}</Markdown>);
    const frame = container.querySelector("iframe")!;
    const sent = vi.spyOn(frame.contentWindow!, "postMessage");
    post(frame, { context: "player.js", event: "ready", value: {} });
    expect(sent.mock.calls.map((c) => JSON.parse(c[0] as string).value)).toEqual(["play", "timeupdate"]);

    for (let s = 0; s <= 60; s += 0.25) post(frame, { context: "player.js", event: "timeupdate", value: { seconds: s, duration: 100 } });
    post(frame, { context: "player.js", event: "play" });

    const params = { content_name: "six-yogas-naropa", video_id: GUID };
    expect(fbq.mock.calls).toEqual([
      ["trackCustom", "InterviewVideoPlay", params],
      ["trackCustom", "InterviewVideo50", params],
    ]);
    expect(gtag.mock.calls).toEqual([
      ["event", "interview_video_play", params],
      ["event", "interview_video_50", params],
    ]);
  });

  it("ignores messages from other origins", () => {
    const { container } = render(<Markdown>{`https://iframe.mediadelivery.net/embed/782699/${GUID}`}</Markdown>);
    const frame = container.querySelector("iframe")!;
    post(frame, { context: "player.js", event: "play" }, "https://evil.example");
    expect(fbq).not.toHaveBeenCalled();
  });

  it("stays silent on the admin", () => {
    window.history.replaceState(null, "", "/admin/x");
    const { container } = render(<Markdown>{`https://iframe.mediadelivery.net/embed/782699/${GUID}`}</Markdown>);
    post(container.querySelector("iframe")!, { context: "player.js", event: "play" });
    expect(fbq).not.toHaveBeenCalled();
    expect(gtag).not.toHaveBeenCalled();
  });
});
