import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ALL_APP_ROLES, requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/password-recovery";
import { AccountSettingsView } from "./account-settings-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Update your ConMart profile, phone, company, and password.",
};

interface AccountSettingsPageProps {
  searchParams: Promise<{ password?: string }>;
}

export default async function AccountSettingsPage({
  searchParams,
}: AccountSettingsPageProps) {
  const user = await requireRole(ALL_APP_ROLES, "/account/settings");
  const params = await searchParams;
  const cookieStore = await cookies();
  const recoveryPending = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";

  let coverageZone: { name: string; region: string } | null = null;
  if (user.role === "FIELD_AGENT") {
    try {
      const profile = await db.agentProfile.findUnique({
        where: { userId: user.id },
        select: { zone: { select: { name: true, region: true } } },
      });
      coverageZone = profile?.zone ?? null;
    } catch (err) {
      console.error("[account/settings] agentProfile lookup failed:", err);
    }
  }

  return (
    <AccountSettingsView
      name={user.name}
      email={user.email}
      phone={user.phone}
      companyName={user.companyName}
      role={user.role}
      coverageZone={
        coverageZone ? `${coverageZone.name}, ${coverageZone.region}` : null
      }
      passwordUpdated={params.password === "1"}
      recoveryPending={recoveryPending}
    />
  );
}
