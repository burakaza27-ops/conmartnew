// =============================================================================
// ConMart — Agent Onboarding Wizard Page (01B Specification)
// =============================================================================

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAgentProfile } from "@/lib/agents/agent-onboarding-service";
import { AgentApplyWizard } from "./agent-apply-wizard";

export const metadata: Metadata = {
  title: "Apply as Commission Agent | ConMart",
  description:
    "Apply to become a vetted ConMart field agent. Work part-time, guide buyers, and connect with verified construction suppliers in your area.",
};

export const dynamic = "force-dynamic";

export default async function AgentApplyPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/agent/apply");
  }

  const existingProfile = await getAgentProfile(user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <AgentApplyWizard
        user={{
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
        }}
        existingProfile={existingProfile ? {
          ...existingProfile,
          createdAt: existingProfile.createdAt.toISOString(),
          updatedAt: existingProfile.updatedAt.toISOString(),
          reviewedAt: existingProfile.reviewedAt?.toISOString() || null,
        } : null}
      />
    </div>
  );
}
