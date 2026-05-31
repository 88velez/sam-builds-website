/**
 * Marketing tools — announcement bar, offer popup, social media manager, publishing calendar.
 * Stores configuration in local JSON files.
 */

import fs from "fs/promises";
import path from "path";

// ---- Types ----

export interface AnnouncementBar {
  enabled: boolean;
  text: string;
  linkUrl?: string;
  linkText?: string;
  backgroundColor: string;
  textColor: string;
  dismissible: boolean;
}

export interface OfferPopup {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl?: string;
  showOnExit: boolean;
  delayMs: number;
  frequencyDays: number;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
  enabled: boolean;
}

export interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduledDate: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "cancelled";
  linkUrl?: string;
}

export interface MarketingData {
  announcement: AnnouncementBar;
  popup: OfferPopup;
  socialLinks: SocialLink[];
  scheduledPosts: ScheduledPost[];
}

const DATA_PATH = path.resolve("src/data/marketing.json");

const defaultMarketing: MarketingData = {
  announcement: {
    enabled: false,
    text: "",
    linkUrl: "",
    linkText: "",
    backgroundColor: "#1a3a5c",
    textColor: "#ffffff",
    dismissible: true,
  },
  popup: {
    enabled: false,
    title: "",
    description: "",
    buttonText: "Learn More",
    buttonUrl: "/contact",
    imageUrl: "",
    showOnExit: false,
    delayMs: 5000,
    frequencyDays: 7,
  },
  socialLinks: [
    { platform: "facebook", url: "", label: "Facebook", enabled: false },
    { platform: "twitter", url: "", label: "X (Twitter)", enabled: false },
    { platform: "instagram", url: "", label: "Instagram", enabled: false },
    { platform: "linkedin", url: "", label: "LinkedIn", enabled: false },
    { platform: "youtube", url: "", label: "YouTube", enabled: false },
  ],
  scheduledPosts: [],
};

// ---- Data helpers ----

async function ensureDir() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export async function getMarketingData(): Promise<MarketingData> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return { ...defaultMarketing, ...JSON.parse(raw) };
  } catch {
    return { ...defaultMarketing };
  }
}

export async function saveMarketingData(data: MarketingData): Promise<void> {
  await ensureDir();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ---- Announcement Bar ----

export async function saveAnnouncement(announcement: AnnouncementBar): Promise<void> {
  const data = await getMarketingData();
  data.announcement = announcement;
  await saveMarketingData(data);
}

// ---- Offer Popup ----

export async function savePopup(popup: OfferPopup): Promise<void> {
  const data = await getMarketingData();
  data.popup = popup;
  await saveMarketingData(data);
}

// ---- Social Links ----

export async function saveSocialLinks(links: SocialLink[]): Promise<void> {
  const data = await getMarketingData();
  data.socialLinks = links;
  await saveMarketingData(data);
}

// ---- Scheduled Posts ----

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const data = await getMarketingData();
  return data.scheduledPosts.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
}

export async function saveScheduledPost(post: Omit<ScheduledPost, "id">): Promise<ScheduledPost> {
  const data = await getMarketingData();
  const newPost: ScheduledPost = { ...post, id: generateId() };
  data.scheduledPosts.push(newPost);
  await saveMarketingData(data);
  return newPost;
}

export async function updateScheduledPost(id: string, updates: Partial<ScheduledPost>): Promise<void> {
  const data = await getMarketingData();
  const idx = data.scheduledPosts.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.scheduledPosts[idx] = { ...data.scheduledPosts[idx], ...updates };
    await saveMarketingData(data);
  }
}

export async function deleteScheduledPost(id: string): Promise<void> {
  const data = await getMarketingData();
  data.scheduledPosts = data.scheduledPosts.filter(p => p.id !== id);
  await saveMarketingData(data);
}
