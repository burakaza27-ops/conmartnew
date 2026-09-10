"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Save, Shield } from "lucide-react";
import type { UserRole } from "@prisma/client";

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
  const { t } = useLanguage();
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
              "Email is your login and cannot be changed here. Contact ConMart support if you need a new address."
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
