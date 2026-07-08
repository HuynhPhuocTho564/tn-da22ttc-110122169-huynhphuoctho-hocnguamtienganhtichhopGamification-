"use client";

import { usePathname } from "next/navigation";

/**
 * Conditionally hides children on admin routes.
 * Server components (Navbar, Footer) are passed as children —
 * this is allowed in Next.js App Router (server components as children of client components).
 */
export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
