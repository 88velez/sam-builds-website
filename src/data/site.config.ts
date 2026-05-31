/**
 * SITE CONFIG — single source of truth for branding & business info.
 * Edit this file first when starting a new site. Most of the template reads from here.
 *
 * Expand each section as needed for your business type.
 */

export const site = {
  // ---- Business identity ----
  name: "Sam Builds Websites",
  tagline: "Custom High-Performance Websites for NEPA Businesses",
  description:
    "I build fast, custom, mobile-first websites for contractors, restaurants, and shops in the Poconos and Northeastern PA. See your homepage mockup free in 48 hours!",

  // ---- Contact ----
  email: "samuel@sambuilds.com",
  phone: "570-555-0199",
  phoneDisplay: "(570) 555-0199", // formatted for display
  address: {
    street: "100 Pocono Crest Road",
    city: "Stroudsburg",
    state: "PA",
    zip: "18360",
    country: "US",
  },
  serviceAreas: ["Stroudsburg", "Scranton", "Wilkes-Barre", "Pocono Pines", "Mount Pocono", "NEPA"],
  hours: {
    monday: "9:00 AM – 6:00 PM",
    tuesday: "9:00 AM – 6:00 PM",
    wednesday: "9:00 AM – 6:00 PM",
    thursday: "9:00 AM – 6:00 PM",
    friday: "9:00 AM – 5:00 PM",
    saturday: "By appointment",
    sunday: "Closed",
  },

  // ---- URLs ----
  url: "https://sambuilds.com", // no trailing slash
  ogImage: "/og-image.png", // 1200x630 social share image

  // ---- Social ----
  social: {
    facebook: "https://facebook.com/sambuildswebsites",
    instagram: "https://instagram.com/sambuilds",
    twitter: "https://twitter.com/sambuildswebsites",
    linkedin: "https://linkedin.com/in/samuelvelez",
    youtube: "",
  },

  // ---- Analytics (paste IDs to activate; leave blank to skip) ----
  analytics: {
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
    plausibleDomain: "",
  },

  // ---- Schema.org / structured data ----
  schemaType: "ProfessionalService",
  priceRange: "$$",
  foundingYear: 2024,

  // ---- Design / Theming ----
  theme: "luxury", // luxury preset will be overridden with custom cybernetic glowing styles

  // ---- Localization / i18n ----
  locale: "en-US",
  languages: [
    { code: "en", label: "English", active: true },
  ],

  // ---- Cookie consent ----
  cookieConsent: {
    enabled: true,
    message: "This site uses cookies to ensure you get the best experience on our website.",
  },

  // ---- Coming Soon / Maintenance Mode ----
  comingSoon: {
    enabled: false,
    heading: "Coming Soon",
    message: "We're working on something great. Check back soon!",
    launchDate: "",
  },
} as const;

// ---- Navigation ----
// Edit nav items here; they appear in header and footer automatically.
export const nav = {
  primary: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Pricing", href: "/pricing" },
    { label: "Featured Websites", href: "/gallery" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  cta: { label: "Get a Quote", href: "/contact" },
  legal: [
    { label: "Service Agreement", href: "/service-agreement" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export type Site = typeof site;
