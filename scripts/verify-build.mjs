import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist");
const catalog = JSON.parse(fs.readFileSync("src/data/catalog.json", "utf8"));
const book = JSON.parse(fs.readFileSync("src/data/book.json", "utf8"));
const study = JSON.parse(fs.readFileSync("src/data/study.json", "utf8"));

function decodeAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>/g)].map((match) =>
    Object.fromEntries(
      [...match[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [
        attribute[1],
        decodeAttribute(attribute[2]),
      ]),
    ),
  );
}

function readRoute(route) {
  const file = path.join(root, route, "index.html");
  assert.ok(fs.existsSync(file), `Missing page: ${route}`);
  return fs.readFileSync(file, "utf8");
}
assert.equal(
  new Set(catalog.map((p) => p.slug)).size,
  catalog.length,
  "Project slugs must be unique",
);
assert.deepEqual(
  catalog.filter((project) => project.featured).map((project) => project.slug),
  ["orange"],
  "Orange must be the only featured catalog project",
);
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeProjects = catalog.filter((project) =>
  home.includes(`href="/projects/${project.slug}/"`),
);
assert.deepEqual(
  homeProjects.map((project) => project.slug),
  ["orange"],
  "Orange must be the only catalog project linked from the homepage",
);
assert.ok(!/<canvas\b/i.test(home), "Homepage must not include canvas visuals");
assert.ok(
  !/data-motion-toggle|data-animation-toggle/i.test(home),
  "Homepage must not include animation or motion controls",
);

assert.equal(book.chapters.length, 24, "The pinned Orange Book has 24 chapters");
assert.equal(
  new Set(book.chapters.map((chapter) => chapter.slug)).size,
  book.chapters.length,
  "Book chapter slugs must be unique",
);
for (const field of ["title", "author", "version", "snapshot", "sourceUrl"])
  assert.ok(
    typeof book[field] === "string" && book[field].trim(),
    `Missing book ${field}`,
  );
assert.match(
  book.revision,
  /^[a-f\d]{40}$/,
  "Book source must be pinned to a full commit revision",
);
assert.ok(
  fs.existsSync("vendor/orange/THE_ORANGE_BOOK.md"),
  "The original Orange Book source must be retained locally",
);
// Check against the vendored manuscript, so missing text or stale chapter imports
// fail without fetching a moving upstream revision during a build.
execFileSync(process.execPath, ["scripts/sync-orange-book.mjs", "--check"], {
  stdio: "inherit",
});
execFileSync(process.execPath, ["scripts/sync-orange-study.mjs", "--check"], {
  stdio: "inherit",
});
assert.ok(
  fs.readFileSync(path.join(root, "book/orange-book.md")).equals(
    fs.readFileSync("vendor/orange/THE_ORANGE_BOOK.md"),
  ),
  "The hosted manuscript download must match the original source",
);
assert.ok(
  anchors(home).some((anchor) => anchor.href === "/book/"),
  "Homepage must link to the hosted Orange Book",
);
const bookHome = readRoute("/book/");
const bookHomeLinks = new Set(anchors(bookHome).map((anchor) => anchor.href));
const chapterRoutes = book.chapters.map((chapter) => `/book/${chapter.slug}/`);
for (const route of ["/book/", ...chapterRoutes])
  assert.ok(
    sitemap.includes(`https://nosuchmachine.net${route}</loc>`),
    `Book route missing from sitemap: ${route}`,
  );

for (const [index, chapter] of book.chapters.entries()) {
  if (index > 0)
    assert.ok(
      chapter.order > book.chapters[index - 1].order,
      "Book chapters must follow reading order",
    );
  const route = chapterRoutes[index];
  assert.ok(bookHomeLinks.has(route), `Book contents missing chapter: ${chapter.title}`);
  const chapterLinks = anchors(readRoute(route));
  const activeChapterLinks = chapterLinks.filter(
    (anchor) =>
      anchor["aria-current"] === "page" && chapterRoutes.includes(anchor.href),
  );
  assert.deepEqual(
    activeChapterLinks.map((anchor) => anchor.href),
    [route],
    `Book sidebar must identify the current chapter: ${route}`,
  );
  for (const [relation, expected] of [
    ["prev", chapterRoutes[index - 1]],
    ["next", chapterRoutes[index + 1]],
  ]) {
    const links = chapterLinks.filter((anchor) =>
      (anchor.rel ?? "").split(/\s+/).includes(relation),
    );
    assert.deepEqual(
      links.map((anchor) => anchor.href),
      expected ? [expected] : [],
      `Incorrect ${relation} chapter link: ${route}`,
    );
  }
}

