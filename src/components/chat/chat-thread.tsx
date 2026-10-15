"use client";

// =============================================================================
// ECON — Alibaba-Grade B2B Direct Chat Thread Component with Supabase Realtime
// =============================================================================
// Replicates and enhances the Alibaba B2B mobile chat flow for subscribed
// suppliers and direct contractor negotiations:
//
// 1. Supplier Header:
//    - Avatar, company name, verification badges (PRO SUPPLIER / VERIFIED)
//    - Realtime LIVE / Online pulsing indicator
//    - Supplier local time (East Africa Time UTC+3) & avg response time
// 2. Pinned Trust & Escrow Alert Banner:
//    - Reminds parties that deals on Econ are 100% escrow-backed
// 3. Floating Product Context Card:
//    - Pinned above input: thumbnail, title, price tier range, MOQ
//    - One-click "Send" button to post the product reference into the thread
// 4. In-Feed Product Card Renderer:
//    - Parses [Product Inquiry] and [PRODUCT_CARD] messages into interactive cards
// 5. Horizontal Scrollable Quick Actions Bar:
//    - 📝 Send order request (opens PurchaseRequestModal)
//    - 💳 View payment options (Escrow, Telebirr, CBE, Awash, Cash on Depot)
//    - 🏢 Supplier Store / Depot (link to catalog)
//    - 🚚 Logistics Inquiry (Ethiopian freight calculator + send to chat)
//    - 🛡️ Escrow Dispute & Buyer Protection
// 6. Contextual Quick Reply Suggestion Chips:
//    - Stock inquiry, bulk discount, Addis Ababa delivery, proforma request, VAT receipt
// 7. Automated Supplier Welcome Greeting when chat has 0 messages
// 8. Supabase Realtime live sync with 8-second polling fallback + typing broadcast
// =============================================================================

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PurchaseRequestModal } from "@/components/enquiry/purchase-request-modal";
import { sendChatMessageAction } from "@/app/actions/marketplace";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatPrice, getLocalizedUnit } from "@/lib/i18n/translations";
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

