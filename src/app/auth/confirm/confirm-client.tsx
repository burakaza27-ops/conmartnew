"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import { Spinner } from "@/components/ui/spinner";
import { FormAlert } from "@/components/ui/form-alert";

async function stampRecoveryCookie(): Promise<boolean> {
  const res = await fetch("/api/auth/recovery-cookie", { method: "POST" });
  return res.ok;
}

export function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    void (async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: type as "recovery" | "signup" | "email",
          token_hash: tokenHash,
        });

        if (otpError) {
          setError(otpError.message);
          return;
        }

        if (type === "recovery") {
          const stamped = await stampRecoveryCookie();
          if (!stamped) {
            setError("Could not start password reset. Request a new link.");
            return;
          }
          router.replace("/reset-password");
          router.refresh();
          return;
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        setError("Invalid or expired confirmation link.");
        return;
      }

      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (!accessToken || !refreshToken) {
        setError("Invalid or expired confirmation link.");
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (hashType === "recovery") {
        const stamped = await stampRecoveryCookie();
        if (!stamped) {
          setError("Could not start password reset. Request a new link.");
          return;
        }
        router.replace("/reset-password");
        router.refresh();
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12">
        <FormAlert>{error}</FormAlert>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Confirming your link…</p>
    </div>
  );
}
