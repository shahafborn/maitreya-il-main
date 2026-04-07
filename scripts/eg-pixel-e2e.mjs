import { chromium } from "playwright";

const LP = "https://maitreya.org.il/p/events/ein-gedi-healing-retreat/";
const SUCCESS_URL = "https://maitreya.org.il/p/events/ein-gedi-healing-retreat/?payment=success";
const N8N_WEBHOOK = "https://tknstk.app.n8n.cloud/webhook/EinGedi_Register";

const pixelHits = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();

// Capture every Meta pixel hit
page.on("request", (req) => {
  const url = req.url();
  if (url.includes("facebook.com/tr")) {
    const u = new URL(url);
    let ev = u.searchParams.get("ev");
    let eid = u.searchParams.get("eid");
    let value = u.searchParams.get("cd[value]");
    if (req.method() === "POST" && !ev) {
      const body = req.postData() || "";
      // Parse multipart/form-data
      const get = (name) => {
        const re = new RegExp(`name="${name.replace(/[[\]]/g, "\\$&")}"\\r?\\n\\r?\\n([^\\r\\n]*)`, "i");
        const m = body.match(re);
        return m ? m[1] : null;
      };
      ev = ev || get("ev");
      eid = eid || get("eid");
      value = value || get("cd\\[value\\]");
    }
    pixelHits.push({ method: req.method(), ev, eid, id: u.searchParams.get("id"), value });
  }
  if (url.includes("tknstk.app.n8n.cloud")) {
    console.log(`[req] ${req.method()} ${url}`);
  }
});

page.on("console", (msg) => {
  if (msg.type() === "error") console.log(`[page-err] ${msg.text()}`);
});
page.on("pageerror", (err) => console.log(`[page-error] ${err.message}`));

// Intercept the n8n webhook to short-circuit CardCom and redirect right back
// to the LP with ?payment=success - this preserves sessionStorage so the
// Purchase event_id flows through deterministically.
await page.route(N8N_WEBHOOK, async (route) => {
  const req = route.request();
  let regToken = "unknown";
  try {
    const body = JSON.parse(req.postData() || "{}");
    regToken = body.reg_token || "missing";
  } catch {}
  console.log(`[stub] n8n webhook called, reg_token=${regToken}`);
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ cardcom_url: SUCCESS_URL }),
  });
});

console.log("[step] navigating to LP");
await page.goto(LP, { waitUntil: "networkidle" });

console.log("[step] waiting for any 'register' button to be visible");
// Click the first registration trigger - try a couple of selectors
const buttonCandidates = [
  'button:has-text("הרשמה")',
  'button:has-text("הזמן")',
  'button:has-text("ההרשמה")',
  'a:has-text("הרשמה")',
];
let opened = false;
for (const sel of buttonCandidates) {
  const el = page.locator(sel).first();
  if ((await el.count()) > 0) {
    try {
      await el.click({ timeout: 2000 });
      opened = true;
      console.log(`[step] clicked ${sel}`);
      break;
    } catch {}
  }
}
if (!opened) {
  console.log("[warn] could not find a registration button via text - dumping buttons");
  const all = await page.locator("button").allTextContents();
  console.log(all.slice(0, 20));
  process.exit(1);
}

// Wait for the modal - it's a Radix Dialog
await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
const modal = page.locator('[role="dialog"]').first();
console.log("[step] modal open, filling form");

const inputs = modal.locator("input");
const inputCount = await inputs.count();
console.log(`[debug] modal has ${inputCount} inputs`);

await inputs.nth(0).fill("Synth");
await inputs.nth(1).fill("Tester");
await modal.locator('input[type="email"]').fill("shahafb+e2e@gmail.com");
await modal.locator('input[type="tel"]').fill("0501234567");

// Fill all selects with first non-empty option
const selects = await modal.locator("select").all();
console.log(`[debug] modal has ${selects.length} selects`);
for (const s of selects) {
  const opts = await s.locator("option").all();
  for (const o of opts) {
    const v = await o.getAttribute("value");
    if (v) {
      await s.selectOption(v);
      break;
    }
  }
}

// Gender radio buttons
const genderRadio = modal.locator('input[type="radio"][name="gender"]').first();
await genderRadio.check();

// Terms checkbox - check all checkboxes in the modal
const checkboxes = await modal.locator('input[type="checkbox"]').all();
for (const c of checkboxes) await c.check();

// Textareas
const textareas = await modal.locator("textarea").all();
for (const t of textareas) await t.fill("e2e test");

console.log("[step] submitting form");
const submitBtn = modal.locator('button[type="submit"]').first();
await submitBtn.click();

// Pause to observe what happens
await page.waitForTimeout(3000);

// Look for visible validation errors in the modal
const errs = await modal.locator(".text-red-500, .text-red-400").allTextContents();
if (errs.length) console.log("[validation-errors]", errs);

// Wait for the redirect to ?payment=success (triggered by the stub)
await page.waitForURL(/payment=success/, { timeout: 10000 });
console.log("[step] landed on ?payment=success");

// Give the useEffect time to fire the Purchase pixel
await page.waitForTimeout(2000);

console.log("\n=== PIXEL HITS ===");
for (const h of pixelHits) {
  console.log(JSON.stringify(h));
}

const ic = pixelHits.find((h) => h.ev === "InitiateCheckout");
const purchase = pixelHits.find((h) => h.ev === "Purchase");

console.log("\n=== ASSERTIONS ===");
console.log("InitiateCheckout fired:", !!ic, ic?.eid);
console.log("Purchase fired:        ", !!purchase, purchase?.eid);

let pass = true;
if (!ic) { console.log("FAIL: no InitiateCheckout"); pass = false; }
if (!purchase) { console.log("FAIL: no Purchase"); pass = false; }
if (ic && purchase) {
  const icToken = ic.eid?.replace(/^ic-/, "");
  const pToken = purchase.eid?.replace(/^purchase-/, "");
  if (icToken && pToken && icToken === pToken) {
    console.log(`PASS: IC and Purchase share reg_token ${icToken}`);
  } else {
    console.log(`FAIL: token mismatch ic=${icToken} purchase=${pToken}`);
    pass = false;
  }
  if (!ic.eid?.startsWith("ic-")) { console.log("FAIL: IC eid not in ic-<token> format"); pass = false; }
  if (!purchase.eid?.startsWith("purchase-")) { console.log("FAIL: Purchase eid not in purchase-<token> format"); pass = false; }
}

await browser.close();
process.exit(pass ? 0 : 1);
