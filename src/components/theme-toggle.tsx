"use client";

// =============================================================================
// ECON — Theme Toggle Button (Client Component)
// =============================================================================

import React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <Button
      variant="ghost"
      size="sm"
      tapTarget={true}
      onClick={toggleTheme}
      className={`h-9 w-9 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-foreground transition-colors ${
        className ?? ""
      }`}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
    >
      {isLight ? (
        <Moon className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-4 w-4 text-primary transition-transform duration-200 hover:rotate-45" />
      )}
    </Button>
  );
}
