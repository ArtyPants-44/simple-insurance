import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://simpleinsurance.com.au",
  // Served from a GitHub Pages project site at /simple-insurance/.
  // Asset paths in components use import.meta.env.BASE_URL so they resolve
  // under this prefix (and still work if deployed at root).
  base: "/simple-insurance/",
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
});
