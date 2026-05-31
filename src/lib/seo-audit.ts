/**
 * SEO audit & management utilities.
 * Scans site pages for common SEO issues and manages SEO metadata.
 */

import fs from "fs/promises";
import path from "path";

// ---- Types ----

export interface SEOAuditResult {
  totalPages: number;
  issues: SEOIssue[];
  score: number; // 0–100
}

export interface SEOIssue {
  page: string;
  type: "title" | "description" | "headings" | "images" | "og" | "canonical" | "speed";
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation?: string;
}

export interface SEOPageData {
  url: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  imageCount: number;
  imagesWithoutAlt: number;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  hasCanonical: boolean;
}

export interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage: string;
  enableJsonLd: boolean;
  trackKeywords: string[];
  pageOverrides: Record<string, SEOPageOverride>;
}

export interface SEOPageOverride {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
  canonical?: string;
  targetKeywords?: string[];
}

// ---- Default settings ----

export const defaultSEOSettings: SEOSettings = {
  siteTitle: "",
  siteDescription: "",
  defaultOgImage: "/og-default.jpg",
  enableJsonLd: true,
  trackKeywords: [],
  pageOverrides: {},
};

const SETTINGS_PATH = path.resolve("src/data/seo-settings.json");

// ---- Settings persistence ----

export async function getSEOSettings(): Promise<SEOSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    return { ...defaultSEOSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSEOSettings };
  }
}

