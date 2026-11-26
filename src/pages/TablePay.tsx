/**
 * QR payment pages for the December 2026 retreats (Shahaf, 2026-11-24)
 * ===================================================================
 *
 * Printed A4 signs at the retreats carry a QR code to one of these pages:
 *   - a donation per retreat (open amount): Antakarana Tel Aviv 2-4.12, Ein Gedi 6-12.12
 *   - the book table (same signs at both retreats), with a copies count:
 *     How to Find the Buddha within You (Louis Hebert) 45, Introduction to Tantra
 *     Hebrew 65, Introduction to Tantra English 65 (was 75 until 26.11.2026).
 * Each page in Hebrew (/qr/<slug>) and English (/en/qr/<slug>). Hidden: noindex,
 * out of the sitemap, linked from nowhere but the signs.
 *
 * Payment: POST -> n8n `Table_Pay` (re-checks the item, price, copies and amount
 * itself) -> Cardcom page shown in place -> `Table_Pay_Paid` -> row on the `table`
 * tab of the visit support spreadsheet. Shekels everywhere, card or Bit.
 * No Meta/GA purchase events: table sales must not mix into the ad numbers.
 *
 * Test: ?test=t7q2 swaps the item for the hidden 1 NIS `TABLE_TEST`.
 * Spec + signs (vault): W-work/ventures/maitreya-sangha/projects/teachers-visit-nov-dec-2026/qr-signs/
 * Retire after 12.12.2026 (routes here, App.tsx, site-routes.mjs; deactivate both flows).
 */
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Minus, Plus, XCircle } from "lucide-react";
import { SiteLayout } from "@/site/SiteLayout";
import { usePaymentReturn } from "@/components/retreat/hooks/usePaymentReturn";
import logo from "@/assets/maitreya-logo.png";

const WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/Table_Pay";
const TEST_KEY = "t7q2";
const MAX_COPIES = 20;
const ORDER_KEY = "tablepay-last-order";

type Lang = "he" | "en";
type Text = Record<Lang, string>;

export interface TableItem {
  slug: string;
  code: string;
  /** Fixed price per copy (books). Donations have none: the donor types the amount. */
  price?: number;
  kicker: Text;
  title: Text;
  /** Lines under the title (retreat name, place and dates / author and edition). */
  lines: Text[];
}

const DANA_KICKER: Text = { he: "דאנה · נדיבות", en: "Dana · Generosity" };
const BOOK_KICKER: Text = { he: "שולחן הספרים", en: "Book table" };

export const TABLE_ITEMS: TableItem[] = [
  {
    slug: "dana-antakarana",
    code: "TABLE_DANA_HKR",
    kicker: DANA_KICKER,
    title: { he: "תרומה לריטריט", en: "Support the retreat" },
    lines: [
      { he: "תרגולי מדיטציה וקונדליני לריפוי", en: "Tantric Meditations and Kundalini Practices for Healing" },
      { he: "עם לאמה גלן מולין ודרופון צ׳ונגוואל-לה", en: "with Lama Glenn Mullin and Drupon Chongwol-la" },
      { he: "אנטאקראנה, תל אביב · ⁦2-4.12⁩", en: "Antakarana, Tel Aviv · December 2-4" },
    ],
  },
  {
    slug: "dana-ein-gedi",
    code: "TABLE_DANA_EGN",
    kicker: DANA_KICKER,
    title: { he: "תרומה לריטריט", en: "Support the retreat" },
    lines: [
      { he: "שש היוגות של ניגומה", en: "The Six Yogas of Niguma" },
      { he: "עם לאמה גלן מולין ודרופון צ׳ונגוואל-לה", en: "with Lama Glenn Mullin and Drupon Chongwol-la" },
      { he: "בית ספר שדה עין גדי · ⁦6-12.12⁩", en: "Ein Gedi Field School · December 6-12" },
    ],
  },
  {
    slug: "book-buddhism",
    code: "TABLE_BOOK_BUDDHA",
    price: 45,
    kicker: BOOK_KICKER,
    title: { he: "How to Find the Buddha within You", en: "How to Find the Buddha within You" },
    lines: [
      { he: "Buddhism in Brief: Philosophy, Meditation, Daily Life", en: "Buddhism in Brief: Philosophy, Meditation, Daily Life" },
      { he: "פרופ׳ לואי אבר · הספר באנגלית", en: "Prof. Louis Hébert" },
    ],
  },
  {
    slug: "book-tantra-he",
    code: "TABLE_BOOK_TANTRA_HE",
    price: 65,
    kicker: BOOK_KICKER,
    title: { he: "מבוא לטנטרה", en: "Introduction to Tantra" },
    lines: [{ he: "לאמה גלן מולין · הספר בעברית", en: "Lama Glenn Mullin · Hebrew edition" }],
  },
  {
    slug: "book-tantra-en",
    code: "TABLE_BOOK_TANTRA_EN",
    price: 65,
    kicker: BOOK_KICKER,
    title: { he: "Introduction to Tantra", en: "Introduction to Tantra" },
    lines: [{ he: "לאמה גלן מולין · הספר באנגלית", en: "Lama Glenn Mullin · English edition" }],
  },
];

