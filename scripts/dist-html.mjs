import fs from "node:fs";
import path from "node:path";

export const siteHost = "nosuchmachine.net";

export function distRoot() {
  return path.resolve(process.env.VERIFY_DIST || "dist");
}

export function walkFiles(dir, predicate, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walkFiles(file, predicate, found);
    else if (predicate(file)) found.push(file);
  }
  return found;
}

export function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export function parseAttributes(source) {
  const attrs = {};
  for (const match of source.matchAll(
    /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
  )) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

export function htmlTags(html) {
  const tags = [];
  for (const match of html.matchAll(/<([a-zA-Z][\w:-]*)([^<>]*)>/g)) {
    tags.push({
      name: match[1].toLowerCase(),
      attrs: parseAttributes(match[2]),
    });
  }
  return tags;
}

export function pageUrl(root, file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (relative === "index.html") return `https://${siteHost}/`;
  if (relative.endsWith("/index.html")) {
    return `https://${siteHost}/${relative.slice(0, -"index.html".length)}`;
  }
  return `https://${siteHost}/${relative}`;
}

export function routeToFile(root, route) {
  if (/\.[a-z0-9]+$/i.test(route)) return path.join(root, route.replace(/^\/+/, ""));
  const cleaned = route.replace(/^\/+|\/+$/g, "");
  if (!cleaned) return path.join(root, "index.html");
  return path.join(root, cleaned, "index.html");
}

export function idsIn(file) {
  const ids = new Set();
  const html = fs.readFileSync(file, "utf8");
  for (const tag of htmlTags(html)) {
    if (tag.attrs.id) ids.add(tag.attrs.id);
  }
  return ids;
}

function decodeHash(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// Classify one href or asset URL against the built dist tree.
// Same-site http(s) URLs, including www, are internal. Other http(s) URLs are external.
export function classifyUrl(raw, fromFile, root) {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { kind: "invalid", reason: "empty URL" };
  }
  const value = raw.trim();
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:")) return { kind: "invalid", reason: "javascript URL" };
  if (
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("sms:") ||
    lower.startsWith("data:")
  ) {
    return { kind: "nonhttp", href: value };
  }
  let url;
  try {
    url = new URL(value, pageUrl(root, fromFile));
  } catch {
    return { kind: "invalid", reason: `unparseable URL ${value}` };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "nonhttp", href: url.href };
  }
  const host = url.hostname.replace(/^www\./i, "");
  if (host !== siteHost) return { kind: "external", href: url.href };
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { kind: "invalid", reason: `bad path encoding ${value}` };
  }
  if (pathname.includes("\0")) return { kind: "invalid", reason: "null in path" };
  const target = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { kind: "invalid", reason: `path escapes dist ${value}` };
  }
  let file = target;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  const hash = url.hash.length > 1 ? decodeHash(url.hash.slice(1)) : "";
  if (url.hash.length > 1 && hash === null) {
    return { kind: "invalid", reason: `bad fragment encoding ${value}` };
  }
  return {
    kind: "internal",
    href: url.href,
    file,
    hash,
    exists: fs.existsSync(file) && fs.statSync(file).isFile(),
  };
}
