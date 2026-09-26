import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/*
 * Manual registration for people who paid directly (credit card, Bit, Paybox, PayPal, bank
 * transfer, cash) - not through the website's registration form. Used by the Sangha team
 * (role "registrar", or any admin).
 * Spec: vault teachers-visit-nov-dec-2026/manual-registration-spec-2026-09-26.md
 *
 * Everything real happens in n8n (Manual_Register): it checks the signed-in user's role, lists
 * every event with its ticket options (read live from each event's own flow, so a new event appears
 * here without a site deploy), its dates and its payment methods (by the event's language), and
 * hands the person to that event's flows - the sheet row, the Mailchimp tags and the confirmation
 * email are the same ones a website payment gets.
 */
const ENDPOINT = "https://tknstk.app.n8n.cloud/webhook/manual-register";

type Option = { code: string; ticket_type: string; price: number; open: boolean };
type Method = { code: string; label: string };
type EventInfo = {
  key: string;
  label: string;
  dates: string;
  ends: string;
  ended: boolean;
  lang: "he" | "en";
  currency: "ILS" | "USD";
  methods: Method[];
  options: Option[];
};
type Duplicate = { status: string; name: string; ticket: string };
type Result = {
  sheet_status?: string;
  mailchimp_tags?: string[];
  email_requested?: boolean;
  reg_token?: string;
};

const money = (n: number, currency: string) =>
  currency === "USD" ? `$${n.toLocaleString("en-US")}` : `${n.toLocaleString("he-IL")} ₪`;

const langTag = (lang: "he" | "en") => (
  <span
    className={`rounded px-1.5 text-[11px] font-semibold ${
      lang === "he" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"
    }`}
  >
    {lang === "he" ? "עברית" : "English"}
  </span>
);

const monthOf = (ends: string) =>
  new Date(`${ends}T12:00:00`).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

/*
 * Event picker: one field; opens to a searchable list grouped by month, closes on choice to a
 * single line with "change". Built for 6-10 events open at once (Shahaf, 26.9, option A).
 * Ended events stay hidden unless the checkbox at the bottom of the list is ticked.
 */
function EventPicker({
  events,
  value,
  onChoose,
}: {
  events: EventInfo[];
  value: EventInfo | undefined;
  onChoose: (e: EventInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showPast, setShowPast] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (ev: MouseEvent) => {
      if (box.current && !box.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const pastCount = events.filter((e) => e.ended).length;
  const q = query.trim().toLowerCase();
  // Soonest first; ended events (only when asked for) at the bottom under their own heading.
  const shown = events
    .filter((e) => showPast || !e.ended)
    .filter((e) => !q || `${e.label} ${e.dates} ${e.lang === "he" ? "עברית hebrew" : "english אנגלית"}`.toLowerCase().includes(q))
    .sort((a, b) => (a.ended === b.ended ? a.ends.localeCompare(b.ends) : a.ended ? 1 : -1));
  const groups: { title: string; items: EventInfo[] }[] = [];
  for (const e of shown) {
    const title = e.ended ? "הסתיימו" : monthOf(e.ends);
    const g = groups.find((x) => x.title === title);
    if (g) g.items.push(e);
    else groups.push({ title, items: [e] });
  }

  const choose = (e: EventInfo) => {
    onChoose(e);
    setOpen(false);
    setQuery("");
  };

  if (value && !open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-primary bg-primary/5 px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-medium">
            {value.label} {langTag(value.lang)}
          </div>
          <div className="text-xs text-muted-foreground">
            {value.dates}
            {value.ended && " · הסתיים"}
          </div>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-sm text-primary underline">
          להחליף
        </button>
      </div>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm"
      >
        <span className={value ? "" : "text-muted-foreground"}>{value ? value.label : "בחירת אירוע..."}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && shown.length === 1) choose(shown[0]);
            }}
            placeholder="חיפוש: ניגומה, זום, חניכה..."
            aria-label="חיפוש אירוע"
            className="w-full border-b border-border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <div role="listbox" className="max-h-72 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="px-3 pb-0.5 pt-2 text-xs font-semibold text-muted-foreground">{g.title}</div>
                {g.items.map((e) => (
                  <button
                    key={e.key}
                    type="button"
                    role="option"
                    aria-selected={e.key === value?.key}
                    onClick={() => choose(e)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-right text-sm hover:bg-muted ${
                      e.key === value?.key ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      {e.label} {langTag(e.lang)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{e.dates}</span>
                  </button>
                ))}
              </div>
            ))}
            {shown.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                {q ? "לא נמצא אירוע כזה" : "אין כרגע אירועים פעילים"}
              </p>
            )}
          </div>
          {pastCount > 0 && (
            <label className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm text-muted-foreground">
              <Checkbox checked={showPast} onCheckedChange={(v) => setShowPast(v === true)} />
              להציג גם אירועים שהסתיימו ({pastCount})
            </label>
          )}
        </div>
      )}
    </div>
  );
}

