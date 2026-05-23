import type { ReactNode } from "react";

/** Full-screen confirmation (no site chrome — Header/Footer hide via pathname). */
export default function BookingConfirmationLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
