#!/usr/bin/env node
/**
 * Import the Orange manuscript into chapter pages without rewriting its prose.
 * Default input is the checked-in snapshot; builds never fetch the manuscript.
 * Use --repo /path/to/orange to update from a clean, committed local checkout.
 * Use --check to compare all outputs without changing any files.
 */
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = "docs/THE_ORANGE_BOOK.md";
const vendorPath = "vendor/orange/THE_ORANGE_BOOK.md";
const metadataPath = "src/data/book.json";
const chapterDirectory = "src/content/book";
const repositoryUrl = "https://github.com/chasebryan/orange";
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

function options(args) {
  const result = { check: false, repo: undefined };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--check") result.check = true;
    else if (args[index] === "--repo" && args[index + 1] && !args[index + 1].startsWith("--")) {
      result.repo = path.resolve(args[++index]);
    } else if (args[index] === "--help") {
      console.log("Usage: node scripts/sync-orange-book.mjs [--repo /path/to/orange] [--check]");
      process.exit(0);
    } else throw new Error(`Unknown or incomplete argument: ${args[index]}`);
  }
  return result;
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
    // This manuscript has no indented code, but future examples should also be
    // protected from link rewriting and chapter detection.
    if (/^(?: {4}|\t)/.test(text)) prose = false;
    const heading = prose ? text.trimEnd().match(/^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/) : null;
    return { text, prose, heading: heading && { level: heading[1].length, title: heading[2] } };
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

// Read one Markdown destination, preserving its delimiters and optional title.
// Parentheses inside destinations are balanced rather than truncated by regex.
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
  // Backtick code spans can cross line boundaries. Do not change literal links
  // printed inside them; closing delimiters must match the opening run exactly.
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
  // Reference-style links resolve through their definitions, including images.
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

