"use client";

// =============================================================================
// ECON — Language Toggle Button (Client Component)
// =============================================================================

import React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLanguage();
  const isAmharic = locale === "am";

  return (
    <Button
      variant="ghost"
      size="sm"
      tapTarget={true}
      onClick={toggleLocale}
      className={`h-9 md:h-8 gap-1.5 px-2.5 md:px-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors ${
        className ?? ""
      }`}
      aria-label="Switch Language (English / አማርኛ)"
      title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር (Switch to Amharic)"}
    >
      <Languages className="h-3.5 w-3.5 text-primary" />
      <span className={isAmharic ? "font-bold text-foreground text-[11px]" : "font-bold text-foreground"}>
        {isAmharic ? "አማርኛ" : "EN"}
      </span>
    </Button>
  );
}
