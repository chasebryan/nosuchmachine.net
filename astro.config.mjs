import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nosuchmachine.net",
  trailingSlash: "never",
  build: {
    format: "file",
  },
});
