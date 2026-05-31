export const prerender = false;

import { verifySession } from "../../../lib/auth";
import { listServices, getService, saveService, deleteService, slugify, slugExists } from "../../../lib/content-manager";
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
      const { title, description, price, duration, featured, body: content } = body;

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

      const exists = await slugExists("services", slug);
      if (exists) {
        return new Response(
          JSON.stringify({ error: `A service with slug "${slug}" already exists.` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      await saveService(slug, {
        slug,
        title,
        description,
        price: price || undefined,
        duration: duration || undefined,
        featured: featured || false,
        body: content,
      });

      return new Response(
        JSON.stringify({ success: true, slug }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      const { slug, title, description, price, duration, featured, body: content } = body;

      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Slug is required for update." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const existing = await getService(slug);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: `Service with slug "${slug}" not found.` }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      await saveService(slug, {
        slug,
        title: title || existing.title,
        description: description || existing.description,
        price: price !== undefined ? price : existing.price,
        duration: duration !== undefined ? duration : existing.duration,
        featured: featured !== undefined ? featured : existing.featured,
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

      await deleteService(slug);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Services API error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle GET requests (list services)
export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get("admin_session")?.value;
  const isValid = await verifySession(sessionCookie);
  if (!isValid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const services = await listServices();
  return new Response(
    JSON.stringify({ services }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
