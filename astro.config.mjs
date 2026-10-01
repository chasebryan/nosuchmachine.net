import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nosuchmachine.net",
  trailingSlash: "always",
  // The Cloudflare CSP allows same-origin scripts, so keep animation JS external.
  vite: { build: { assetsInlineLimit: 0 } },
  build: {
    format: "directory",
  },
});