const searchIndexFile = path.join(root, "book/search-index.json");
assert.ok(fs.existsSync(searchIndexFile), "Missing locally hosted book search index");
const searchIndex = JSON.parse(fs.readFileSync(searchIndexFile, "utf8"));
assert.ok(
  Array.isArray(searchIndex),
  "Book search index must contain an array of chapter entries",
);
const studyRoutes = study.lessons.map((lesson) => `/book/${lesson.slug}/`);
assert.equal(study.lessons.filter((lesson) => lesson.linear).length, 11, "The novice draft has 11 reading lessons");
assert.equal(study.revision, "a5620df49f695423f32d1c7bfe0056a28a9773ae", "Novice lessons must stay pinned to the book branch");
assert.ok(bookHomeLinks.has("/book/before-we-begin/"), "Book contents must open the novice draft");
for (const route of studyRoutes) {
  assert.ok(bookHomeLinks.has(route), `Book contents missing novice page: ${route}`);
  assert.ok(sitemap.includes(`https://nosuchmachine.net${route}</loc>`), `Novice route missing from sitemap: ${route}`);
}
const linearRoutes = study.lessons.filter((lesson) => lesson.linear).map((lesson) => `/book/${lesson.slug}/`);
for (const [index, route] of linearRoutes.entries()) {
  const links = anchors(readRoute(route));
  for (const [relation, expected] of [
    ["prev", linearRoutes[index - 1]],
    ["next", linearRoutes[index + 1]],
  ]) {
    const related = links.filter((anchor) => (anchor.rel ?? "").split(/\s+/).includes(relation));
    assert.deepEqual(related.map((anchor) => anchor.href), expected ? [expected] : [], `Incorrect novice ${relation} link: ${route}`);
  }
}
assert.deepEqual(
  searchIndex.map((chapter) => chapter.url),
  [...chapterRoutes, ...studyRoutes],
  "Book search must index every manuscript chapter and novice lesson in order",
);
const indexedChapters = [...book.chapters, ...study.lessons];
for (const [index, chapter] of searchIndex.entries()) {
  assert.equal(
    chapter.title,
    indexedChapters[index].title,
    `Search title differs from chapter: ${chapter.url}`,
  );
  assert.ok(
    typeof chapter.text === "string" && chapter.text.trim().length > 100,
    `Search index lacks chapter text: ${chapter.url}`,
  );
}
// Orange's sized-call syntax resembles Markdown links. Readers must be able to
// find these literal examples from both inline code and fenced code blocks.
for (const [route, expressions] of [
  [
    "/book/chapter-8/",
    [
      "sha256[2](m)",
      "sum[1]([10])",
      "spec total() -> Int { sum([1, 2, 3]) + sum[1]([10]) }",
    ],
  ],
  ["/book/appendix-a/", ["f[s, ...](args)"]],
]) {
  const chapter = searchIndex.find((entry) => entry.url === route);
  for (const expression of expressions)
    assert.ok(
      chapter.text.includes(expression),
      `Book search must preserve Orange syntax ${expression} in ${route}`,
    );
}

const files = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (file.endsWith(".html")) files.push(file);
  }
}
walk(root);
let checkedLinks = 0;
for (const project of catalog) {
  const route = `/projects/${project.slug}/`;
  const projectFile = path.join(root, route, "index.html");
  assert.ok(
    sitemap.includes(`https://nosuchmachine.net${route}`),
    `${project.name} missing from sitemap`,
  );
  assert.ok(
    fs.existsSync(projectFile),
    `${project.name} page missing`,
  );
  assert.ok(
    project.sources.length > 0,
    `${project.name} needs a source reference`,
  );
  const projectHtml = fs.readFileSync(projectFile, "utf8");
  const projectLinks = new Set(
    [...projectHtml.matchAll(/\bhref="([^"]+)"/g)].map((match) =>
      match[1].replaceAll("&amp;", "&"),
    ),
  );
  for (const source of project.sources) {
    assert.ok(
      projectLinks.has(source.href),
      `${project.name} missing source reference: ${source.href}`,
    );
  }
}
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${file}`);
  assert.ok(ids.includes("main"), `Missing main content target: ${file}`);
  assert.equal(
    [...html.matchAll(/<main\b/g)].length,
    1,
    `Expected one main landmark: ${file}`,
  );
  assert.equal(
    [...html.matchAll(/<h1\b/g)].length,
    1,
    `Expected one page heading: ${file}`,
  );
  for (const tag of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/application\/ld\+json/.test(tag[1])) continue;
    assert.ok(
      /\bsrc=/.test(tag[1]) && !tag[2].trim(),
      `Executable inline script conflicts with CSP: ${file}`,
    );
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(
      match[1].replaceAll("&amp;", "&"),
      `https://nosuchmachine.net/${path.relative(root, file)}`,
    );
    if (url.origin !== "https://nosuchmachine.net") continue;
    let target = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory())
      target = path.join(target, "index.html");
    assert.ok(fs.existsSync(target), `Missing target ${match[1]} on ${file}`);
    if (url.hash && target.endsWith(".html")) {
      const targetHtml = fs.readFileSync(target, "utf8");
      assert.ok(
        targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
        `Missing anchor ${match[1]} on ${file}`,
      );
    }
    checkedLinks++;
  }
}
console.log(
  `Verified Orange-only homepage, ${book.chapters.length} hosted book chapters with reading navigation and search, ${catalog.length} project routes and source references, ${files.length} HTML pages, ${checkedLinks} local links/assets, sitemap, and CSP-compatible scripts.`,
);
