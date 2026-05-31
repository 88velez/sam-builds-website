/**
 * Content management utilities.
 * Reads and writes markdown files with YAML-style frontmatter.
 * No external dependencies (no gray-matter, no marked, etc.).
 */

import fs from "fs/promises";
import path from "path";

const BLOG_DIR = path.resolve("src/content/blog");
const SERVICES_DIR = path.resolve("src/content/services");

// ---- Types ----

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  author: string;
  tags: string[];
  draft: boolean;
  body: string;
}

export interface ServicePage {
  slug: string;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  featured: boolean;
  body: string;
}

// ---- Frontmatter serialization ----

function serializeFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${JSON.stringify(item)}`);
      }
    } else if (value instanceof Date) {
      lines.push(`${key}: ${value.toISOString()}`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(String(value))}`);
    }
  }
  return lines.join("\n");
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const data: Record<string, unknown> = {};

  // Check for opening ---
  if (!raw.startsWith("---\n")) {
    return { data, body: raw };
  }

  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data, body: raw };
  }

  const fmText = raw.slice(4, endIndex);
  const body = raw.slice(endIndex + 5);

  // Parse simple YAML-like frontmatter
  let currentKey: string | null = null;
  for (const line of fmText.split("\n")) {
    const listItemMatch = line.match(/^\s+-\s+(.*)/);
    if (listItemMatch && currentKey) {
      // Array item
      const val = listItemMatch[1].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      (data[currentKey] as string[]).push(val);
      continue;
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      let val: unknown = kvMatch[2].trim();

      if (val === "true") val = true;
      else if (val === "false") val = false;
      else if (val === "") val = null;
      else if ((val as string).startsWith('"') && (val as string).endsWith('"')) {
        val = (val as string).slice(1, -1);
      } else if ((val as string).startsWith("'") && (val as string).endsWith("'")) {
        val = (val as string).slice(1, -1);
      } else {
        // Keep as string
      }

      // Don't auto-create arrays for non-list values
      if (val !== null) {
        data[currentKey] = val;
      }
    }
  }

  return { data, body };
}

function toMarkdownFile(data: Record<string, unknown>, body: string): string {
  return `---\n${serializeFrontmatter(data)}\n---\n\n${body.trim()}\n`;
}

// ---- Slug generation ----

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ---- Blog posts ----

export async function listBlogPosts(): Promise<BlogPost[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const posts: BlogPost[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      const post = await getBlogPost(slug);
      if (post) posts.push(post);
    }

    return posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, body } = parseFrontmatter(raw);

    return {
      slug,
      title: (data.title as string) || "",
      description: (data.description as string) || "",
      pubDate: data.pubDate ? new Date(data.pubDate as string).toISOString() : new Date().toISOString(),
      author: (data.author as string) || "Editorial Team",
      tags: (data.tags as string[]) || [],
      draft: (data.draft as boolean) || false,
      body: body.trim(),
    };
  } catch {
    return null;
  }
}

export async function saveBlogPost(slug: string, data: BlogPost): Promise<void> {
  const fmData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    pubDate: new Date(data.pubDate),
    author: data.author,
    tags: data.tags,
  };

  if (data.draft) {
    fmData.draft = true;
  }

  const content = toMarkdownFile(fmData, data.body);
  await fs.mkdir(BLOG_DIR, { recursive: true });
  await fs.writeFile(path.join(BLOG_DIR, `${slug}.md`), content, "utf-8");
}

export async function deleteBlogPost(slug: string): Promise<void> {
  await fs.unlink(path.join(BLOG_DIR, `${slug}.md`));
}

// ---- Service pages ----

export async function listServices(): Promise<ServicePage[]> {
  try {
    const files = await fs.readdir(SERVICES_DIR);
    const services: ServicePage[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      const service = await getService(slug);
      if (service) services.push(service);
    }

    return services;
  } catch {
    return [];
  }
}

export async function getService(slug: string): Promise<ServicePage | null> {
  try {
    const filePath = path.join(SERVICES_DIR, `${slug}.md`);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, body } = parseFrontmatter(raw);

    return {
      slug,
      title: (data.title as string) || "",
      description: (data.description as string) || "",
      price: (data.price as string) || undefined,
      duration: data.duration as string | undefined,
      featured: (data.featured as boolean) || false,
      body: body.trim(),
    };
  } catch {
    return null;
  }
}

export async function saveService(slug: string, data: ServicePage): Promise<void> {
  const fmData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    order: 0,
  };

  if (data.price) fmData.price = data.price;
  if (data.duration) fmData.duration = data.duration;
  if (data.featured) fmData.featured = true;

  const content = toMarkdownFile(fmData, data.body);
  await fs.mkdir(SERVICES_DIR, { recursive: true });
  await fs.writeFile(path.join(SERVICES_DIR, `${slug}.md`), content, "utf-8");
}

export async function deleteService(slug: string): Promise<void> {
  await fs.unlink(path.join(SERVICES_DIR, `${slug}.md`));
}

// ---- Slug conflict checks ----

export async function slugExists(type: "blog" | "services", slug: string): Promise<boolean> {
  if (type === "blog") {
    const existing = await getBlogPost(slug);
    return existing !== null;
  } else {
    const existing = await getService(slug);
    return existing !== null;
  }
}
