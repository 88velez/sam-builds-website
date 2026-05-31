/**
 * Analytics utilities — local page view tracking & UTM builder.
 * Stores page view data locally in a JSON file.
 * This provides a self-contained analytics system without GA dependency.
 */

import fs from "fs/promises";
import path from "path";

// ---- Types ----

export interface PageView {
  path: string;
  timestamp: string;
  referrer: string;
  userAgent: string;
  utm?: UTMParams;
}

export interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  topPages: { path: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  topSources: { source: string; count: number }[];
  recentViews: PageView[];
}

export interface UTMLink {
  id: string;
  url: string;
  utm: UTMParams;
  createdAt: string;
  shortUrl?: string;
}

const DATA_DIR = path.resolve("src/data");
const VIEWS_PATH = path.join(DATA_DIR, "page-views.json");
const UTMS_PATH = path.join(DATA_DIR, "utm-links.json");

// ---- Page View Tracking ----

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readViews(): Promise<PageView[]> {
  try {
    const raw = await fs.readFile(VIEWS_PATH, "utf-8");
    return JSON.parse(raw) as PageView[];
  } catch {
    return [];
  }
}

async function writeViews(views: PageView[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(VIEWS_PATH, JSON.stringify(views, null, 2), "utf-8");
}

export async function trackPageView(view: Omit<PageView, "timestamp">): Promise<void> {
  const views = await readViews();
  views.push({ ...view, timestamp: new Date().toISOString() });

  // Keep only last 50,000 views to prevent file bloat
  if (views.length > 50000) {
    views.splice(0, views.length - 50000);
  }

  await writeViews(views);
}

export async function getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary> {
  const allViews = await readViews();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recentViews = allViews.filter(v => new Date(v.timestamp) >= cutoff);

  // Total views
  const totalViews = recentViews.length;

  // Unique visitors (by IP-like identifier — using user agent + referrer as proxy)
  const uniqueKeys = new Set(recentViews.map(v => `${v.userAgent}|${v.referrer}`));
  const uniqueVisitors = uniqueKeys.size;

  // Top pages
  const pageCounts = new Map<string, number>();
  for (const v of recentViews) {
    pageCounts.set(v.path, (pageCounts.get(v.path) || 0) + 1);
  }
  const topPages = [...pageCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Views by day
  const dayCounts = new Map<string, number>();
  for (const v of recentViews) {
    const day = v.timestamp.split("T")[0];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }

  // Fill in missing days
  const viewsByDay: { date: string; count: number }[] = [];
  const start = new Date(cutoff);
  const end = new Date();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    viewsByDay.push({ date: dateStr, count: dayCounts.get(dateStr) || 0 });
  }

  // Top sources
  const sourceCounts = new Map<string, number>();
  for (const v of recentViews) {
    const source = v.utm?.source || v.referrer || "direct";
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  }
  const topSources = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalViews,
    uniqueVisitors,
    topPages,
    viewsByDay,
    topSources,
    recentViews: recentViews.slice(-20).reverse(),
  };
}

// ---- UTM Link Builder ----

async function readUTMLinks(): Promise<UTMLink[]> {
  try {
    const raw = await fs.readFile(UTMS_PATH, "utf-8");
    return JSON.parse(raw) as UTMLink[];
  } catch {
    return [];
  }
}

async function writeUTMLinks(links: UTMLink[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(UTMS_PATH, JSON.stringify(links, null, 2), "utf-8");
}

export function generateUTMLink(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  if (params.term) url.searchParams.set("utm_term", params.term);
  if (params.content) url.searchParams.set("utm_content", params.content);
  return url.toString();
}

export async function saveUTMLink(url: string, utm: UTMParams): Promise<UTMLink> {
  const links = await readUTMLinks();
  const link: UTMLink = {
    id: generateId(),
    url,
    utm,
    createdAt: new Date().toISOString(),
  };
  links.push(link);
  await writeUTMLinks(links);
  return link;
}

export async function listUTMLinks(): Promise<UTMLink[]> {
  const links = await readUTMLinks();
  return links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteUTMLink(id: string): Promise<void> {
  const links = await readUTMLinks();
  await writeUTMLinks(links.filter(l => l.id !== id));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
