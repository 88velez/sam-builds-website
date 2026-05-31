export const prerender = false;

import { verifySession } from "../../../lib/auth";
import {
  getMarketingData,
  saveAnnouncement,
  savePopup,
  saveSocialLinks,
  getScheduledPosts,
  saveScheduledPost,
  updateScheduledPost,
  deleteScheduledPost,
} from "../../../lib/marketing";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
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

    if (action === "get") {
      const data = await getMarketingData();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "save-announcement") {
      const { announcement } = body;
      if (!announcement) {
        return new Response(JSON.stringify({ error: "Announcement data required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await saveAnnouncement(announcement);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "save-popup") {
      const { popup } = body;
      if (!popup) {
        return new Response(JSON.stringify({ error: "Popup data required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await savePopup(popup);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "save-social") {
      const { links } = body;
      if (!links) {
        return new Response(JSON.stringify({ error: "Social links required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await saveSocialLinks(links);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "get-posts") {
      const posts = await getScheduledPosts();
      return new Response(JSON.stringify({ success: true, posts }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "create-post") {
      const { post } = body;
      if (!post || !post.title || !post.platform || !post.scheduledDate) {
        return new Response(JSON.stringify({ error: "Title, platform, and date are required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const created = await saveScheduledPost(post);
      return new Response(JSON.stringify({ success: true, post: created }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "update-post") {
      const { id, updates } = body;
      if (!id || !updates) {
        return new Response(JSON.stringify({ error: "ID and updates required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await updateScheduledPost(id, updates);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "delete-post") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "ID required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await deleteScheduledPost(id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Marketing API error:", e);
    return new Response(JSON.stringify({ error: "Internal server error." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get("admin_session")?.value;
  const isValid = await verifySession(sessionCookie);
  if (!isValid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await getMarketingData();
  const posts = await getScheduledPosts();
  return new Response(JSON.stringify({ success: true, data, posts }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
