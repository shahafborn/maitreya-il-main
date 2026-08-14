/**
 * Admin back office - Site Content editor.
 * Edits one content file: frontmatter fields as labeled inputs, body as
 * markdown textarea. Values render dir="auto" so Hebrew and English both sit
 * naturally. Saving writes through the dev API (vite-plugin-site-content);
 * the local site hot-reloads the change instantly.
 *
 * Also handles creation (?kind=articles|events&lang=he|en) from templates,
 * and deletion (articles/events only, with confirm).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ExternalLink, Save, Trash2 } from "lucide-react";
import { parseFrontmatter, serializeFrontmatter } from "@/site/frontmatter";

/** Plain-language labels for known frontmatter keys (fallback: the key itself). */
const FRIENDLY_LABELS: Record<string, string> = {
  title: "Title (browser tab + Google)",
  description: "Description (Google snippet + social share)",
  slug: "Slug (address part, letters-numbers-hyphens)",
  date: "Date (YYYY-MM-DD)",
  lang: "Language (he / en)",
  start: "Start date (YYYY-MM-DD)",
  end: "End date (YYYY-MM-DD)",
  location: "Location",
  teacher: "Teacher(s)",
  url: "Link to event page (optional)",
  summary: "Short summary",
  email: "Contact email",
  cta_label: "Button label",
  cardcom_url: "Cardcom payment link (optional)",
  original_url: "Original WordPress address (reference)",
};

const TEMPLATES: Record<string, (lang: string) => { name: string; content: string }> = {
  articles: (lang) => ({
    name: "new-article",
    content: serializeFrontmatter(
      {
        title: "",
        slug: "new-article",
        date: new Date().toISOString().slice(0, 10),
        lang,
        description: "",
      },
      lang === "he" ? "גוף המאמר..." : "Article body...",
    ),
  }),
  events: (lang) => ({
    name: `${new Date().toISOString().slice(0, 7)}-new-event`,
    content: serializeFrontmatter(
      { title: "", start: "", end: "", location: "", teacher: "", url: "", summary: "" },
      "",
    ),
  }),
};

/** Long-text keys render as textareas instead of single-line inputs. */
const isLongKey = (key: string, value: string) =>
  value.length > 90 || /(_text|_subheading|description|summary)$/.test(key);

const AdminSiteContentEditor = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const existingPath = params.get("path");
  const newKind = params.get("kind");
  const newLang = params.get("lang") ?? "he";
  const isNew = !existingPath && !!newKind && !!TEMPLATES[newKind];

  const [meta, setMeta] = useState<Record<string, string>>({});
  const [keyOrder, setKeyOrder] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (isNew) {
      const tpl = TEMPLATES[newKind!](newLang);
      const parsed = parseFrontmatter(tpl.content);
      setMeta(parsed.meta);
      setKeyOrder(parsed.keyOrder);
      setBody(parsed.body);
      setFileName(tpl.name);
      return;
    }
    if (!existingPath) return;
    fetch(`/__site-content/read?path=${encodeURIComponent(existingPath)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { content: string }) => {
        const parsed = parseFrontmatter(data.content);
        setMeta(parsed.meta);
        setKeyOrder(parsed.keyOrder);
        setBody(parsed.body);
      })
      .catch(() => setLoadError("Could not load the file (the editor works while the local dev server runs)."));
  }, [existingPath, isNew, newKind, newLang]);

  const targetPath = useMemo(() => {
    if (existingPath) return existingPath;
    const clean = fileName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    return clean ? `${newLang}/${newKind}/${clean}.md` : "";
  }, [existingPath, fileName, newKind, newLang]);

  /** Site path this file renders at, for the "View page" link. */
  const viewPath = useMemo(() => {
    const m = targetPath.match(/^(he|en)\/(pages|articles|events)\/(.+)\.md$/);
    if (!m) return null;
    const [, lang, kind, name] = m;
    if (kind === "pages") return name === "home" ? `/${lang}` : `/${lang}/${name}`;
    if (kind === "articles") return `/${lang}/articles/${name}`;
    return `/${lang}/events`;
  }, [targetPath]);

  const save = async () => {
    if (!targetPath) return;
    setStatus("saving");
    try {
      const content = serializeFrontmatter(meta, body, keyOrder);
      const r = await fetch("/__site-content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, content }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setStatus("saved");
      if (isNew) navigate(`../edit?path=${encodeURIComponent(targetPath)}`, { replace: true });
    } catch {
      setStatus("error");
    }
  };

  const remove = async () => {
    if (!existingPath || !/\/(articles|events)\//.test(existingPath)) return;
    if (!window.confirm("Delete this file? (Recoverable from git history, but it leaves the site immediately.)")) return;
    const r = await fetch("/__site-content/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: existingPath }),
    });
    if (r.ok) navigate("/admin/site-content");
  };

  if (loadError) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link to="/admin/site-content" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to site content
        </Link>
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  const isHe = targetPath.startsWith("he/");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <Link to="/admin/site-content" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to site content
        </Link>
        {viewPath && !isNew && (
          <a
            href={import.meta.env.BASE_URL.replace(/\/$/, "") + viewPath}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            View page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <h2 className="font-heading text-2xl font-bold text-primary" dir="auto">
        {isNew ? `New ${newKind?.slice(0, -1)} (${newLang === "he" ? "Hebrew" : "English"})` : meta.title || targetPath}
      </h2>

      {isNew && (
        <div className="space-y-2">
          <Label htmlFor="fc-name">File name (letters, numbers, hyphens)</Label>
          <Input
            id="fc-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="text-left font-mono"
          />
          {targetPath && <p className="text-xs text-muted-foreground">Will be saved as content/{targetPath}</p>}
        </div>
      )}

      <div className="space-y-4">
        {keyOrder.map((key) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`fm-${key}`}>{FRIENDLY_LABELS[key] ?? key}</Label>
            {isLongKey(key, meta[key] ?? "") ? (
              <Textarea
                id={`fm-${key}`}
                dir="auto"
                rows={3}
                value={meta[key] ?? ""}
                onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
              />
            ) : (
              <Input
                id={`fm-${key}`}
                dir="auto"
                value={meta[key] ?? ""}
                onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fc-body">Page text (markdown)</Label>
        <Textarea
          id="fc-body"
          dir={isHe ? "rtl" : "ltr"}
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="font-body leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={status === "saving" || !targetPath} className="gap-2">
          <Save className="h-4 w-4" />
          {status === "saving" ? "Saving..." : "Save"}
        </Button>
        {status === "saved" && <span className="text-sm text-muted-foreground">Saved - the local site is already updated.</span>}
        {status === "error" && <span className="text-sm text-destructive">Save failed - is the local dev server running?</span>}
        {existingPath && /\/(articles|events)\//.test(existingPath) && (
          <Button variant="outline" onClick={remove} className="gap-2 ms-auto text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminSiteContentEditor;
