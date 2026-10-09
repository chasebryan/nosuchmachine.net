import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");
const root = path.resolve("dist");
const baselinePath = path.resolve("scripts/a11y-baseline.json");
const colorSchemes = ["light", "dark"];

function builtBookRoutes() {
  const bookDir = path.join(root, "book");
  if (!fs.existsSync(bookDir)) return [];
  return fs
    .readdirSync(bookDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(bookDir, entry.name, "index.html")))
    .map((entry) => `/book/${entry.name}/`)
    .sort();
}

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

function startServer(csp, serveRoot = root) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(400).end("Bad path");
      return;
    }
    let file = path.resolve(serveRoot, `.${pathname}`);
    const relative = path.relative(serveRoot, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(400).end("Bad path");
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    let status = 200;
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      const missing = path.join(serveRoot, "404.html");
      if (!fs.existsSync(missing)) {
        response.writeHead(404, {
          "content-type": "text/plain; charset=utf-8",
          "content-security-policy": csp,
        }).end("missing");
        return;
      }
      file = missing;
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

const cspRefusal = /content security policy|refused to (apply|load|execute|connect|frame)/i;

async function armCspWatch(page) {
  const messages = [];
  let watching = true;
  page.on("console", (message) => {
    if (!watching) return;
    const text = message.text();
    if (cspRefusal.test(text)) messages.push(text);
  });
  await page.evaluateOnNewDocument(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations.push({
        directive: event.violatedDirective || event.effectiveDirective || "",
        blockedURI: event.blockedURI || "",
        sample: event.sample || "",
      });
    });
  });
  return {
    messages,
    stop() {
      watching = false;
    },
    violations() {
      return page.evaluate(() => window.__cspViolations || []);
    },
  };
}

function cspFailure(label, messages, violations) {
  if (messages.length === 0 && violations.length === 0) return null;
  const lines = [`${label} CSP blocked a style or asset:`];
  for (const item of messages) lines.push(`  console: ${item}`);
  for (const item of violations) {
    const sample = item.sample ? ` (${item.sample})` : "";
    lines.push(`  securitypolicyviolation: ${item.directive} blocked ${item.blockedURI}${sample}`);
  }
  return lines.join("\n");
}

function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
}

