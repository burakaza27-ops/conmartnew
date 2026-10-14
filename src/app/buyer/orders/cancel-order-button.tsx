"use client";

// =============================================================================
// ECON — Cancel Order Button (Client Component)
// =============================================================================
// Allows a buyer to cancel a proforma inquiry while it is still in GENERATED status.
// =============================================================================

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelOrderInquiryAction } from "@/app/actions/orders";
import { useLanguage } from "@/lib/i18n/language-context";

interface CancelOrderButtonProps {
  orderId: string;
  referenceCode: string;
  variant?: "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "xs";
  onCancelled?: () => void;
}

export function CancelOrderButton({
  orderId,
  referenceCode,
  variant = "outline",
  size = "sm",
  onCancelled,
}: CancelOrderButtonProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelOrderInquiryAction(orderId);
      if (!res.success) {
        alert(res.error);
        setShowConfirm(false);
        return;
      }
      setShowConfirm(false);
      if (onCancelled) {
        onCancelled();
      }
      router.refresh();
    });
  };

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-1.5 animate-in fade-in duration-150">
        <span className="text-[11px] text-destructive font-medium">
          {locale === "am" ? `#${referenceCode} ይሰረዝ?` : `Cancel #${referenceCode}?`}
        </span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleCancel}
          disabled={isPending}
          className="h-7 px-2 text-[11px] font-bold"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("orders_cancel_yes")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="h-7 px-2 text-[11px]"
        >
          {t("orders_cancel_no")}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setShowConfirm(true)}
      className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      title="Cancel this inquiry"
    >
      <XCircle className="h-3.5 w-3.5" />
      <span>{t("orders_btn_cancel")}</span>
    </Button>
  );
}

