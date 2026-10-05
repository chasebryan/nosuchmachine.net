import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nosuchmachine.net",
  trailingSlash: "always",
  markdown: {
    shikiConfig: {
      theme: "github-light",
      langs: [{
        name: "orange",
        scopeName: "source.orange",
        patterns: [
          { name: "comment.line.double-slash.orange", match: "//.*$" },
          { name: "string.quoted.double.orange", begin: '(?:[bh])?"', end: '"', patterns: [{ name: "constant.character.escape.orange", match: "\\\\." }] },
          { name: "keyword.control.orange", match: "\\b(spec|impl|proof|game|module|use|let|for|in|if|else|requires|ensures|return|pub)\\b" },
          { name: "constant.language.orange", match: "\\b(true|false)\\b" },
          { name: "entity.name.type.orange", match: "\\b(Int|Bool|Word|Mod|Array)\\b" },
          { name: "constant.numeric.orange", match: "\\b(0[xX][0-9a-fA-F_]+|0[bB][01_]+|[0-9][0-9_]*)\\b" },
          { name: "entity.name.function.orange", match: "\\b[a-zA-Z_][a-zA-Z_0-9]*(?=\\s*\\()" },
          { name: "keyword.operator.orange", match: "[=+*/%&|^~<>!:-]+" },
        ],
      }],
    },
  },
  // The Cloudflare CSP allows same-origin scripts, so keep animation JS external.
  vite: { build: { assetsInlineLimit: 0 } },
  build: {
    format: "directory",
  },
});