function rewriteLines(lines, resolve) {
  let output = "";
  let prose = "";
  const flush = () => { output += rewriteProse(prose, resolve); prose = ""; };
  for (const line of lines) {
    if (line.prose) {
      // The chapter title comes from the reader layout. Promote subsection
      // headings so the article has h1, h2, h3 rather than skipping h2.
      prose += line.heading ? line.text.replace(/^( {0,3})#/, "$1") : line.text;
    } else { flush(); output += line.text; }
  }
  flush();
  return output;
}

function generate(source, revision) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Book revision must be a full Git commit SHA.");
  const title = source.match(/^# (.+)$/m)?.[1];
  const author = source.match(/^By (.+)$/m)?.[1];
  const version = source.match(/^Manuscript version: (.+)$/m)?.[1];
  const snapshot = source.match(/^Snapshot: (\d{4}-\d{2}-\d{2})$/m)?.[1];
  if (!title || !author || !version || !snapshot) throw new Error("Missing manuscript identity fields.");
  const lines = manuscriptLines(source);
  const sections = lines.flatMap((line, index) => line.heading?.level === 2 ? [{ index, title: line.heading.title }] : []);
  const chapters = sections.filter((section) => section.title !== "Contents").map((section, order) => {
    const slug = chapterSlug(section.title);
    const sectionIndex = sections.indexOf(section);
    return {
      slug, title: section.title, part: chapterPart(slug), order,
      description: descriptions[order],
      start: section.index, end: sections[sectionIndex + 1]?.index ?? lines.length,
    };
  });
  const expectedSlugs = ["preface", ...Array.from({ length: 17 }, (_, index) => `chapter-${index + 1}`), ..."abcd".split("").map((letter) => `appendix-${letter}`), "manuscript-map", "sources-and-drafting-disclosure"];
  if (chapters.map((chapter) => chapter.slug).join() !== expectedSlugs.join()) {
    throw new Error("The manuscript structure changed. Update the importer and descriptions before syncing.");
  }
  const anchorRoutes = new Map();
  const sourceSlugger = new GithubSlugger();
  let currentChapter;
  let localSlugger;
  for (const [index, line] of lines.entries()) {
    if (!line.heading) continue;
    const sourceAnchor = sourceSlugger.slug(line.heading.title);
    if (line.heading.level === 1 || line.heading.title === "Contents") {
      anchorRoutes.set(sourceAnchor, "/book/");
      continue;
    }
    if (line.heading.level === 2) {
      currentChapter = chapters.find((chapter) => chapter.start === index);
      localSlugger = new GithubSlugger();
      anchorRoutes.set(sourceAnchor, `/book/${currentChapter.slug}/`);
    } else if (currentChapter) {
      anchorRoutes.set(sourceAnchor, `/book/${currentChapter.slug}/#${localSlugger.slug(line.heading.title)}`);
    }
  }
  let hostedLinks = 0;
  let repositoryLinks = 0;
  function resolveDestination(destination) {
    if (!destination || /^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith("//")) return destination;
    if (destination === "../assets/identity/orange-book-cover.svg") return "/projects/orange/book-cover.svg";
    const [relativePath, fragment] = destination.split(/#(.*)/s);
    if (!relativePath || path.posix.normalize(path.posix.join("docs", relativePath)) === sourcePath) {
      const route = fragment ? anchorRoutes.get(decodeURIComponent(fragment)) : "/book/";
      if (!route) throw new Error(`Unknown manuscript anchor: ${destination}`);
      hostedLinks++;
      return route;
    }
    const target = path.posix.normalize(path.posix.join("docs", relativePath));
    if (target.startsWith("../")) throw new Error(`Repository link escapes its root: ${destination}`);
    repositoryLinks++;
    return `${repositoryUrl}/${relativePath.endsWith("/") ? "tree" : "blob"}/${revision}/${target}${relativePath.endsWith("/") && !target.endsWith("/") ? "/" : ""}${fragment === undefined ? "" : `#${fragment}`}`;
  }
  const files = new Map([[vendorPath, source], ["public/book/orange-book.md", source]]);
  for (const chapter of chapters) {
    const data = Object.fromEntries(["title", "part", "order", "description"].map((key) => [key, chapter[key]]));
    const frontmatter = Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
    const body = rewriteLines(lines.slice(chapter.start + 1, chapter.end), resolveDestination);
    files.set(`${chapterDirectory}/${chapter.slug}.md`, `---\n${frontmatter}\n---\n${body}`);
  }
  const metadata = {
    title, author, version, snapshot, revision,
    sourceUrl: `${repositoryUrl}/blob/${revision}/${sourcePath}`,
    chapters: chapters.map(({ start, end, ...chapter }) => chapter),
  };
  files.set(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return { files, chapters, hostedLinks, repositoryLinks };
}

async function main() {
  const args = options(process.argv.slice(2));
  let source;
  let revision;
  if (args.repo) {
    const dirty = execFileSync("git", ["-C", args.repo, "status", "--porcelain", "--", sourcePath], { encoding: "utf8" }).trim();
    if (dirty) throw new Error("Commit the Orange manuscript before importing it so the hosted source has an immutable revision.");
    revision = execFileSync("git", ["-C", args.repo, "log", "-1", "--format=%H", "--", sourcePath], { encoding: "utf8" }).trim();
    source = await readFile(path.join(args.repo, sourcePath), "utf8");
  } else {
    source = await readFile(path.join(root, vendorPath), "utf8");
    revision = JSON.parse(await readFile(path.join(root, metadataPath), "utf8")).revision;
  }
  const result = generate(source, revision);
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
  if (args.check) {
    mismatches.push(...stale.map((name) => `${chapterDirectory}/${name} (stale)`));
    if (mismatches.length) throw new Error(`Book outputs are out of date:\n${mismatches.map((file) => `  ${file}`).join("\n")}\nRun npm run sync:book to regenerate from the vendored source.`);
  } else {
    for (const name of stale) await unlink(path.join(root, chapterDirectory, name));
  }
  console.log(`${args.check ? "Verified" : "Synced"} ${result.chapters.length} Orange Book sections; ${result.hostedLinks} hosted cross-references and ${result.repositoryLinks} pinned repository links. Source revision ${revision}.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
