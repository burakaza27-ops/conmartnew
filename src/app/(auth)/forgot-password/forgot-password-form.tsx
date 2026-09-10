"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetFormData,
} from "@/lib/validations";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

export function ForgotPasswordForm({ expired }: { expired?: boolean }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetFormData>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(data: RequestPasswordResetFormData) {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      const result = await requestPasswordResetAction(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setSent(true);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="heading-display text-2xl text-foreground">
          {t("auth_forgot_title", "Reset your password")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "auth_forgot_subtitle",
            "Enter the email you registered with. If an account exists, we will send a reset link."
          )}
        </p>
      </div>

      {expired && !sent ? (
        <FormAlert>
          {t(
            "auth_reset_expired",
            "This reset link has expired or was already used. Request a new one."
          )}
        </FormAlert>
      ) : null}

      {sent ? (
        <p
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-foreground"
        >
          {t(
            "auth_forgot_sent",
            "If that email is registered, a reset link is on its way. Check your inbox and spam folder."
          )}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormAlert>{serverError}</FormAlert>

          <div className="space-y-2">
            <Label htmlFor="reset-email">{t("auth_email_label")}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder={t("auth_email_placeholder")}
              autoComplete="email"
              disabled={isPending}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            size="lg"
            loading={isPending}
            loadingLabel={t("auth_forgot_sending", "Sending...")}
          >
            <Mail />
            {t("auth_forgot_submit", "Send reset link")}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("auth_back_to_sign_in", "Back to sign in")}
        </Link>
      </p>
    </div>
  );
}
