/**
 * Shared frontmatter parse/serialize for site content files.
 * Format is deliberately flat: `key: value` string pairs only (see
 * content/README.md). Used by the site content loader (content.ts) and the
 * admin back office editor (AdminSiteContent*).
 */

export interface ParsedContent {
  /** Flat frontmatter fields; missing keys read as "". */
  meta: Record<string, string>;
  /** Markdown body after the frontmatter block. */
  body: string;
  /** Key order as found in the file, so edits round-trip without reshuffling. */
  keyOrder: string[];
}

export function parseFrontmatter(raw: string): ParsedContent {
  const meta: Record<string, string> = {};
  const keyOrder: string[] = [];
  let body = raw;
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (match) {
    body = raw.slice(match[0].length);
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) {
        meta[key] = value;
        keyOrder.push(key);
      }
    }
  }
  return { meta, body: body.trim(), keyOrder };
}

/** Quote a value iff needed (colons, quotes, leading/trailing space). */
function quoteValue(value: string): string {
  if (value === "" || /[:"#]|^\s|\s$/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

export function serializeFrontmatter(
  meta: Record<string, string>,
  body: string,
  keyOrder?: string[],
): string {
  const keys = [
    ...(keyOrder ?? []).filter((k) => k in meta),
    ...Object.keys(meta).filter((k) => !(keyOrder ?? []).includes(k)),
  ];
  const fm = keys.map((k) => `${k}: ${quoteValue(meta[k])}`).join("\n");
  return `---\n${fm}\n---\n${body.trim() ? body.trim() + "\n" : ""}`;
}
