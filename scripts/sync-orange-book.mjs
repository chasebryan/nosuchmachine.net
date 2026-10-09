#!/usr/bin/env node
/**
 * Fetch The Orange Book from the public orange repository and regenerate the
 * hosted reader. The default ref is main; set ORANGE_BOOK_REF or pass --ref.
 *
 *   node scripts/sync-orange-book.mjs                 # fetch and write
 *   node scripts/sync-orange-book.mjs --offline       # committed snapshot, no network
 *   node scripts/sync-orange-book.mjs --check         # compare, no network, no writes
 *   ORANGE_BOOK_OFFLINE=1 npm run build               # local build without fetching
 *
 * A failed fetch exits non-zero. There is no silent fallback to the previous
 * text. --offline is refused when CI is set, so a continuous-integration build
 * cannot publish the committed snapshot after a missed fetch.
 *
 * Chapter status in src/content/book/manifest.json is copied only from an
 * orange manifest under docs/book/. Orange "draft" is stored as "drafted"
 * and "planned" as "planned", the two tokens the site reader understands.
 * "original" is the manuscript rollup: it is not a chapter status, it does
 * not mark the preface, and it does not add a row. Any other token stays
 * null (unmarked). This script does not infer "drafted" from a file merely
 * existing, and it does not claim the Book is complete.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

const root = fileURLToPath(new URL("../", import.meta.url));
const repositoryUrl = "https://github.com/chasebryan/orange";
const manuscriptPath = "docs/THE_ORANGE_BOOK.md";
const vendorPath = "vendor/orange/THE_ORANGE_BOOK.md";
const downloadPath = "public/book/orange-book.md";
const metadataPath = "src/data/book.json";
const chapterDirectory = "src/content/book";
const manifestOutput = "src/content/book/manifest.json";
const snapshotDirectory = "src/content/book/source";
const snapshotBookDirectory = "src/content/book/source/book";
const provenancePath = "src/content/book/source/provenance.json";
const descriptions = [
  "The book's audience, the current state of Orange, and the boundary between aspiration and evidence.",
  "Why high-assurance cryptography depends on the connections between specifications, implementations, proofs, and binaries.",
  "How Orange describes assurance through precise claims, evidence, assumptions, and independent outcomes.",
  "One language with distinct semantic roles for specifications, implementations, proofs, and foreign interfaces.",
  "The path from source bytes through syntax and meaning to the Typed Reference Core.",
  "The distinction between finding a proof and checking one, and the proposed trust boundary around automation.",
  "Secrecy, leakage policies, constant-time claims, and the gap between source code and native execution.",
  "Why Orange builds its permanent compiler through small slices instead of a disposable prototype.",
  "The current Orange 2026 grammar, semantic slices, executable examples, and explicit capability limits.",
  "The evidence and design decisions needed to connect the reference semantics to native code.",
  "Foreign interfaces, contracts, imported assumptions, and secrets crossing language boundaries.",
  "How standards, clauses, test vectors, provenance, and rights become versioned inputs.",
  "Why real cryptographic algorithms and their known answers belong in the acceptance process from the beginning.",
  "The boundaries between primitive correctness, protocol interoperability, and independent validation.",
  "The records and identities needed to keep a build's evidence useful after the build ends.",
  "Offline replay, dependency closure, and making a claim's trust budget visible.",
  "Solo development through bounded stages, explicit decisions, acceptance gates, and durable records.",
  "Release claims, updates, vulnerability response, stop-ship conditions, and support boundaries.",
  "A reference for the current grammar, types, operators, commands, and diagnostic families.",
  "A summary of the project's decision register and the status of its controlling decisions.",
  "Definitions of the claim and evidence vocabulary used throughout the book.",
  "The principal repository sources behind each chapter and appendix.",
  "The manuscript's chapter plan and intended reading structure.",
  "The source documents, manuscript revision history, authorship, and drafting disclosures.",
];
const expectedSlugs = [
  "preface",
  ...Array.from({ length: 17 }, (_, index) => `chapter-${index + 1}`),
  ..."abcd".split("").map((letter) => `appendix-${letter}`),
  "manuscript-map",
  "sources-and-drafting-disclosure",
];
const partDivider = /^(?:Part \d+,.*|Novice continuation)$/;

function options(args) {
  const result = {
    check: false,
    offline: false,
    selfTest: false,
    ref: process.env.ORANGE_BOOK_REF?.trim() || "main",
    repo: undefined,
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--check") result.check = true;
    else if (arg === "--offline") result.offline = true;
    else if (arg === "--self-test") result.selfTest = true;
    else if ((arg === "--ref" || arg === "--repo") && args[index + 1] && !args[index + 1].startsWith("--")) {
      result[arg === "--ref" ? "ref" : "repo"] = arg === "--repo" ? path.resolve(args[++index]) : args[++index];
    } else if (arg === "--help") {
      console.log(`Usage: node scripts/sync-orange-book.mjs [--ref <ref>] [--offline] [--check] [--repo <checkout>]

ORANGE_BOOK_REF       git ref to fetch (default main). --ref overrides it.
ORANGE_BOOK_OFFLINE=1 same as --offline.`);
      process.exit(0);
    } else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (process.env.ORANGE_BOOK_OFFLINE === "1" || process.env.ORANGE_BOOK_OFFLINE === "true") result.offline = true;
  if (result.offline && result.repo) throw new Error("Use either --offline or --repo, not both.");
  if (result.offline && !result.check && (process.env.CI === "true" || process.env.CI === "1")) {
    throw new Error("Refusing --offline while CI is set. Fetch the Book, or unset CI for a local snapshot build. A failed fetch must not publish the committed copy.");
  }
  return result;
}

function git(args, cwd) {
  try {
    return execFileSync("git", args, {
      ...(cwd ? { cwd } : {}),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (error) {
    const detail = `${error.stderr ?? ""}`.trim() || error.message;
    throw new Error(detail);
  }
}

function fetchOrange(ref) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "orange-book-"));
  try {
    git(["init", "-q"], dir);
    git(["remote", "add", "origin", `${repositoryUrl}.git`], dir);
    git(["sparse-checkout", "init", "--cone"], dir);
    git(["sparse-checkout", "set", "docs"], dir);
    git(["fetch", "--depth", "1", "origin", ref], dir);
    const sha = git(["rev-parse", "FETCH_HEAD"], dir).trim();
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error(`Unexpected commit id: ${sha}`);
    git(["checkout", "--detach", "--quiet", "FETCH_HEAD"], dir);
    return { dir, sha };
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`Could not fetch ${repositoryUrl} ref ${JSON.stringify(ref)}. ${error.message}`);
  }
}

async function readBookFiles(directory) {
  const files = new Map();
  async function walk(current, prefix) {
    const entries = await readdir(current, { withFileTypes: true }).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute, relative);
      else if (entry.isFile() && /\.(?:md|json|ya?ml|txt)$/i.test(entry.name)) {
        files.set(`docs/book/${relative}`, await readFile(absolute, "utf8"));
      } else if (entry.isFile()) {
        throw new Error(`docs/book contains ${relative}, which the sync does not copy. Extend the sync before relying on it.`);
      }
    }
  }
  await walk(directory, "");
  return files;
}

function findManifest(bookFiles) {
  const matches = [...bookFiles.keys()].filter((file) =>
    /(?:^|\/)[^/]*manifest[^/]*\.(?:json|ya?ml)$/i.test(file)
  ).sort();
  if (matches.length > 1) {
    throw new Error(`Found more than one chapter manifest under docs/book/: ${matches.join(", ")}. Keep a single manifest so chapter status is unambiguous.`);
  }
  return matches[0] ?? null;
}

// Record which lines are ordinary Markdown. A fence closes only with the same
// marker and at least the opening marker's length; code examples stay untouched.
function manuscriptLines(source) {
  let fence;
  return source.split(/(?<=\n)/).map((text) => {
    const marker = text.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
    let prose = !fence;
    if (marker && !fence) {
      fence = { marker: marker[1][0], length: marker[1].length };
      prose = false;
    } else if (marker && fence && marker[1][0] === fence.marker && marker[1].length >= fence.length && /^\s*$/.test(marker[2])) {
      fence = undefined;
      prose = false;
    }
    if (/^(?: {4}|\t)/.test(text)) prose = false;
    const heading = prose ? text.trimEnd().match(/^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/) : null;
    return { text, prose, heading: heading && { level: heading[1].length, title: heading[2].trim() } };
  });
}

function chapterSlug(title) {
  if (title === "Preface") return "preface";
  const chapter = title.match(/^Chapter (\d+): /);
  if (chapter) return `chapter-${chapter[1]}`;
  const appendix = title.match(/^Appendix ([A-D]): /);
  if (appendix) return `appendix-${appendix[1].toLowerCase()}`;
  if (title === "Manuscript map") return "manuscript-map";
  if (title === "Sources and drafting disclosure") return "sources-and-drafting-disclosure";
  throw new Error(`Unrecognized top-level book section: ${title}`);
}

function chapterPart(slug) {
  const chapter = Number(slug.match(/^chapter-(\d+)$/)?.[1]);
  if (chapter <= 3) return "Part I: Why Orange";
  if (chapter <= 6) return "Part II: Meaning and Trust";
  if (chapter <= 10) return "Part III: Building the Language";
  if (chapter <= 13) return "Part IV: Cryptography in Practice";
  if (chapter <= 17) return "Part V: Operating Orange";
  if (slug.startsWith("appendix-")) return "Appendices";
  return slug === "preface" ? "Front matter" : "Back matter";
}

function sectionSlug(file, title) {
  const lesson = title.match(/^(N\d+)\s*:/);
  if (lesson) return lesson[1].toLowerCase();
  const chapter = title.match(/^Chapter (\d+)\s*:/);
  if (chapter) {
    const prefix = /\/NOVICE_/i.test(`/${file}`) ? "novice" : path.posix.basename(file, ".md").toLowerCase().replaceAll("_", "-");
    return `${prefix}-chapter-${chapter[1]}`;
  }
  if (title === "A word before we begin") return "a-word-before-we-begin";
  const stem = path.posix.basename(file, ".md").toLowerCase().replaceAll("_", "-");
  return `${stem}-${new GithubSlugger().slug(title)}`;
}

function splitHash(destination) {
  const match = destination.split(/#(.*)/s);
  return [match[0], match[1]];
}

function linkedFile(fromFile, destination) {
  if (!destination || /^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith("//") || destination.startsWith("/")) return null;
  const [relativePath, fragment] = splitHash(destination);
  if (!relativePath) return { file: fromFile, fragment: fragment ? decodeURIComponent(fragment) : undefined };
  const file = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), relativePath));
  return { file, fragment: fragment ? decodeURIComponent(fragment) : undefined, directory: relativePath.endsWith("/") };
}

function canonicalPart(value) {
  if (typeof value !== "string") return undefined;
  const novice = /\bnovice\b/i.test(value);
  const journeyman = /\bjourneyman\b/i.test(value);
  const master = /\bmaster\b/i.test(value);
  if ([novice, journeyman, master].filter(Boolean).length !== 1) return undefined;
  return novice ? "Novice" : journeyman ? "Journeyman" : "Master";
}

function knownOriginal(value) {
  return typeof value === "string" && value.trim().toLowerCase() === "original";
}

function canonicalStatus(value) {
  if (typeof value !== "string") return undefined;
  const text = value.trim().toLowerCase();
  if (text === "draft" || text === "drafted") return "drafted";
  if (text === "planned") return "planned";
  return undefined;
}

// A small indented-YAML subset is enough for a chapter manifest. JSON is
// preferred. Anchors, tags, and block scalars fail loudly instead of being
// misread as chapter status.
function parseYaml(source) {
  const lines = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  const tokens = [];
  for (let number = 0; number < lines.length; number++) {
    const raw = lines[number];
    if (/^\s*(#|$)/.test(raw)) continue;
    if (raw.includes("\t")) throw new Error(`YAML manifest uses a tab (line ${number + 1}).`);
    const indent = raw.match(/^ */)?.[0].length ?? 0;
    const text = raw.slice(indent).replace(/\s+$/, "").replace(/\s+#.*$/, "");
    if (/^(?:<<|!|&|\*)/.test(text) || /:\s*[|>]/.test(text)) {
      throw new Error(`YAML manifest uses an unsupported construct on line ${number + 1}. Use JSON, or plain indented keys and lists.`);
    }
    tokens.push({ indent, text, line: number + 1 });
  }
  let index = 0;
  const peek = () => tokens[index];
  function scalar(text) {
    if (text === "null" || text === "~" || text === "") return null;
    if (text === "true") return true;
    if (text === "false") return false;
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) return text.slice(1, -1);
    if (/^-?\d+$/.test(text)) return Number(text);
    return text;
  }
  function keyValue(text) {
    const separator = text.indexOf(":");
    if (separator <= 0 || text.startsWith('"') || text.startsWith("'")) return null;
    return [text.slice(0, separator).trim(), text.slice(separator + 1).trim()];
  }
  function absorbMap(map, indent) {
    while (peek() && peek().indent === indent && !peek().text.startsWith("- ")) {
      const token = tokens[index++];
      const pair = keyValue(token.text);
      if (!pair) throw new Error(`Expected a YAML key on line ${token.line}.`);
      map[pair[0]] = pair[1] === "" ? parseBlock(indent + 1) : scalar(pair[1]);
    }
    return map;
  }
  function parseBlock(minIndent) {
    const first = peek();
    if (!first || first.indent < minIndent) return null;
    if (first.text.startsWith("- ")) return parseList(first.indent);
    return absorbMap({}, first.indent);
  }
  function parseList(indent) {
    const list = [];
    while (peek() && peek().indent === indent && peek().text.startsWith("- ")) {
      const token = tokens[index++];
      const rest = token.text.slice(2).trim();
      if (rest === "") list.push(parseBlock(indent + 1));
      else {
        const pair = keyValue(rest);
        if (!pair) list.push(scalar(rest));
        else {
          const item = { [pair[0]]: pair[1] === "" ? parseBlock(indent + 2) : scalar(pair[1]) };
          absorbMap(item, indent + 2);
          list.push(item);
        }
      }
    }
    return list;
  }
  const value = parseBlock(0);
  if (peek()) throw new Error(`Unparsed YAML manifest content at line ${peek().line}.`);
  return value;
}

