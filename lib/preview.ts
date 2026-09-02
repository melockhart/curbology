import { runtimeEnv } from "./env";
import type { Lead, Review, Booking, TeamMember, Activity, AdminUser, SeoOverride, Redirect } from "./db";

/**
 * Preview mode — the whole site and console, working, with no database.
 *
 * There is no Supabase project yet and there will not be one until Tristen is
 * onboarded, but the design needs to be walked through before then. So this
 * serves a fixed set of sample rows in place of every read, and turns every
 * write into a no-op that says so.
 *
 * THE INTERLOCK. Preview mode refuses to switch on if SUPABASE_URL is set. That
 * is what makes the demo session below safe to exist: production has a database,
 * therefore production can never be in preview, therefore the auth shortcut can
 * never apply to real customer data. The check is here, in one place, and every
 * other file asks this function rather than reading the flag itself.
 *
 * Everything below is SAMPLE DATA. It is not Curbology's customers, reviews or
 * bookings, and none of it may be published, screenshotted as real, or migrated
 * into a live table. Every page rendered in preview mode carries a ribbon saying
 * so, because a console full of plausible names is exactly the thing someone
 * forwards without the context.
 */
export function previewMode(): boolean {
  const env = runtimeEnv();
  if (env.SUPABASE_URL) return false;
  return env.PREVIEW_MODE === "1";
}

/** The password that opens the preview console. No value, no console — the
 *  preview is not meant to be a publicly walkable admin, even of sample rows. */
export function previewPassword(): string | null {
  return previewMode() ? (runtimeEnv().PREVIEW_PASSWORD ?? null) : null;
}

export const PREVIEW_SESSION_VALUE = "preview";
export const PREVIEW_EMAIL = "preview@opscend.net";
export const PREVIEW_USER_ID = "00000000-0000-4000-8000-000000000001";

/* --------------------------------------------------------------- sample rows */

const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

export const previewLeads: Lead[] = [
  { id: "p-lead-1", created_at: hoursAgo(5), updated_at: hoursAgo(5), name: "Dana Whitcomb",
    email: "dana@example.com", phone: "(248) 555-0134", address: "142 Maple Ct", town: "Rochester Hills",
    service: "Roof Cleaning", message: "North side of the roof is completely black. How soon could you take a look?",
    photo_paths: [], source_page: "/services/roof-cleaning", status: "new", quoted_amount: null, notes: null },
  { id: "p-lead-2", created_at: hoursAgo(26), updated_at: hoursAgo(26), name: "Marcus Bell",
    email: "mbell@example.com", phone: "(248) 555-0177", address: null, town: "Troy",
    service: "Pressure Washing", message: "Driveway and the back patio.", photo_paths: [],
    source_page: "/contact", status: "new", quoted_amount: null, notes: null },
  { id: "p-lead-3", created_at: hoursAgo(120), updated_at: hoursAgo(96), name: "Priya Raman",
    email: "praman@example.com", phone: null, address: null, town: "Birmingham",
    service: "Gutter Cleaning & Brightening", message: "Two storeys, and the front gutters have staining.",
    photo_paths: [], source_page: "/services", status: "quoted", quoted_amount: 340, notes: null },
  { id: "p-lead-4", created_at: hoursAgo(430), updated_at: hoursAgo(402), name: "Owen Fischer",
    email: "owen@example.com", phone: "(248) 555-0190", address: null, town: "Rochester Hills",
    service: "House & Siding Soft Wash", message: null, photo_paths: [], source_page: "/contact",
    status: "won", quoted_amount: 620, notes: null },
  { id: "p-lead-5", created_at: hoursAgo(740), updated_at: hoursAgo(726), name: "Grace Lindqvist",
    email: "grace@example.com", phone: null, address: null, town: "Troy", service: "Pressure Washing",
    message: null, photo_paths: [], source_page: "/contact", status: "lost", quoted_amount: 280, notes: null },
];

