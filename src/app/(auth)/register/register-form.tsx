// =============================================================================
// ConMart — Register Form (Client Component)
// =============================================================================
// Registration with role selection: BUYER or SELLER only. ADMIN and FIELD_AGENT
// are granted from the command line. Supports referral codes via ?ref=CODE.
// =============================================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Building2, ShoppingCart, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";

import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { signUp } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const referralCode = searchParams.get("ref") ?? "";

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
      role: referralCode ? "SELLER" : "BUYER",
      referralCode: referralCode || "",
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  function selectRole(role: RegisterFormData["role"]) {
    setValue("role", role, { shouldValidate: true });
  }

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
      if (data.referralCode) {
        formData.set("referralCode", data.referralCode);
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
    `flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center text-xs font-semibold transition-all ${
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

      {referralCode && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("referral_invite_banner_title", "You've been invited!")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "referral_invite_banner_desc",
                "Register as a supplier and list your materials to help your referrer earn free subscription time."
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert>{serverError}</FormAlert>

        <input type="hidden" {...register("referralCode")} />

        <div className="space-y-2">
          <Label>{t("auth_role_label")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectRole("BUYER")}
              aria-pressed={selectedRole === "BUYER"}
              className={roleButtonClass("BUYER")}
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              <span className="line-clamp-2">{t("auth_role_buyer")}</span>
            </button>
            <button
              type="button"
              onClick={() => selectRole("SELLER")}
              aria-pressed={selectedRole === "SELLER"}
              className={roleButtonClass("SELLER")}
            >
              <Building2 className="size-5" aria-hidden="true" />
              <span className="line-clamp-2">{t("auth_role_seller")}</span>
            </button>
          </div>
          <input type="hidden" {...register("role")} />
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

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
            placeholder={t("auth_company_placeholder")}
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
