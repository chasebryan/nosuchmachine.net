#!/usr/bin/env node
/**
 * Host the drafted Part 1 novice lessons beside the original manuscript.
 * Builds use the vendored sources and never fetch them.
 * Use --check to compare generated lessons without writing.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

const root = fileURLToPath(new URL("../", import.meta.url));
const vendorDirectory = "vendor/orange/book";
const lessonDirectory = "src/content/study";
const metadataPath = "src/data/study.json";
const repositoryUrl = "https://github.com/chasebryan/orange";
const branchRevision = "a5620df49f695423f32d1c7bfe0056a28a9773ae";

const pages = [
  { file: "NOVICE_OPENING.md", start: "A word before we begin", slug: "before-we-begin", title: "A word before we begin", order: 0, linear: true, description: "How to study the book without already knowing how to program or how cryptography works." },
  { file: "NOVICE_OPENING.md", start: "Chapter 1: Before You Hide Anything", slug: "novice-1", title: "Chapter 1: Before You Hide Anything", order: 1, linear: true, description: "Messages, confidentiality, keys, and what a single successful example can establish." },
  { file: "NOVICE_OPENING.md", start: "Chapter 2: Two Marks, Many Possibilities", slug: "novice-2", title: "Chapter 2: Two Marks, Many Possibilities", order: 2, linear: true, description: "Place value, binary, bits, bytes, hexadecimal, and the difference between a value and its notation." },
  { file: "NOVICE_OPENING.md", start: "Chapter 3: A Rule You Can Undo", slug: "novice-3", title: "Chapter 3: A Rule You Can Undo", order: 3, linear: true, description: "Boolean operations, masks, XOR, and what an exhaustive check can honestly say." },
  { file: "NOVICE_OPENING.md", start: "Answers and worked reasoning", slug: "novice-answers-1", title: "Worked answers: Chapters 1–3", order: 4, linear: false, description: "Worked answers for the opening exercises on messages, notation, and reversible rules." },
  { file: "NOVICE_PROGRAMMING.md", start: "Chapter 4: A Place to Work", slug: "novice-4", title: "Chapter 4: A Place to Work", order: 5, linear: true, description: "Files, the terminal, and how to record the source revision and compiler you actually used." },
  { file: "NOVICE_PROGRAMMING.md", start: "Chapter 5: Tell the Machine Exactly", slug: "novice-5", title: "Chapter 5: Tell the Machine Exactly", order: 6, linear: true, description: "A first Orange program, names and scope, diagnostics, and the gap between accepted source and intention." },
  { file: "NOVICE_PROGRAMMING.md", start: "Chapter 6: Words Have Edges", slug: "novice-6", title: "Chapter 6: Words Have Edges", order: 7, linear: true, description: "Fixed-width words, wrapping, shifts, rotations, and why grouping is part of the calculation." },
  { file: "NOVICE_PROGRAMMING.md", start: "Worked answers: Chapters 4–6", slug: "novice-answers-4", title: "Worked answers: Chapters 4–6", order: 8, linear: false, description: "Worked answers for the exercises on the working environment, a first program, and word arithmetic." },
  { file: "NOVICE_N7_NAME_THE_INTERMEDIATE_STEP.md", start: "N7: Name the Intermediate Step", slug: "novice-n7", title: "N7: Name the Intermediate Step", order: 9, linear: true, description: "Bindings, explicit conversions, arrays, and the ChaCha20 quarter round written one named step at a time." },
  { file: "NOVICE_N7_NAME_THE_INTERMEDIATE_STEP.md", start: "Worked answers", slug: "novice-answers-n7", title: "Worked answers: N7", order: 10, linear: false, description: "Worked answers for naming intermediate steps, conversions, and the quarter round." },
  { file: "NOVICE_N8_READ_AND_REPAIR.md", start: "N8: Read and Repair a Program", slug: "novice-n8", title: "N8: Read and Repair a Program", order: 11, linear: true, description: "How to predict a diagnostic, then repair grouping, conversion, bounds, and one wrong test." },
  { file: "NOVICE_N8_READ_AND_REPAIR.md", start: "Worked answers", slug: "novice-answers-n8", title: "Worked answers: N8", order: 12, linear: false, description: "Worked answers for reading diagnostics and making one repair at a time." },
  { file: "NOVICE_LOGIC.md", start: "N9: Say What You Mean", slug: "novice-n9", title: "N9: Say What You Mean", order: 13, linear: true, description: "Sets, functions, quantifiers, and the elementary proof patterns used later in the book." },
  { file: "NOVICE_LOGIC.md", start: "Worked answers: N9", slug: "novice-answers-n9", title: "Worked answers: N9", order: 14, linear: false, description: "Worked answers for the exercises on sets, functions, quantifiers, and proof patterns." },
  { file: "NOVICE_PROBABILITY.md", start: "N10: Count What You Do Not Know", slug: "novice-n10", title: "N10: Count What You Do Not Know", order: 15, linear: true, description: "Ratios, finite probability, and the difference between key length, distribution, and uncertainty." },
  { file: "NOVICE_PROBABILITY.md", start: "Worked answers", slug: "novice-answers-n10", title: "Worked answers: N10", order: 16, linear: false, description: "Worked answers for the exercises on counting, probability, and uncertainty." },
];

function options(args) {
  const result = { check: false };
  for (const arg of args) {
    if (arg === "--check") result.check = true;
    else if (arg === "--help") {
      console.log("Usage: node scripts/sync-orange-study.mjs [--check]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return result;
}

function sectionsOf(source) {
  let fence;
  const sections = [];
  let preamble = "";
  let current;
  for (const line of source.split("\n")) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !fence) fence = { marker: marker[1][0], length: marker[1].length };
    else if (marker && fence && marker[1][0] === fence.marker && marker[1].length >= fence.length && marker[2].trim() === "") fence = undefined;
    const heading = !fence && line.match(/^## (.+)$/);
    if (heading) {
      current = { title: heading[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) current.lines.push(line);
    else preamble += `${line}\n`;
  }
  return { preamble, sections };
}

function promote(text) {
  let fence;
  return text.split("\n").map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !fence) fence = { marker: marker[1][0], length: marker[1].length };
    else if (marker && fence && marker[1][0] === fence.marker && marker[1].length >= fence.length && marker[2].trim() === "") fence = undefined;
    return fence ? line : line.replace(/^( {0,3})#/, "$1");
  }).join("\n");
}

function rewrite(text, file, routes) {
  let fence;
  return text.split("\n").map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !fence) fence = { marker: marker[1][0], length: marker[1].length };
    else if (marker && fence && marker[1][0] === fence.marker && marker[1].length >= fence.length && marker[2].trim() === "") fence = undefined;
    if (fence) return line;
    return line.replace(/\]\(([^)\s]+)\)/g, (match, destination) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(destination) || destination.startsWith("//")) return match;
      const key = destination.startsWith("#") ? `${file}${destination}` : destination;
      const route = routes.get(key);
      if (!route) throw new Error(`Unmapped novice link: ${destination} in ${file}`);
      return `](${route})`;
    });
  }).join("\n");
}

function headingLines(lines) {
  let fence;
  const headings = [];
  for (const line of lines) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !fence) fence = { marker: marker[1][0], length: marker[1].length };
    else if (marker && fence && marker[1][0] === fence.marker && marker[1].length >= fence.length && marker[2].trim() === "") fence = undefined;
    const heading = !fence && line.match(/^(#{2,6}) (.+)$/);
    if (heading) headings.push(heading[2].trim());
  }
  return headings;
}

function generate(sources) {
  const byFile = new Map();
  for (const page of pages) {
    if (!byFile.has(page.file)) byFile.set(page.file, []);
    byFile.get(page.file).push(page);
  }
  const anchorRoutes = new Map([
    ["README.md", "/book/"],
    ["../THE_ORANGE_BOOK.md", "/book/"],
  ]);
  const rendered = new Map();
  for (const [file, filePages] of byFile) {
    const source = sources.get(file);
    if (!source) throw new Error(`Missing vendored novice source: ${file}`);
    const { preamble, sections } = sectionsOf(source);
    const starts = new Map(filePages.map((page) => [page.start, page]));
    const sourceSlugger = new GithubSlugger();
    const hostedSlugger = new Map(filePages.map((page) => [page.slug, new GithubSlugger()]));
    let page;
    let seededLeading = false;
    const chunks = new Map(filePages.map((item) => [item.slug, []]));
    const leading = [];
    const assign = (title, owner, { inBody }) => {
      const sourceAnchor = sourceSlugger.slug(title);
      const route = inBody
        ? `/book/${owner.slug}/#${hostedSlugger.get(owner.slug).slug(title)}`
        : `/book/${owner.slug}/`;
      anchorRoutes.set(`${file}#${sourceAnchor}`, route);
    };
    for (const section of sections) {
      const started = starts.get(section.title);
      if (started && !page && !seededLeading) {
        page = started;
        seededLeading = true;
        for (const lead of leading) {
          hostedSlugger.get(page.slug).slug(lead.title);
          for (const title of headingLines(lead.lines)) hostedSlugger.get(page.slug).slug(title);
        }
      } else if (started) page = started;
      else if (!page) leading.push(section);
      const owner = page;
      if (!owner) {
        sourceSlugger.slug(section.title);
        for (const title of headingLines(section.lines)) sourceSlugger.slug(title);
        continue;
      }
      chunks.get(owner.slug).push(section);
      assign(section.title, owner, { inBody: section.title !== owner.start });
      for (const title of headingLines(section.lines)) assign(title, owner, { inBody: true });
    }
    for (const filePage of filePages) {
      const bodyChunks = chunks.get(filePage.slug);
      if (!bodyChunks?.length) throw new Error(`Novice page has no source text: ${filePage.slug}`);
      let body = "";
      if (filePage === filePages[0] && (preamble.trim() || leading.length)) {
        const intro = `${preamble}${leading.map((section) => `## ${section.title}\n${section.lines.join("\n")}`).join("\n")}`.replace(/^# .+\n+/, "").replace(/^By .+\n+/, "");
        body += `${intro.trim()}\n\n`;
      }
      body += promote(bodyChunks[0].lines.join("\n")).replace(/^\n+/, "");
      for (const section of bodyChunks.slice(1)) body += `\n\n## ${section.title}\n${section.lines.join("\n")}`.replace(/\n*$/, "\n");
      rendered.set(filePage.slug, { page: filePage, body: `${body.trim()}\n` });
    }
  }
  const files = new Map();
  const lessons = [];
  for (const page of pages) {
    const lesson = rendered.get(page.slug);
    const body = rewrite(lesson.body, page.file, anchorRoutes);
    const data = { title: page.title, part: page.linear ? "Part 1, The Novice" : "Worked answers", order: page.order, description: page.description };
    const frontmatter = Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
    files.set(`${lessonDirectory}/${page.slug}.md`, `---\n${frontmatter}\n---\n${body}`);
    lessons.push({ ...data, slug: page.slug, linear: page.linear, draft: true });
  }
  const metadata = {
    title: "Part 1, The Novice",
    status: "Draft",
    snapshot: "2026-10-05",
    revision: branchRevision,
    sourceUrl: `${repositoryUrl}/blob/${branchRevision}/docs/book/README.md`,
    note: "Draft lessons from the open Orange book branch. They are one book with the original manuscript, not a second book. Two later novice lessons are still unwritten.",
    corrections: [
      { pullRequest: 246, revision: "f968111aa2e403e5aec3691cdccb90a686fc4898", summary: "Repair novice chapters 4–6 proofs and labels." },
      { pullRequest: 250, revision: "71dda3054c50d57e9858b8468d145773c3b195af", summary: "Date RFC 8439 as June 2018 in N7." },
      { pullRequest: 251, revision: "21b9eb511f68924ae2217633491cb7259ce41619", summary: "Correct N7's quarter-round trace and diagnostics." },
    ],
    sources: [...sources].map(([file, text]) => ({ file, sha256: createHash("sha256").update(text).digest("hex") })),
    lessons,
  };
  files.set(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return { files, lessons };
}

async function main() {
  const args = options(process.argv.slice(2));
  const names = [...new Set(pages.map((page) => page.file))];
  const sources = new Map();
  for (const name of names) sources.set(name, await readFile(path.join(root, vendorDirectory, name), "utf8"));
  const result = generate(sources);
  const existing = await readdir(path.join(root, lessonDirectory)).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  const stale = existing.filter((name) => name.endsWith(".md") && !result.files.has(`${lessonDirectory}/${name}`));
  const mismatches = [];
  for (const [relativePath, expected] of result.files) {
    const current = await readFile(path.join(root, relativePath), "utf8").catch((error) => error.code === "ENOENT" ? undefined : Promise.reject(error));
    if (current === expected) continue;
    if (args.check) mismatches.push(relativePath);
    else {
      await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
      await writeFile(path.join(root, relativePath), expected);
    }
  }
  if (args.check) {
    mismatches.push(...stale.map((name) => `${lessonDirectory}/${name} (stale)`));
    if (mismatches.length) throw new Error(`Novice lesson outputs are out of date:\n${mismatches.map((file) => `  ${file}`).join("\n")}\nRun npm run sync:study to regenerate.`);
  } else {
    for (const name of stale) await unlink(path.join(root, lessonDirectory, name));
  }
  console.log(`${args.check ? "Verified" : "Synced"} ${result.lessons.length} novice lessons from ${branchRevision}.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
