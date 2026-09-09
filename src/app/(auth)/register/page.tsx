// =============================================================================
// ConMart — Register Page
// =============================================================================

import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { fetchRegistrationZones } from "@/lib/data/zones";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your ConMart B2B marketplace account",
};

export default async function RegisterPage() {
  const zones = await fetchRegistrationZones();
  return <RegisterForm zones={zones} />;
}