export interface ProductContext {
  listingId: string;
  productId: string;
  title: string;
  unit: string;
  imageUrl?: string | null;
  location: string;
  brand?: string | null;
  minOrder: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface ChatCounterpart {
  id: string | null;
  name: string;
  companyName?: string | null;
  role: string;
  subscriptionTier?: string | null;
  isSubscribed?: boolean;
  isVerified?: boolean;
  workingHours?: string | null;
  responseTimeAvgMinutes?: number;
  address?: string | null;
}

interface ChatThreadProps {
  roomId: string;
  type: string;
  messages: ChatMessageItem[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: string;
  counterpartName?: string | null;
  counterpart?: ChatCounterpart | null;
  productContext?: ProductContext | null;
  listingTitle?: string | null;
  ticket?: {
    id: string;
    referenceCode: string;
    status: string;
    zoneName: string;
  } | null;
}

let chatSupabaseClient: ReturnType<typeof createClient> | null = null;

// Supabase client instance (inlined via env at build time)
function getSupabaseClient() {
  if (chatSupabaseClient) return chatSupabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  chatSupabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return chatSupabaseClient;
}

type RealtimeStatus = "connecting" | "connected" | "fallback";

const TYPING_BROADCAST_INTERVAL = 2000;
const TYPING_TIMEOUT = 4000;

/** Computes current East Africa Time (EAT, UTC+3) */
function getEastAfricaTime(): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: "Africa/Addis_Ababa",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

/** Parses structured product cards out of chat message strings */
function parseProductCardMessage(body: string): {
  isProductCard: boolean;
  title?: string;
  price?: string;
  minOrder?: string;
  location?: string;
  listingId?: string;
  rawText?: string;
} {
  if (body.startsWith("📦 [PRODUCT_CARD]")) {
    try {
      const jsonStr = body.replace("📦 [PRODUCT_CARD]", "").trim();
      const parsed = JSON.parse(jsonStr);
      return {
        isProductCard: true,
        title: parsed.title,
        price: parsed.price,
        minOrder: parsed.minOrder,
        location: parsed.location,
        listingId: parsed.listingId,
      };
    } catch {
      // Fall through to regex parser
    }
  }

  if (body.startsWith("📦 [Product Inquiry]")) {
    const lines = body.split("\n");
    const title = lines[0]?.replace("📦 [Product Inquiry]", "").trim();
    let price: string | undefined;
    let minOrder: string | undefined;
    let location: string | undefined;
    let listingId: string | undefined;

    for (const line of lines.slice(1)) {
      if (line.includes("💰 Price:")) price = line.replace(/.*💰 Price:\s*/, "").trim();
      if (line.includes("📦 Min Order:")) minOrder = line.replace(/.*📦 Min Order:\s*/, "").trim();
      if (line.includes("📍 Depot:")) location = line.replace(/.*📍 Depot:\s*/, "").trim();
      if (line.includes("/buyer/catalog/")) {
        const match = line.match(/\/buyer\/catalog\/([^\s]+)/);
        if (match) listingId = match[1];
      }
    }

    return {
      isProductCard: true,
      title: title || undefined,
      price,
      minOrder,
      location,
      listingId,
      rawText: body,
    };
  }

  return { isProductCard: false };
}

export function ChatThread({
  roomId,
  type,
  messages: initialMessages,
  currentUserId,
  currentUserName,
  currentUserRole: _currentUserRole,
  counterpartName,
  counterpart,
  productContext,
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
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [showTrustBanner, setShowTrustBanner] = useState(true);
  const [isProductCardMinimized, setIsProductCardMinimized] = useState(false);
  const [hasSentProductCard, setHasSentProductCard] = useState(false);
  const [localTime, setLocalTime] = useState<string>(getEastAfricaTime);

  // Modals
  const [isPurchaseRequestOpen, setIsPurchaseRequestOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);

  // Logistics modal state
  const [logisticsTruck, setLogisticsTruck] = useState<"sino" | "fsr" | "npr">("sino");
  const [logisticsDestination, setLogisticsDestination] = useState("Addis Ababa - Bole / CMC");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>["channel"]> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTypingBroadcast = useRef<number>(0);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Update local clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(getEastAfricaTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Debounced typing broadcast
  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingBroadcast.current < TYPING_BROADCAST_INTERVAL) return;
    lastTypingBroadcast.current = now;

    const channel = channelRef.current;
    if (!channel) return;

    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, userName: currentUserName },
    });
  }, [currentUserId, currentUserName]);

  // Supabase Realtime subscription with polling fallback
  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
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
          refresh();
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as { userId: string; userName: string } | undefined;
        if (!data || data.userId === currentUserId) return;

        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.userName);
          return next;
        });

        const existingTimer = typingTimers.current.get(data.userId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
          typingTimers.current.delete(data.userId);
        }, TYPING_TIMEOUT);
        typingTimers.current.set(data.userId, timer);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("fallback");
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
      for (const timer of typingTimers.current.values()) {
        clearTimeout(timer);
      }
      typingTimers.current.clear();
      supabase.removeChannel(channel);
    };
  }, [roomId, refresh, currentUserId]);

  const sendMessageText = (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const result = await sendChatMessageAction({ roomId, body: text });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBody("");
      refresh();
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessageText(body);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(event.target.value);
    if (event.target.value.trim()) {
      broadcastTyping();
    }
  };

  // Alibaba signature: "Send" product reference card into the thread
  const handleSendProductCard = () => {
    if (!productContext || hasSentProductCard) return;

    let priceStr = "On Inquiry";
    if (productContext.minPrice !== null && productContext.maxPrice !== null) {
      if (productContext.minPrice === productContext.maxPrice) {
        priceStr = `${formatPrice(productContext.minPrice, locale)} / ${getLocalizedUnit(productContext.unit, locale)}`;
      } else {
        priceStr = `${formatPrice(productContext.minPrice, locale)} - ${formatPrice(productContext.maxPrice, locale)} / ${getLocalizedUnit(productContext.unit, locale)}`;
      }
    }

    const payload = JSON.stringify({
      listingId: productContext.listingId,
      productId: productContext.productId,
      title: productContext.title,
      price: priceStr,
      minOrder: `${productContext.minOrder} ${getLocalizedUnit(productContext.unit, locale)}`,
      location: productContext.location,
    });

    const cardMessage = `📦 [PRODUCT_CARD] ${payload}\n📦 [Product Inquiry] ${productContext.title}\n💰 Price: ${priceStr}\n📦 Min Order: ${productContext.minOrder} ${productContext.unit}\n📍 Depot: ${productContext.location}\n🔗 /buyer/catalog/${productContext.listingId}`;

    sendMessageText(cardMessage);
    setHasSentProductCard(true);
  };

  const handleQuickReply = (text: string) => {
    setBody(text);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(text.length, text.length);
    }, 50);
  };

  const handleSendFreightInquiry = () => {
    const truckLabel =
      logisticsTruck === "sino"
        ? "Sino-Truck 40-Ton Tipper/Trailer"
        : logisticsTruck === "fsr"
          ? "Isuzu FSR (7–8 Tons)"
          : "Isuzu NPR (3.5–5 Tons)";

    const origin = productContext?.location || counterpart?.address || "Supplier Depot";
    const msg = `🚚 [Logistics Request] Freight quotation needed:\n• Origin: ${origin}\n• Destination: ${logisticsDestination}\n• Vehicle: ${truckLabel}\n• Material: ${productContext?.title ?? listingTitle ?? "Bulk materials"}`;

    sendMessageText(msg);
    setIsLogisticsModalOpen(false);
  };

  // Typing indicator text
  const typingNames = Array.from(typingUsers.values());
  const typingText =
    typingNames.length === 0
      ? null
      : typingNames.length === 1
        ? locale === "am"
          ? `${typingNames[0]} እየጻፈ ነው…`
          : `${typingNames[0]} is typing…`
        : locale === "am"
          ? `${typingNames.join(", ")} እየጻፉ ናቸው…`
          : `${typingNames.join(", ")} are typing…`;

  const title =
    type === "DIRECT"
      ? t("chat_type_direct", "Direct chat")
      : type === "BUYER_AGENT"
        ? t("chat_type_buyer_agent", "You ↔ Agent")
        : t("chat_type_seller_agent", "Supplier ↔ Agent");

  const displayName = counterpart?.companyName || counterpart?.name || counterpartName || title;

  // Format price range for the product context bar
  const priceRangeDisplay =
    productContext?.minPrice !== null && productContext?.maxPrice !== null && productContext?.minPrice !== undefined && productContext?.maxPrice !== undefined
      ? productContext.minPrice === productContext.maxPrice
        ? `${formatPrice(productContext.minPrice, locale)} / ${getLocalizedUnit(productContext.unit, locale)}`
        : `${formatPrice(productContext.minPrice, locale)} – ${formatPrice(productContext.maxPrice, locale)} / ${getLocalizedUnit(productContext.unit, locale)}`
      : "Pricing on Inquiry";

  return (
    <div
      className="flex min-h-[78vh] flex-col rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden"
      role="region"
      aria-label={`Chat with ${displayName}`}
    >
      {/* =====================================================================
          1. ALIBABA TOP HEADER
          ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with building/store icon */}
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 text-primary border border-border/60">
            {counterpart?.role === "FIELD_AGENT" ? (
              <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Building2 className="size-5 text-primary" />
            )}
            {/* Green Online Dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center"
              title={t("chat_online_live", "Online · Live")}
            >
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          </div>

          {/* Supplier details */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                {displayName}
              </h1>
              {counterpart?.isSubscribed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-3xs font-black uppercase text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Sparkles className="size-2.5" />
                  {counterpart.subscriptionTier || "PRO"}
                </span>
              ) : null}
              {counterpart?.isVerified ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="size-2.5" />
                  Verified
                </span>
              ) : null}
            </div>

            {/* Subtitle: Local Time indicator & Response time */}
            <div className="flex flex-wrap items-center gap-2 text-2xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1 font-mono text-muted-foreground">
                <Clock className="size-3" />
                <span>{localTime}</span>
                <span className="opacity-80">
                  {locale === "am" ? "የአገር ውስጥ ሰዓት (EAT)" : "local time (EAT)"}
                </span>
              </span>
              <span className="opacity-50">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ⚡ ~{counterpart?.responseTimeAvgMinutes ?? 30}m response
              </span>
            </div>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Realtime connection status badge */}
          <span
            className="flex items-center gap-1 text-2xs px-2 py-1 rounded-md bg-muted/60"
            title={
              realtimeStatus === "connected"
                ? "Live — messages arrive instantly"
                : realtimeStatus === "connecting"
                  ? "Connecting to live updates…"
                  : "Using polling (8-second refresh)"
            }
          >
            {realtimeStatus === "connected" ? (
              <>
                <Wifi className="size-3 text-emerald-500" />
                <span className="text-2xs text-emerald-600 dark:text-emerald-400 hidden sm:inline font-mono font-medium">
                  LIVE
                </span>
              </>
            ) : realtimeStatus === "connecting" ? (
              <Wifi className="size-3 animate-pulse text-muted-foreground" />
            ) : (
              <WifiOff className="size-3 text-amber-500" />
            )}
          </span>

          {ticket ? (
            <StatusBadge domain="dealTicket" status={ticket.status} locale={locale} />
          ) : (
            <StatusBadge domain="subscription" status="ACTIVE" locale={locale} size="sm" />
          )}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsEscrowModalOpen(true)}
            className="h-8 gap-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2"
            title="Econ Escrow Security Guarantee"
          >
            <ShieldCheck className="size-3.5" />
            <span className="hidden md:inline font-semibold">Escrow Protection</span>
          </Button>
        </div>
      </div>

      {/* =====================================================================
          2. PINNED TRUST & ESCROW PROTECTION BANNER
          ===================================================================== */}
      {showTrustBanner && (
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-4 py-2 border-b border-amber-500/20 text-xs">
          <div className="flex items-center gap-2 text-foreground/90 min-w-0">
            <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="truncate text-2xs sm:text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {t("chat_escrow_banner_title", "Econ Escrow & Buyer Protection")}:
              </span>{" "}
              {t(
                "chat_escrow_banner_desc",
                "Keep chats and transactions on Econ to enjoy verified depot inspection, escrow safety, and dispute resolution."
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEscrowModalOpen(true)}
              className="text-2xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              {t("chat_btn_how_escrow_works", "How Escrow Works")}
            </button>
            <button
              type="button"
              onClick={() => setShowTrustBanner(false)}
              className="text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Dismiss banner"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. MESSAGE STREAM WITH RICH PRODUCT CARDS
          ===================================================================== */}
      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4 bg-muted/15"
        role="log"
        aria-live="polite"
        aria-label={t("chat_messages_label", "Chat messages")}
      >
        {/* Empty state: Supplier Auto-Welcome Card */}
        {initialMessages.length === 0 ? (
          <div className="max-w-md mx-auto my-6 p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Store className="size-4" />
              <span>{t("chat_welcome_title", "Supplier Instant Desk")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "chat_welcome_body",
                "Hello! Welcome to our materials depot. We have this material ready in stock. Please let us know your required volume and delivery site in Ethiopia, or tap 'Send' below to attach your product inquiry."
              )}
            </p>
            {productContext && (
              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-2xs text-muted-foreground">
                <span>Material: {productContext.title}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendProductCard}
                  className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/5"
                >
                  <SendHorizontal className="size-3" />
                  {t("chat_send_product", "Send to chat")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          initialMessages.map((message) => {
            const cardInfo = parseProductCardMessage(message.body);

            return (
              <div
                key={message.id}
                className={cn("flex", message.mine ? "justify-end" : "justify-start")}
              >
                {/* Render interactive product card if message contains one */}
                {cardInfo.isProductCard ? (
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[420px] rounded-2xl border p-3 shadow-xs space-y-2.5",
                      message.mine
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card border-border"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 text-2xs">
                      <span className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Sparkles className="size-3" />
                        Material Inquiry Card
                      </span>
                      {cardInfo.location && (
                        <span className="text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="size-2.5" />
                          {cardInfo.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-12 shrink-0 rounded-lg bg-muted flex items-center justify-center border border-border/50 overflow-hidden text-muted-foreground">
                        <Building2 className="size-6 opacity-60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2">
                          {cardInfo.title || listingTitle || "Construction Material"}
                        </h4>
                        {cardInfo.price && (
                          <p className="text-xs font-mono font-extrabold text-primary mt-0.5">
                            {cardInfo.price}
                          </p>
                        )}
                        {cardInfo.minOrder && (
                          <p className="text-2xs text-muted-foreground">
                            Min. Order: {cardInfo.minOrder}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-2xs">
                      <span className="text-muted-foreground text-3xs">
                        {new Date(message.createdAt).toLocaleTimeString(
                          locale === "am" ? "am-ET" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                      {cardInfo.listingId ? (
                        <Link
                          href={`/buyer/catalog/${cardInfo.listingId}`}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
                        >
                          <span>View Specs</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  /* Normal message bubble */
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-2xs",
                      message.mine
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-card border border-border/70 text-foreground rounded-bl-xs"
                    )}
                  >
                    <p className="text-2xs font-semibold opacity-75 mb-0.5">
                      {message.senderName}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                      {message.body}
                    </p>
                    <p className="mt-1 text-right text-3xs opacity-60 font-mono">
                      {new Date(message.createdAt).toLocaleTimeString(
                        locale === "am" ? "am-ET" : "en-US",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex justify-start" aria-live="polite">
            <div className="flex items-center gap-2 rounded-2xl bg-card border border-border/60 px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
              <span className="inline-flex gap-1" aria-hidden="true">
                <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
              </span>
              <span className="italic">{typingText}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* =====================================================================
          4. ALIBABA FLOATING PRODUCT CONTEXT CARD (Pinned above actions & input)
          ===================================================================== */}
      {productContext && (
        <div className="border-t border-border/80 bg-muted/30 px-3 py-2 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Product Thumbnail */}
              <div className="size-11 shrink-0 rounded-lg bg-card border border-border/80 flex items-center justify-center overflow-hidden">
                <Building2 className="size-5 text-muted-foreground/70" />
              </div>

              {/* Title, Price, MOQ */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-foreground truncate max-w-[220px] sm:max-w-[400px]">
                    {productContext.title}
                  </h3>
                  {productContext.brand && (
                    <Badge variant="outline" className="text-3xs py-0 px-1 hidden sm:inline-flex">
                      {productContext.brand}
                    </Badge>
                  )}
                </div>
                {!isProductCardMinimized && (
                  <div className="flex flex-wrap items-center gap-2 text-2xs mt-0.5">
                    <span className="font-mono font-bold text-primary">
                      {priceRangeDisplay}
                    </span>
                    <span className="text-muted-foreground">
                      · Min. Order: {productContext.minOrder}{" "}
                      {getLocalizedUnit(productContext.unit, locale)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Alibaba Orange "Send" Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={handleSendProductCard}
                disabled={hasSentProductCard || isPending}
                className={cn(
                  "h-8 px-3 text-xs font-bold gap-1.5 shadow-xs transition-colors",
                  hasSentProductCard
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                )}
              >
                {hasSentProductCard ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>{t("chat_product_sent", "Sent ✓")}</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="size-3.5" />
                    <span>{t("chat_send_product", "Send")}</span>
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setIsProductCardMinimized((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground p-1"
                title={isProductCardMinimized ? "Expand product card" : "Minimize product card"}
              >
                {isProductCardMinimized ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. HORIZONTAL QUICK ACTIONS BAR (Alibaba 5 Shortcuts)
          ===================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/70 bg-card px-3 py-1.5 text-xs scrollbar-none">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsPurchaseRequestOpen(true)}
          className="h-7 shrink-0 text-2xs font-semibold gap-1 rounded-full border-border/80 hover:bg-muted"
        >
          <FileText className="size-3 text-primary" />
          <span>{t("chat_action_order_request", "Send order request")}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsPaymentModalOpen(true)}
          className="h-7 shrink-0 text-2xs font-semibold gap-1 rounded-full border-border/80 hover:bg-muted"
        >
          <CreditCard className="size-3 text-emerald-600 dark:text-emerald-400" />
          <span>{t("chat_action_payment_options", "Payment options")}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsLogisticsModalOpen(true)}
          className="h-7 shrink-0 text-2xs font-semibold gap-1 rounded-full border-border/80 hover:bg-muted"
        >
          <Truck className="size-3 text-amber-600 dark:text-amber-400" />
          <span>{t("chat_action_logistics", "Logistics Inquiry")}</span>
        </Button>

        {counterpart?.companyName && (
          <Link
            href={`/buyer/catalog?search=${encodeURIComponent(counterpart.companyName)}`}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border/80 bg-background px-2.5 text-2xs font-semibold hover:bg-muted text-foreground transition-colors"
          >
            <Store className="size-3 text-purple-600 dark:text-purple-400" />
            <span>{t("chat_action_supplier_depot", "Supplier depot")}</span>
          </Link>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsEscrowModalOpen(true)}
          className="h-7 shrink-0 text-2xs font-semibold gap-1 rounded-full border-border/80 hover:bg-muted text-muted-foreground"
        >
          <ShieldCheck className="size-3 text-amber-600 dark:text-amber-400" />
          <span>{t("chat_action_dispute", "Buyer Protection")}</span>
        </Button>
      </div>

      {/* =====================================================================
          6. CONTEXTUAL QUICK REPLY CHIPS
          ===================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/50 bg-muted/20 px-3 py-1.5 text-2xs scrollbar-none">
        <button
          type="button"
          onClick={() => handleQuickReply(t("chat_quick_reply_stock", "Is this available in stock?"))}
          className="shrink-0 rounded-full border border-border/60 bg-card px-2.5 py-1 font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/90"
        >
          📦 {t("chat_quick_reply_stock", "Available in stock?")}
        </button>
        <button
          type="button"
          onClick={() => handleQuickReply(t("chat_quick_reply_price", "What is the best price for bulk?"))}
          className="shrink-0 rounded-full border border-border/60 bg-card px-2.5 py-1 font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/90"
        >
          💰 {t("chat_quick_reply_price", "Best bulk price?")}
        </button>
        <button
          type="button"
          onClick={() => handleQuickReply(t("chat_quick_reply_delivery", "Can you deliver to Addis Ababa?"))}
          className="shrink-0 rounded-full border border-border/60 bg-card px-2.5 py-1 font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/90"
        >
          🚚 {t("chat_quick_reply_delivery", "Addis Ababa delivery?")}
        </button>
        <button
          type="button"
          onClick={() => handleQuickReply(t("chat_quick_reply_proforma", "Please send a proforma invoice"))}
          className="shrink-0 rounded-full border border-border/60 bg-card px-2.5 py-1 font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/90"
        >
          📄 {t("chat_quick_reply_proforma", "Request proforma")}
        </button>
        <button
          type="button"
          onClick={() => handleQuickReply(t("chat_quick_reply_vat", "Is official VAT receipt included?"))}
          className="shrink-0 rounded-full border border-border/60 bg-card px-2.5 py-1 font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/90"
        >
          🧾 {t("chat_quick_reply_vat", "VAT receipt included?")}
        </button>
        <button
          type="button"
          onClick={() => handleQuickReply(t("chat_quick_reply_inspect", "Can I inspect materials at the depot?"))}
          className="shrink-0 rounded-full border border-border/60 bg-card px-2.5 py-1 font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/90"
        >
          🏗️ {t("chat_quick_reply_inspect", "Inspect at depot?")}
        </button>
      </div>

      {/* =====================================================================
          7. COMPOSE INPUT BAR
          ===================================================================== */}
      <form onSubmit={handleSubmit} className="border-t border-border/80 bg-card p-3">
        {type !== "DIRECT" && (
          <p className="mb-2 text-2xs text-muted-foreground flex items-center gap-1">
            <Lock className="size-3 text-muted-foreground" />
            {t(
              "chat_mediated_hint",
              "Phone numbers and messaging handles are stripped from agent channels."
            )}
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={body}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t("chat_placeholder", "Write a message… (Ctrl+Enter to send)")}
            rows={2}
            maxLength={2000}
            aria-label={t("chat_input_label", "Message input")}
            aria-describedby={error ? "chat-error" : undefined}
            className="resize-none text-xs sm:text-sm bg-muted/20"
          />
          <Button
            type="submit"
            disabled={isPending || !body.trim()}
            className="shrink-0 h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
            aria-label={t("chat_send", "Send message")}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="size-4" aria-hidden="true" />
            )}
            <span className="ml-1 hidden sm:inline">{t("chat_send", "Send")}</span>
          </Button>
        </div>
        {error && (
          <p id="chat-error" role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <p className="mt-1 text-right text-3xs text-muted-foreground">
          {body.length}/2000
        </p>
      </form>

      {/* =====================================================================
          8. PURCHASE REQUEST MODAL (Triggered from Quick Actions)
          ===================================================================== */}
      {isPurchaseRequestOpen && productContext && (
        <PurchaseRequestModal
          isOpen={isPurchaseRequestOpen}
          onClose={() => setIsPurchaseRequestOpen(false)}
          listingId={productContext.listingId}
          productTitle={productContext.title}
          unit={productContext.unit}
          basePrice={productContext.minPrice ?? undefined}
          onSuccess={(_enquiryId, refCode) => {
            setIsPurchaseRequestOpen(false);
            sendMessageText(`📝 Verified Purchase Request submitted!\nReference: #${refCode}\nMaterial: ${productContext.title}`);
          }}
        />
      )}

      {/* =====================================================================
          9. PAYMENT OPTIONS MODAL
          ===================================================================== */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CreditCard className="size-5 text-emerald-600" />
              Verified Payment & Escrow Options
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official payment channels supported by Econ for Ethiopian materials transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {/* Escrow Guarantee Pill */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                <ShieldCheck className="size-4" />
                <span>Econ Escrow Security Guarantee</span>
              </div>
              <p className="text-2xs text-muted-foreground leading-relaxed">
                Payments remain locked in escrow until materials are physically inspected at the supplier yard or offloaded at your construction site.
              </p>
            </div>

            {/* Channels */}
            <div className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">1. Telebirr SuperApp / USSD</span>
                <Badge variant="outline" className="text-3xs font-mono">0911000000</Badge>
              </div>
              <p className="text-2xs text-muted-foreground">
                Instant merchant transfer with automated digital slip generation.
              </p>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">2. Commercial Bank of Ethiopia (CBE)</span>
                <Badge variant="outline" className="text-3xs font-mono">1000000000000</Badge>
              </div>
              <p className="text-2xs text-muted-foreground">
                Official CBE escrow account · Reference quote with room ID.
              </p>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">3. Cash / Transfer on Depot Pickup</span>
                <Badge variant="secondary" className="text-3xs">Ex-Works</Badge>
              </div>
              <p className="text-2xs text-muted-foreground">
                Inspect physical rebar or cement bundles at the yard before settling final balance.
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =====================================================================
          10. LOGISTICS INQUIRY MODAL
          ===================================================================== */}
      <Dialog open={isLogisticsModalOpen} onOpenChange={setIsLogisticsModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Truck className="size-5 text-amber-600" />
              Ethiopian Freight & Logistics Calculator
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Calculate estimated trucking rates and dispatch an official logistics request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="text-2xs font-semibold text-muted-foreground">Origin Depot</label>
              <div className="rounded-lg border bg-muted/40 p-2 text-xs font-mono text-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="size-3.5 text-primary" />
                <span>{productContext?.location || counterpart?.address || "Kality Heavy Freight Terminal, Addis Ababa"}</span>
              </div>
            </div>

            <div>
              <label className="text-2xs font-semibold text-muted-foreground">Delivery Site Sub-City</label>
              <select
                value={logisticsDestination}
                onChange={(e) => setLogisticsDestination(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-2 text-xs mt-1"
              >
                <option value="Addis Ababa - Bole / CMC">Addis Ababa — Bole / CMC / Ayat</option>
                <option value="Addis Ababa - Merkato / Piyassa">Addis Ababa — Merkato / Piyassa</option>
                <option value="Addis Ababa - Kality / Akaki">Addis Ababa — Kality / Akaki</option>
                <option value="Addis Ababa - Jemo / Betel">Addis Ababa — Jemo / Betel</option>
                <option value="Oromia - Dukem / Gelan Corridor">Oromia — Dukem / Gelan Corridor</option>
                <option value="Oromia - Bishoftu / Adama">Oromia — Bishoftu / Adama Highway</option>
                <option value="Regional Destination (Hawassa / Bahir Dar)">Regional Destination (Hawassa / Bahir Dar)</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-muted-foreground">Required Vehicle Class</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setLogisticsTruck("sino")}
                  className={cn(
                    "rounded-lg border p-2 text-center text-2xs transition-colors",
                    logisticsTruck === "sino"
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  Sino-Truck
                  <div className="text-3xs text-muted-foreground">40 Tons</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogisticsTruck("fsr")}
                  className={cn(
                    "rounded-lg border p-2 text-center text-2xs transition-colors",
                    logisticsTruck === "fsr"
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  Isuzu FSR
                  <div className="text-3xs text-muted-foreground">7–8 Tons</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLogisticsTruck("npr")}
                  className={cn(
                    "rounded-lg border p-2 text-center text-2xs transition-colors",
                    logisticsTruck === "npr"
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  Isuzu NPR
                  <div className="text-3xs text-muted-foreground">3.5–5 Tons</div>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-2xs text-muted-foreground">
              Estimated Freight Guide:{" "}
              <strong className="text-foreground font-mono">
                {logisticsTruck === "sino" ? "ETB 14,000 – 22,000" : logisticsTruck === "fsr" ? "ETB 7,500 – 12,000" : "ETB 5,000 – 8,500"}
              </strong>{" "}
              per trip (subject to offloading access & site crane feasibility).
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsLogisticsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendFreightInquiry} className="gap-1.5 font-bold">
              <SendHorizontal className="size-3.5" />
              Send Freight Request to Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =====================================================================
          11. ESCROW & BUYER PROTECTION MODAL
          ===================================================================== */}
      <Dialog open={isEscrowModalOpen} onOpenChange={setIsEscrowModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-600 dark:text-amber-400">
              <ShieldCheck className="size-5" />
              Econ Escrow & Buyer Protection Program
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Industrial-grade protection for commercial construction material procurement across Ethiopia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex gap-3 items-start">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                1
              </div>
              <div>
                <h5 className="font-bold text-foreground">Secure Payment Lock</h5>
                <p className="text-2xs text-muted-foreground">
                  Your funds are deposited into Econ Escrow (CBE / Telebirr). The supplier sees the verified payment and begins batch loading.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                2
              </div>
              <div>
                <h5 className="font-bold text-foreground">Physical Depot / Site Inspection</h5>
                <p className="text-2xs text-muted-foreground">
                  Materials are weighed and inspected (e.g. rebar rib profile, cement batch date). A local Econ field agent verifies the consignment.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                3
              </div>
              <div>
                <h5 className="font-bold text-foreground">Release Code Settlement</h5>
                <p className="text-2xs text-muted-foreground">
                  Only after you confirm receipt and test conformity, the release code is entered to disburse funds. If non-conforming, 100% refund is guaranteed.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setIsEscrowModalOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
