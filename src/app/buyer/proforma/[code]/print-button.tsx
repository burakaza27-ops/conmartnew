// =============================================================================
// ECON — Print Button (Client Component)
// =============================================================================

"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export function PrintButton() {
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-1.5 text-xs"
    >
      <Printer className="h-4 w-4" />
      {t("print_invoice_btn")}
    </Button>
  );
}
