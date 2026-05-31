import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

// Update `site` to your production URL before deploying — required for sitemap & RSS.
export default defineConfig({
  site: "https://sam-builds-website.vercel.app",
  // "server" = every route is on-demand (SSR) by default. The admin panel and
  // API routes need this. (We use "server" rather than "hybrid" because hybrid's
  // prerender opt-out was unreliable here — see HOW-IT-WORKS.md §"Rendering".)
  // Content + public pages are rendered on demand and edge-cached by the host.
  output: "server",
  adapter: vercel(),
  integrations: [sitemap()],
  compressHTML: true,
});
