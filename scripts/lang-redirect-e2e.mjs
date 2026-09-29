/**
 * End-to-end check of the language redirect on the BUILT site (dist/), in a real
 * browser: a phone abroad with an English browser, an Israeli phone, an Israeli
 * abroad with a Hebrew phone, a visitor who picked Hebrew, and a crawler.
 *
 *   npm run build   (or: vite build)
 *   node scripts/lang-redirect-e2e.mjs
 *
 * Playwright marks its browser as automated (navigator.webdriver), which the
 * redirect deliberately ignores - so the "human" cases unset that flag first.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { DIST } from "./site-routes.mjs";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://x");
      let file = path.join(DIST, decodeURIComponent(url.pathname));
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const CASES = [
  { name: "abroad, English phone, home", tz: "Europe/London", locale: "en-GB", path: "/", expect: "/en" },
  { name: "abroad, English phone, Six Yogas + ad link", tz: "America/New_York", locale: "en-US", path: "/events/six-yogas-niguma-retreat?utm_source=fb&fbclid=1", expect: "/events/en/six-yogas-niguma-retreat?utm_source=fb&fbclid=1" },
  { name: "abroad, Hebrew-only page", tz: "Europe/Berlin", locale: "de-DE", path: "/weekly-practice", expect: "/weekly-practice" },
  { name: "abroad, test link", tz: "Europe/London", locale: "en-GB", path: "/events/six-yogas-niguma-retreat?test=abc", expect: "/events/six-yogas-niguma-retreat?test=abc" },
  { name: "Israel, English phone", tz: "Asia/Jerusalem", locale: "en-US", path: "/", expect: "/" },
  { name: "Israeli abroad, Hebrew phone", tz: "Europe/Prague", locale: "he-IL", path: "/about", expect: "/about" },
  { name: "abroad, picked Hebrew before", tz: "Europe/London", locale: "en-GB", path: "/", pref: "he", expect: "/" },
  { name: "Googlebot", tz: "America/Los_Angeles", locale: "en-US", path: "/", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", expect: "/" },
];

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let failed = 0;
for (const c of CASES) {
  const context = await browser.newContext({ timezoneId: c.tz, locale: c.locale, userAgent: c.ua || PHONE_UA, viewport: { width: 375, height: 812 } });
  await context.addInitScript((pref) => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    if (pref) localStorage.setItem("maitreya-lang", pref);
  }, c.pref || null);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(origin + c.path, { waitUntil: "networkidle" });
  const u = new URL(page.url());
  const got = u.pathname + u.search;
  const ok = got === c.expect && errors.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}: ${c.path} -> ${got}${ok ? "" : `  (expected ${c.expect})`}${errors.length ? "  errors: " + errors.join(" | ") : ""}`);
  await context.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
