"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  Save,
  Shield,
  LogOut,
  ShieldAlert,
  ShoppingCart,
  Store,
  Compass,
  RefreshCw,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from "@/lib/validations";
import {
  changePasswordAction,
  updateProfileAction,
  signOut,
  switchUserRoleAction,
} from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

interface AccountSettingsViewProps {
  name: string;
  email: string | null;
  phone: string;
  companyName: string;
  role: UserRole;
  coverageZone: string | null;
  passwordUpdated: boolean;
  recoveryPending: boolean;
}

export function AccountSettingsView({
  name,
  email,
  phone,
  companyName,
  role,
  coverageZone,
  passwordUpdated,
  recoveryPending,
}: AccountSettingsViewProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("account_settings_title", "Account settings")}
        description={t(
          "account_settings_subtitle",
          "Update the name, phone, and company shown on enquiries and introductions. Change your password here, or use the email reset link if you forgot it."
        )}
      />

      {passwordUpdated ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-foreground"
        >
          {t("account_password_reset_done", "Your password has been updated. You are signed in.")}
        </p>
      ) : null}

      {recoveryPending ? (
        <p
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-foreground"
        >
          {t(
            "account_recovery_pending",
            "Finish setting your new password on the reset page, or change it below with your current password."
          )}
        </p>
      ) : null}

      {/* Admin Portal & Role Control */}
      {(role === "ADMIN" || email === "brooknew25@gmail.com") && (
        <AdminRoleSwitcherCard
          currentRole={role}
          email={email}
          onRoleSwitched={(redirectUrl) => {
            router.push(redirectUrl);
            router.refresh();
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard
          name={name}
          email={email}
          phone={phone}
          companyName={companyName}
          role={role}
          coverageZone={coverageZone}
          onSaved={() => router.refresh()}
        />
        <PasswordCard hasEmail={Boolean(email)} />
      </div>

      {/* Account Session & Sign Out Card */}
      <Card className="border border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader className="border-b border-destructive/20 pb-4">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <LogOut className="size-4 text-destructive" />
            {t("nav_sign_out", "Sign out")}
          </CardTitle>
          <CardDescription className="text-xs">
            {locale === "am"
              ? "ከዚህ መሳሪያ ወይም አካውንት ለመውጣት ይጫኑ"
              : "Sign out of your active account session on this device"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={signOut}>
            <Button
              type="submit"
              variant="destructive"
              className="w-full sm:w-auto font-semibold gap-2"
            >
              <LogOut className="size-4" />
              {t("nav_sign_out", "Sign out")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileCard({
  name,
  email,
  phone,
  companyName,
  role,
  coverageZone,
  onSaved,
}: {
  name: string;
  email: string | null;
  phone: string;
  companyName: string;
  role: UserRole;
  coverageZone: string | null;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name, phone, companyName },
  });

  function onSubmit(data: UpdateProfileFormData) {
    setServerError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("phone", data.phone);
      formData.set("companyName", data.companyName);

      const result = await updateProfileAction(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      reset({
        name: result.data.name,
        phone: result.data.phone,
        companyName: result.data.companyName,
      });
      setSuccess(true);
      onSaved();
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t("account_profile_title", "Profile")}</CardTitle>
        <CardDescription>
          {t(
            "account_profile_desc",
            "This name, phone, and company are what counterparties see after an enquiry is unlocked."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormAlert>{serverError}</FormAlert>
          {success ? (
            <p
              role="status"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-foreground"
            >
              {t("account_profile_saved", "Profile saved.")}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t(`account_role_${role}`, role)}</Badge>
            {coverageZone ? (
              <span className="text-xs text-muted-foreground">{coverageZone}</span>
            ) : null}
          </div>

          <Field
            label={t("auth_email_label")}
            hint={t(
              "account_email_readonly",
              "Email is your login and cannot be changed here. Contact ECON support if you need a new address."
            )}
          >
            <Input type="email" value={email ?? ""} disabled autoComplete="email" />
          </Field>

          <Field label={t("auth_name_label")} error={errors.name?.message} required>
            <Input
              autoComplete="name"
              disabled={isPending}
              {...register("name")}
            />
          </Field>

          <Field
            label={t("auth_phone_label")}
            hint={t("account_phone_hint", "Ethiopian mobile in international form, e.g. +251 91 234 5678")}
            error={errors.phone?.message}
            required
          >
            <Input
              type="tel"
              autoComplete="tel"
              disabled={isPending}
              {...register("phone")}
            />
          </Field>

          <Field
            label={t("auth_company_label")}
            error={errors.companyName?.message}
            required
          >
            <Input
              autoComplete="organization"
              disabled={isPending}
              {...register("companyName")}
            />
          </Field>

          <Button type="submit" loading={isPending} loadingLabel={t("account_saving", "Saving...")}>
            <Save />
            {t("account_save_profile", "Save profile")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard({ hasEmail }: { hasEmail: boolean }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: ChangePasswordFormData) {
    setServerError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("currentPassword", data.currentPassword);
      formData.set("newPassword", data.newPassword);
      formData.set("confirmPassword", data.confirmPassword);

      const result = await changePasswordAction(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      reset();
      setSuccess(true);
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t("account_password_title", "Password")}</CardTitle>
        <CardDescription>
          {t(
            "account_password_desc",
            "Use at least 8 characters with an uppercase letter, a lowercase letter, and a number."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasEmail ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "account_password_no_email",
              "This account has no email, so the password cannot be changed here."
            )}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormAlert>{serverError}</FormAlert>
            {success ? (
              <p
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-foreground"
              >
                {t("account_password_saved", "Password updated. Other devices have been signed out.")}
              </p>
            ) : null}

            <Field
              label={t("account_current_password", "Current password")}
              error={errors.currentPassword?.message}
              required
            >
              <Input
                type="password"
                autoComplete="current-password"
                disabled={isPending}
                {...register("currentPassword")}
              />
            </Field>

            <Field
              label={t("account_new_password", "New password")}
              error={errors.newPassword?.message}
              required
            >
              <Input
                type="password"
                autoComplete="new-password"
                disabled={isPending}
                {...register("newPassword")}
              />
            </Field>

            <Field
              label={t("auth_confirm_password_label")}
              error={errors.confirmPassword?.message}
              required
            >
              <Input
                type="password"
                autoComplete="new-password"
                disabled={isPending}
                {...register("confirmPassword")}
              />
            </Field>

            <Button
              type="submit"
              loading={isPending}
              loadingLabel={t("account_updating_password", "Updating...")}
            >
              <KeyRound />
              {t("account_change_password", "Update password")}
            </Button>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t(
                "account_password_other_sessions",
                "Updating your password signs other devices out of this account."
              )}
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function AdminRoleSwitcherCard({
  currentRole,
  email,
  onRoleSwitched,
}: {
  currentRole: UserRole;
  email: string | null;
  onRoleSwitched: (redirectUrl: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [switchingTo, setSwitchingTo] = useState<UserRole | null>(null);

  const roles: Array<{
    role: UserRole;
    label: string;
    description: string;
    icon: typeof ShieldAlert;
    accentClass: string;
  }> = [
    {
      role: "ADMIN",
      label: "Administrator",
      description: "Full platform permissions, command center, user management & vetting.",
      icon: ShieldAlert,
      accentClass: "border-amber-500/30 text-amber-600 bg-amber-500/10",
    },
    {
      role: "BUYER",
      label: "Buyer",
      description: "Construction materials catalog, RFQ requests, inquiries & cart.",
      icon: ShoppingCart,
      accentClass: "border-blue-500/30 text-blue-600 bg-blue-500/10",
    },
    {
      role: "SELLER",
      label: "Supplier / Merchant",
      description: "Catalog listings, tier pricing, orders received & subscription wallet.",
      icon: Store,
      accentClass: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
    },
    {
      role: "FIELD_AGENT",
      label: "Commission / Field Agent",
      description: "01B guided lead inbox, nearby requests, buyer visit dispatch & deals.",
      icon: Compass,
      accentClass: "border-orange-500/30 text-orange-600 bg-orange-500/10",
    },
  ];

  const handleRoleSwitch = (targetRole: UserRole) => {
    if (targetRole === currentRole) return;
    setError(null);
    setSuccess(null);
    setSwitchingTo(targetRole);

    startTransition(async () => {
      const res = await switchUserRoleAction(targetRole);
      if (!res.success) {
        setError(res.error);
        setSwitchingTo(null);
        return;
      }
      setSuccess(`Account role successfully updated to ${targetRole}. Redirecting...`);
      onRoleSwitched(res.data.redirectUrl);
    });
  };

  return (
    <Card className="border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <CardTitle className="text-base font-black text-foreground">
                Administrator Role & Portal Control
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Seamlessly switch between ECON platforms or update your account&apos;s active database role.
            </CardDescription>
          </div>
          <Badge className="bg-primary text-primary-foreground font-mono text-xs w-fit">
            👑 Admin Access
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <FormAlert>{error}</FormAlert>
        {success && (
          <p
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          >
            {success}
          </p>
        )}

        {/* Section 1: Instant Portal Navigation */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            1. Instant Portal Navigation (Zero DB changes)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/admin/command-center"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/80 hover:border-amber-500 hover:bg-amber-500/5 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 text-foreground">
                <ShieldAlert className="size-4 text-amber-600" />
                <span>Admin Console</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/buyer"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/80 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 text-foreground">
                <ShoppingCart className="size-4 text-blue-600" />
                <span>Buyer Portal</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/seller/dashboard"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/80 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Store className="size-4 text-emerald-600" />
                <span>Supplier Portal</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/agent/leads"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/80 hover:border-orange-500 hover:bg-orange-500/5 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Compass className="size-4 text-orange-600" />
                <span>Field Agent Inbox</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Section 2: Active Database Role Switcher */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Switch Active Database Role (For Realistic Permission Testing)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Active in DB: <strong className="text-foreground">{currentRole}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const isCurrent = currentRole === r.role;
              const isThisSwitching = switchingTo === r.role && isPending;

              return (
                <button
                  key={r.role}
                  type="button"
                  disabled={isPending || isCurrent}
                  onClick={() => handleRoleSwitch(r.role)}
                  className={cn(
                    "flex flex-col text-left p-4 rounded-xl border transition-all relative",
                    isCurrent
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                      : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40",
                    isPending && "opacity-75 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex size-7 items-center justify-center rounded-lg border", r.accentClass)}>
                        <Icon className="size-3.5" />
                      </div>
                      <span className="font-bold text-xs text-foreground">{r.label}</span>
                    </div>

                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-[10px] bg-primary text-primary-foreground font-mono font-bold px-2 py-0.5 rounded-full">
                        <Check className="size-3" /> Current
                      </span>
                    ) : isThisSwitching ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary font-bold">
                        <RefreshCw className="size-3 animate-spin" /> Switching...
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground hover:text-primary font-bold">
                        Switch &rarr;
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {r.description}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5">
            <Shield className="size-3.5 text-primary shrink-0" />
            <span>
              <strong>Failsafe Protection:</strong> Your account (<code>{email || "admin"}</code>) is registered with administrative bypass. Even if you switch to Buyer or Seller to test, you can always return to this settings page to restore Administrator status.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

