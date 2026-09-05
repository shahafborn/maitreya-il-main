/**
 * Admin back office - Site Content list.
 * Shows every editable site content file (content/<lang>/{pages,articles,events})
 * grouped by section and language, with edit links and new-item buttons.
 *
 * Editing works while the dev server runs (the vite-plugin-site-content dev
 * API writes straight to the files, and the site hot-reloads instantly).
 * On the deployed site the dev API doesn't exist, so this screen explains
 * where editing happens for now; the GitHub-connected publishing path is a
 * go-live phase item (see the migration plan in the vault).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface ContentFile {
  path: string;
  title: string;
}

const KINDS = [
  { kind: "pages", label: "Pages" },
  { kind: "articles", label: "Articles" },
  { kind: "events", label: "Events" },
] as const;

const LANGS = [
  { lang: "he", label: "Hebrew" },
  { lang: "en", label: "English" },
] as const;

const AdminSiteContent = () => {
  const [files, setFiles] = useState<ContentFile[] | null>(null);
  const [devApi, setDevApi] = useState(true);

  useEffect(() => {
    fetch("/__site-content/list")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { files: ContentFile[] }) => setFiles(data.files))
      .catch(() => setDevApi(false));
  }, []);

  if (!devApi) {
    return (
      <div className="max-w-2xl space-y-4">
        <h2 className="font-heading text-2xl font-bold text-primary">Site Content</h2>
        <div className="bg-muted/50 border border-border rounded-lg p-6 text-sm leading-relaxed space-y-3">
          <p className="font-medium">Editing from the deployed admin isn't switched on yet.</p>
          <p className="text-muted-foreground">
            The website's texts live as simple content files. Right now they are edited on the
            computer (through Claude or the local editor); when the new site goes live, this screen
            will connect to publishing so edits from here go straight to the website.
          </p>
        </div>
      </div>
    );
  }

  if (!files) {
    return <div className="animate-pulse text-muted-foreground">Loading content files...</div>;
  }

  const group = (kind: string, lang: string) =>
    files
      .filter((f) => f.path.startsWith(`${lang}/${kind}/`))
      .sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-primary">Site Content</h2>
        <p className="text-sm text-muted-foreground">
          Changes save to the site files and show up on the local site instantly.
        </p>
      </div>

      {KINDS.map(({ kind, label }) => (
        <section key={kind}>
          <h3 className="font-heading text-lg font-bold mb-3">{label}</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {LANGS.map(({ lang, label: langLabel }) => (
              <div key={lang} className="border border-border rounded-lg bg-card">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="text-sm font-medium">{langLabel}</span>
                  {kind !== "pages" && (
                    <Button asChild size="sm" variant="outline" className="h-7 gap-1">
                      <Link to={`new?kind=${kind}&lang=${lang}`}>
                        <Plus className="h-3.5 w-3.5" /> New
                      </Link>
                    </Button>
                  )}
                </div>
                <ul className="divide-y divide-border">
                  {group(kind, lang).map((f) => (
                    <li key={f.path}>
                      <Link
                        to={`edit?path=${encodeURIComponent(f.path)}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate" dir="auto">
                          {f.title || f.path.split("/").pop()}
                        </span>
                        <span className="text-xs text-muted-foreground ms-auto shrink-0">
                          {f.path.split("/").pop()}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {group(kind, lang).length === 0 && (
                    <li className="px-4 py-3 text-sm text-muted-foreground">No files yet.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default AdminSiteContent;
