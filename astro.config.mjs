import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nosuchmachine.net",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
});
