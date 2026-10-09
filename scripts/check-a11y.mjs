import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");
const root = path.resolve("dist");
const baselinePath = path.resolve("scripts/a11y-baseline.json");
const pages = [
  { route: "/", status: 200 },
  { route: "/book/", status: 200 },
  { route: "/book/chapter-1/", status: 200 },
  { route: "/404", requestPath: "/this-page-is-not-published", status: 404 },
];
const colorSchemes = ["light", "dark"];

function contentType(file) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".md": "text/markdown; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".ico": "image/x-icon",
  };
  return types[path.extname(file).toLowerCase()] || "application/octet-stream";
}

function siteCsp() {
  const headers = fs.readFileSync("public/_headers", "utf8");
  const match = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m);
  if (!match) throw new Error("public/_headers has no Content-Security-Policy");
  return match[1].trim();
}

function startServer(csp) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(400).end("Bad path");
      return;
    }
    let file = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(400).end("Bad path");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    let status = 200;
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      file = path.join(root, "404.html");
      status = 404;
    }
    response.writeHead(status, {
      "content-type": contentType(file),
      "content-security-policy": csp,
      "x-content-type-options": "nosniff",
    });
    response.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function violationKey(ruleId, target) {
  return `${ruleId}\n${target}`;
}

if (!fs.existsSync(root)) {
  console.error("dist/ is missing. Run npm run build before the accessibility check.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const csp = siteCsp();
const server = await startServer(csp);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

const failures = [];
try {
  for (const scheme of colorSchemes) {
  for (const pageSpec of pages) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    const label = `${pageSpec.route} (${scheme})`;
    const cspMessages = [];
    let watchCsp = true;
    page.on("console", (message) => {
      if (!watchCsp) return;
      const text = message.text();
      if (/content security policy|refused to (apply|load|execute|connect|frame)/i.test(text)) {
        cspMessages.push(text);
      }
    });
    await page.setViewport({ width: 1280, height: 2400 });
    const requestPath = pageSpec.requestPath || pageSpec.route;
    const response = await page.goto(`${origin}${requestPath}`, { waitUntil: "load", timeout: 30000 });
    if (response?.status() !== pageSpec.status) {
      failures.push(`${label} returned HTTP ${response?.status()}, expected ${pageSpec.status}`);
    }
    const presented = await page.evaluate(() => {
      const styled = [...document.querySelectorAll("code span[style]")].find((element) =>
        /(?:^|;)\s*color\s*:\s*#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i.test(element.getAttribute("style") || ""),
      );
      let inlineStyleApplied = null;
      if (styled) {
        const declared = styled.getAttribute("style").match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{6}|#[0-9a-f]{3})/i)[1];
        const hex = declared.slice(1);
        const expanded = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
        const value = Number.parseInt(expanded, 16);
        inlineStyleApplied = {
          declared,
          expected: `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`,
          computed: getComputedStyle(styled).color,
        };
      }
      let styleRules = 0;
      for (const sheet of document.styleSheets) {
        try {
          styleRules += sheet.cssRules.length;
        } catch {
          styleRules = -1;
          break;
        }
      }
      return { inlineStyleApplied, styleRules };
    });
    watchCsp = false;
    await page.setBypassCSP(true);
    await page.reload({ waitUntil: "load", timeout: 30000 });
    await page.evaluate(() => {
      for (const sidebar of document.querySelectorAll(".book-sidebar")) {
        sidebar.style.maxHeight = "none";
        sidebar.style.overflow = "visible";
      }
    });
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const axeResult = await window.axe.run(document, { resultTypes: ["violations"] });
      return axeResult.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
          target: node.target.join(" "),
          html: node.html,
        })),
      }));
    });
    const result = { ...presented, violations };
    if (cspMessages.length > 0) {
      failures.push(`${label} CSP blocked a built asset:\n${cspMessages.map((item) => `  ${item}`).join("\n")}`);
    }
    if (result.styleRules <= 0) {
      failures.push(`${label} loaded no stylesheet rules under the site CSP (${result.styleRules})`);
    }
    if (pageSpec.route === "/book/chapter-1/") {
      const applied = result.inlineStyleApplied;
      if (!applied) {
        failures.push("Chapter page has no colored style attribute; cannot confirm the CSP still allows Shiki");
      } else if (applied.computed !== applied.expected) {
        failures.push(
          `Chapter syntax color was blocked by CSP. Declared ${applied.declared} (${applied.expected}), computed ${applied.computed}.`,
        );
      } else {
        console.log(`CSP kept chapter syntax color ${applied.declared} -> ${applied.computed} (${scheme})`);
      }
    }
    const pageBaseline = baseline.pages?.[pageSpec.route];
    if (!Array.isArray(pageBaseline)) {
      failures.push(`scripts/a11y-baseline.json is missing a pages["${pageSpec.route}"] array`);
      await page.close();
      continue;
    }
    const applicable = pageBaseline.filter((entry) => !entry.scheme || entry.scheme === scheme);
    const remaining = new Map();
    for (const entry of applicable) {
      for (const field of ["id", "target", "owner", "summary"]) {
        if (typeof entry[field] !== "string" || !entry[field].trim()) {
          failures.push(`Baseline entry on ${pageSpec.route} needs a non-empty ${field}`);
        }
      }
      if (entry.scheme && entry.scheme !== "light" && entry.scheme !== "dark") {
        failures.push(`Baseline entry on ${pageSpec.route} has an unknown scheme ${entry.scheme}`);
      }
      const key = violationKey(entry.id, entry.target);
      remaining.set(key, (remaining.get(key) || 0) + 1);
    }
    for (const violation of result.violations) {
      for (const node of violation.nodes) {
        const key = violationKey(violation.id, node.target);
        if ((remaining.get(key) || 0) > 0) {
          remaining.set(key, remaining.get(key) - 1);
          continue;
        }
        failures.push(
          [
            `${label} ${violation.id} (${violation.impact}) ${node.target}`,
            `  ${violation.help}`,
            `  ${node.html}`,
            `  ${violation.helpUrl}`,
            "  Not listed in scripts/a11y-baseline.json",
          ].join("\n"),
        );
      }
    }
    for (const [key, count] of remaining) {
      if (count > 0) {
        const [id, target] = key.split("\n");
        failures.push(
          `${label} baseline waiver no longer reproduces: ${id} ${target}. Remove it from scripts/a11y-baseline.json.`,
        );
      }
    }
    const found = result.violations.reduce((sum, violation) => sum + violation.nodes.length, 0);
    console.log(`${label}: ${found} axe node(s), ${applicable.length} waived in the baseline`);
    await page.close();
  }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length > 0) {
  console.error(`Accessibility check failed (${failures.length}):`);
  for (const failure of failures) console.error(`\n${failure}`);
  process.exit(1);
}
console.log(
  `Accessibility check passed for ${pages.map((page) => page.route).join(", ")} in ${colorSchemes.join(" and ")} under the site CSP.`,
);
