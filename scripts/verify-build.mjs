import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyUrl, distRoot, htmlTags, idsIn, routeToFile, walkFiles } from "./dist-html.mjs";

// Ideas' homepage sections. Required once enabled, and automatically once every
// id is already in the built homepage, so current main is not failed early.
const HOME_SECTION_IDS = ["hero", "current", "listing", "non-claims", "book-parts", "about"];
const CHAPTER_STATUSES = ["drafted", "planned"];
const SHA_FIELDS = ["sha", "commit", "revision", "orangeCommit", "orangeSha"];

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

function readRoute(root, route) {
  const file = routeToFile(root, route);
  assert.ok(fs.existsSync(file), `Missing page: ${route}`);
  return fs.readFileSync(file, "utf8");
}

function headerBlocks(text) {
  const blocks = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = { path: line.trim(), headers: [] };
      blocks.push(current);
      continue;
    }
    if (!current) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith("!")) {
      current.headers.push({ unset: trimmed.slice(1).trim().toLowerCase() });
      continue;
    }
    const separator = trimmed.indexOf(":");
    assert.ok(separator > 0, `Malformed _headers line: ${trimmed}`);
    current.headers.push({
      name: trimmed.slice(0, separator).trim().toLowerCase(),
      value: trimmed.slice(separator + 1).trim(),
    });
  }
  return blocks;
}

function cspDirectives(value) {
  const directives = new Map();
  for (const part of value.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    directives.set(tokens[0], tokens.slice(1));
  }
  return directives;
}

function sources(directives, name) {
  return directives.get(name) ?? null;
}

function assertSourceIsSelf(directives, name) {
  const value = sources(directives, name);
  assert.deepEqual(value, ["'self'"], `CSP ${name} must be 'self' only`);
}

