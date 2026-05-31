export const prerender = false;

import { verifySession } from "../../../lib/auth";
import {
  runSEOAudit,
  getSEOSettings,
  saveSEOSettings,
  getRobotsTxt,
  saveRobotsTxt,
} from "../../../lib/seo-audit";
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

    if (action === "run-audit") {
      const result = await runSEOAudit(new URL(request.url).origin);
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "get-settings") {
      const settings = await getSEOSettings();
      return new Response(
        JSON.stringify({ success: true, settings }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "save-settings") {
      const { settings } = body;
      if (!settings) {
        return new Response(
          JSON.stringify({ error: "Settings are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      await saveSEOSettings(settings);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "get-robots") {
      const robots = await getRobotsTxt();
      return new Response(
        JSON.stringify({ success: true, robots }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "save-robots") {
      const { robots } = body;
      if (robots === undefined) {
        return new Response(
          JSON.stringify({ error: "Robots.txt content is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      await saveRobotsTxt(robots);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "save-page-override") {
      const { url, override } = body;
      if (!url || !override) {
        return new Response(
          JSON.stringify({ error: "URL and override data are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const settings = await getSEOSettings();
      settings.pageOverrides = settings.pageOverrides || {};
      settings.pageOverrides[url] = override;
      await saveSEOSettings(settings);
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
    console.error("SEO API error:", e);
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

  const settings = await getSEOSettings();
  const robots = await getRobotsTxt();
  return new Response(
    JSON.stringify({ success: true, settings, robots }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
