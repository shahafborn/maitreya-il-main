/**
 * Social-share image for an article: the post's picture with a white strip under it
 * holding the article's name (the title up to the first " - ") and the Sangha logo.
 * 1200x630 JPEG -> public/media/articles/share/<slug>.jpg (the `image` frontmatter field).
 *
 * Usage:
 *   node scripts/share-image.mjs <slug> <picture, path from the repo root> [focus-y 0-100, default 50]
 *   node scripts/share-image.mjs six-yogas-naropa-tantric-theater-inner-fire public/media/articles/tummo-yogi-mural.jpg 0
 * focus-y moves the crop: 0 = keep the top of the picture, 100 = the bottom.
 * Fonts: Frank Ruhl Libre (the site's heading font) from Google Fonts, so it needs a network.
 * Look at the result before deploying; a long name is shrunk to fit one line.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ROOT } from "./site-routes.mjs";

const [slug, picture, focus = "50"] = process.argv.slice(2);
if (!slug || !picture) {
  console.error("usage: node scripts/share-image.mjs <slug> <picture, path from the repo root> [focus-y]");
  process.exit(1);
}
const md = fs.readFileSync(path.join(ROOT, "content/he/articles", `${slug}.md`), "utf8");
const title = (md.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? "").split(" - ")[0].trim();
const pic = fs.readFileSync(path.join(ROOT, picture)).toString("base64");
const logo = fs.readFileSync(path.join(ROOT, "src/assets/maitreya-logo.png")).toString("base64");
const ext = path.extname(picture).slice(1).replace("jpg", "jpeg");

const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&display=block" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#fff}
  .pic{width:1200px;height:500px;object-fit:cover;object-position:50% ${Number(focus)}%;display:block}
  .strip{height:130px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;box-sizing:border-box;gap:32px}
  .t{font-family:"Frank Ruhl Libre",serif;font-weight:700;color:hsl(220 60% 20%);font-size:58px;line-height:1.1;white-space:nowrap}
  .logo{height:78px}
</style></head><body>
<img class="pic" src="data:image/${ext};base64,${pic}">
<div class="strip"><div class="t" id="t"></div><img class="logo" src="data:image/png;base64,${logo}"></div>
<script>document.getElementById("t").textContent = ${JSON.stringify(title)};</script>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await document.fonts.ready;
  const t = document.getElementById("t");
  const room = document.querySelector(".strip").clientWidth - document.querySelector(".logo").clientWidth - 96 - 32;
  let size = 58;
  while (t.scrollWidth > room && size > 30) t.style.fontSize = `${--size}px`;
});
const out = path.join(ROOT, "public/media/articles/share", `${slug}.jpg`);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, type: "jpeg", quality: 85 });
await browser.close();
console.log(`${out}  (${title})`);
