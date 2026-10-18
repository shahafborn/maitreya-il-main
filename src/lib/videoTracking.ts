/**
 * "Watched an interview" events for the Bunny Stream players in the articles
 * (src/site/Markdown.tsx, BunnyEmbed). Meta cannot see inside the Bunny iframe,
 * so the page reports two custom events itself, for retargeting audiences:
 *
 * - `InterviewVideoPlay`    (GA4: `interview_video_play`)  - playback started;
 * - `InterviewVideo2Min`    (GA4: `interview_video_2min`)  - 2 minutes watched;
 * - `InterviewVideo5Min`    (GA4: `interview_video_5min`)  - 5 minutes watched;
 * - `InterviewVideo15Min`   (GA4: `interview_video_15min`) - 15 minutes watched.
 * (Shahaf, 18.10.2026: time watched instead of a 50% mark - the interviews run
 * an hour, so "half" was a very high bar and meant different things per video.)
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
 * "Watched" means seconds actually played, summing the small forward steps
 * between updates, so seeking ahead does not count; a link with `t=` that
 * opens mid-video counts from where it starts.
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

/** Minutes-watched marks: seconds of real watching -> pixel event name. */
export const WATCH_MARKS = [
  { seconds: 120, event: "InterviewVideo2Min", ga: "interview_video_2min" },
  { seconds: 300, event: "InterviewVideo5Min", ga: "interview_video_5min" },
  { seconds: 900, event: "InterviewVideo15Min", ga: "interview_video_15min" },
] as const;

export type VideoEvent = "InterviewVideoPlay" | (typeof WATCH_MARKS)[number]["event"];

/**
 * Pure play / time-watched logic for one player. Feed it player events; it
 * calls `onPlay` once and `onMark` once per WATCH_MARKS entry reached.
 */
export function createWatchTracker(cb: { onPlay: () => void; onMark: (event: VideoEvent) => void }) {
  let played = false;
  let last: number | null = null;
  let watched = 0;
  let next = 0; // index of the next mark in WATCH_MARKS
  const play = () => {
    if (played) return;
    played = true;
    cb.onPlay();
  };
  return {
    play,
    time(seconds: number) {
      if (!Number.isFinite(seconds)) return;
      play();
      if (last !== null) {
        const step = seconds - last;
        // Normal playback moves ~0.25s per update; a bigger jump is a seek.
        if (step > 0 && step <= 2) watched += step;
      }
      last = seconds;
      while (next < WATCH_MARKS.length && watched >= WATCH_MARKS[next].seconds) {
        cb.onMark(WATCH_MARKS[next].event);
        next++;
      }
    },
  };
}

/** Events already sent on this page view, as `<path>|<video>|<event>`. */
const sent = new Set<string>();
let sentPath = "";

function sendOnce(event: VideoEvent, videoId: string) {
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
  const ga = WATCH_MARKS.find((m) => m.event === event)?.ga ?? "interview_video_play";
  window.gtag?.("event", ga, params);
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
      onMark: (event) => sendOnce(event, videoId),
    });
    const onMessage = (e: MessageEvent) => {
      const frame = ref.current?.contentWindow;
      if (e.origin !== BUNNY_ORIGIN || !frame || e.source !== frame) return;
      let msg: { context?: string; event?: string; value?: { seconds?: number } };
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
        tracker.time(Number(msg.value.seconds));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [ref, videoId]);
}