export const tablePayPath = (slug: string, lang: Lang) => `${lang === "en" ? "/en" : ""}/qr/${slug}`;

const COPY = {
  he: {
    perCopy: "לעותק",
    copies: "כמה עותקים?",
    amount: "סכום התרומה (₪)",
    amountNote: "כל סכום, כפי יכולתכם.",
    name: "שם מלא",
    email: "אימייל (לקבלה)",
    phone: "טלפון",
    total: "סה״כ",
    payBook: "מעבר לתשלום",
    payDana: "מעבר לתרומה",
    sending: "רגע...",
    footnote: "כרטיס אשראי או ביט, בעמוד סליקה מאובטח של קארדקום. הקבלה נשלחת לאימייל.",
    errAmount: "יש למלא סכום בשקלים שלמים, בין 1 ל-50,000",
    errGeneric: "משהו השתבש. אפשר לנסות שוב, או לפנות לצוות בשולחן.",
    payTitle: "תשלום",
    thanksDana: "תודה רבה על התרומה!",
    thanksDanaBody: "התרומה התקבלה. הקבלה נשלחת לאימייל שמילאתם.",
    thanksBook: "תודה! התשלום התקבל",
    thanksBookBody: "אפשר לקחת את הספר מהשולחן. הראו את המסך הזה לצוות בשולחן הספרים.",
    failed: "התשלום לא הושלם",
    failedBody: "לא חויבתם. אפשר לנסות שוב.",
    again: "לנסות שוב",
    test: "מצב בדיקה: חיוב של 1 ₪",
    seoDana: "תרומה לריטריט",
    seoBook: "שולחן הספרים",
  },
  en: {
    perCopy: "per copy",
    copies: "How many copies?",
    amount: "Amount (NIS)",
    amountNote: "Any amount you wish.",
    name: "Full name",
    email: "Email (for the receipt)",
    phone: "Phone",
    total: "Total",
    payBook: "Continue to payment",
    payDana: "Continue to give",
    sending: "One moment...",
    footnote: "Card or Bit, on Cardcom's secure payment page. Charged in Israeli shekels. Receipt by email.",
    errAmount: "Please enter a whole amount in shekels, 1 to 50,000",
    errGeneric: "Something went wrong. Please try again, or ask the team at the table.",
    payTitle: "Payment",
    thanksDana: "Thank you for your generosity!",
    thanksDanaBody: "Your gift has been received. The receipt is on its way to your email.",
    thanksBook: "Thank you! Payment received",
    thanksBookBody: "Please take your book from the table. Show this screen to the team at the book table.",
    failed: "The payment did not go through",
    failedBody: "You were not charged. Please try again.",
    again: "Try again",
    test: "Test mode: 1 NIS charge",
    seoDana: "Support the retreat",
    seoBook: "Book table",
  },
};

/** Cardcom's page opens with a band of white space; same crop as the retreat modal. */
const FRAME_HEIGHT = 900;
const FRAME_CROP_TOP = 205;

