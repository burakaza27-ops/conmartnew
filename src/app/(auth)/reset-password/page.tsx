import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/password-recovery";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a New Password",
  description: "Set a new password for your ConMart account.",
};

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  const cookieStore = await cookies();
  const hasRecovery = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";

  if (!user) {
    redirect("/forgot-password?error=expired");
  }

  if (!hasRecovery) {
    redirect("/account/settings");
  }

  return <ResetPasswordForm />;
}
