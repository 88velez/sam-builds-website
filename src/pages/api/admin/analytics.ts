export const prerender = false;

import { verifySession } from "../../../lib/auth";
import {
  getAnalyticsSummary,
  generateUTMLink,
  saveUTMLink,
  listUTMLinks,
  deleteUTMLink,
} from "../../../lib/analytics";
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

    if (action === "get-summary") {
      const days = body.days || 30;
      const summary = await getAnalyticsSummary(days);
      return new Response(
        JSON.stringify({ success: true, summary }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "generate-utm") {
      const { url, source, medium, campaign, term, content } = body;
      if (!url || !source || !medium || !campaign) {
        return new Response(
          JSON.stringify({ error: "URL, source, medium, and campaign are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const utmUrl = generateUTMLink(url, { source, medium, campaign, term, content });
      const saved = await saveUTMLink(url, { source, medium, campaign, term, content });

      return new Response(
        JSON.stringify({ success: true, utmUrl, link: saved }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "list-utms") {
      const links = await listUTMLinks();
      return new Response(
        JSON.stringify({ success: true, links }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "delete-utm") {
      const { id } = body;
      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      await deleteUTMLink(id);
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
    console.error("Analytics API error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
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

  const summary = await getAnalyticsSummary(30);
  const utmLinks = await listUTMLinks();
  return new Response(
    JSON.stringify({ success: true, summary, utmLinks }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