export const previewReviews: Review[] = [
  { id: "p-rev-1", created_at: hoursAgo(34), name: "Owen Fischer", email: "owen@example.com", rating: 5,
    body: "Siding on the north side had gone green over two winters. Took a morning and it looks like it did when we moved in. He covered the flower beds before he started, which I did not expect.",
    service: "House & Siding Soft Wash", consented: true, published: true,
    owner_reply: "Thanks Owen — glad the beds made it.", status: "replied" },
  { id: "p-rev-2", created_at: hoursAgo(7), name: "Priya Raman", email: "praman@example.com", rating: 4,
    body: "Good work on the gutters and he turned up when he said he would. Would have liked a heads-up about the downspout that needed replacing rather than finding out afterwards.",
    service: "Gutter Cleaning & Brightening", consented: true, published: false, owner_reply: null, status: "new" },
  { id: "p-rev-3", created_at: hoursAgo(300), name: "Grace Lindqvist", email: "grace@example.com", rating: 3,
    body: "The driveway came up well. Quote took a few days longer to arrive than I was told it would.",
    service: "Pressure Washing", consented: false, published: false, owner_reply: null, status: "new" },
];

export const previewBookings: Booking[] = [
  { id: "p-bok-1", created_at: hoursAgo(9), name: "Owen Fischer", email: "owen@example.com",
    phone: "(248) 555-0190", format: "in-person", requested_slots: "Weekday evenings, or Saturday morning",
    confirmed_slot: null, state: "requested", video_url: null, notes: null },
  { id: "p-bok-2", created_at: hoursAgo(210), name: "Dana Whitcomb", email: "dana@example.com",
    phone: null, format: "self-record", requested_slots: "Any time", confirmed_slot: null,
    state: "received", video_url: "https://example.com/testimonial.mp4", notes: null },
];

export const previewTeam: TeamMember[] = [
  { id: "p-team-1", created_at: hoursAgo(900), updated_at: hoursAgo(900), name: "Tristen",
    role_title: "Owner", bio: null, photo_url: null, sort_order: 0, is_published: false },
];

export const previewActivity: Activity[] = [
  { id: "p-act-1", created_at: hoursAgo(7), actor_email: PREVIEW_EMAIL, entity: "review",
    entity_id: "p-rev-1", verb: "set_state", detail: { published_from: false, published_to: true, archived: false } },
  { id: "p-act-2", created_at: hoursAgo(34), actor_email: PREVIEW_EMAIL, entity: "redirect",
    entity_id: "/pressure-washing", verb: "upsert", detail: { to: "/services/pressure-washing" } },
  { id: "p-act-3", created_at: hoursAgo(96), actor_email: PREVIEW_EMAIL, entity: "lead",
    entity_id: "p-lead-3", verb: "set_status", detail: { status: "quoted" } },
  { id: "p-act-4", created_at: hoursAgo(402), actor_email: PREVIEW_EMAIL, entity: "lead",
    entity_id: "p-lead-4", verb: "set_status", detail: { status: "won" } },
];

export const previewUsers: AdminUser[] = [
  { id: PREVIEW_USER_ID, email: PREVIEW_EMAIL, display_name: "Preview", is_suspended: false,
    created_at: hoursAgo(900), last_sign_in_at: hoursAgo(0.2), roles: ["admin"] },
];

export const previewSeo: SeoOverride[] = [
  { path: "/services/roof-cleaning", title: "Roof cleaning in Oakland County, MI",
    description: "Soft-wash roof cleaning that lifts the black streaks without stripping granules.",
    noindex: false, updated_at: hoursAgo(40), updated_by: PREVIEW_EMAIL },
];

export const previewRedirects: Redirect[] = [
  { id: "p-red-1", created_at: hoursAgo(40), from_path: "/pressure-washing",
    to_path: "/services/pressure-washing", permanent: true, hits: 12, is_active: true },
];

export const previewContent: Record<string, unknown> = {
  "home.heroHeading": "",
  "business.hours": "",
};

/** The banner and the Google link are deliberately unset: the preview should
 *  show what Tristen actually has, so the empty states are part of the demo. */
export const previewSettings: Record<string, unknown> = {
  "portal.reviewOpen": true,
  "portal.testimonialOpen": true,
};
