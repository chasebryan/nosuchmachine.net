import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist");
const catalog = JSON.parse(fs.readFileSync("src/data/catalog.json", "utf8"));
assert.equal(
  new Set(catalog.map((p) => p.slug)).size,
  catalog.length,
  "Project slugs must be unique",
);
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  assert.ok(
    home.includes(`href="${route}"`),
    `${project.name} missing from homepage`,
  );
  assert.ok(
    sitemap.includes(`https://nosuchmachine.net${route}`),
    `${project.name} missing from sitemap`,
  );
  assert.ok(
    fs.existsSync(path.join(root, route, "index.html")),
    `${project.name} page missing`,
  );
  assert.ok(
    project.sources.length > 0,
    `${project.name} needs a source reference`,
  );
}
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${file}`);
  assert.ok(ids.includes("main"), `Missing main content target: ${file}`);
  assert.ok(
    html.includes("data-motion-toggle"),
    `Missing motion control: ${file}`,
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
        targetHtml.includes(`id="${url.hash.slice(1)}"`),
        `Missing anchor ${match[1]} on ${file}`,
      );
    }
    checkedLinks++;
  }
}
console.log(
  `Verified ${catalog.length} project routes, ${files.length} HTML pages, ${checkedLinks} local links/assets, sitemap, and CSP-compatible scripts.`,
);
