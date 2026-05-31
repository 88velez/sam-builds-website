export const prerender = false;

import { saveContactSubmission, addSubscriber } from "../../lib/leads";
import { sendContactNotification } from "../../lib/email";
import type { APIRoute } from "astro";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    // JS submits JSON; a no-JS native form submits urlencoded — we redirect those.
    const isJson = contentType.includes("application/json");

    let body: Record<string, string>;
    if (isJson) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    }

    const { action, name, email, phone, subject, message } = body;
    const honeypot = body["bot-field"];

    // Honeypot tripped — pretend success, save nothing.
    if (honeypot) {
      return isJson
        ? json({ success: true, message: "Message sent successfully!" })
        : redirect("/contact?sent=1", 303);
    }

    // Newsletter subscription
    if (action === "subscribe" && email) {
      if (!isEmail(email)) {
        return json({ error: "Please enter a valid email address." }, 400);
      }
      try {
        await addSubscriber(email);
      } catch (e) {
        // Storage may be read-only in production — log and continue.
        console.error("Could not persist subscriber:", e);
      }
      return isJson
        ? json({ success: true, message: "Subscribed successfully!" })
        : redirect("/?subscribed=1", 303);
    }

    // Contact form submission
    if (name && email && message) {
      if (!isEmail(email)) {
        return json({ error: "Please enter a valid email address." }, 400);
      }

      const data = {
        name,
        email,
        phone: phone || "",
        subject: subject || "Website inquiry",
        message,
      };

      // Persist locally (best-effort) and notify by email (if configured).
      let persisted = false;
      try {
        await saveContactSubmission(data);
        persisted = true;
      } catch (e) {
        console.error("Could not persist contact submission:", e);
      }
      const emailed = await sendContactNotification(data);

      if (!persisted && !emailed) {
        // Nothing captured the lead — make this loud in the server logs.
        console.error(
          "⚠️  Contact lead was NOT stored or emailed. Configure a datastore or RESEND_API_KEY for production."
        );
      }

      return isJson
        ? json({ success: true, message: "Message sent successfully!" })
        : redirect("/contact?sent=1", 303);
    }

    return json({ error: "Name, email, and message are required." }, 400);
  } catch (e) {
    console.error("Contact API error:", e);
    return json({ error: "Internal server error." }, 500);
  }
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
