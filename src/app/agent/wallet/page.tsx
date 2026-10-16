// =============================================================================
// ConMart — Agent & Driver Job Credits Wallet Page
// =============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";
import { getAgentWalletStatus } from "@/lib/agents/agent-onboarding-service";
import { AgentWalletView } from "./agent-wallet-view";

export const metadata: Metadata = {
  title: "Job Credits & Driver Wallet | ConMart",
  description:
    "Manage your ConMart dispatch prepaid job credits, view 6-month free intro period status, top up via Telebirr/CBE, and inspect transaction ledger.",
};

export const dynamic = "force-dynamic";

export default async function AgentWalletPage() {
  const auth = await authorize(["FIELD_AGENT", "ADMIN"]);
  if (!auth.ok) {
    redirect("/login?next=/agent/wallet");
  }

  try {
    const wallet = await getAgentWalletStatus(auth.user.id);
    return <AgentWalletView wallet={wallet} userName={auth.user.name} />;
  } catch {
    // If agent profile is not created yet, redirect to apply
    redirect("/agent/apply");
  }
}
