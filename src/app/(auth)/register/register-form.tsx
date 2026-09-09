// =============================================================================
// ConMart — Register Form (Client Component)
// =============================================================================
// Registration with role selection: BUYER, SELLER, or FIELD_AGENT (local agent).
// Agents must pick a service zone so job-board routing works immediately.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Building2, ShoppingCart, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";

import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { signUp } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";
import type { RegistrationZoneOption } from "@/lib/data/zones";

interface RegisterFormProps {
  zones: RegistrationZoneOption[];
}

export function RegisterForm({ zones }: RegisterFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      companyName: "",
      role: "BUYER",
      zoneId: "",
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  function onSubmit(data: RegisterFormData) {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      formData.set("name", data.name);
      formData.set("phone", data.phone);
      formData.set("companyName", data.companyName);
      formData.set("role", data.role);
      if (data.zoneId) {
        formData.set("zoneId", data.zoneId);
      }

      const result = await signUp(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push(result.data.redirectUrl);
      router.refresh();
    });
  }

  const roleButtonClass = (role: RegisterFormData["role"]) =>
    `flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition-all ${
      selectedRole === role
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
    }`;

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="heading-display text-2xl text-foreground">
          {t("auth_register_title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth_register_subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert>{serverError}</FormAlert>

        <div className="space-y-2">
          <Label>{t("auth_role_label")}</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setValue("role", "BUYER")}
              aria-pressed={selectedRole === "BUYER"}
              className={roleButtonClass("BUYER")}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="line-clamp-2">{t("auth_role_buyer")}</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "SELLER")}
              aria-pressed={selectedRole === "SELLER"}
              className={roleButtonClass("SELLER")}
            >
              <Building2 className="h-5 w-5" />
              <span className="line-clamp-2">{t("auth_role_seller")}</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "FIELD_AGENT")}
              aria-pressed={selectedRole === "FIELD_AGENT"}
              className={roleButtonClass("FIELD_AGENT")}
            >
              <MapPin className="h-5 w-5" />
              <span className="line-clamp-2">{t("auth_role_agent", "Local agent")}</span>
            </button>
          </div>
          <input type="hidden" {...register("role")} />
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

        {selectedRole === "FIELD_AGENT" && (
          <div className="space-y-2">
            <Label htmlFor="reg-zone">{t("auth_agent_zone_label", "Service zone")}</Label>
            {zones.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t(
                  "auth_agent_zone_empty",
                  "No zones are configured yet. Contact ConMart operations to finish agent onboarding."
                )}
              </p>
            ) : (
              <select
                id="reg-zone"
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60"
                {...register("zoneId")}
                aria-invalid={!!errors.zoneId}
              >
                <option value="">
                  {t("auth_agent_zone_placeholder", "Select your coverage area")}
                </option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            )}
            {errors.zoneId && (
              <p className="text-xs text-destructive">{errors.zoneId.message}</p>
            )}
            <p className="text-2xs text-muted-foreground">
              {t(
                "auth_agent_zone_hint",
                "You will only see and claim free-supplier deals routed to this zone."
              )}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reg-name">{t("auth_name_label")}</Label>
          <Input
            id="reg-name"
            placeholder={t("auth_name_placeholder")}
            autoComplete="name"
            disabled={isPending}
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-company">{t("auth_company_label")}</Label>
          <Input
            id="reg-company"
            placeholder={
              selectedRole === "FIELD_AGENT"
                ? t("auth_agent_company_placeholder", "e.g. ConMart Field Operations")
                : t("auth_company_placeholder")
            }
            disabled={isPending}
            {...register("companyName")}
            aria-invalid={!!errors.companyName}
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-phone">{t("auth_phone_label")}</Label>
          <Input
            id="reg-phone"
            type="tel"
            placeholder="+251 91 234 5678"
            autoComplete="tel"
            disabled={isPending}
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">{t("auth_email_label")}</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder={t("auth_email_placeholder")}
            autoComplete="email"
            disabled={isPending}
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">{t("auth_password_label")}</Label>
          <Input
            id="reg-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-confirm">{t("auth_confirm_password_label")}</Label>
          <Input
            id="reg-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          size="lg"
          loading={isPending}
          loadingLabel={t("auth_btn_registering")}
          disabled={selectedRole === "FIELD_AGENT" && zones.length === 0}
        >
          <UserPlus />
          {t("auth_btn_register")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth_have_account")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth_sign_in_link")}
          </Link>
        </p>
      </form>
    </div>
  );
}
