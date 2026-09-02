import type { Icon } from "../../components/admin/icons";
import * as I from "../../components/admin/icons";

/**
 * The nav contract — the single source of truth for the console's shape.
 *
 * Nav is data, not JSX. The sidebar, the breadcrumb trail, the ⌘K palette and
 * the mobile strip all derive from this one array, which is why adding a screen
 * is one NavItem plus one route and nothing else. The moment any of those four
 * is hand-written they start disagreeing, and the one that disagrees silently is
 * the palette.
 *
 * Scope is the Opscend "operator" tier: everything a person who runs the
 * business needs, and none of the sub-apps (CRM, OpSync, OpFlow) that would be
 * empty chrome on a four-service exterior cleaning company.
 */
export type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  /** Exact-match active state. Only the dashboard needs it — every other item
   *  owns its whole subtree, and /admin is a prefix of all of them. */
  exact?: boolean;
  /** Renders a chip. Means "real, reads real data, still growing" — never
   *  "not built": a screen that does nothing does not belong in the nav. */
  beta?: boolean;
  /** Locked unless the signed-in address is in OWNER_EMAILS. */
  godModeOnly?: boolean;
  /** Opens in a new tab instead of navigating the console away. */
  external?: boolean;
  /** One-line description. The palette shows it; a label alone is not enough to
   *  pick between "Team" and "Team Access" at speed. */
  hint?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Data",
    items: [
      { to: "/admin", label: "Dashboard", icon: I.IconDashboard, exact: true, hint: "What is waiting on you today" },
      { to: "/admin/analytics", label: "Analytics", icon: I.IconAnalytics, beta: true, hint: "Where the work comes from" },
      { to: "/admin/activity", label: "Activity Log", icon: I.IconActivity, beta: true, hint: "Every change, who made it, when" },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/admin/leads", label: "Leads", icon: I.IconLeads, hint: "Quote requests and where each one stands" },
      { to: "/admin/reviews", label: "Reviews", icon: I.IconReviews, hint: "The inbox, and what shows on the site" },
      { to: "/admin/bookings", label: "Bookings", icon: I.IconBookings, hint: "Video testimonial queue" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/content", label: "Content", icon: I.IconContent, hint: "Copy the site reads at request time" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/forms", label: "Forms", icon: I.IconForms, hint: "Every form on the site and where it lands" },
      { to: "/admin/seo", label: "SEO & Redirects", icon: I.IconSeo, hint: "Titles, descriptions, and old URLs" },
    ],
  },
  {
    label: "Configure",
    items: [
      { to: "/admin/theme", label: "Theme", icon: I.IconTheme, hint: "Brand tokens and their measured contrast" },
      { to: "/admin/settings", label: "Settings", icon: I.IconSettings, hint: "Switches, not copy" },
      { to: "/admin/team", label: "Team", icon: I.IconTeam, hint: "The people shown on the site" },
      { to: "/admin/team-access", label: "Team Access", icon: I.IconAccess, hint: "Who is an administrator" },
      { to: "/admin/users", label: "Users", icon: I.IconUsers, hint: "Accounts, sign-ins, suspension" },
      { to: "/admin/domain", label: "Domain", icon: I.IconDomain, godModeOnly: true, hint: "Hostname and deployment checks" },
      { to: "/admin/account", label: "Account", icon: I.IconAccount, hint: "You" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Longest matching prefix wins, so /admin/team-access resolves to itself
 *  rather than to /admin/team. String prefixes alone would get that wrong. */
export function buildCrumbs(pathname: string): NavItem[] {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  const matches = ALL_NAV_ITEMS.filter(
    (i) => path === i.to || path.startsWith(`${i.to}/`),
  ).sort((a, b) => b.to.length - a.to.length);
  const best = matches[0];
  const home = ALL_NAV_ITEMS.find((i) => i.exact)!;
  if (!best || best === home) return [home];
  return [home, best];
}

export function isActive(item: NavItem, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  return item.exact ? path === item.to : path === item.to || path.startsWith(`${item.to}/`);
}