function assertSecurityHeaders(root, htmlFiles) {
  const headersPath = process.env.VERIFY_HEADERS || "public/_headers";
  const source = fs.readFileSync(headersPath, "utf8");
  const published = path.join(root, "_headers");
  assert.ok(fs.existsSync(published), "Built dist is missing _headers");
  assert.equal(
    fs.readFileSync(published, "utf8"),
    source,
    `dist/_headers drifted from ${headersPath}`,
  );
  const blocks = headerBlocks(source);
  const site = blocks.find((block) => block.path === "/*");
  assert.ok(site, `${headersPath} is missing the /* block`);
  const detached = new Set(site.headers.filter((item) => item.unset).map((item) => item.unset));
  assert.ok(
    detached.has("access-control-allow-origin"),
    "verify-build: /* must detach Access-Control-Allow-Origin",
  );
  const header = (name) => site.headers.find((item) => item.name === name)?.value;
  assert.equal(header("x-content-type-options"), "nosniff");
  assert.equal(header("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(header("x-frame-options"), "DENY");
  const permissions = header("permissions-policy") ?? "";
  for (const feature of ["camera=()", "microphone=()", "geolocation=()"]) {
    assert.ok(permissions.includes(feature), `Permissions-Policy is missing ${feature}`);
  }
  const hsts = header("strict-transport-security") ?? "";
  const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1]);
  assert.ok(maxAge >= 31536000, "HSTS max-age must be at least one year");
  assert.ok(hsts.includes("includeSubDomains"), "HSTS must include subdomains");
  const csp = header("content-security-policy");
  assert.ok(csp, "public/_headers is missing Content-Security-Policy");
  const directives = cspDirectives(csp);
  for (const [name, values] of directives) {
    assert.ok(!values.includes("*"), `CSP ${name} must not use a wildcard source`);
    assert.ok(!values.includes("'unsafe-eval'"), `CSP ${name} must not allow unsafe-eval`);
    assert.ok(
      !values.some((value) => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(value)),
      `CSP ${name} must not allow a font CDN`,
    );
  }
  assert.ok(directives.has("upgrade-insecure-requests"), "CSP must upgrade insecure requests");
  assert.deepEqual(sources(directives, "default-src"), ["'self'"]);
  assert.deepEqual(sources(directives, "script-src"), ["'self'"]);
  assert.deepEqual(sources(directives, "script-src-attr"), ["'none'"]);
  assert.deepEqual(sources(directives, "object-src"), ["'none'"]);
  assert.deepEqual(sources(directives, "base-uri"), ["'self'"]);
  assert.deepEqual(sources(directives, "form-action"), ["'none'"]);
  assert.deepEqual(sources(directives, "frame-ancestors"), ["'none'"]);
  assert.deepEqual(sources(directives, "frame-src"), ["'none'"]);
  assertSourceIsSelf(directives, "font-src");
  assertSourceIsSelf(directives, "connect-src");

  let styleAttributes = 0;
  let styleElements = 0;
  let inlineScripts = 0;
  let dataUrls = 0;
  let frames = 0;
  let eventHandlers = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    styleAttributes += [...html.matchAll(/\sstyle="/g)].length;
    styleElements += [...html.matchAll(/<style\b/g)].length;
    frames += [...html.matchAll(/<iframe\b/g)].length;
    for (const tag of htmlTags(html)) {
      if (Object.keys(tag.attrs).some((name) => name.startsWith("on"))) eventHandlers += 1;
      if (tag.name === "script" && !tag.attrs.src && tag.attrs.type !== "application/ld+json") {
        inlineScripts += 1;
      }
      for (const value of Object.values(tag.attrs)) {
        if (typeof value === "string" && value.trim().toLowerCase().startsWith("data:")) dataUrls += 1;
      }
    }
  }
  assert.equal(inlineScripts, 0, "Built HTML has executable inline scripts, which script-src 'self' blocks");
  assert.equal(eventHandlers, 0, "Built HTML has inline event handlers, which script-src-attr 'none' blocks");
  assert.equal(frames, 0, "Built HTML has an iframe, which frame-src 'none' blocks");
  const imageSources = sources(directives, "img-src");
  if (dataUrls > 0) {
    assert.ok(imageSources?.includes("data:"), "CSP img-src must allow data: because the build uses a data URL");
  } else {
    assert.deepEqual(imageSources, ["'self'"], "CSP img-src must be 'self' only while the build has no data URLs");
  }
  const styleSrc = sources(directives, "style-src") ?? [];
  const styleElementSources = sources(directives, "style-src-elem") ?? styleSrc;
  const styleAttributeSources = sources(directives, "style-src-attr") ?? styleSrc;
  if (styleAttributes > 0) {
    assert.ok(
      styleSrc.includes("'unsafe-inline'"),
      "CSP style-src must allow 'unsafe-inline' so older browsers still apply Shiki's style attributes",
    );
    assert.ok(
      styleAttributeSources.includes("'unsafe-inline'"),
      "CSP style-src-attr must allow 'unsafe-inline' because the build emits style attributes",
    );
  } else {
    assert.ok(
      !styleSrc.includes("'unsafe-inline'") && !styleAttributeSources.includes("'unsafe-inline'"),
      "CSP still allows inline styles, but the build no longer emits style attributes",
    );
  }
  if (styleElements > 0) {
    assert.ok(styleElementSources.includes("'unsafe-inline'"), "CSP blocks the style elements this build emits");
  } else {
    assert.ok(
      !styleElementSources.includes("'unsafe-inline'"),
      "CSP style-src-elem must stay 'self' while the build has no <style> elements",
    );
  }
  console.log(
    `Security headers match the build: ${styleAttributes} style attributes, ${styleElements} style elements, no inline scripts or font CDNs.`,
  );
}

function assertHtmlDocuments(root, expectedRoutes) {
  for (const route of expectedRoutes) {
    const file = routeToFile(root, route);
    const emptyBook = route === "/book/" ? " Refusing to ship an empty /book." : "";
    assert.ok(
      fs.existsSync(file),
      `verify-build: missing expected page: ${route}.${emptyBook}`,
    );
  }
  const htmlFiles = walkFiles(root, (file) => file.endsWith(".html"));
  assert.ok(htmlFiles.length > 0, "verify-build: missing expected page: dist has no HTML");
  for (const file of htmlFiles) {
    const relative = path.relative(root, file);
    const stat = fs.statSync(file);
    assert.ok(stat.size > 0, `verify-build: zero-byte HTML: ${relative}`);
    const html = fs.readFileSync(file, "utf8");
    assert.ok(html.trim().length > 0, `verify-build: empty HTML: ${relative}`);
    const tags = htmlTags(html);
    const htmlTag = tags.find((tag) => tag.name === "html");
    assert.ok(htmlTag?.attrs.lang?.trim(), `verify-build: missing lang: ${relative}`);
    const title = html.match(/<title>([^<]*)<\/title>/i);
    assert.ok(title && title[1].trim(), `verify-build: missing <title>: ${relative}`);
    const description = tags.find(
      (tag) => tag.name === "meta" && (tag.attrs.name || "").toLowerCase() === "description",
    );
    assert.ok(
      description?.attrs.content?.trim(),
      `verify-build: missing meta description: ${relative}`,
    );
  }
  return htmlFiles;
}

function assertAssets(root) {
  const assetTags = new Set(["img", "script", "source", "video", "audio", "track", "embed"]);
  const htmlFiles = walkFiles(root, (file) => file.endsWith(".html"));
  for (const file of htmlFiles) {
    for (const tag of htmlTags(fs.readFileSync(file, "utf8"))) {
      const rel = tag.attrs.rel || "";
      const urls = [];
      if (assetTags.has(tag.name) && tag.attrs.src) urls.push(tag.attrs.src);
      if (
        tag.name === "link" &&
        tag.attrs.href &&
        /stylesheet|icon|apple-touch-icon|preload|modulepreload|manifest/.test(rel)
      ) {
        urls.push(tag.attrs.href);
      }
      if (tag.attrs.srcset) {
        for (const part of tag.attrs.srcset.split(",")) {
          const url = part.trim().split(/\s+/)[0];
          if (url) urls.push(url);
        }
      }
      for (const raw of urls) {
        const result = classifyUrl(raw, file, root);
        if (result.kind === "nonhttp" && result.href.toLowerCase().startsWith("data:")) continue;
        assert.ok(
          result.kind === "internal" && result.exists,
          `verify-build: broken asset reference: ${raw} in ${path.relative(root, file)} (${result.reason || result.kind})`,
        );
      }
    }
  }
  for (const file of walkFiles(root, (candidate) => candidate.endsWith(".css"))) {
    const css = fs.readFileSync(file, "utf8");
    for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
      const raw = match[2].trim();
      if (raw.startsWith("data:")) continue;
      const result = classifyUrl(raw, file, root);
      assert.ok(
        result.kind === "internal" && result.exists,
        `verify-build: broken asset reference: ${raw} in ${path.relative(root, file)} (${result.reason || result.kind})`,
      );
    }
  }
}

