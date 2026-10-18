/**
 * Interview video events (src/lib/videoTracking.ts): the play / minutes-watched logic, and
 * the wiring from Bunny's player.js postMessages to fbq + gtag.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { Markdown } from "@/site/Markdown";
import { BUNNY_ORIGIN, createWatchTracker, resetVideoTrackingForTests } from "@/lib/videoTracking";

const GUID = "0b3a6f1e-2c4d-4e5f-8a9b-1c2d3e4f5a6b";

describe("createWatchTracker", () => {
  const run = (t: ReturnType<typeof createWatchTracker>, from: number, to: number) => {
    for (let x = from; x <= to; x += 0.25) t.time(x);
  };

  it("fires play once, then 2, 5 and 15 minutes once each", () => {
    const onPlay = vi.fn();
    const onMark = vi.fn();
    const t = createWatchTracker({ onPlay, onMark });
    run(t, 0, 119);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onMark).not.toHaveBeenCalled();
    run(t, 119, 121);
    expect(onMark.mock.calls).toEqual([["InterviewVideo2Min"]]);
    run(t, 121, 1000);
    expect(onMark.mock.calls).toEqual([["InterviewVideo2Min"], ["InterviewVideo5Min"], ["InterviewVideo15Min"]]);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("does not count a seek ahead as watching", () => {
    const onMark = vi.fn();
    const t = createWatchTracker({ onPlay: () => {}, onMark });
    t.time(0);
    t.time(1000);
    run(t, 1000, 1010);
    expect(onMark).not.toHaveBeenCalled();
  });

  it("counts from where a t= link starts", () => {
    const onMark = vi.fn();
    const t = createWatchTracker({ onPlay: () => {}, onMark });
    run(t, 2067, 2067 + 121);
    expect(onMark.mock.calls).toEqual([["InterviewVideo2Min"]]);
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

  it("subscribes on ready and reports play and 2 minutes once each", () => {
    const { container } = render(<Markdown>{`https://iframe.mediadelivery.net/embed/782699/${GUID}`}</Markdown>);
    const frame = container.querySelector("iframe")!;
    const sent = vi.spyOn(frame.contentWindow!, "postMessage");
    post(frame, { context: "player.js", event: "ready", value: {} });
    expect(sent.mock.calls.map((c) => JSON.parse(c[0] as string).value)).toEqual(["play", "timeupdate"]);

    for (let s = 0; s <= 130; s += 0.25) post(frame, { context: "player.js", event: "timeupdate", value: { seconds: s, duration: 4000 } });
    post(frame, { context: "player.js", event: "play" });

    const params = { content_name: "six-yogas-naropa", video_id: GUID };
    expect(fbq.mock.calls).toEqual([
      ["trackCustom", "InterviewVideoPlay", params],
      ["trackCustom", "InterviewVideo2Min", params],
    ]);
    expect(gtag.mock.calls).toEqual([
      ["event", "interview_video_play", params],
      ["event", "interview_video_2min", params],
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
