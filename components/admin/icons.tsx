/**
 * The console's icon set — inline, not a package.
 *
 * Fifteen 16px glyphs is less code than the loader for an icon library, and the
 * console renders on a Worker where every kilobyte is paid for on the first
 * request of every cold start. They share one wrapper so stroke weight and cap
 * style cannot drift between them.
 */
import type { ComponentType, ReactNode } from "react";

export type IconProps = { className?: string };
export type Icon = ComponentType<IconProps>;

function Glyph({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      className={className ?? "h-[18px] w-[18px] shrink-0"}
    >
      {children}
    </svg>
  );
}

export const IconDashboard: Icon = (p) => (
  <Glyph {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Glyph>
);
export const IconAnalytics: Icon = (p) => (
  <Glyph {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Glyph>
);
export const IconActivity: Icon = (p) => (
  <Glyph {...p}><path d="M3 12h4l3 8 4-16 3 8h4" /></Glyph>
);
export const IconLeads: Icon = (p) => (
  <Glyph {...p}><path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M18 11h4M20 9v4" /></Glyph>
);
export const IconReviews: Icon = (p) => (
  <Glyph {...p}><path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3L4.5 9.6l5.2-.7z" /></Glyph>
);
export const IconBookings: Icon = (p) => (
  <Glyph {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Glyph>
);
export const IconContent: Icon = (p) => (
  <Glyph {...p}><path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></Glyph>
);
export const IconForms: Icon = (p) => (
  <Glyph {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></Glyph>
);
export const IconSeo: Icon = (p) => (
  <Glyph {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6M8 11h6M11 8v6" /></Glyph>
);
export const IconTheme: Icon = (p) => (
  <Glyph {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" stroke="none" opacity=".35" /></Glyph>
);
export const IconSettings: Icon = (p) => (
  <Glyph {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" /></Glyph>
);
export const IconTeam: Icon = (p) => (
  <Glyph {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20v-1.2A4.3 4.3 0 0 1 6.8 14.5h4.4a4.3 4.3 0 0 1 4.3 4.3V20" /><path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.9M18 14.6a4.3 4.3 0 0 1 3.5 4.2V20" /></Glyph>
);
export const IconAccess: Icon = (p) => (
  <Glyph {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" /></Glyph>
);
export const IconUsers: Icon = (p) => (
  <Glyph {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20v-1a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v1" /></Glyph>
);
export const IconDomain: Icon = (p) => (
  <Glyph {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></Glyph>
);
export const IconAccount: Icon = (p) => (
  <Glyph {...p}><circle cx="12" cy="9" r="3.6" /><circle cx="12" cy="12" r="9" /><path d="M5.9 19a6.4 6.4 0 0 1 12.2 0" /></Glyph>
);
export const IconLock: Icon = (p) => (
  <Glyph {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8.5 11V7.8a3.5 3.5 0 0 1 7 0V11" /></Glyph>
);
export const IconSearch: Icon = (p) => (
  <Glyph {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></Glyph>
);
export const IconChevron: Icon = (p) => (
  <Glyph {...p}><path d="m9 5 7 7-7 7" /></Glyph>
);
export const IconExternal: Icon = (p) => (
  <Glyph {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Glyph>
);