function assertExpectations(root, homeHtml) {
  const expectations = JSON.parse(fs.readFileSync("scripts/ci-expectations.json", "utf8"));
  assert.deepEqual(
    expectations.homeSectionIds.ids,
    HOME_SECTION_IDS,
    "scripts/ci-expectations.json home section ids changed. Toggle enabled instead of editing the contract.",
  );
  assert.deepEqual(
    expectations.chapterDataStatus.allowed,
    CHAPTER_STATUSES,
    "scripts/ci-expectations.json statuses changed. Only drafted and planned are allowed.",
  );
  const homeIds = idsIn(routeToFile(root, "/"));
  const requireHomeSections =
    expectations.homeSectionIds.enabled === true || process.env.SITE_CI_EXPECT_HOME_SECTIONS === "1";
  const missingSections = HOME_SECTION_IDS.filter((id) => !homeIds.has(id));
  if (requireHomeSections || missingSections.length === 0) {
    assert.deepEqual(
      missingSections,
      [],
      `Homepage is missing section ids: ${missingSections.join(", ")}. Set homeSectionIds.enabled in scripts/ci-expectations.json after Ideas' sections land, or export SITE_CI_EXPECT_HOME_SECTIONS=1.`,
    );
    console.log(`Homepage section ids required: ${HOME_SECTION_IDS.join(", ")}`);
  } else if (missingSections.length < HOME_SECTION_IDS.length) {
    const present = HOME_SECTION_IDS.filter((id) => homeIds.has(id));
    console.log(
      `Homepage section ids not required yet. Present: ${present.join(", ") || "(none)"}. Missing: ${missingSections.join(", ")}. Set homeSectionIds.enabled to true to require them now.`,
    );
  } else {
    console.log(
      "Homepage section ids not required yet. Set homeSectionIds.enabled to true in scripts/ci-expectations.json, or export SITE_CI_EXPECT_HOME_SECTIONS=1, once Ideas' sections land.",
    );
  }
  // homeHtml keeps the caller's already-loaded homepage available for future section text checks.
  assert.ok(homeHtml.includes('id="main"'));

  const requireChapterStatus =
    expectations.chapterDataStatus.enabled === true || process.env.SITE_CI_EXPECT_CHAPTER_STATUS === "1";
  const bookFiles = walkFiles(path.join(root, "book"), (file) => file.endsWith(".html"));
  let statusCount = 0;
  for (const file of bookFiles) {
    for (const tag of htmlTags(fs.readFileSync(file, "utf8"))) {
      if (!Object.hasOwn(tag.attrs, "data-status")) continue;
      statusCount += 1;
      assert.ok(
        CHAPTER_STATUSES.includes(tag.attrs["data-status"]),
        `data-status on ${path.relative(root, file)} must be drafted or planned, got ${tag.attrs["data-status"]}`,
      );
    }
  }
  if (statusCount > 0) console.log(`Checked ${statusCount} data-status attributes (drafted|planned only).`);
  if (!requireChapterStatus) {
    console.log(
      "Chapter data-status presence is not required yet. Set chapterDataStatus.enabled to true, or export SITE_CI_EXPECT_CHAPTER_STATUS=1, once chapter elements carry it.",
    );
    return;
  }
  const book = JSON.parse(fs.readFileSync("src/data/book.json", "utf8"));
  for (const chapter of book.chapters) {
    const file = routeToFile(root, `/book/${chapter.slug}/`);
    const statuses = htmlTags(fs.readFileSync(file, "utf8"))
      .map((tag) => tag.attrs["data-status"])
      .filter(Boolean);
    assert.ok(
      statuses.some((status) => CHAPTER_STATUSES.includes(status)),
      `Chapter page /book/${chapter.slug}/ is missing data-status="drafted|planned"`,
    );
  }
}

