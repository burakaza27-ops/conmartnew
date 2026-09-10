"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations";
import { resetPasswordAction } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

export function ResetPasswordForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function onSubmit(data: ResetPasswordFormData) {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("newPassword", data.newPassword);
      formData.set("confirmPassword", data.confirmPassword);

      const result = await resetPasswordAction(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      router.push(result.data.redirectUrl);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="heading-display text-2xl text-foreground">
          {t("auth_reset_title", "Choose a new password")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "auth_reset_subtitle",
            "Use at least 8 characters with an uppercase letter, a lowercase letter, and a number."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert>{serverError}</FormAlert>

        <div className="space-y-2">
          <Label htmlFor="new-password">{t("account_new_password", "New password")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
            {...register("newPassword")}
            aria-invalid={!!errors.newPassword}
          />
          {errors.newPassword ? (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("auth_confirm_password_label")}</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          size="lg"
          loading={isPending}
          loadingLabel={t("account_updating_password", "Updating...")}
        >
          <KeyRound />
          {t("auth_reset_submit", "Save new password")}
        </Button>
      </form>
    </div>
  );
}
