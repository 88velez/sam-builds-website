export const prerender = false;

import { verifySession } from "../../../lib/auth";
import { listBlogPosts, getBlogPost, saveBlogPost, deleteBlogPost, slugify, slugExists } from "../../../lib/content-manager";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verify admin session
  const sessionCookie = cookies.get("admin_session")?.value;
  const isValid = await verifySession(sessionCookie);
  if (!isValid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { title, description, author, pubDate, tags, draft, body: content } = body;

      if (!title || !description || !content) {
        return new Response(
          JSON.stringify({ error: "Title, description, and content are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let slug = body.slug || slugify(title);
      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Could not generate slug from title." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check for existing slug
      const exists = await slugExists("blog", slug);
      if (exists) {
        return new Response(
          JSON.stringify({ error: `A post with slug "${slug}" already exists.` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      await saveBlogPost(slug, {
        slug,
        title,
        description,
        pubDate: pubDate || new Date().toISOString(),
        author: author || "Editorial Team",
        tags: tags || [],
        draft: draft || false,
        body: content,
      });

      return new Response(
        JSON.stringify({ success: true, slug }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      const { slug, title, description, author, pubDate, tags, draft, body: content } = body;

      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Slug is required for update." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const existing = await getBlogPost(slug);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: `Post with slug "${slug}" not found.` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      await saveBlogPost(slug, {
        slug,
        title: title || existing.title,
        description: description || existing.description,
        pubDate: pubDate || existing.pubDate,
        author: author || existing.author,
        tags: tags || existing.tags,
        draft: draft !== undefined ? draft : existing.draft,
        body: content !== undefined ? content : existing.body,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      const { slug } = body;
      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Slug is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      await deleteBlogPost(slug);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "toggle-draft") {
      const { slug } = body;
      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Slug is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const existing = await getBlogPost(slug);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: "Post not found." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      await saveBlogPost(slug, {
        ...existing,
        draft: !existing.draft,
      });

      return new Response(
        JSON.stringify({ success: true, draft: !existing.draft }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Blog API error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle GET requests (list posts)
export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get("admin_session")?.value;
  const isValid = await verifySession(sessionCookie);
  if (!isValid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const posts = await listBlogPosts();
  return new Response(
    JSON.stringify({ posts }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
