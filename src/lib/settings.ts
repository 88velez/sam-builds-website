/**
 * Business settings — site configuration, PWA manifest, custom widgets/scripts, performance scorecard.
 */

import fs from "fs/promises";
import path from "path";

// ---- Types ----

export interface SiteSettings {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  socialLinks: Record<string, string>;
  customCss: string;
  customHeadHtml: string;
  customFooterHtml: string;
  enablePWA: boolean;
  pwaManifest: PWAManifest;
  enablePerformanceScorecard: boolean;
}

export interface PWAManifest {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  themeColor: string;
  backgroundColor: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  icon192: string;
  icon512: string;
}

export interface Widget {
  id: string;
  type: "chat" | "booking" | "reviews" | "custom";
  title: string;
  code: string;
  enabled: boolean;
  position: "bottom-right" | "bottom-left" | "inline";
}

const DATA_DIR = path.resolve("src/data");
const SETTINGS_PATH = path.join(DATA_DIR, "site-settings.json");
const WIDGETS_PATH = path.join(DATA_DIR, "widgets.json");

const defaultSettings: SiteSettings = {
  businessName: "",
  tagline: "",
  phone: "",
  email: "",
  address: "",
  businessHours: "",
  socialLinks: {},
  customCss: "",
  customHeadHtml: "",
  customFooterHtml: "",
  enablePWA: false,
  pwaManifest: {
    name: "",
    shortName: "",
    description: "",
    startUrl: "/",
    themeColor: "#1a3a5c",
    backgroundColor: "#ffffff",
    display: "standalone",
    icon192: "/icons/icon-192.png",
    icon512: "/icons/icon-512.png",
  },
  enablePerformanceScorecard: false,
};

// ---- Data helpers ----

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ---- Site Settings ----

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await ensureDir();
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

// ---- Widgets ----

export async function getWidgets(): Promise<Widget[]> {
  try {
    const raw = await fs.readFile(WIDGETS_PATH, "utf-8");
    return JSON.parse(raw) as Widget[];
  } catch {
    return [];
  }
}

export async function saveWidgets(widgets: Widget[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(WIDGETS_PATH, JSON.stringify(widgets, null, 2), "utf-8");
}

export async function addWidget(widget: Omit<Widget, "id">): Promise<Widget> {
  const widgets = await getWidgets();
  const newWidget: Widget = { ...widget, id: generateId() };
  widgets.push(newWidget);
  await saveWidgets(widgets);
  return newWidget;
}

export async function updateWidget(id: string, updates: Partial<Widget>): Promise<void> {
  const widgets = await getWidgets();
  const idx = widgets.findIndex(w => w.id === id);
  if (idx !== -1) {
    widgets[idx] = { ...widgets[idx], ...updates };
    await saveWidgets(widgets);
  }
}

export async function deleteWidget(id: string): Promise<void> {
  const widgets = await getWidgets();
  await saveWidgets(widgets.filter(w => w.id !== id));
}
