import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://simpleinsurance.com.au",
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
});
