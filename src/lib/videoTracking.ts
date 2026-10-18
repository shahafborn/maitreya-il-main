/**
 * "Watched an interview" events for the Bunny Stream players in the articles
 * (src/site/Markdown.tsx, BunnyEmbed). Meta cannot see inside the Bunny iframe,
 * so the page reports two custom events itself, for retargeting audiences:
 *
 * - `InterviewVideoPlay` (GA4: `interview_video_play`) - playback started;
 * - `InterviewVideo50`   (GA4: `interview_video_50`)   - half the video watched.
 *
 * Params: `content_name` (the article slug) and `video_id` (Bunny video GUID).
 * No personal data. Each fires once per video per page view, even when one
 * article embeds the same video twice (e.g. a second link with `t=`).
 *
 * How the player talks to us (verified live 18.10.2026, and in Bunny's
 * "Playback control API" docs): the iframe speaks the player.js protocol over
 * postMessage. It posts `{"context":"player.js","event":"ready","value":{events,...}}`;
 * the page then subscribes by posting `{"method":"addEventListener","value":"timeupdate"}`
 * back, and receives `{"event":"timeupdate","value":{"seconds","duration"}}`
 * about four times a second while playing.
 * Quirk: with `preload=false` the player posts `ready` only once the visitor
 * presses play, so the `play` event is already over by the time we subscribe.
 * The first `timeupdate` therefore also counts as "played".
 *
 * "50%" means: seconds actually watched (summing the small forward steps
 * between updates, so seeking ahead does not count) reach half of what was
 * left from where the visitor started - a link with `t=` that opens mid-video
 * can still reach it.
 *
 * Never fires inside an iframe (the Cardcom payment iframe climbs out to the
 * full page), on the admin, or in the build's pre-render (headless browser) -
 * the same guards as the first-load page_view in index.html.
 */
import { useEffect, type RefObject } from "react";
import { trackMetaCustom } from "./metaPixel";

export const BUNNY_ORIGIN = "https://iframe.mediadelivery.net";

/** False where analytics must stay silent (see the file header). */
export function videoTrackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.top !== window.self) return false;
  if (window.location.pathname.startsWith("/admin")) return false;
  if (navigator.webdriver) return false;
  return true;
}

/**
 * Pure play / 50% logic for one player. Feed it player events; it calls
 * `onPlay` once and `onHalf` once.
 */
export function createWatchTracker(cb: { onPlay: () => void; onHalf: () => void }) {
  let played = false;
  let half = false;
  let startAt: number | null = null;
  let last: number | null = null;
  let watched = 0;
  const play = () => {
    if (played) return;
    played = true;
    cb.onPlay();
  };
  return {
    play,
    time(seconds: number, duration: number) {
      if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) return;
      play();
      if (startAt === null) startAt = seconds;
      if (last !== null) {
        const step = seconds - last;
        // Normal playback moves ~0.25s per update; a bigger jump is a seek.
        if (step > 0 && step <= 2) watched += step;
      }
      last = seconds;
      if (!half && watched >= (duration - startAt) / 2) {
        half = true;
        cb.onHalf();
      }
    },
  };
}

/** Events already sent on this page view, as `<path>|<video>|<event>`. */
const sent = new Set<string>();
let sentPath = "";

function sendOnce(event: "InterviewVideoPlay" | "InterviewVideo50", videoId: string) {
  const path = window.location.pathname;
  if (path !== sentPath) {
    sent.clear(); // a new page view (in-app navigation)
    sentPath = path;
  }
  const key = `${videoId}|${event}`;
  if (sent.has(key)) return;
  sent.add(key);
  const slug = decodeURIComponent(path.replace(/\/+$/, "").split("/").pop() || "");
  const params = { content_name: slug, video_id: videoId };
  trackMetaCustom(event, params);
  window.gtag?.("event", event === "InterviewVideoPlay" ? "interview_video_play" : "interview_video_50", params);
}

/** Test hook: forget what was sent (a fresh page view). */
export function resetVideoTrackingForTests() {
  sent.clear();
  sentPath = "";
}

/**
 * Wires one Bunny iframe to the events above.
 *
 * @example
 * const ref = useRef<HTMLIFrameElement>(null);
 * useBunnyVideoTracking(ref, videoGuid);
 * return <iframe ref={ref} src={`${BUNNY_ORIGIN}/embed/${lib}/${videoGuid}`} />;
 */
export function useBunnyVideoTracking(ref: RefObject<HTMLIFrameElement>, videoId: string) {
  useEffect(() => {
    if (!videoTrackingAllowed()) return;
    const tracker = createWatchTracker({
      onPlay: () => sendOnce("InterviewVideoPlay", videoId),
      onHalf: () => sendOnce("InterviewVideo50", videoId),
    });
    const onMessage = (e: MessageEvent) => {
      const frame = ref.current?.contentWindow;
      if (e.origin !== BUNNY_ORIGIN || !frame || e.source !== frame) return;
      let msg: { context?: string; event?: string; value?: { seconds?: number; duration?: number } };
      try {
        msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!msg || msg.context !== "player.js") return;
      if (msg.event === "ready") {
        for (const ev of ["play", "timeupdate"]) {
          frame.postMessage(
            JSON.stringify({ context: "player.js", version: "0.0.11", method: "addEventListener", value: ev, listener: ev }),
            BUNNY_ORIGIN,
          );
        }
      } else if (msg.event === "play") {
        tracker.play();
      } else if (msg.event === "timeupdate" && msg.value) {
        tracker.time(Number(msg.value.seconds), Number(msg.value.duration));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [ref, videoId]);
}
