import type { ReactNode } from "react";

/**
 * Responsive fluid frame.
 * On mobile: full screen.
 * On desktop: full screen adapted.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="relative h-dvh w-full overflow-hidden bg-white">{children}</div>;
}
