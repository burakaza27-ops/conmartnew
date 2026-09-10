"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { sendChatMessageAction } from "@/app/actions/marketplace";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export interface ChatMessageItem {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  mine: boolean;
}

interface ChatThreadProps {
  roomId: string;
  type: string;
  messages: ChatMessageItem[];
  counterpartName?: string | null;
  listingTitle?: string | null;
  ticket?: {
    id: string;
    referenceCode: string;
    status: string;
    zoneName: string;
  } | null;
}

export function ChatThread({
  roomId,
  type,
  messages,
  counterpartName,
  listingTitle,
  ticket,
}: ChatThreadProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(timer);
  }, [router]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = body.trim();
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const result = await sendChatMessageAction({ roomId, body: next });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  const title =
    type === "DIRECT"
      ? t("chat_type_direct", "Direct chat")
      : type === "BUYER_AGENT"
        ? t("chat_type_buyer_agent", "You ↔ Agent")
        : t("chat_type_seller_agent", "Supplier ↔ Agent");

  return (
    <div className="flex min-h-[70vh] flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {counterpartName || title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {title}
            {listingTitle ? ` · ${listingTitle}` : ""}
            {ticket ? ` · ${ticket.referenceCode} · ${ticket.zoneName}` : ""}
          </p>
        </div>
        {ticket ? <StatusBadge domain="dealTicket" status={ticket.status} locale={locale} /> : (
          <StatusBadge domain="subscription" status="ACTIVE" locale={locale} size="sm" />
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("chat_no_messages", "No messages yet")}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                  message.mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-2xs font-medium opacity-80">{message.senderName}</p>
                <p className="whitespace-pre-wrap">{message.body}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        {type !== "DIRECT" ? (
          <p className="mb-2 text-2xs text-muted-foreground">
            {t(
              "chat_mediated_hint",
              "Phone numbers and messaging handles are stripped from agent channels."
            )}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("chat_placeholder", "Write a message…")}
            rows={2}
            maxLength={2000}
            aria-label={t("chat_placeholder", "Write a message…")}
          />
          <Button type="submit" disabled={isPending || !body.trim()} className="shrink-0">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            {t("chat_send", "Send")}
          </Button>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}