export async function saveSEOSettings(settings: SEOSettings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

// ---- Robots.txt manager ----

const ROBOTS_PATH = path.resolve("public/robots.txt");

export async function getRobotsTxt(): Promise<string> {
  try {
    return await fs.readFile(ROBOTS_PATH, "utf-8");
  } catch {
    return "User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap-index.xml\n";
  }
}

export async function saveRobotsTxt(content: string): Promise<void> {
  await fs.writeFile(ROBOTS_PATH, content, "utf-8");
}

// ---- SEO Checks ----

const SCANNED_PAGES = [
  "/", "/about", "/services", "/contact", "/blog", "/gallery",
  "/privacy", "/terms",
];

/**
 * Run an SEO audit by fetching each page and parsing its HTML.
 * Pass the site origin (e.g. `https://example.com` or `http://localhost:4321`);
 * in an API route use `new URL(request.url).origin`. Without an origin we can't
 * fetch, so an empty result is returned.
 */
export async function runSEOAudit(origin?: string): Promise<SEOAuditResult> {
  const issues: SEOIssue[] = [];
  const pagesData: SEOPageData[] = [];

  if (!origin) {
    return { totalPages: 0, issues: [], score: 100 };
  }

  // Scan each page's rendered HTML for SEO data
  for (const pageUrl of SCANNED_PAGES) {
    const data = await analyzePage(origin, pageUrl);
    if (!data) continue;
    pagesData.push(data);

    // Title checks
    if (!data.title) {
      issues.push({
        page: pageUrl,
        type: "title",
        severity: "critical",
        message: "Page is missing a title tag.",
        recommendation: "Add a unique, descriptive title (50–60 characters).",
      });
    } else if (data.titleLength < 30) {
      issues.push({
        page: pageUrl,
        type: "title",
        severity: "warning",
        message: `Title is too short (${data.titleLength} chars).`,
        recommendation: "Use 50–60 characters for optimal SERP display.",
      });
    } else if (data.titleLength > 70) {
      issues.push({
        page: pageUrl,
        type: "title",
        severity: "warning",
        message: `Title may be truncated (${data.titleLength} chars).`,
        recommendation: "Keep titles under 60 characters.",
      });
    }

    // Description checks
    if (!data.description) {
      issues.push({
        page: pageUrl,
        type: "description",
        severity: "critical",
        message: "Page is missing a meta description.",
        recommendation: "Write a compelling meta description (140–160 characters).",
      });
    } else if (data.descriptionLength < 120) {
      issues.push({
        page: pageUrl,
        type: "description",
        severity: "warning",
        message: `Meta description is too short (${data.descriptionLength} chars).`,
        recommendation: "Use 140–160 characters for optimal SERP display.",
      });
    } else if (data.descriptionLength > 165) {
      issues.push({
        page: pageUrl,
        type: "description",
        severity: "warning",
        message: `Meta description may be truncated (${data.descriptionLength} chars).`,
        recommendation: "Keep descriptions under 160 characters.",
      });
    }

    // Heading checks
    if (data.h1Count === 0) {
      issues.push({
        page: pageUrl,
        type: "headings",
        severity: "critical",
        message: "Page has no H1 heading.",
        recommendation: "Each page should have exactly one H1 that includes the primary keyword.",
      });
    } else if (data.h1Count > 1) {
      issues.push({
        page: pageUrl,
        type: "headings",
        severity: "warning",
        message: `Page has ${data.h1Count} H1 headings.`,
        recommendation: "Use only one H1 per page for proper heading hierarchy.",
      });
    }

    // Image alt text
    if (data.imagesWithoutAlt > 0) {
      issues.push({
        page: pageUrl,
        type: "images",
        severity: "warning",
        message: `${data.imagesWithoutAlt} image(s) without alt text.`,
        recommendation: "Add descriptive alt text to all images for accessibility and SEO.",
      });
    }

    // Open Graph
    if (!data.hasOgTitle) {
      issues.push({
        page: pageUrl,
        type: "og",
        severity: "warning",
        message: "Missing Open Graph title.",
        recommendation: "Add og:title for better social sharing previews.",
      });
    }
    if (!data.hasOgDescription) {
      issues.push({
        page: pageUrl,
        type: "og",
        severity: "info",
        message: "Missing Open Graph description.",
        recommendation: "Add og:description to control how your page appears when shared.",
      });
    }
    if (!data.hasOgImage) {
      issues.push({
        page: pageUrl,
        type: "og",
        severity: "info",
        message: "Missing Open Graph image.",
        recommendation: "Add og:image for a rich social sharing preview.",
      });
    }

    // Canonical
    if (!data.hasCanonical) {
      issues.push({
        page: pageUrl,
        type: "canonical",
        severity: "info",
        message: "No canonical URL specified.",
        recommendation: "Add a canonical URL to prevent duplicate content issues.",
      });
    }
  }

  // Calculate score
  const totalChecks = issues.length;
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  // Score: start at 100, subtract 15 per critical, 5 per warning, 1 per info
  const score = Math.max(0, 100 - (criticalCount * 15) - (warningCount * 5) - issues.filter((i) => i.severity === "info").length);

  return {
    totalPages: pagesData.length,
    issues,
    score,
  };
}

/** Extract a <meta> content value by attribute (name/property), order-independent. */
function metaContent(html: string, attr: string, value: string): string | null {
  const a = `${attr}=["']${value}["']`;
  const re1 = new RegExp(`<meta[^>]*${a}[^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${a}`, "i");
  const m = html.match(re1) || html.match(re2);
  return m ? m[1].trim() : null;
}

function hasMeta(html: string, attr: string, value: string): boolean {
  return new RegExp(`<meta[^>]*${attr}=["']${value}["']`, "i").test(html);
}

async function analyzePage(origin: string, pageUrl: string): Promise<SEOPageData | null> {
  let html: string;
  try {
    const res = await fetch(new URL(pageUrl, origin).toString(), {
      headers: { "user-agent": "starter-seo-audit" },
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null; // page not reachable (e.g. /gallery removed) — skip it
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

  const description = metaContent(html, "name", "description") || "";

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const imagesWithoutAlt = imgTags.filter(
    (tag) => !/\balt=["'][^"']+["']/i.test(tag)
  ).length;

  const canonicalMatch = html.match(
    /<link[^>]*rel=["']canonical["']/i
  );

  return {
    url: pageUrl,
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    h1Count,
    imageCount: imgTags.length,
    imagesWithoutAlt,
    hasOgTitle: hasMeta(html, "property", "og:title"),
    hasOgDescription: hasMeta(html, "property", "og:description"),
    hasOgImage: hasMeta(html, "property", "og:image"),
    hasCanonical: !!canonicalMatch,
  };
}

export function getGradeColor(score: number): string {
  if (score >= 90) return "#10b981"; // green
  if (score >= 70) return "#d97706"; // amber
  if (score >= 50) return "#f97316"; // orange
  return "#ef4444"; // red
}

export function getGradeLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
}
