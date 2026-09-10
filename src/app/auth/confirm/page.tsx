import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { AuthConfirmClient } from "./confirm-client";

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Confirming your link…</p>
        </div>
      }
    >
      <AuthConfirmClient />
    </Suspense>
  );
}
