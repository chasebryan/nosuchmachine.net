import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nosuchmachine.net",
  trailingSlash: "always",
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
