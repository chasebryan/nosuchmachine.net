import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

// Layout markup stays with the design. These build rewrites keep the book
// index from shifting on mobile without editing those files: the cover SVG is
// 1600×2400, and the contents <details> must not paint open and then collapse
// after the reader script loads. Desktop still shows the contents immediately
// via an external stylesheet (no <style> element, so a style-src-elem of
// 'self' can stay strict).
const desktopNavLink = '<link rel="stylesheet" href="/book-nav-boot.css">';

function bookLayoutStability() {
  return {
    name: "book-layout-stability",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const root = fileURLToPath(dir);
        const pages = [];
        async function walk(directory) {
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const full = path.join(directory, entry.name);
            if (entry.isDirectory()) await walk(full);
            else if (entry.name.endsWith(".html")) pages.push(full);
          }
        }
        await walk(root);
        for (const file of pages) {
          const html = await readFile(file, "utf8");
          let next = html;
          if (next.includes('id="book-navigation"')) {
            next = next.replace(
              '<details id="book-navigation" open>',
              '<details id="book-navigation">',
            );
            if (!next.includes('href="/book-nav-boot.css"')) {
              next = next.replace("</head>", `${desktopNavLink}</head>`);
            }
          }
          if (next.includes('src="/projects/orange/book-cover.svg"')) {
            next = next.replace(
              /<img\b[^>]*\bsrc="\/projects\/orange\/book-cover\.svg"[^>]*>/,
              (tag) => {
                const open = tag.replace(/\s(?:width|height)="[^"]*"/g, "").replace(/\s*\/?>$/, "");
                return `${open} width="1600" height="2400">`;
              },
            );
            if (!next.includes('width="1600" height="2400"')) {
              throw new Error(`book-layout-stability: could not set the cover aspect ratio in ${file}`);
            }
          }
          if (next !== html) await writeFile(file, next);
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://nosuchmachine.net",
  trailingSlash: "always",
  integrations: [bookLayoutStability()],
  build: {
    format: "directory",
  },
  markdown: {
    shikiConfig: {
      // AA pair. Light is the default; dark follows prefers-color-scheme via
      // the .astro-code hook in src/styles/global.css.
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
      langs: [
        {
          name: "orange",
          scopeName: "source.orange",
          patterns: [
            { name: "comment.line.double-slash.orange", match: "//.*$" },
            {
              name: "string.quoted.double.orange",
              begin: '(?:[bh])?"',
              end: '"',
              patterns: [{ name: "constant.character.escape.orange", match: "\\\\." }],
            },
            {
              name: "keyword.control.orange",
              match: "\\b(spec|impl|proof|game|module|use|let|for|in|if|else|requires|ensures|return|pub)\\b",
            },
            { name: "constant.language.orange", match: "\\b(true|false)\\b" },
            { name: "entity.name.type.orange", match: "\\b(Int|Bool|Word|Mod|Array)\\b" },
            {
              name: "constant.numeric.orange",
              match: "\\b(0[xX][0-9a-fA-F_]+|0[bB][01_]+|[0-9][0-9_]*)\\b",
            },
            {
              name: "entity.name.function.orange",
              match: "\\b[a-zA-Z_][a-zA-Z_0-9]*(?=\\s*\\()",
            },
            { name: "keyword.operator.orange", match: "[=+*/%&|^~<>!:-]+" },
          ],
        },
      ],
    },
  },
  // Keep scripts and images as files. The Cloudflare CSP allows same-origin
  // scripts and forbids inline event handlers, so nothing executable is inlined.
  vite: { build: { assetsInlineLimit: 0 } },
});
