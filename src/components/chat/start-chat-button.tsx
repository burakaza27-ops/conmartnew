"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { initiateConversationAction } from "@/app/actions/marketplace";
import { useLanguage } from "@/lib/i18n/language-context";

interface StartChatButtonProps {
  listingId?: string;
  enquiryId?: string;
  directChatEnabled?: boolean;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  portal?: "buyer" | "seller";
}

export function StartChatButton({
  listingId,
  enquiryId,
  directChatEnabled = false,
  variant = "outline",
  size = "lg",
  className,
  portal = "buyer",
}: StartChatButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await initiateConversationAction({ listingId, enquiryId });
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.data.kind === "DIRECT" && result.data.roomId) {
        router.push(`/${portal}/messages/${result.data.roomId}`);
        return;
      }
      if (result.data.kind === "MEDIATED" && result.data.roomId) {
        router.push(`/${portal}/messages/${result.data.roomId}`);
        return;
      }
      if (result.data.ticketId) {
        router.push(`/${portal}/deals/${result.data.ticketId}`);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size={size}
        variant={variant}
        disabled={isPending}
        onClick={handleClick}
        className={className}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : directChatEnabled ? (
          <MessageCircle className="size-4" />
        ) : (
          <Lock className="size-4" />
        )}
        {directChatEnabled
          ? t("chat_start_direct", "Message supplier")
          : t("chat_start_agent", "Request local agent")}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
