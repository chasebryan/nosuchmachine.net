import fs from "node:fs";
import path from "node:path";
import { classifyUrl, distRoot, htmlTags, idsIn, pageUrl, walkFiles } from "./dist-html.mjs";

const root = distRoot();
if (!fs.existsSync(root)) {
  console.error("dist/ is missing. Run npm run build before checking links.");
  process.exit(1);
}

const files = walkFiles(root, (file) => file.endsWith(".html"));
const broken = [];
const external = new Set();
const nonHttp = new Set();
const idCache = new Map();
let internal = 0;
let fragments = 0;

function idsFor(file) {
  if (!idCache.has(file)) idCache.set(file, idsIn(file));
  return idCache.get(file);
}

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const where = pageUrl(root, file);
  for (const tag of htmlTags(html)) {
    for (const attribute of ["href", "xlink:href"]) {
      if (!Object.hasOwn(tag.attrs, attribute)) continue;
      const raw = tag.attrs[attribute];
      const result = classifyUrl(raw, file, root);
      if (result.kind === "external") {
        const url = new URL(result.href);
        url.hash = "";
        external.add(url.href);
        continue;
      }
      if (result.kind === "nonhttp") {
        nonHttp.add(result.href);
        continue;
      }
      if (result.kind !== "internal" || !result.exists) {
        broken.push(`${where} <${tag.name} ${attribute}="${raw}"> ${result.reason || "target does not exist"}`);
        continue;
      }
      internal += 1;
      if (!result.hash) continue;
      fragments += 1;
      const documentFile =
        result.file.endsWith(".html") || result.file.endsWith(".svg") || result.file.endsWith(".xml");
      if (!documentFile) {
        broken.push(`${where} fragment on ${raw} but ${path.relative(root, result.file)} has no element ids`);
        continue;
      }
      if (!idsFor(result.file).has(result.hash)) {
        broken.push(`${where} missing #${result.hash} (${raw})`);
      }
    }
  }
}

const externalLinks = [...external].sort();
console.log(
  `Checked ${internal} internal hrefs and ${fragments} fragments across ${files.length} HTML pages.`,
);
console.log(`External links (reported, not failed): ${externalLinks.length}`);
for (const link of externalLinks) console.log(`  ${link}`);
if (nonHttp.size > 0) {
  console.log(`Non-HTTP hrefs (reported, not failed): ${nonHttp.size}`);
  for (const link of [...nonHttp].sort()) console.log(`  ${link}`);
}
if (broken.length > 0) {
  console.error(`Broken internal links: ${broken.length}`);
  for (const item of broken) console.error(`  ${item}`);
  process.exit(1);
}