function manifestChapters(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.chapters)) return parsed.chapters;
  assert.fail(
    "src/content/book/manifest.json must be a chapter array or an object with a chapters array. Each chapter needs part, slug, title, status (drafted or planned), and a full orange commit SHA (sha, commit, revision, orangeCommit, or orangeSha).",
  );
}

function assertManifest(root) {
  const manifestPath = process.env.BOOK_MANIFEST || "src/content/book/manifest.json";
  if (!fs.existsSync(manifestPath)) {
    assert.ok(
      !process.env.BOOK_MANIFEST,
      `Book manifest not found at ${manifestPath}. Refusing to ship an empty /book.`,
    );
    console.log(
      "No src/content/book/manifest.json. Manifest checks turn on when the book sync writes one. A failed sync must still fail the build rather than publish an empty /book.",
    );
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    assert.fail(`Book manifest is not valid JSON: ${error.message}`);
  }
  const chapters = manifestChapters(parsed);
  assert.ok(
    chapters.length > 0,
    "Book manifest lists no chapters. Refusing to ship an empty /book.",
  );
  for (const chapter of chapters) {
    const label = chapter?.slug || "(missing slug)";
    assert.equal(typeof chapter.part, "string", `Manifest chapter ${label} is missing part`);
    assert.ok(chapter.part.trim(), `Manifest chapter ${label} has an empty part`);
    assert.equal(typeof chapter.slug, "string", `Manifest chapter is missing slug`);
    assert.ok(chapter.slug.trim(), "Manifest chapter has an empty slug");
    assert.equal(typeof chapter.title, "string", `Manifest chapter ${label} is missing title`);
    assert.ok(chapter.title.trim(), `Manifest chapter ${label} has an empty title`);
    assert.ok(
      CHAPTER_STATUSES.includes(chapter.status),
      `Manifest status for ${chapter.slug} must be drafted or planned, got ${JSON.stringify(chapter.status)}`,
    );
    const sha = SHA_FIELDS.map((field) => chapter[field]).find(
      (value) => typeof value === "string" && value.trim(),
    );
    assert.match(
      sha || "",
      /^[a-f0-9]{40}$/i,
      `Manifest chapter ${chapter.slug} needs a full orange commit SHA in ${SHA_FIELDS.join(", ")}`,
    );
    const page = routeToFile(root, `/book/${chapter.slug}/`);
    assert.ok(
      fs.existsSync(page) && fs.statSync(page).size > 0,
      `Manifest chapter ${chapter.slug} (${chapter.status}) has no built page at /book/${chapter.slug}/. Refusing to ship an incomplete book.`,
    );
  }
  console.log(`Manifest: ${chapters.length} chapters, each with a built page and status drafted or planned.`);
}