export function parseChapterManifest(text, file) {
  try {
    return /\.json$/i.test(file) ? JSON.parse(text) : parseYaml(text);
  } catch (error) {
    throw new Error(`Could not parse orange chapter manifest ${file}. ${error.message}`);
  }
}

function manifestEntries(document) {
  const source = Array.isArray(document) ? document : document?.chapters;
  if (Array.isArray(source)) {
    return source.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error(`Orange manifest chapter ${index + 1} must be an object.`);
      }
      return entry;
    });
  }
  if (source && typeof source === "object") {
    return Object.entries(source).map(([key, value]) => {
      if (typeof value === "string") return { slug: key, status: value };
      if (value && typeof value === "object" && !Array.isArray(value)) return { slug: key, ...value };
      throw new Error(`Orange manifest chapter ${key} must be a status or an object.`);
    });
  }
  throw new Error("Orange chapter manifest must be a list, or an object with a chapters list or map.");
}

function entryIdentity(entry) {
  const slug = typeof entry.slug === "string" ? entry.slug : typeof entry.id === "string" ? entry.id : null;
  const title = typeof entry.title === "string" ? entry.title : typeof entry.name === "string" ? entry.name : null;
  const rawSource = entry.source ?? entry.path ?? entry.sourcePath ?? entry.file;
  let source = typeof rawSource === "string" ? rawSource.trim().replace(/^\.\//, "").split("#")[0] : null;
  if (source?.startsWith("book/")) source = `docs/${source}`;
  if (source === "THE_ORANGE_BOOK.md") source = manuscriptPath;
  const rawAnchor = entry.anchor ?? entry.fragment;
  const anchor = typeof rawAnchor === "string" && rawAnchor.trim() ? rawAnchor.trim().replace(/^#/, "") : null;
  return { slug, title, source, anchor };
}

function selectMatches(pages, identity) {
  const found = (predicate) => {
    const matches = pages.filter(predicate);
    return matches.length ? matches : null;
  };
  if (identity.source && identity.anchor) {
    const matches = found((page) => page.file === identity.source && page.sourceAnchor === identity.anchor);
    if (matches) return matches;
  }
  if (identity.slug) {
    const matches = found((page) => page.slug === identity.slug);
    if (matches) return matches;
  }
  if (identity.source && identity.title) {
    const matches = found((page) => page.file === identity.source && page.title === identity.title);
    if (matches) return matches;
  }
  if (identity.title) {
    const matches = found((page) => page.title === identity.title);
    if (matches) return matches;
  }
  if (identity.source && !identity.slug && !identity.title && !identity.anchor) {
    return pages.filter((page) => page.file === identity.source);
  }
  return [];
}

function readingParts(readme) {
  const anchors = new Map();
  const files = new Map();
  if (!readme) return { anchors, files };
  const lines = manuscriptLines(readme);
  let part = null;
  let prose = "";
  const flush = () => {
    if (!part || !prose) return;
    rewriteProse(prose, (destination) => {
      const target = linkedFile("docs/book/README.md", destination);
      if (!target || target.file.startsWith("../")) return destination;
      if (target.fragment) {
        const key = `${target.file}#${target.fragment}`;
        const previous = anchors.get(key);
        anchors.set(key, anchors.has(key) && previous !== part ? null : part);
      }
      const seen = files.get(target.file) ?? new Set();
      seen.add(part);
      files.set(target.file, seen);
      return destination;
    });
  };
  for (const line of lines) {
    if (line.heading?.level === 2) {
      flush();
      prose = "";
      part = canonicalPart(line.heading.title);
    } else if (line.prose) prose += line.text;
  }
  flush();
  return { anchors, files };
}

function assignPart(page, parts) {
  const specific = parts.anchors.get(`${page.file}#${page.sourceAnchor}`);
  if (specific) return specific;
  if (specific === null) return null;
  const seen = parts.files.get(page.file);
  if (seen?.size === 1) return [...seen][0];
  return null;
}

function destinationAt(text, start) {
  if (text[start] === "<") {
    const end = text.indexOf(">", start + 1);
    return end < 0 ? null : { start: start + 1, end };
  }
  let depth = 0;
  let end = start;
  for (; end < text.length; end++) {
    if (text[end] === "\\") { end++; continue; }
    if (/\s/.test(text[end])) break;
    if (text[end] === "(") depth++;
    if (text[end] === ")") { if (depth === 0) break; depth--; }
  }
  return end > start ? { start, end } : null;
}

function rewriteProse(text, resolve) {
  const edits = [];
  const protectedSpans = [];
  for (let index = 0; index < text.length; index++) {
    if (text[index] !== "`") continue;
    const start = index;
    while (text[index + 1] === "`") index++;
    const delimiter = text.slice(start, index + 1);
    let close = text.indexOf(delimiter, index + 1);
    while (close >= 0 && (text[close - 1] === "`" || text[close + delimiter.length] === "`")) {
      close = text.indexOf(delimiter, close + delimiter.length);
    }
    if (close >= 0) { protectedSpans.push([start, close + delimiter.length]); index = close + delimiter.length - 1; }
  }
  const isCode = (index) => protectedSpans.some(([start, end]) => start <= index && index < end);
  const addDestination = (range) => {
    if (!range || isCode(range.start) || edits.some((edit) => edit.start === range.start)) return;
    const original = text.slice(range.start, range.end);
    const replacement = resolve(original);
    if (replacement !== original) edits.push({ ...range, replacement });
  };
  for (let index = 0; index < text.length - 1; index++) {
    if (text[index] !== "]" || text[index + 1] !== "(" || isCode(index) || text[index - 1] === "\\") continue;
    let start = index + 2;
    while (/\s/.test(text[start] ?? "") && start < text.length) start++;
    addDestination(destinationAt(text, start));
  }
  for (const match of text.matchAll(/^ {0,3}\[[^\]\n]+\]:[ \t]*/gm)) {
    addDestination(destinationAt(text, match.index + match[0].length));
  }
  for (const tag of text.matchAll(/<(?:a|img|source)\b[^>]*>/gi)) {
    if (isCode(tag.index)) continue;
    for (const attribute of tag[0].matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
      const start = tag.index + attribute.index + attribute[0].indexOf(attribute[1]) + 1;
      addDestination({ start, end: start + attribute[2].length });
    }
  }
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
  }
  return text;
}

