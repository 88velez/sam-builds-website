export const prerender = false;

import { verifySession } from "../../../lib/auth";
import {
  getSiteSettings,
  saveSiteSettings,
  getWidgets,
  addWidget,
  updateWidget,
  deleteWidget,
} from "../../../lib/settings";
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

    if (action === "get-settings") {
      const settings = await getSiteSettings();
      const widgets = await getWidgets();
      return new Response(JSON.stringify({ success: true, settings, widgets }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "save-settings") {
      const { settings } = body;
      if (!settings) {
        return new Response(JSON.stringify({ error: "Settings are required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await saveSiteSettings(settings);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "get-widgets") {
      const widgets = await getWidgets();
      return new Response(JSON.stringify({ success: true, widgets }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "add-widget") {
      const { widget } = body;
      if (!widget || !widget.type || !widget.title) {
        return new Response(JSON.stringify({ error: "Widget type and title required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const created = await addWidget(widget);
      return new Response(JSON.stringify({ success: true, widget: created }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "update-widget") {
      const { id, updates } = body;
      if (!id || !updates) {
        return new Response(JSON.stringify({ error: "ID and updates required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await updateWidget(id, updates);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (action === "delete-widget") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "ID required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await deleteWidget(id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Settings API error:", e);
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

  const settings = await getSiteSettings();
  const widgets = await getWidgets();
  return new Response(JSON.stringify({ success: true, settings, widgets }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
