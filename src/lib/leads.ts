/**
 * Lead management — contact form submissions & newsletter subscribers.
 * Stores data locally in JSON files with optional Resend email integration.
 */

import fs from "fs/promises";
import path from "path";

// ---- Types ----

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  active: boolean;
}

export interface LeadStats {
  totalSubmissions: number;
  unreadCount: number;
  totalSubscribers: number;
  submissionsThisWeek: number;
}

const DATA_DIR = path.resolve("src/data");
const CONTACTS_PATH = path.join(DATA_DIR, "contacts.json");
const SUBSCRIBERS_PATH = path.join(DATA_DIR, "subscribers.json");

// ---- Data helpers ----

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJSON<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ---- Contact Submissions ----

export async function saveContactSubmission(data: Omit<ContactSubmission, "id" | "read" | "createdAt">): Promise<ContactSubmission> {
  const contacts = await readJSON<ContactSubmission[]>(CONTACTS_PATH, []);
  const submission: ContactSubmission = {
    ...data,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  contacts.unshift(submission);
  await writeJSON(CONTACTS_PATH, contacts);
  return submission;
}

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  return readJSON<ContactSubmission[]>(CONTACTS_PATH, []);
}

export async function getContactSubmission(id: string): Promise<ContactSubmission | null> {
  const contacts = await getContactSubmissions();
  return contacts.find(c => c.id === id) || null;
}

export async function markContactRead(id: string): Promise<void> {
  const contacts = await getContactSubmissions();
  const idx = contacts.findIndex(c => c.id === id);
  if (idx !== -1) {
    contacts[idx].read = true;
    await writeJSON(CONTACTS_PATH, contacts);
  }
}

export async function deleteContactSubmission(id: string): Promise<void> {
  let contacts = await getContactSubmissions();
  contacts = contacts.filter(c => c.id !== id);
  await writeJSON(CONTACTS_PATH, contacts);
}

// ---- Newsletter Subscribers ----

export async function addSubscriber(email: string): Promise<NewsletterSubscriber> {
  const subscribers = await readJSON<NewsletterSubscriber[]>(SUBSCRIBERS_PATH, []);
  // Check if already subscribed
  const existing = subscribers.find(s => s.email === email && s.active);
  if (existing) {
    return existing;
  }

  // Reactivate if previously unsubscribed
  const inactive = subscribers.find(s => s.email === email && !s.active);
  if (inactive) {
    inactive.active = true;
    await writeJSON(SUBSCRIBERS_PATH, subscribers);
    return inactive;
  }

  const subscriber: NewsletterSubscriber = {
    id: generateId(),
    email,
    subscribedAt: new Date().toISOString(),
    active: true,
  };
  subscribers.push(subscriber);
  await writeJSON(SUBSCRIBERS_PATH, subscribers);
  return subscriber;
}

export async function getSubscribers(): Promise<NewsletterSubscriber[]> {
  return readJSON<NewsletterSubscriber[]>(SUBSCRIBERS_PATH, []);
}

export async function unsubscribe(email: string): Promise<void> {
  const subscribers = await getSubscribers();
  const sub = subscribers.find(s => s.email === email);
  if (sub) {
    sub.active = false;
    await writeJSON(SUBSCRIBERS_PATH, subscribers);
  }
}

// ---- Stats ----

export async function getLeadStats(): Promise<LeadStats> {
  const contacts = await getContactSubmissions();
  const subscribers = await getSubscribers();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    totalSubmissions: contacts.length,
    unreadCount: contacts.filter(c => !c.read).length,
    totalSubscribers: subscribers.filter(s => s.active).length,
    submissionsThisWeek: contacts.filter(c => new Date(c.createdAt) >= weekAgo).length,
  };
}