async function call(body: Record<string, unknown>) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("צריך להתחבר מחדש");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    const reason = json.error === "not_allowed" ? "אין לחשבון הזה הרשאת רישום" : json.error || `שגיאה ${res.status}`;
    throw new Error(reason);
  }
  return json;
}

const emptyForm = {
  eventKey: "",
  code: "",
  fullName: "",
  email: "",
  phone: "",
  amount: "",
  method: "",
  transactionId: "",
  note: "",
  sendEmail: true,
};

const AdminManualRegistration = () => {
  const [events, setEvents] = useState<EventInfo[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<Duplicate[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    call({ action: "list" })
      .then((json) => setEvents(json.events || []))
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const event = useMemo(() => events?.find((e) => e.key === form.eventKey), [events, form.eventKey]);
  const option = useMemo(() => event?.options.find((o) => o.code === form.code), [event, form.code]);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const chooseEvent = (e: EventInfo) =>
    setForm((f) => ({ ...f, eventKey: e.key, code: "", amount: "", method: e.methods[0]?.code || "", transactionId: "" }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const amountNum = Number(form.amount);
  const ready = event && option && form.method && form.fullName.trim() && emailOk && amountNum > 0;

  const submit = async (force: boolean) => {
    if (!event || !option) return;
    setSubmitting(true);
    setError("");
    try {
      const json = await call({
        action: "register",
        force,
        event_key: event.key,
        field_event: option.code,
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        amount: amountNum,
        method: form.method,
        transaction_id: form.method === "cash" ? "" : form.transactionId.trim(),
        note: form.note.trim(),
        send_email: form.sendEmail,
      });
      if (json.duplicate) {
        setDuplicate(json.duplicate as Duplicate[]);
      } else {
        setDuplicate(null);
        setResult(json.result as Result);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setResult(null);
    setDuplicate(null);
    setError("");
  };

  return (
    <div dir="rtl" className="max-w-2xl space-y-6 text-right">
      <div>
        <h2 className="font-heading text-2xl font-bold text-primary">רישום ידני - תשלום ישיר</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          למי ששילם ישירות - בכרטיס אשראי, Bit, Paybox, PayPal, בהעברה בנקאית או במזומן - ולא דרך טופס ההרשמה
          באתר. הרישום מוסיף אותו לגיליון ההרשמות של האירוע, מתייג אותו ב-Mailchimp ושולח לו את אותו מייל אישור
          שמקבל מי שנרשם באתר.
        </p>
      </div>

      {loadError && <p className="text-destructive">לא הצלחתי לטעון את האירועים: {loadError}</p>}
      {!events && !loadError && <p className="animate-pulse text-muted-foreground">טוען את האירועים...</p>}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-2">
          <p className="font-bold text-green-900">
            {form.fullName} נרשם/ה ל{event?.label}.
          </p>
          <ul className="space-y-1 text-sm text-green-900">
            <li>
              {result.sheet_status === "paid"
                ? "✓ נוסף לגיליון ההרשמות, מסומן כשולם"
                : `⚠ בגיליון ההרשמות הסטטוס הוא "${result.sheet_status || "לא נמצא"}" - כדאי לבדוק`}
            </li>
            <li>
              {result.mailchimp_tags && result.mailchimp_tags.length
                ? `✓ תויג ב-Mailchimp (${result.mailchimp_tags.join(", ")})`
                : "⚠ לא מצאתי אותו ב-Mailchimp - כדאי לבדוק"}
            </li>
            <li>{result.email_requested ? "✓ מייל אישור נשלח" : "מייל אישור לא נשלח (לפי הבחירה)"}</li>
          </ul>
          <Button variant="outline" onClick={reset} className="mt-2">
            לרשום עוד מישהו
          </Button>
        </div>
      )}

      {events && !result && (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div className="space-y-2">
            <Label>אירוע</Label>
            <EventPicker events={events} value={event} onChoose={chooseEvent} />
          </div>

          {event && (
            <div className="space-y-2">
              <Label>אפשרות השתתפות</Label>
              <Select
                value={form.code}
                onValueChange={(v) => {
                  const o = event.options.find((x) => x.code === v);
                  setForm({ ...form, code: v, amount: o && !o.open ? String(o.price) : "" });
                }}
              >
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="בחרו אפשרות" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {event.options.map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.ticket_type}
                      {!o.open && ` - ${money(o.price, event.currency)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mr-name">שם מלא</Label>
              <Input id="mr-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mr-email">מייל</Label>
              <Input
                id="mr-email"
                dir="ltr"
                className="text-left"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              {form.email && !emailOk && <p className="text-xs text-destructive">כתובת המייל לא תקינה</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mr-phone">טלפון (לא חובה)</Label>
              <Input
                id="mr-phone"
                dir="ltr"
                className="text-left"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mr-amount">
                הסכום ששולם {event && `(${event.currency === "USD" ? "דולר" : "₪"})`}
              </Label>
              <Input
                id="mr-amount"
                type="number"
                min="1"
                dir="ltr"
                className="text-left"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
              {option && !option.open && event && (
                <p className="text-xs text-muted-foreground">
                  המחיר המלא: {money(option.price, event.currency)}. אם שולמה מקדמה - רשמו את הסכום ששולם בפועל.
                </p>
              )}
            </div>
          </div>

          {event && (
            <div className="space-y-2">
              <Label>אמצעי תשלום</Label>
              <div className="flex flex-wrap gap-2">
                {event.methods.map((m) => (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => set("method", m.code)}
                    className={`rounded-full border px-5 py-2 text-sm ${
                      form.method === m.code ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {event && form.method && form.method !== "cash" && (
            <div className="space-y-2">
              <Label htmlFor="mr-tx">מספר אסמכתא / עסקה (לא חובה, עוזר להתאים מול הדוח)</Label>
              <Input
                id="mr-tx"
                dir="ltr"
                className="text-left"
                value={form.transactionId}
                onChange={(e) => set("transactionId", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mr-note">הערה (לא חובה)</Label>
            <Textarea id="mr-note" rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.sendEmail} onCheckedChange={(v) => set("sendEmail", v === true)} />
            לשלוח לו/לה את מייל האישור
          </label>

          {duplicate && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
              <p className="font-bold">המייל הזה כבר מופיע בגיליון של האירוע:</p>
              <ul className="list-disc pr-5">
                {duplicate.map((d, i) => (
                  <li key={i}>
                    {d.name} - {d.ticket} (סטטוס: {d.status || "ללא"})
                  </li>
                ))}
              </ul>
              <p>אם זה תשלום נוסף של אותו אדם או מקדמה נוספת - אפשר לרשום בכל זאת, והוא יופיע בשורה נפרדת.</p>
              <div className="flex gap-2">
                <Button onClick={() => submit(true)} disabled={submitting}>
                  לרשום בכל זאת
                </Button>
                <Button variant="outline" onClick={() => setDuplicate(null)}>
                  ביטול
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">משהו השתבש: {error}</p>}

          {!duplicate && (
            <Button onClick={() => submit(false)} disabled={!ready || submitting} className="w-full font-bold">
              {submitting ? "רושם..." : "לרשום"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManualRegistration;