const field =
  "w-full rounded-lg border border-border bg-white px-4 py-3 font-body text-base text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

interface LastOrder {
  slug: string;
  copies: number;
  amount: number;
  at: string;
}

const readLastOrder = (slug: string): LastOrder | null => {
  try {
    const o = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "null") as LastOrder | null;
    return o && o.slug === slug ? o : null;
  } catch {
    return null;
  }
};

const Header = ({ item, lang }: { item: TableItem; lang: Lang }) => (
  <header className="mb-6 text-center">
    <p className="font-body text-sm font-bold tracking-wide" style={{ color: "#a8782a" }}>
      {item.kicker[lang]}
    </p>
    <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mt-1 mb-2" dir="auto">
      {item.title[lang]}
    </h1>
    {item.lines.map((l, i) => (
      <p key={i} className={`font-body ${i === 0 ? "text-lg font-medium" : "text-base opacity-80"}`} dir="auto">
        {l[lang]}
      </p>
    ))}
    {item.price && (
      <p className="font-body text-2xl font-bold mt-3 text-primary">
        <span dir="ltr">{item.price} ₪</span> <span className="text-base font-normal opacity-70">{COPY[lang].perCopy}</span>
      </p>
    )}
  </header>
);

const TablePayForm = ({ item, lang }: { item: TableItem; lang: Lang }) => {
  const c = COPY[lang];
  const isBook = Boolean(item.price);
  const test = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("test") === TEST_KEY;
  const [copies, setCopies] = useState(1);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const { paymentStatus, closePaymentStatus } = usePaymentReturn();
  const lastOrder = paymentStatus === "success" ? readLastOrder(item.slug) : null;

  const total = isBook ? (item.price as number) * copies : Number(amount) || 0;

  if (paymentStatus === "success") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "#EAF4EA" }}>
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14" style={{ color: "#2f7d32" }} aria-hidden />
        <h2 className="font-heading text-2xl mb-2">{isBook ? c.thanksBook : c.thanksDana}</h2>
        {isBook && lastOrder && (
          <p className="font-body text-xl font-bold my-3" dir="auto">
            {lastOrder.copies} × {item.title[lang]}
          </p>
        )}
        {lastOrder && (
          <p className="font-body text-lg mb-2">
            <span dir="ltr">{lastOrder.amount} ₪</span> · <span dir="ltr">{lastOrder.at}</span>
          </p>
        )}
        <p className="font-body text-base leading-relaxed">{isBook ? c.thanksBookBody : c.thanksDanaBody}</p>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-white">
        <p className="px-5 pt-4 font-body text-lg font-bold text-center">
          {c.payTitle}: <span dir="ltr">{total} ₪</span>
        </p>
        <div className="overflow-hidden" style={{ height: FRAME_HEIGHT }}>
          <iframe
            src={paymentUrl}
            title={c.payTitle}
            className="w-full border-0 block"
            style={{ height: FRAME_HEIGHT + FRAME_CROP_TOP, marginTop: -FRAME_CROP_TOP }}
            allow="payment"
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!isBook && !test) {
      const n = Number(amount);
      if (!Number.isInteger(n) || n < 1 || n > 50000) {
        setError(c.errAmount);
        return;
      }
    }
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (data.website) return; // honeypot
    setBusy(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reg_token: crypto.randomUUID(),
          field_event: test ? "TABLE_TEST" : item.code,
          ...(isBook ? { quantity: copies } : { amount: Number(amount) }),
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          lang,
          page_path: `/qr/${item.slug}`,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.cardcom_url) throw new Error(out.error || String(res.status));
      const at = new Date().toLocaleString(lang === "he" ? "he-IL" : "en-GB", {
        timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit",
      });
      sessionStorage.setItem(
        ORDER_KEY,
        JSON.stringify({ slug: item.slug, copies: isBook ? copies : 1, amount: test ? 1 : total, at } satisfies LastOrder),
      );
      setPaymentUrl(out.cardcom_url);
      window.scrollTo?.({ top: 0, behavior: "smooth" });
    } catch {
      setError(c.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 md:p-8" style={{ background: "#FBF3E2" }} noValidate={false}>
      {paymentStatus === "failed" && (
        <div className="mb-5 rounded-lg p-4 text-center" style={{ background: "#fdecea" }}>
          <p className="font-body font-bold">{c.failed}</p>
          <p className="font-body text-sm">{c.failedBody}</p>
          <button type="button" onClick={closePaymentStatus} className="mt-2 underline font-body text-sm">
            {c.again}
          </button>
        </div>
      )}
      {test && <p className="mb-4 rounded-lg bg-yellow-100 p-3 text-center font-body font-bold">{c.test}</p>}

      {isBook ? (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
          <span className="font-body text-base font-medium">{c.copies}</span>
          <div className="flex items-center gap-3" dir="ltr">
            <button
              type="button"
              aria-label="-"
              onClick={() => setCopies((n) => Math.max(1, n - 1))}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white disabled:opacity-40"
              disabled={copies <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2ch] text-center font-body text-2xl font-bold" data-testid="copies">
              {copies}
            </span>
            <button
              type="button"
              aria-label="+"
              onClick={() => setCopies((n) => Math.min(MAX_COPIES, n + 1))}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white disabled:opacity-40"
              disabled={copies >= MAX_COPIES}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <label className="mb-5 block">
          <span className="mb-1 block font-body text-sm font-medium">{c.amount}</span>
          <input
            name="amount"
            inputMode="numeric"
            pattern="[0-9]*"
            required={!test}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            className={`${field} text-center text-2xl font-bold`}
            dir="ltr"
            placeholder="₪"
          />
          <span className="mt-1 block font-body text-sm opacity-70">{c.amountNote}</span>
        </label>
      )}

      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1 block font-body text-sm">{c.name}</span>
          <input name="full_name" required className={field} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">{c.email}</span>
          <input name="email" type="email" required className={field} autoComplete="email" dir="ltr" style={{ textAlign: lang === "he" ? "right" : "left" }} />
        </label>
        <label className="block">
          <span className="mb-1 block font-body text-sm">{c.phone}</span>
          <input name="phone" required className={field} inputMode="tel" autoComplete="tel" placeholder="050-1234567" dir="ltr" style={{ textAlign: lang === "he" ? "right" : "left" }} />
        </label>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {isBook && (
        <div className="mt-5 flex justify-between font-body text-xl font-bold">
          <span>{c.total}</span>
          <span dir="ltr" data-testid="total">{total} ₪</span>
        </div>
      )}

      {error && (
        <p className="mt-4 flex items-center gap-2 font-body text-sm" style={{ color: "#b51a00" }}>
          <XCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-7 py-4 font-body text-lg font-bold text-white disabled:opacity-70"
        style={{ background: "#ff385c" }}
      >
        {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {busy ? c.sending : isBook ? c.payBook : c.payDana}
      </button>
      <p className="mt-3 text-center font-body text-sm opacity-70">{c.footnote}</p>
    </form>
  );
};

const TablePay = ({ slug, lang }: { slug: string; lang: Lang }) => {
  const item = TABLE_ITEMS.find((i) => i.slug === slug) as TableItem;
  const c = COPY[lang];
  const name = lang === "he" ? "מאיטרייה סנגהה ישראל" : "Maitreya Sangha Israel";
  return (
    <SiteLayout
      lang={lang}
      title={`${item.price ? `${c.seoBook}: ${item.title[lang]}` : `${c.seoDana}: ${item.lines[0][lang]}`} | ${name}`}
      description={item.lines.map((l) => l[lang]).join(" · ")}
      path={tablePayPath(slug, lang)}
      noindex
      bare
    >
      <article className="container max-w-lg pt-5 pb-10 md:py-10">
        {/* No site header/footer on these pages (Shahaf, 24.11): just a small logo. */}
        <img src={logo} alt={name} className="mx-auto mb-6 h-8 w-auto" />
        <Header item={item} lang={lang} />
        <TablePayForm item={item} lang={lang} />
      </article>
    </SiteLayout>
  );
};

export default TablePay;
