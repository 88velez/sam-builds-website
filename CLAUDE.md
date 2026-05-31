# Project context for AI assistants

This file tells Claude (or any AI coding assistant) how this project is structured and how to extend it. **Read this first before making changes.**

> For the full human-facing walkthrough (public site **and** the `/admin` panel, data flow, deployment, and known limitations) see **`HOW-IT-WORKS.md`**.

## What this is

A reusable Astro starter template for small-business websites. Generic by design — the same template should work for a carpentry business, a dentist, a yoga studio, or a law firm. Personality comes from the brand config and content, not the code.

## Stack

- **Astro 4** — `output: "server"` (every route is on-demand SSR via the adapter; the host edge-caches responses). The admin/API need SSR; content + public pages render on demand and read their data at request time. (We use `"server"` rather than `"hybrid"` because hybrid's prerender handling was unreliable in this stack.)
- **No framework** in components (no React/Vue). Pure `.astro` files.
- **No CSS framework** (no Tailwind). Plain CSS with custom properties.
- Hosted on **Netlify or Vercel** (configs included for both).

## File map

```
src/
├── data/site.config.ts       ← SINGLE SOURCE OF TRUTH. Edit this first.
├── styles/global.css         ← Design tokens (colors, fonts, spacing, dark mode, animations).
├── layouts/
│   ├── BaseLayout.astro      ← Default layout (wraps every page).
│   ├── LegalLayout.astro     ← Narrow prose for privacy/terms pages.
│   └── LandingLayout.astro   ← Full-bleed layout for landing pages.
├── components/
│   ├── SEO.astro             ← Meta tags + JSON-LD schema (auto-injected by layouts).
│   ├── Header.astro          ← Site nav + dark mode toggle.
│   ├── Footer.astro          ← Site footer.
│   ├── Hero.astro            ← Reusable hero section.
│   ├── FeatureGrid.astro     ← Cards grid (services, features).
│   ├── Testimonials.astro    ← Customer quotes with star ratings.
│   ├── FAQ.astro             ← Accordion + FAQ schema.
│   ├── ContactForm.astro     ← Netlify-wired form.
│   ├── CTABanner.astro       ← Call-to-action block.
│   ├── Gallery.astro         ← Filterable image grid with lightbox.
│   ├── Pricing.astro         ← Pricing tables with billing toggle.
│   ├── Team.astro            ← Team member cards with social links.
│   ├── Stats.astro           ← Animated stat counters.
│   ├── LogoCloud.astro       ← Client logo grid or marquee.
│   ├── Process.astro         ← "How it works" steps (numbered or timeline).
│   ├── ShareButtons.astro    ← Social share links (Twitter, LinkedIn, FB, copy).
│   ├── RelatedPosts.astro    ← Related blog posts by tag matching.
│   ├── Breadcrumbs.astro     ← Breadcrumb nav with schema.
│   ├── CookieConsent.astro   ← GDPR cookie consent banner.
│   ├── BackToTop.astro       ← Scroll-to-top button.
│   ├── Newsletter.astro      ← Email signup form.
│   ├── VideoEmbed.astro      ← Responsive YouTube/Vimeo embed.
│   ├── TableOfContents.astro ← Sticky TOC for blog posts (manual).
│   ├── ScrollReveal.astro    ← Intersection observer for scroll animations.
│   └── ComingSoon.astro      ← Maintenance / coming soon page.
├── pages/                    ← Each .astro file = one route.
│   ├── services/[...slug].astro ← Dynamic service detail pages.
│   └── blog/[...slug].astro     ← Dynamic blog post pages.
└── content/
    ├── blog/                 ← Markdown blog posts.
    └── services/             ← Markdown service detail pages.
```

## Admin panel & server-side architecture

The repo is **two apps**: the static public site (above) and a server-rendered admin panel.

```
src/
├── middleware.ts          ← Guards /admin/* (only /admin/login is public).
├── lib/                   ← Server-side data layer (file-based JSON/Markdown via fs).
│   ├── auth.ts            ← getAdminPassword() + SHA-256 session verify. Reads ADMIN_PASSWORD.
│   ├── email.ts           ← Optional Resend notifications (no-op without RESEND_API_KEY).
│   ├── leads.ts / analytics.ts / marketing.ts / settings.ts / seo-audit.ts / content-manager.ts
├── pages/admin/*          ← Admin UI (SSR, prerender=false, uses AdminLayout).
└── pages/api/
    ├── contact.ts         ← Public: contact form + newsletter.
    ├── track/pageview.ts  ← Public: page-view beacon (consent-gated, fails soft).
    └── admin/*.ts         ← Admin JSON APIs (each re-checks the session).
```

Rules for the admin/server side:
- **Auth source of truth is `getAdminPassword()` in `auth.ts`.** Login and `verifySession` must use it so they agree. Never hardcode the password/hash. The session cookie value is `SHA-256(password)`.
- **`lib/` writes to disk** (`src/data/*.json`, `src/content/*.md`). This works in `npm run dev` but the FS is read-only on serverless — so the admin is a **local authoring tool**: edit locally, commit, redeploy. Public endpoints (`/api/contact`, `/api/track/pageview`) must therefore **fail soft** (never 500 on a write error).
- **Admin-authored content needs a rebuild** to appear publicly (content collections compile at build time).
- **Marketing + Settings are consumed by `BaseLayout`** (announcement bar, offer popup, custom CSS/head/footer HTML). If you add admin-configurable site chrome, wire it into `BaseLayout` too — don't leave it write-only.
- **Analytics is consent-gated.** GA/GTM/Pixel/Plausible and the page-view beacon only run after `window.__consentGranted` (set by `BaseLayout` + `CookieConsent`). Keep new trackers behind the same gate.

## How to start a new site from this template

1. Copy the template folder, rename it for the new project.
2. Edit `src/data/site.config.ts`: business name, tagline, phone, email, address, hours, service areas, social URLs, analytics IDs, **theme preset**.
3. Pick a **theme preset** in `site.config.ts`: `"professional"`, `"creative"`, `"natural"`, `"luxury"`, or `"medical"` — this swaps all colors automatically.
4. Edit `src/styles/global.css` — fine-tune the CSS variables at the top if needed.
5. Update fonts in `src/layouts/BaseLayout.astro` (the `<link>` to Google Fonts) to match the new design tokens.
6. Replace placeholder content in `src/pages/index.astro`, `about.astro`, `services.astro`, `gallery.astro`.
7. Replace `public/favicon.svg` and add `og-image.jpg` (1200×630) to `public/`.
8. Update the `site:` URL in `astro.config.mjs` to the production domain.
9. Run `npm install` then `npm run dev` to preview.

## Conventions

- **Colors**: never hard-code. Always use a CSS variable from `global.css`.
- **Spacing**: use `--space-*` variables, not raw `rem` or `px`.
- **Type**: use `--text-*` and `--font-*` variables.
- **Components are dumb**: they take props, render UI. Business info comes from `site.config.ts`.
- **SEO is automatic**: every page using `BaseLayout` gets meta tags, OG tags, canonical URL, and LocalBusiness schema. Just pass `title` and `description` props.
- **Forms**: the contact form and newsletter post to the custom `POST /api/contact` endpoint (single path). It validates input, checks a honeypot, saves to `src/data/*.json` (best-effort), and emails the admin via Resend if `RESEND_API_KEY` is set. No-JS submits are redirected to `?sent=1`.
- **Blog posts**: drop a `.md` file in `src/content/blog/` with the required frontmatter (see `welcome.md`). The blog list and post pages handle the rest.
- **Service pages**: drop a `.md` file in `src/content/services/` with frontmatter. Dynamic routes are pre-configured at `/services/:slug`.
- **Scroll animations**: add class `anim-fade-in`, `anim-fade-in-left`, `anim-fade-in-right`, or `anim-scale-in` to any element. The `ScrollReveal` component in `BaseLayout` handles the intersection observer.
- **Dark mode**: toggled via the sun/moon icon in the header. Preference persists in localStorage. Respects `prefers-color-scheme` by default.
- **Theme system**: set `site.theme` in `site.config.ts` to apply a full color preset — `BaseLayout` writes it to `<html data-preset="…">`. Presets use the `data-preset` attribute; **dark mode uses the `.theme-dark` class** (kept separate so they don't collide).
- **Coming Soon**: set `site.comingSoon.enabled = true` to show a coming-soon page instead of the normal homepage.
- **Gallery**: the nav already links to `/gallery`. Update `src/pages/gallery.astro` with your real project images.
- **Pricing**: use the `<Pricing>` component with `billingToggle`, `monthlyTiers`, and `yearlyTiers` for subscription-style pricing.
- **Cookie consent**: appears automatically via `BaseLayout`. Disable with `hideCookieConsent` prop on the layout.
- **i18n locale**: set `site.locale` for date/number formatting. Expand `site.languages` for multi-language support.

## Common requests and how to handle them

- **"Change the colors"** → set `site.theme` to a preset, or edit `--color-primary` and `--color-accent` in `global.css`.
- **"Change the fonts"** → update `--font-display` and `--font-body` in `global.css`, AND update the Google Fonts link in `BaseLayout.astro`.
- **"Add a new page"** → create `src/pages/<name>.astro`, use `BaseLayout`, add to `nav.primary` in `site.config.ts`.
- **"Add a service detail page"** → create `src/content/services/<slug>.md` with frontmatter.
- **"Add a blog post"** → create `src/content/blog/<slug>.md` with frontmatter.
- **"Add a new section type"** → create a new component in `src/components/`, follow the prop pattern in `Hero.astro` or `FeatureGrid.astro`.
- **"Make it more [bold/playful/minimal]"** → change the theme preset or typography (display font is the biggest lever), the color palette, and spacing. Don't rewrite the structure.
- **"Enable dark mode"** → already built in. Click the sun/moon icon in the header.
- **"Add a gallery"** → the `/gallery` page is ready; just update the array of items in `src/pages/gallery.astro`.
- **"Add pricing"** → import `<Pricing>` and pass `tiers` (and optionally `billingToggle` + `monthlyTiers`/`yearlyTiers`).
- **"Show a coming soon page"** → set `site.comingSoon.enabled = true` in `site.config.ts`.
- **"Swap schema type"** → set `site.schemaType` to any of: `LocalBusiness`, `ProfessionalService`, `HomeAndConstructionBusiness`, `Restaurant`, `MedicalBusiness`, `Store`, `RealEstateAgent`, `HealthAndBeautyBusiness`, `AutomotiveBusiness`, `Dentist`, `Lawyer`.

## What NOT to do

- Don't add a CSS framework. The design tokens system is the styling layer.
- Don't add React/Vue unless a feature genuinely needs interactivity beyond what plain JS handles.
- Don't hard-code business info in components. It belongs in `site.config.ts`.
- Don't duplicate SEO logic per page. `BaseLayout` handles it.
- Don't skip the `description` prop when creating pages — it's required for good SEO.

## Pre-launch checklist

- [ ] All `site.config.ts` fields filled in
- [ ] Brand colors and fonts updated (theme preset or CSS vars)
- [ ] Real favicon and `og-image.jpg` in `/public`
- [ ] `astro.config.mjs` `site:` URL set to production
- [ ] All placeholder copy ("Replace this with…") replaced
- [ ] Privacy policy and terms reviewed by a lawyer or generated
- [ ] Analytics ID added in `site.config.ts`
- [ ] Contact form tested end-to-end on staging
- [ ] Google Search Console verified
- [ ] Sitemap submitted to Google Search Console
