/**
 * Dev-only API for the admin "Site Content" back office.
 *
 * While `npm run dev` runs, the admin editor reads and writes the markdown
 * files under content/ through these endpoints, and Vite HMR shows every save
 * on the site instantly. The plugin applies to `serve` only - it does not
 * exist in production builds. The production publishing path (edits committed
 * to GitHub and auto-deployed) is planned for the go-live phase; see the
 * migration plan in the vault.
 *
 * Endpoints (JSON):
 *   GET  /__site-content/list            -> { files: [{ path, title }] }
 *   GET  /__site-content/read?path=x.md  -> { path, content }
 *   POST /__site-content/save            <- { path, content }
 *   POST /__site-content/delete          <- { path }  (articles/events only)
 *
 * Safety: paths are resolved and must stay inside content/ and end with .md;
 * delete additionally refuses anything outside articles/ or events/.
 */
import type { Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    // README is the editing guide, not editable site content
    return entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md" ? [full] : [];
  });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function siteContentDevApi(): Plugin {
  return {
    name: "site-content-dev-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const root = path.resolve(server.config.root, "content");

      const resolveSafe = (rel: string | null): string | null => {
        if (!rel || rel.includes("..") || !rel.endsWith(".md")) return null;
        const abs = path.resolve(root, rel);
        return abs.startsWith(root + path.sep) ? abs : null;
      };

      server.middlewares.use("/__site-content", (req, res) => {
        void (async () => {
          const url = new URL(req.url ?? "/", "http://localhost");
          try {
            if (req.method === "GET" && url.pathname === "/list") {
              const files = walk(root).map((abs) => {
                const rel = path.relative(root, abs).split(path.sep).join("/");
                const raw = fs.readFileSync(abs, "utf8");
                const title = raw.match(/^title:\s*"?([^"\n]*)"?$/m)?.[1] ?? "";
                return { path: rel, title };
              });
              return json(res, 200, { files });
            }

            if (req.method === "GET" && url.pathname === "/read") {
              const abs = resolveSafe(url.searchParams.get("path"));
              if (!abs || !fs.existsSync(abs)) return json(res, 404, { error: "not found" });
              return json(res, 200, {
                path: url.searchParams.get("path"),
                content: fs.readFileSync(abs, "utf8"),
              });
            }

            if (req.method === "POST" && url.pathname === "/save") {
              const { path: rel, content } = JSON.parse(await readBody(req)) as {
                path?: string;
                content?: string;
              };
              const abs = resolveSafe(rel ?? null);
              if (!abs || typeof content !== "string") return json(res, 400, { error: "bad request" });
              fs.mkdirSync(path.dirname(abs), { recursive: true });
              fs.writeFileSync(abs, content, "utf8");
              return json(res, 200, { ok: true });
            }

            if (req.method === "POST" && url.pathname === "/delete") {
              const { path: rel } = JSON.parse(await readBody(req)) as { path?: string };
              const abs = resolveSafe(rel ?? null);
              const deletable = rel && /^(he|en)\/(articles|events)\//.test(rel);
              if (!abs || !deletable || !fs.existsSync(abs)) return json(res, 400, { error: "bad request" });
              fs.unlinkSync(abs);
              return json(res, 200, { ok: true });
            }

            return json(res, 404, { error: "unknown endpoint" });
          } catch (e) {
            return json(res, 500, { error: String(e) });
          }
        })();
      });
    },
  };
}
