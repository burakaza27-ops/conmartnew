"use client";

// =============================================================================
// ConMart — Chat Thread Component with Supabase Realtime
// =============================================================================
// Renders a message thread and listens for new messages via Supabase Realtime
// (postgres_changes on chat_messages table for this roomId). Falls back
// gracefully to polling if the Realtime subscription fails or is unavailable.
// =============================================================================

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizontal, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

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

// We create the Supabase client on the client-side only, using the
// NEXT_PUBLIC_ keys that Next.js inlines at build time.
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type RealtimeStatus = "connecting" | "connected" | "fallback";

export function ChatThread({
  roomId,
  type,
  messages: initialMessages,
  counterpartName,
  listingTitle,
  ticket,
}: ChatThreadProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>(() => {
    return !getSupabaseClient() ? "fallback" : "connecting";
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>["channel"]> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to the bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  // Refresh router (which re-fetches server component data)
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Set up Supabase Realtime subscription. If it works, we ditch the poll.
  // If it fails, we fall back to 8-second polling.
  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // No client available (missing env vars) — use polling
      pollTimerRef.current = setInterval(refresh, 8000);
      return;
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // A new message arrived — refresh the server component to get it
          refresh();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
          // Cancel any fallback poll
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("fallback");
          // Start polling as a fallback
          if (!pollTimerRef.current) {
            pollTimerRef.current = setInterval(refresh, 8000);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

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
      // Immediately refresh to show the sent message without waiting for Realtime
      refresh();
      // Re-focus input for rapid messaging
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  const title =
    type === "DIRECT"
      ? t("chat_type_direct", "Direct chat")
      : type === "BUYER_AGENT"
        ? t("chat_type_buyer_agent", "You ↔ Agent")
        : t("chat_type_seller_agent", "Supplier ↔ Agent");

  return (
    <div
      className="flex min-h-[70vh] flex-col rounded-xl border border-border bg-card"
      role="region"
      aria-label={counterpartName ? `Chat with ${counterpartName}` : title}
    >
      {/* Header */}
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
        <div className="flex items-center gap-2">
          {/* Realtime connection indicator */}
          <span
            title={
              realtimeStatus === "connected"
                ? "Live — messages arrive instantly"
                : realtimeStatus === "connecting"
                  ? "Connecting to live updates…"
                  : "Using polling (8-second refresh)"
            }
            aria-label={
              realtimeStatus === "connected"
                ? "Live connection active"
                : "Using polling fallback"
            }
          >
            {realtimeStatus === "connected" ? (
              <Wifi className="size-3.5 text-success" />
            ) : realtimeStatus === "connecting" ? (
              <Wifi className="size-3.5 animate-pulse text-muted-foreground" />
            ) : (
              <WifiOff className="size-3.5 text-warning" />
            )}
          </span>
          {ticket ? (
            <StatusBadge domain="dealTicket" status={ticket.status} locale={locale} />
          ) : (
            <StatusBadge domain="subscription" status="ACTIVE" locale={locale} size="sm" />
          )}
        </div>
      </div>

      {/* Message list */}
      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label={t("chat_messages_label", "Chat messages")}
        aria-atomic="false"
        aria-relevant="additions"
      >
        {initialMessages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("chat_no_messages", "No messages yet. Send the first one.")}
          </p>
        ) : (
          initialMessages.map((message) => (
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
                <p className="mt-0.5 text-right text-2xs opacity-60">
                  {new Date(message.createdAt).toLocaleTimeString(
                    locale === "am" ? "am-ET" : "en-US",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose form */}
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
            ref={inputRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat_placeholder", "Write a message… (Ctrl+Enter to send)")}
            rows={2}
            maxLength={2000}
            aria-label={t("chat_input_label", "Message input")}
            aria-describedby={error ? "chat-error" : undefined}
            className="resize-none"
          />
          <Button
            type="submit"
            disabled={isPending || !body.trim()}
            className="shrink-0"
            aria-label={t("chat_send", "Send message")}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="size-4" aria-hidden="true" />
            )}
            {t("chat_send", "Send")}
          </Button>
        </div>
        {error ? (
          <p id="chat-error" role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <p className="mt-1 text-right text-2xs text-muted-foreground">
          {body.length}/2000
        </p>
      </form>
    </div>
  );
}
