import { redirect } from "next/navigation";
import { getSessionUser, defaultRouteForRole } from "@/lib/auth/session";

// =============================================================================
// ConMart — App Entry Root (Smart Route)
// =============================================================================
// Directs users immediately to their intended workspace or the categories hub:
// - Authenticated SELLER      -> /seller
// - Authenticated FIELD_AGENT -> /agent
// - Authenticated ADMIN       -> /admin
// - Authenticated BUYER       -> /buyer (category hub)
// - Visitors / Anonymous      -> /buyer (categories front & center)
//
// The complete marketing landing page is preserved and accessible at /landing.
// =============================================================================

export default async function RootEntryPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(defaultRouteForRole(user.role));
  }

  // Anonymous visitor lands directly in front of the categories hub
  redirect("/buyer");
}
