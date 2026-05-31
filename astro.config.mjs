import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel/serverless";

// Update `site` to your production URL before deploying — required for sitemap & RSS.
export default defineConfig({
  site: "https://sam-builds-website.vercel.app",
  // "hybrid" = public pages compile statically (SSG) by default, while APIs/Admin opt-out.
  output: "hybrid",
  adapter: vercel(),
  integrations: [sitemap()],
  compressHTML: true,
});