function verify() {
  const root = distRoot();
  assert.ok(
    fs.existsSync(root),
    "dist/ is missing. Run npm run build. If scripts/sync-orange-book.mjs failed, the build must stop instead of publishing an empty /book.",
  );
  const catalog = JSON.parse(fs.readFileSync("src/data/catalog.json", "utf8"));
  const book = JSON.parse(fs.readFileSync("src/data/book.json", "utf8"));
  const chapterRoutes = book.chapters.map((chapter) => `/book/${chapter.slug}/`);
  const expectedRoutes = [
    "/",
    "/book/",
    "/404.html",
    ...chapterRoutes,
    ...catalog.map((project) => `/projects/${project.slug}/`),
  ];
  const htmlFiles = assertHtmlDocuments(root, expectedRoutes);
  assertAssets(root);
  assertSecurityHeaders(root, htmlFiles);

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
  const bookHome = readRoute(root, "/book/");
  assert.ok(
    bookHome.trim().length > 0,
    "Refusing to ship an empty /book. The Orange Book sync or build did not produce a readable book index.",
  );
  const bookHomeLinks = new Set(anchors(bookHome).map((anchor) => anchor.href));
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
    const chapterLinks = anchors(readRoute(root, route));
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
  assert.deepEqual(
    searchIndex.map((chapter) => chapter.url),
    chapterRoutes,
    "Book search must index every chapter exactly once in reading order",
  );
  for (const [index, chapter] of searchIndex.entries()) {
    assert.equal(
      chapter.title,
      book.chapters[index].title,
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

  const files = walkFiles(root, (file) => file.endsWith(".html"));
  let checkedLinks = 0;
  for (const project of catalog) {
    const route = `/projects/${project.slug}/`;
    const projectFile = path.join(root, route, "index.html");
    assert.ok(
      sitemap.includes(`https://nosuchmachine.net${route}`),
      `${project.name} missing from sitemap`,
    );
    assert.ok(fs.existsSync(projectFile), `${project.name} page missing`);
    assert.ok(project.sources.length > 0, `${project.name} needs a source reference`);
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
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
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
  assertExpectations(root, home);
  assertManifest(root);
  console.log(
    `Verified Orange-only homepage, ${book.chapters.length} hosted book chapters with reading navigation and search, ${catalog.length} project routes and source references, ${files.length} HTML pages, ${checkedLinks} local links/assets, sitemap, and CSP-compatible scripts.`,
  );
}

function runVerify(directory, extraEnv = {}) {
  return spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: path.resolve("."),
    env: { ...process.env, VERIFY_DIST: directory, ...extraEnv },
    encoding: "utf8",
    timeout: 120000,
  });
}

function outputOf(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function selfTest() {
  const source = distRoot();
  assert.ok(fs.existsSync(path.join(source, "index.html")), "self-test needs a built dist/. Run npm run build first.");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "verify-build-"));
  const good = path.join(temp, "good");
  fs.cpSync(source, good, { recursive: true });
  try {
    const passed = runVerify(good);
    if (passed.status !== 0 || !outputOf(passed).includes("Verified Orange-only homepage")) {
      console.error(outputOf(passed));
      throw new Error("self-test: FALSE GREEN: unmutated dist did not pass verify-build");
    }
    console.log("self-test: unmutated dist passed");
    const cases = [
      {
        name: "zero-byte HTML",
        expect: /verify-build: zero-byte HTML:/,
        mutate(copy) {
          fs.writeFileSync(path.join(copy, "index.html"), "");
        },
      },
      {
        name: "missing title",
        expect: /verify-build: missing <title>:/,
        mutate(copy) {
          const file = path.join(copy, "index.html");
          const html = fs.readFileSync(file, "utf8");
          assert.ok(html.includes("<title>"), "fixture has no title element");
          fs.writeFileSync(file, html.replace(/<title>[^<]*<\/title>/, "<title></title>"));
        },
      },
      {
        name: "missing lang",
        expect: /verify-build: missing lang:/,
        mutate(copy) {
          const file = path.join(copy, "index.html");
          const html = fs.readFileSync(file, "utf8");
          assert.ok(/<html\b[^>]*\blang=/.test(html), "fixture has no lang attribute");
          fs.writeFileSync(file, html.replace(/\s+lang="[^"]*"/, ""));
        },
      },
      {
        name: "missing meta description",
        expect: /verify-build: missing meta description:/,
        mutate(copy) {
          const file = path.join(copy, "index.html");
          const html = fs.readFileSync(file, "utf8");
          assert.ok(html.includes('name="description"'), "fixture has no meta description");
          fs.writeFileSync(file, html.replace(/<meta\b(?=[^>]*name="description")[^>]*>/, ""));
        },
      },
      {
        name: "missing expected page",
        expect: /verify-build: missing expected page: \/404\.html/,
        mutate(copy) {
          fs.rmSync(path.join(copy, "404.html"));
        },
      },
      {
        name: "broken asset reference",
        expect: /verify-build: broken asset reference:/,
        mutate(copy) {
          const file = path.join(copy, "index.html");
          const html = fs.readFileSync(file, "utf8");
          assert.ok(html.includes('src="/projects/orange/emblem.svg"'), "fixture has no emblem asset");
          fs.writeFileSync(
            file,
            html.replace('src="/projects/orange/emblem.svg"', 'src="/projects/orange/missing.svg"'),
          );
        },
      },
    ];
    for (const testCase of cases) {
      const copy = path.join(temp, testCase.name.replaceAll(" ", "-"));
      fs.cpSync(good, copy, { recursive: true });
      testCase.mutate(copy);
      const result = runVerify(copy);
      const output = outputOf(result);
      if (result.status === 0) {
        throw new Error(`self-test: FALSE GREEN: ${testCase.name} did not fail`);
      }
      if (!testCase.expect.test(output)) {
        console.error(output);
        throw new Error(`self-test: ${testCase.name} failed for a different reason than ${testCase.expect}`);
      }
      console.log(`self-test: ${testCase.name} failed as expected`);
    }
    const withSections = path.join(temp, "home-sections");
    fs.cpSync(good, withSections, { recursive: true });
    const homeFile = path.join(withSections, "index.html");
    const builtHome = fs.readFileSync(homeFile, "utf8");
    const absentSections = HOME_SECTION_IDS.filter((id) => !builtHome.includes(`id="${id}"`));
    if (absentSections.length === 0) {
      if (!outputOf(passed).includes("Homepage section ids required")) {
        console.error(outputOf(passed));
        throw new Error("self-test: FALSE GREEN: homepage section ids were present but not required");
      }
      console.log("self-test: homepage section ids already required on this dist");
    } else {
      fs.writeFileSync(
        homeFile,
        builtHome.replace(
          "</body>",
          `${absentSections.map((id) => `<div id="${id}"></div>`).join("")}</body>`,
        ),
      );
      const sectionsOn = runVerify(withSections);
      if (sectionsOn.status !== 0 || !outputOf(sectionsOn).includes("Homepage section ids required")) {
        console.error(outputOf(sectionsOn));
        throw new Error("self-test: FALSE GREEN: homepage section ids were not required once all of them were present");
      }
      console.log("self-test: homepage section ids lock on when present");
    }
    const forced = runVerify(good, { SITE_CI_EXPECT_HOME_SECTIONS: "1" });
    if (absentSections.length === 0) {
      if (forced.status !== 0 || !outputOf(forced).includes("Homepage section ids required")) {
        console.error(outputOf(forced));
        throw new Error("self-test: FALSE GREEN: forcing homepage section ids failed even though they are present");
      }
      console.log("self-test: forced homepage section ids passed because they are present");
    } else if (forced.status === 0 || !/Homepage is missing section ids:/.test(outputOf(forced))) {
      console.error(outputOf(forced));
      throw new Error("self-test: FALSE GREEN: SITE_CI_EXPECT_HOME_SECTIONS=1 did not fail while section ids were missing");
    } else {
      console.log("self-test: forced homepage section ids failed as expected");
    }
    const planned = path.join(temp, "planned-status");
    fs.cpSync(good, planned, { recursive: true });
    const preface = path.join(planned, "book/preface/index.html");
    fs.writeFileSync(
      preface,
      fs.readFileSync(preface, "utf8").replace("<article", '<article data-status="planned"'),
    );
    const plannedResult = runVerify(planned);
    if (plannedResult.status !== 0 || !outputOf(plannedResult).includes("data-status attributes")) {
      console.error(outputOf(plannedResult));
      throw new Error("self-test: FALSE GREEN: data-status=planned was rejected");
    }
    console.log("self-test: data-status=planned passed");
    const invalidStatus = path.join(temp, "invalid-status");
    fs.cpSync(good, invalidStatus, { recursive: true });
    const invalidPreface = path.join(invalidStatus, "book/preface/index.html");
    fs.writeFileSync(
      invalidPreface,
      fs.readFileSync(invalidPreface, "utf8").replace("<article", '<article data-status="wip"'),
    );
    const invalidStatusResult = runVerify(invalidStatus);
    if (invalidStatusResult.status === 0 || !/must be drafted or planned/.test(outputOf(invalidStatusResult))) {
      console.error(outputOf(invalidStatusResult));
      throw new Error("self-test: FALSE GREEN: data-status=wip did not fail");
    }
    console.log("self-test: invalid data-status failed as expected");
    const revision = "4394a66201ff59d73bdd1dea38637bf9b7f37421";
    const validManifest = path.join(temp, "manifest-valid.json");
    fs.writeFileSync(
      validManifest,
      JSON.stringify({
        chapters: [
          { part: "Front matter", slug: "preface", title: "Preface", status: "drafted", sha: revision },
          { part: "Part I: Why Orange", slug: "chapter-1", title: "Chapter 1", status: "planned", commit: revision },
        ],
      }),
    );
    const manifestOk = runVerify(good, { BOOK_MANIFEST: validManifest });
    if (manifestOk.status !== 0 || !outputOf(manifestOk).includes("Manifest: 2 chapters")) {
      console.error(outputOf(manifestOk));
      throw new Error("self-test: FALSE GREEN: a valid book manifest was rejected");
    }
    console.log("self-test: valid manifest passed");
    const manifestCases = [
      {
        name: "manifest status",
        expect: /must be drafted or planned/,
        body: { chapters: [{ part: "Front matter", slug: "preface", title: "Preface", status: "draft", sha: revision }] },
      },
      {
        name: "manifest missing page",
        expect: /has no built page/,
        body: { chapters: [{ part: "Front matter", slug: "not-a-chapter", title: "Missing", status: "planned", sha: revision }] },
      },
      {
        name: "empty manifest",
        expect: /lists no chapters/,
        body: { chapters: [] },
      },
    ];
    for (const manifestCase of manifestCases) {
      const file = path.join(temp, `${manifestCase.name.replaceAll(" ", "-")}.json`);
      fs.writeFileSync(file, JSON.stringify(manifestCase.body));
      const result = runVerify(good, { BOOK_MANIFEST: file });
      if (result.status === 0 || !manifestCase.expect.test(outputOf(result))) {
        console.error(outputOf(result));
        throw new Error(`self-test: FALSE GREEN: ${manifestCase.name} did not fail as expected`);
      }
      console.log(`self-test: ${manifestCase.name} failed as expected`);
    }
    const headersText = fs.readFileSync(path.join(good, "_headers"), "utf8");
    const withoutDetach = headersText.replace(/^[ \t]*! Access-Control-Allow-Origin[ \t]*\r?\n/m, "");
    assert.notEqual(withoutDetach, headersText, "self-test fixture is missing the CORS detach line");
    assert.ok(
      !/access-control-allow-origin/i.test(withoutDetach),
      "self-test fixture still detaches Access-Control-Allow-Origin",
    );
    const headersCopy = path.join(temp, "headers-no-acao");
    fs.writeFileSync(headersCopy, withoutDetach);
    const noDetachDist = path.join(temp, "no-acao");
    fs.cpSync(good, noDetachDist, { recursive: true });
    fs.writeFileSync(path.join(noDetachDist, "_headers"), withoutDetach);
    const noDetach = runVerify(noDetachDist, { VERIFY_HEADERS: headersCopy });
    if (noDetach.status === 0 || !/verify-build: \/\* must detach Access-Control-Allow-Origin/.test(outputOf(noDetach))) {
      console.error(outputOf(noDetach));
      throw new Error("self-test: FALSE GREEN: removing ! Access-Control-Allow-Origin did not fail");
    }
    console.log("self-test: missing CORS detach failed as expected");
    console.log(`self-test: ${cases.length} mutated dist trees failed for the expected reasons`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv.includes("--self-test")) selfTest();
else verify();
