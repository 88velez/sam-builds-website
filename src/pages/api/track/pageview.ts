export const prerender = false;

import { trackPageView } from "../../../lib/analytics";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  // This is a fire-and-forget beacon. Local file storage is read-only on most
  // serverless hosts, so a write failure must NOT surface as an error to the
  // client — we log it and always return 204. For real production analytics,
  // use GA/Plausible (wired in SEO.astro) or swap lib/analytics for a datastore.
  try {
    const body = await request.json();
    const { path, referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = body;

    await trackPageView({
      path: path || "/",
      referrer: referrer || request.headers.get("referer") || "",
      userAgent: request.headers.get("user-agent") || "",
      utm: utmSource ? {
        source: utmSource,
        medium: utmMedium || "",
        campaign: utmCampaign || "",
        term: utmTerm || undefined,
        content: utmContent || undefined,
      } : undefined,
    });
  } catch (e) {
    console.warn("Page-view tracking skipped (storage unavailable?):", e);
  }

  return new Response(null, { status: 204 });
};