function rewriteLines(lines, resolve, promote) {
  let output = "";
  let prose = "";
  const flush = () => { output += rewriteProse(prose, resolve); prose = ""; };
  for (const line of lines) {
    if (line.prose) prose += line.heading && promote ? line.text.replace(/^( {0,3})#/, "$1") : line.text;
    else { flush(); output += line.text; }
  }
  flush();
  return output.endsWith("\n") ? output : `${output}\n`;
}

function firstParagraph(markdown) {
  const blocks = markdown
    .replace(/```[\s\S]*?```/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block && !/^(?:#|>|\||[-*]\s|<)/.test(block))
    .map((block) => block
      .replace(/!\[[^\]]*]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      .replace(/[*_]+/g, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter(Boolean);
  const plain = blocks.find((block) => block.length >= 80) ?? blocks[0];
  if (!plain) return null;
  if (plain.length <= 240) return plain;
  const cut = plain.slice(0, 240);
  const space = cut.lastIndexOf(" ");
  return `${(space > 160 ? cut.slice(0, space) : cut).trim()}...`;
}

function pageHeading(file, heading) {
  if (!heading || heading.level !== 2 || partDivider.test(heading.title)) return false;
  if (file === manuscriptPath) return heading.title !== "Contents";
  if (file === "docs/book/README.md") return false;
  return true;
}

function bodyLines(doc, page, pages) {
  if (doc.file === manuscriptPath) {
    const next = pages.find((candidate) => candidate.file === doc.file && candidate.headingIndex > page.headingIndex);
    return doc.lines.slice(page.headingIndex + 1, next?.headingIndex ?? doc.lines.length);
  }
  const same = pages.filter((candidate) => candidate.file === doc.file);
  const position = same.indexOf(page);
  const next = same[position + 1];
  const region = doc.lines.slice(page.headingIndex + 1, next?.headingIndex ?? doc.lines.length);
  if (position === 0) {
    const lead = doc.lines.slice(0, page.headingIndex).filter((line) =>
      !(line.heading && (line.heading.level === 1 || partDivider.test(line.heading.title)))
    );
    region.unshift(...lead);
  }
  return region.filter((line) => !(line.heading && partDivider.test(line.heading.title)));
}

function mapAnchors(doc, pages) {
  const anchors = new Map();
  const sourceSlugger = new GithubSlugger();
  let page = null;
  let local = null;
  const pendingDividers = [];
  let titleAnchor = null;
  const routeOf = (candidate) => `/book/${candidate.slug}/`;
  for (const [index, line] of doc.lines.entries()) {
    if (!line.heading) continue;
    const sourceAnchor = sourceSlugger.slug(line.heading.title);
    const key = `${doc.file}#${sourceAnchor}`;
    if (doc.file === manuscriptPath && (line.heading.level === 1 || line.heading.title === "Contents")) {
      anchors.set(key, "/book/");
      continue;
    }
    if (line.heading.level === 1) {
      titleAnchor = key;
      continue;
    }
    if (partDivider.test(line.heading.title)) {
      pendingDividers.push(key);
      continue;
    }
    if (pageHeading(doc.file, line.heading)) {
      page = pages.find((candidate) => candidate.file === doc.file && candidate.headingIndex === index);
      local = new GithubSlugger();
      page.sourceAnchor = sourceAnchor;
      anchors.set(key, routeOf(page));
      for (const divider of pendingDividers) anchors.set(divider, routeOf(page));
      pendingDividers.length = 0;
      if (titleAnchor) { anchors.set(titleAnchor, routeOf(page)); titleAnchor = null; }
    } else if (page) {
      anchors.set(key, `${routeOf(page)}#${local.slug(line.heading.title)}`);
    }
  }
  if (doc.file === "docs/book/README.md") {
    const readme = pages.find((candidate) => candidate.file === doc.file);
    const localSlugger = new GithubSlugger();
    const source = new GithubSlugger();
    for (const line of doc.lines) {
      if (!line.heading) continue;
      const sourceAnchor = source.slug(line.heading.title);
      if (line.heading.level === 1) {
        readme.sourceAnchor = sourceAnchor;
        anchors.set(`${doc.file}#${sourceAnchor}`, routeOf(readme));
      } else anchors.set(`${doc.file}#${sourceAnchor}`, `${routeOf(readme)}#${localSlugger.slug(line.heading.title)}`);
    }
  }
  return anchors;
}

function applyManifest(pages, extras, document, warnings) {
  for (const entry of manifestEntries(document)) {
    const identity = entryIdentity(entry);
    const rawStatus = entry.status ?? entry.state;
    if (knownOriginal(rawStatus)) continue;
    const status = canonicalStatus(rawStatus);
    const part = canonicalPart(entry.part);
    const label = identity.slug ?? identity.title ?? identity.source ?? "an unnamed chapter";
    if (rawStatus != null && rawStatus !== "" && !status) {
      warnings.push(`Manifest status ${JSON.stringify(rawStatus)} for ${label} is not "drafted" or "planned"; left unmarked.`);
    }
    if (entry.part != null && entry.part !== "" && !part && !knownOriginal(entry.part)) {
      warnings.push(`Manifest part ${JSON.stringify(entry.part)} for ${label} is not Novice, Journeyman, or Master; left unassigned.`);
    }
    const matches = selectMatches(pages, identity);
    if (matches.length > 1) {
      warnings.push(`Manifest entry ${label} matches more than one hosted chapter; status left unmarked on those chapters.`);
      continue;
    }
    if (matches.length === 1) {
      const match = matches[0];
      if (status) match.status = status;
      if (part) match.manifestPart = part;
      match.manifestMatched = true;
      continue;
    }
    if (!status || (!identity.title && !identity.slug)) {
      warnings.push(`Manifest entry ${JSON.stringify(identity.source ?? identity.title ?? identity.slug)} did not match a hosted chapter and has no usable status; skipped.`);
      continue;
    }
    let slug = identity.slug ?? (identity.title ? new GithubSlugger().slug(identity.title) : null);
    if (!slug) continue;
    if (pages.some((page) => page.slug === slug) || extras.some((extra) => extra.slug === slug)) slug = `${slug}-listed`;
    extras.push({
      part: part ?? null,
      slug,
      title: identity.title ?? identity.slug,
      status,
      source: identity.source,
    });
  }
}

function generate(source) {
  if (!/^[a-f0-9]{40}$/.test(source.commit)) throw new Error("Book revision must be a full Git commit SHA.");
  const title = source.manuscript.match(/^# (.+)$/m)?.[1];
  const author = source.manuscript.match(/^By (.+)$/m)?.[1];
  const version = source.manuscript.match(/^Manuscript version: (.+)$/m)?.[1];
  const snapshot = source.manuscript.match(/^Snapshot: (\d{4}-\d{2}-\d{2})$/m)?.[1];
  if (!title || !author || !version || !snapshot) throw new Error("Missing manuscript identity fields.");
  const documents = [{ file: manuscriptPath, text: source.manuscript }];
  for (const [file, text] of [...source.bookFiles].sort(([left], [right]) => left.localeCompare(right))) {
    if (file.endsWith(".md")) documents.push({ file, text });
  }
  for (const doc of documents) doc.lines = manuscriptLines(doc.text);
  const pages = [];
  for (const doc of documents) {
    if (doc.file === "docs/book/README.md") {
      const heading = doc.lines.find((line) => line.heading?.level === 1);
      pages.push({
        file: doc.file, headingIndex: -1, slug: "book-readme", title: heading?.heading.title ?? "The Orange Book",
        sidebarPart: "Front matter", manifestPart: null, status: null, promote: false, kind: "readme",
      });
      continue;
    }
    if (doc.file === manuscriptPath) {
      doc.lines.forEach((line, index) => {
        if (!pageHeading(doc.file, line.heading)) return;
        const slug = chapterSlug(line.heading.title);
        pages.push({
          file: doc.file, headingIndex: index, slug, title: line.heading.title,
          sidebarPart: chapterPart(slug), manifestPart: null, status: null, promote: true, kind: "manuscript",
        });
      });
      continue;
    }
    const headings = [];
    doc.lines.forEach((line, index) => { if (pageHeading(doc.file, line.heading)) headings.push({ index, title: line.heading.title }); });
    if (headings.length === 0) {
      const heading = doc.lines.find((line) => line.heading?.level === 1);
      pages.push({
        file: doc.file, headingIndex: -1, slug: sectionSlug(doc.file, heading?.heading.title ?? path.posix.basename(doc.file)),
        title: heading?.heading.title ?? path.posix.basename(doc.file),
        sidebarPart: "Front matter", manifestPart: null, status: null, promote: false, kind: "file",
      });
      continue;
    }
    for (const heading of headings) {
      pages.push({
        file: doc.file, headingIndex: heading.index, slug: sectionSlug(doc.file, heading.title), title: heading.title,
        sidebarPart: "Front matter", manifestPart: null, status: null, promote: true, kind: "section",
      });
    }
  }
  const manuscriptPages = pages.filter((page) => page.kind === "manuscript");
  if (manuscriptPages.map((page) => page.slug).join() !== expectedSlugs.join()) {
    throw new Error(`The manuscript structure changed (${manuscriptPages.map((page) => page.slug).join(", ")}). Update the importer before syncing.`);
  }
  const slugs = new Set();
  for (const page of pages) {
    if (slugs.has(page.slug)) throw new Error(`Duplicate book slug: ${page.slug}`);
    slugs.add(page.slug);
  }
  const anchors = new Map();
  for (const doc of documents) for (const [key, route] of mapAnchors(doc, pages)) anchors.set(key, route);
  const firstPage = new Map();
  for (const page of pages) if (!firstPage.has(page.file)) firstPage.set(page.file, `/book/${page.slug}/`);
  const parts = readingParts(source.bookFiles.get("docs/book/README.md"));
  for (const page of pages) {
    if (page.kind === "manuscript" || page.kind === "section" || page.kind === "file") {
      const assigned = assignPart(page, parts);
      if (assigned) {
        page.manifestPart = assigned;
        if (page.kind !== "manuscript") page.sidebarPart = assigned;
      }
    }
  }
  const warnings = [];
  const extras = [];
  if (source.manifestText != null) applyManifest(pages, extras, parseChapterManifest(source.manifestText, source.manifestPath), warnings);
  const readme = source.bookFiles.get("docs/book/README.md") ?? "";
  const extrasInOrder = pages.filter((page) => page.kind !== "manuscript").sort((left, right) => {
    if (left.kind === "readme") return -1;
    if (right.kind === "readme") return 1;
    const rank = (page) => {
      const needle = page.sourceAnchor ? `#${page.sourceAnchor}` : path.posix.basename(page.file);
      const index = readme.indexOf(needle);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return rank(left) - rank(right) || left.file.localeCompare(right.file) || left.headingIndex - right.headingIndex;
  });
  const ordered = [...manuscriptPages, ...extrasInOrder];
  ordered.forEach((page, order) => { page.order = order; });
  let hostedLinks = 0;
  let repositoryLinks = 0;
  const broken = [];
  function resolveDestination(fromFile, destination) {
    if (!destination || /^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith("//") || destination.startsWith("/")) return destination;
    const target = linkedFile(fromFile, destination);
    if (!target) return destination;
    if (target.file === "assets/identity/orange-book-cover.svg") return "/projects/orange/book-cover.svg";
    const hosted = target.file === manuscriptPath || target.file.startsWith("docs/book/");
    if (hosted && (source.bookFiles.has(target.file) || target.file === manuscriptPath) && target.file.endsWith(".md")) {
      const route = target.fragment ? anchors.get(`${target.file}#${target.fragment}`) : firstPage.get(target.file) ?? "/book/";
      if (route) { hostedLinks++; return route; }
      if (target.file === manuscriptPath) throw new Error(`Unknown manuscript anchor: ${destination}`);
      broken.push({ source: fromFile, destination, reason: "no hosted heading for this anchor" });
    } else if (target.file.startsWith("../")) {
      throw new Error(`Repository link escapes its root: ${destination}`);
    }
    repositoryLinks++;
    const kind = target.directory ? "tree" : "blob";
    const suffix = target.directory && !target.file.endsWith("/") ? "/" : "";
    const rawFragment = destination.includes("#") ? `#${destination.split("#").slice(1).join("#")}` : "";
    return `${repositoryUrl}/${kind}/${source.commit}/${target.file}${suffix}${rawFragment}`;
  }
  const files = new Map([[vendorPath, source.manuscript], [downloadPath, source.manuscript]]);
  for (const page of ordered) {
    const doc = documents.find((candidate) => candidate.file === page.file);
    const lines = page.kind === "readme"
      ? doc.lines.filter((line) => line.heading?.level !== 1)
      : bodyLines(doc, page, ordered);
    const description = page.kind === "manuscript"
      ? descriptions[manuscriptPages.indexOf(page)]
      : firstParagraph(lines.map((line) => line.text).join("")) ?? page.title;
    page.description = description;
    const data = { title: page.title, part: page.sidebarPart, order: page.order, description };
    const frontmatter = Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
    const body = rewriteLines(lines, (destination) => resolveDestination(page.file, destination), page.promote);
    files.set(`${chapterDirectory}/${page.slug}.md`, `---\n${frontmatter}\n---\n${body}`);
  }
  const manifest = {
    schemaVersion: 1,
    repository: repositoryUrl,
    ref: source.ref,
    commit: source.commit,
    title,
    author,
    version,
    snapshot,
    manuscript: manuscriptPath,
    docsBook: source.bookFiles.size > 0,
    orangeManifest: source.manifestPath,
    chapters: [
      ...ordered.map((page) => ({
        part: page.manifestPart,
        slug: page.slug,
        title: page.title,
        status: page.status,
        source: page.file,
      })),
      ...extras,
    ],
  };
  files.set(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`);
  const metadata = {
    title, author, version, snapshot, revision: source.commit, ref: source.ref,
    sourceUrl: `${repositoryUrl}/blob/${source.commit}/${manuscriptPath}`,
    chapters: ordered.map((page) => ({
      slug: page.slug, title: page.title, part: page.sidebarPart, order: page.order, description: page.description,
    })),
  };
  files.set(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return { files, ordered, broken, warnings, hostedLinks, repositoryLinks, manifest };
}

async function loadSnapshot() {
  const provenance = JSON.parse(await readFile(path.join(root, provenancePath), "utf8").catch((error) => {
    if (error.code === "ENOENT") throw new Error(`Missing ${provenancePath}. Run npm run sync:book once with network access before --offline or --check.`);
    throw error;
  }));
  if (!/^[a-f0-9]{40}$/.test(provenance.commit ?? "")) throw new Error(`${provenancePath} has no full commit SHA.`);
  const manuscript = await readFile(path.join(root, vendorPath), "utf8");
  const bookFiles = await readBookFiles(path.join(root, snapshotBookDirectory));
  const manifestPath = provenance.orangeManifest ?? null;
  return {
    ref: provenance.ref,
    commit: provenance.commit,
    manuscript,
    bookFiles,
    manifestPath,
    manifestText: manifestPath ? bookFiles.get(manifestPath) ?? null : null,
  };
}

async function loadCheckout(directory, ref, commit) {
  const manuscriptFile = path.join(directory, manuscriptPath);
  const manuscript = await readFile(manuscriptFile, "utf8").catch((error) => {
    if (error.code === "ENOENT") throw new Error(`${ref} (${commit}) has no ${manuscriptPath}.`);
    throw error;
  });
  const bookFiles = await readBookFiles(path.join(directory, "docs/book"));
  const manifestPath = findManifest(bookFiles);
  return { ref, commit, manuscript, bookFiles, manifestPath, manifestText: manifestPath ? bookFiles.get(manifestPath) : null };
}

async function writeSnapshot(source) {
  await mkdir(path.join(root, snapshotDirectory), { recursive: true });
  await writeFile(path.join(root, provenancePath), `${JSON.stringify({
    schemaVersion: 1,
    ref: source.ref,
    commit: source.commit,
    orangeManifest: source.manifestPath,
  }, null, 2)}\n`);
  await rm(path.join(root, snapshotBookDirectory), { recursive: true, force: true });
  for (const [file, text] of source.bookFiles) {
    const destination = path.join(root, snapshotBookDirectory, file.slice("docs/book/".length));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, text);
  }
}

async function commitSource(args) {
  if (args.offline || args.check) return loadSnapshot();
  if (args.repo) {
    const dirty = git(["-C", args.repo, "status", "--porcelain", "--", "docs/THE_ORANGE_BOOK.md", "docs/book"], undefined);
    if (dirty.trim()) throw new Error("Commit the Orange Book files before importing them so the hosted source has an immutable revision.");
    const commit = git(["-C", args.repo, "rev-parse", "HEAD"], undefined).trim();
    return loadCheckout(args.repo, args.ref, commit);
  }
  const fetched = fetchOrange(args.ref);
  try {
    return await loadCheckout(fetched.dir, args.ref, fetched.sha);
  } finally {
    rmSync(fetched.dir, { recursive: true, force: true });
  }
}

function selfTest() {
  const manifest = parseChapterManifest(`chapters:\n  - slug: n7\n    title: "N7: Name"\n    part: Novice\n    status: drafted\n    source: docs/book/N7.md\n  - slug: rings\n    title: Rings\n    part: Journeyman\n    status: planned\n`, "docs/book/manifest.yaml");
  if (manifest.chapters[0].status !== "drafted" || manifest.chapters[1].part !== "Journeyman") {
    throw new Error("YAML manifest parser failed.");
  }
  const json = parseChapterManifest('{"chapters":{"preface":"planned"}}', "manifest.json");
  if (json.chapters.preface !== "planned") throw new Error("JSON manifest parser failed.");
  let rejected = false;
  try { parseYaml("value: |\n  no\n"); } catch { rejected = true; }
  if (!rejected) throw new Error("Block scalars must be rejected.");
  if (canonicalStatus("Drafted") !== "drafted" || canonicalStatus("draft") !== "drafted" || canonicalStatus("planned") !== "planned" || canonicalStatus("original") !== undefined) {
    throw new Error("Status normalization drifted.");
  }
  if (canonicalPart("Part 2, The Journeyman") !== "Journeyman" || canonicalPart("Part I") !== undefined) {
    throw new Error("Part normalization drifted.");
  }
  const manuscript = readFileSync(path.join(root, vendorPath), "utf8");
  const manifestText = JSON.stringify({
    chapters: [
      {
        id: "n1",
        title: "N1. Before You Hide Anything",
        part: "novice",
        status: "draft",
        path: "docs/book/NOVICE_OPENING.md",
        anchor: "chapter-1-before-you-hide-anything",
      },
      {
        id: "original-manuscript",
        title: "Existing seventeen chapters and four appendices",
        part: "original",
        status: "original",
        path: "docs/THE_ORANGE_BOOK.md",
        anchor: "preface",
      },
      { slug: "rings", title: "Rings and Fields", part: "Journeyman", status: "planned", source: "docs/book/RINGS.md" },
      { slug: "preface", status: "complete" },
    ],
  });
  const result = generate({
    ref: "self-test",
    commit: "a".repeat(40),
    manuscript,
    bookFiles: new Map([
      ["docs/book/README.md", "## Part 1, The Novice\n\n- [Before](NOVICE_OPENING.md#chapter-1-before-you-hide-anything)\n\n## Part 3, The Master\n\n- [Seams](../THE_ORANGE_BOOK.md#chapter-1-the-seams-are-the-system)\n"],
      ["docs/book/NOVICE_OPENING.md", "# The Orange Book\n\n## Chapter 1: Before You Hide Anything\n\nA message can be read by someone it was not meant for.\n"],
      ["docs/book/manifest.json", manifestText],
    ]),
    manifestPath: "docs/book/manifest.json",
    manifestText,
  });
  const chapters = result.manifest.chapters;
  const novice = chapters.find((chapter) => chapter.slug === "novice-chapter-1");
  const preface = chapters.find((chapter) => chapter.slug === "preface");
  const seams = chapters.find((chapter) => chapter.slug === "chapter-1");
  const rings = chapters.find((chapter) => chapter.slug === "rings");
  if (novice?.status !== "drafted" || novice.part !== "Novice" || novice.slug !== "novice-chapter-1") {
    throw new Error(`Novice chapter was not marked from the manifest: ${JSON.stringify(novice)}`);
  }
  if (preface?.status !== null) throw new Error(`Unrecognized status was stored as ${preface.status}.`);
  if (chapters.some((chapter) => chapter.slug === "original-manuscript" || chapter.status === "draft" || chapter.status === "original")) {
    throw new Error(`Rollup or orange vocabulary leaked into the site manifest: ${JSON.stringify(chapters.filter((chapter) => chapter.status !== null))}`);
  }
  if (seams?.part !== "Master" || seams.status !== null) throw new Error(`Manuscript part mapping failed: ${JSON.stringify(seams)}`);
  if (rings?.status !== "planned" || rings.part !== "Journeyman" || rings.slug !== "rings") throw new Error(`Planned chapter missing: ${JSON.stringify(rings)}`);
  if (result.files.has(`${chapterDirectory}/rings.md`)) throw new Error("A planned chapter with no source file was given a page.");
  if (!result.warnings.some((warning) => warning.includes("complete"))) throw new Error("Unrecognized status was not reported.");
  if (result.warnings.some((warning) => /original/i.test(warning))) throw new Error(`Original rollup was warned: ${result.warnings.join(" | ")}`);
  console.log("Orange Book sync self-test passed.");
}

async function main() {
  const args = options(process.argv.slice(2));
  if (args.selfTest) { selfTest(); return; }
  const source = await commitSource(args);
  if (source.manifestPath && source.manifestText == null) {
    throw new Error(`Orange manifest ${source.manifestPath} was recorded but not found in the snapshot.`);
  }
  const result = generate(source);
  const existing = await readdir(path.join(root, chapterDirectory)).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const stale = existing.filter((name) => name.endsWith(".md") && !result.files.has(`${chapterDirectory}/${name}`));
  const mismatches = [];
  for (const [relativePath, expected] of result.files) {
    const absolutePath = path.join(root, relativePath);
    const current = await readFile(absolutePath, "utf8").catch((error) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (current === expected) continue;
    if (args.check) mismatches.push(relativePath);
    else { await mkdir(path.dirname(absolutePath), { recursive: true }); await writeFile(absolutePath, expected); }
  }
  if (!args.check) await writeSnapshot(source);
  if (args.check) {
    mismatches.push(...stale.map((name) => `${chapterDirectory}/${name} (stale)`));
    if (mismatches.length) {
      throw new Error(`Book outputs are out of date:\n${mismatches.map((file) => `  ${file}`).join("\n")}\nRun npm run sync:book to fetch the Book, or npm run sync:book -- --offline to rebuild the committed snapshot.`);
    }
  } else {
    for (const name of stale) await unlink(path.join(root, chapterDirectory, name));
  }
  const mode = args.check ? "Verified" : "Synced";
  const book = source.bookFiles.size ? `${source.bookFiles.size} docs/book files` : "docs/book absent";
  const listed = source.manifestPath ? `manifest ${source.manifestPath}` : "no orange manifest; every chapter status left unmarked";
  console.log(`${mode} ${result.ordered.length} Orange Book pages from ${source.ref} at ${source.commit}. ${book}; ${listed}.`);
  console.log(`${result.hostedLinks} hosted cross-references, ${result.repositoryLinks} repository links, manuscript ${result.manifest.version} (${result.manifest.snapshot}).`);
  for (const warning of result.warnings) console.log(`Warning: ${warning}`);
  if (result.broken.length) {
    console.log("In-book links that do not resolve to a hosted heading (rewritten to the orange commit):");
    for (const item of result.broken) console.log(`  ${item.source}: ${item.destination} (${item.reason})`);
  } else console.log("Every in-book link resolved to a hosted page or a repository file.");
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
