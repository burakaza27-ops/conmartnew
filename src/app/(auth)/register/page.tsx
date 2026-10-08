// =============================================================================
// ConMart — Register Page
// =============================================================================

import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your ConMart B2B marketplace account",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
