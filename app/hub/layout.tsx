/**
 * The hub deliberately drops the site nav and footer. It is a destination, not a
 * doorway — someone arriving from a truck decal wants one tap, not a menu.
 */
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