async function runSelfTest() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "a11y-csp-"));
  fs.writeFileSync(
    path.join(fixture, "theme.css"),
    "@media (prefers-color-scheme: dark) {\n  .astro-code span { color: var(--shiki-dark) !important; }\n}\n",
  );
  fs.mkdirSync(path.join(fixture, "dual"));
  fs.writeFileSync(
    path.join(fixture, "dual", "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Dual theme</title>
  <link rel="stylesheet" href="/theme.css">
</head>
<body>
  <pre class="astro-code"><code><span id="tok" style="color:#0E1116;--shiki-dark:#F0F3F6">let</span></code></pre>
</body>
</html>
`,
  );
  fs.mkdirSync(path.join(fixture, "blocked"));
  fs.writeFileSync(
    path.join(fixture, "blocked", "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Blocked style</title>
  <style>body { color: #ff0000; }</style>
</head>
<body><p>blocked</p></body>
</html>
`,
  );

  const csp = siteCsp();
  const server = await startServer(csp, fixture);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchBrowser();
  const problems = [];
  try {
    const page = await browser.newPage();
    const watch = await armCspWatch(page);
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
    await page.goto(`${origin}/dual/`, { waitUntil: "load", timeout: 30000 });
    const sample = await page.evaluate(() => {
      const element = document.getElementById("tok");
      return {
        declared: element.getAttribute("style") || "",
        computed: getComputedStyle(element).color,
      };
    });
    const violations = await watch.violations();
    watch.stop();
    const overrideReport = cspFailure("dual-theme override", watch.messages, violations);
    if (overrideReport) {
      problems.push(`Dual-theme override must pass, but the probe reported a CSP block:\n${overrideReport}`);
    }
    if (!sample.declared.includes("#0E1116")) {
      problems.push(`Dual-theme fixture lost its inline #0E1116 color: ${sample.declared}`);
    }
    if (sample.computed !== "rgb(240, 243, 246)") {
      problems.push(
        `Dual-theme fixture did not apply var(--shiki-dark). Computed ${sample.computed}, expected rgb(240, 243, 246).`,
      );
    } else if (!overrideReport) {
      console.log(
        "Self-test: dark dual-theme override kept inline #0E1116 and computed rgb(240, 243, 246) with no CSP violation.",
      );
    }
    await page.close();

    const blockedPage = await browser.newPage();
    const blockedWatch = await armCspWatch(blockedPage);
    await blockedPage.goto(`${origin}/blocked/`, { waitUntil: "load", timeout: 30000 });
    const blockedViolations = await blockedWatch.violations();
    blockedWatch.stop();
    const blockedReport = cspFailure("blocked inline style", blockedWatch.messages, blockedViolations);
    const signal = [
      ...blockedWatch.messages,
      ...blockedViolations.map((item) => `${item.directive} ${item.blockedURI}`),
    ].join("\n");
    if (!blockedReport || !/style-src|inline style/i.test(signal)) {
      problems.push(
        "Blocked inline <style> must fail the CSP probe, but no style securitypolicyviolation or console refusal was recorded.",
      );
    } else {
      const how = blockedViolations.map((item) => item.directive).filter(Boolean).join(", ") || "console refusal";
      console.log(`Self-test: blocked inline style failed the probe (${how}).`);
    }
    await blockedPage.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
  if (problems.length > 0) {
    console.error(`Accessibility self-test failed (${problems.length}):`);
    for (const problem of problems) console.error(`\n${problem}`);
    process.exit(1);
  }
  console.log("Accessibility self-test passed: a dual-theme override is not a CSP block, and a blocked inline style fails the probe.");
}

if (process.argv.includes("--self-test")) {
  await runSelfTest();
  process.exit(0);
}

if (!fs.existsSync(root)) {
  console.error("dist/ is missing. Run npm run build before the accessibility check.");
  process.exit(1);
}

const pages = [
  { route: "/", status: 200 },
  { route: "/book/", status: 200 },
  ...builtBookRoutes().map((route) => ({ route, status: 200 })),
  { route: "/404", requestPath: "/this-page-is-not-published", status: 404 },
];

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const csp = siteCsp();
const server = await startServer(csp);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await launchBrowser();

const failures = [];
try {
  for (const scheme of colorSchemes) {
  for (const pageSpec of pages) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    const label = `${pageSpec.route} (${scheme})`;
    const cspWatch = await armCspWatch(page);
    await page.setViewport({ width: 1280, height: 2400 });
    const requestPath = pageSpec.requestPath || pageSpec.route;
    const response = await page.goto(`${origin}${requestPath}`, { waitUntil: "load", timeout: 30000 });
    if (response?.status() !== pageSpec.status) {
      failures.push(`${label} returned HTTP ${response?.status()}, expected ${pageSpec.status}`);
    }
    const presented = await page.evaluate(() => {
      let styleRules = 0;
      for (const sheet of document.styleSheets) {
        try {
          styleRules += sheet.cssRules.length;
        } catch {
          styleRules = -1;
          break;
        }
      }
      return { styleRules };
    });
    const cspViolations = await cspWatch.violations();
    cspWatch.stop();
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
    const blocked = cspFailure(label, cspWatch.messages, cspViolations);
    if (blocked) failures.push(blocked);
    if (result.styleRules <= 0) {
      failures.push(`${label} loaded no stylesheet rules under the site CSP (${result.styleRules})`);
    }
    const pageBaseline = Object.hasOwn(baseline.pages ?? {}, pageSpec.route) ? baseline.pages[pageSpec.route] : [];
    if (!Array.isArray(pageBaseline)) {
      failures.push(`scripts/a11y-baseline.json pages["${pageSpec.route}"] must be an array`);
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
  const scanned = new Set(pages.map((page) => page.route));
  for (const route of Object.keys(baseline.pages ?? {})) {
    if (!scanned.has(route)) {
      failures.push(`scripts/a11y-baseline.json lists ${route}, but that page was not scanned`);
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
