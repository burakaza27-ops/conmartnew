"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { signIn } from "@/app/actions/auth";
import { useLanguage } from "@/lib/i18n/language-context";

interface LoginFormProps {
  redirectUrl?: string;
  errorMessage?: string;
  noticeMessage?: string;
}

export function LoginForm({ redirectUrl, errorMessage, noticeMessage }: LoginFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(
    errorMessage ?? null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginFormData) {
    setServerError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);

      const result = await signIn(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      const isSafeRedirect =
        redirectUrl &&
        redirectUrl.startsWith("/") &&
        !redirectUrl.startsWith("//") &&
        !redirectUrl.includes("\\") &&
        !redirectUrl.includes(":");

      router.push(isSafeRedirect ? redirectUrl : result.data.redirectUrl);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="heading-display text-2xl text-foreground">
          {t("auth_sign_in_title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth_sign_in_subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert>{serverError}</FormAlert>
        {noticeMessage && !serverError ? (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-foreground">
            {noticeMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="login-email">{t("auth_email_label")}</Label>
          <Input
            id="login-email"
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
          <Label htmlFor="login-password">{t("auth_password_label")}</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isPending}
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full font-semibold"
          size="lg"
          loading={isPending}
          loadingLabel={t("auth_btn_signing_in")}
        >
          <LogIn />
          {t("auth_btn_sign_in")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth_no_account")}{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("auth_create_account_link")}
        </Link>
      </p>
    </div>
  );
}
