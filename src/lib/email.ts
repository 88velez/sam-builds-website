/**
 * Optional email notifications via Resend (https://resend.com).
 * No SDK dependency — uses the REST API over fetch.
 * If RESEND_API_KEY is not set, every function is a no-op that returns false.
 */

import { getAdminEmail } from "./auth";

function getKey(): string | undefined {
  return import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || undefined;
}

function getFrom(): string {
  return (
    import.meta.env.RESEND_FROM ||
    process.env.RESEND_FROM ||
    "onboarding@resend.dev"
  );
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Email the admin about a new contact submission. Returns true if sent.
 * Safe to call unconditionally — returns false when no API key is configured.
 */
export async function sendContactNotification(data: ContactEmailData): Promise<boolean> {
  const apiKey = getKey();
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFrom(),
        to: getAdminEmail(),
        reply_to: data.email,
        subject: `New contact form submission: ${data.subject}`,
        text:
          `Name: ${data.name}\n` +
          `Email: ${data.email}\n` +
          `Phone: ${data.phone || "—"}\n` +
          `Subject: ${data.subject}\n\n` +
          `${data.message}\n`,
      }),
    });
    if (!res.ok) {
      console.error("Resend responded with", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Resend email failed:", e);
    return false;
  }
}
