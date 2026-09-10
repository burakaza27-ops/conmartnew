// =============================================================================
// ConMart — Login Page
// =============================================================================

import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your ConMart account",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string; registered?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const noticeMessage =
    params.registered === "1"
      ? "Account created. Sign in with the same email and password to continue."
      : undefined;

  const errorMessage =
    params.error === "auth_failed"
      ? "Authentication failed. Please try again."
      : params.error === "missing_code"
        ? "Invalid authentication link."
        : params.error === "expired"
          ? "This reset link has expired. Sign in, or request a new password reset."
          : undefined;

  return (
    <LoginForm
      redirectUrl={params.redirect}
      noticeMessage={noticeMessage}
      errorMessage={errorMessage}
    />
  );
}
