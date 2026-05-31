export const prerender = false;

import { verifySession } from "../../../lib/auth";
import {
  getContactSubmissions,
  getContactSubmission,
  markContactRead,
  deleteContactSubmission,
  getSubscribers,
  unsubscribe,
  getLeadStats,
} from "../../../lib/leads";
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

    if (action === "get-submissions") {
      const submissions = await getContactSubmissions();
      return new Response(
        JSON.stringify({ success: true, submissions }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "get-submission") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "ID is required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const submission = await getContactSubmission(id);
      if (!submission) {
        return new Response(JSON.stringify({ error: "Submission not found." }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(
        JSON.stringify({ success: true, submission }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "mark-read") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "ID is required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await markContactRead(id);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "delete-submission") {
      const { id } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "ID is required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await deleteContactSubmission(id);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "get-subscribers") {
      const subscribers = await getSubscribers();
      return new Response(
        JSON.stringify({ success: true, subscribers }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "unsubscribe") {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await unsubscribe(email);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "get-stats") {
      const stats = await getLeadStats();
      return new Response(
        JSON.stringify({ success: true, stats }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Leads API error:", e);
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

  const submissions = await getContactSubmissions();
  const subscribers = await getSubscribers();
  const stats = await getLeadStats();
  return new Response(
    JSON.stringify({ success: true, submissions, subscribers, stats }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
