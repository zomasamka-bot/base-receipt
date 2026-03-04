import type { ReactNode } from "react";

// AppWrapper is intentionally a transparent pass-through.
// Authentication is handled explicitly by the user via the
// Connect Pi Wallet button on the page — not automatically on mount.
export function AppWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
