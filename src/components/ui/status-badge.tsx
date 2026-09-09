import {
  AlertTriangleIcon,
  BanIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  HandCoinsIcon,
  PackageCheckIcon,
  PhoneCallIcon,
  ScaleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  SlidersHorizontalIcon,
  TruckIcon,
  UnlockIcon,
  WalletIcon,
  XCircleIcon,
  LockIcon,
  HandshakeIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/translations"

/**
 * The single place a domain status becomes a colour, an icon and a label.
 *
 * Statuses used to be styled inline wherever they were rendered, which drifted
 * exactly as you would expect: a disputed enquiry showed rose on the buyer
 * home page and amber on the buyer enquiries page, and the seller's view of
 * the same enquiry showed no badge at all. Colour here carries meaning, so it
 * has to mean the same thing on every screen.
 *
 * Tones map to the semantic tokens in `globals.css` rather than to raw Tailwind
 * palette classes, so both themes stay legible without per-site `dark:` hacks.
 */
type Tone = "neutral" | "success" | "warning" | "info" | "danger" | "brand"

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  info: "bg-info/12 text-info border-info/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  brand: "bg-primary/15 text-primary border-primary/30",
}

interface StatusMeta {
  tone: Tone
  icon: LucideIcon
  en: string
  am: string
}

/** Enquiry lifecycle, shown to buyers, suppliers and admins alike. */
const ENQUIRY_STATUS: Record<string, StatusMeta> = {
  PENDING: { tone: "warning", icon: ClockIcon, en: "Awaiting supplier", am: "አቅራቢን በመጠባበቅ ላይ" },
  ACCEPTED: { tone: "success", icon: UnlockIcon, en: "Contacts unlocked", am: "አድራሻ ተከፍቷል" },
  DECLINED: { tone: "neutral", icon: XCircleIcon, en: "Declined", am: "ተቀባይነት አላገኘም" },
  EXPIRED: { tone: "neutral", icon: ClockIcon, en: "Expired", am: "ጊዜው አልፎበታል" },
  COMPLETED: { tone: "success", icon: CheckCircle2Icon, en: "Deal completed", am: "ስምምነቱ ተጠናቋል" },
  FAILED: { tone: "danger", icon: AlertTriangleIcon, en: "Deal failed", am: "ስምምነቱ አልተሳካም" },
  DISPUTED: { tone: "danger", icon: ShieldAlertIcon, en: "Under mediation", am: "በክርክር ላይ" },
}

/** Proforma order lifecycle. */
const ORDER_STATUS: Record<string, StatusMeta> = {
  GENERATED: { tone: "neutral", icon: FileTextIcon, en: "Generated", am: "ተዘጋጅቷል" },
  CALL_RECEIVED: { tone: "info", icon: PhoneCallIcon, en: "Call received", am: "ጥሪ ደርሷል" },
  PROCURED: { tone: "info", icon: PackageCheckIcon, en: "Procured", am: "ተገዝቷል" },
  IN_TRANSIT: { tone: "warning", icon: TruckIcon, en: "In transit", am: "በመጓጓዝ ላይ" },
  DELIVERED: { tone: "success", icon: CheckCircle2Icon, en: "Delivered", am: "ደርሷል" },
  CANCELLED: { tone: "danger", icon: BanIcon, en: "Cancelled", am: "ተሰርዟል" },
}

/** Supplier compliance state. */
const VERIFICATION_STATUS: Record<string, StatusMeta> = {
  UNVERIFIED: { tone: "neutral", icon: ShieldXIcon, en: "Unverified", am: "ያልተረጋገጠ" },
  PENDING: { tone: "warning", icon: ClockIcon, en: "Pending review", am: "ግምገማ በመጠባበቅ ላይ" },
  VERIFIED: { tone: "success", icon: ShieldCheckIcon, en: "Verified", am: "የተረጋገጠ" },
  SUSPENDED: { tone: "danger", icon: BanIcon, en: "Suspended", am: "ታግዷል" },
}

/** Wallet ledger entry types. */
const WALLET_TX_TYPE: Record<string, StatusMeta> = {
  TOP_UP: { tone: "success", icon: WalletIcon, en: "Deposit", am: "ተቀማጭ" },
  UNLOCK_FEE: { tone: "warning", icon: UnlockIcon, en: "Unlock fee", am: "የመክፈቻ ክፍያ" },
  REFUND_CREDIT: { tone: "info", icon: HandCoinsIcon, en: "Refund credit", am: "የተመላሽ ክሬዲት" },
  ADJUSTMENT: { tone: "neutral", icon: SlidersHorizontalIcon, en: "Adjustment", am: "ማስተካከያ" },
}

/** Pending money movements awaiting an administrator. */
const TX_STATUS: Record<string, StatusMeta> = {
  PENDING: { tone: "warning", icon: ClockIcon, en: "Pending", am: "በመጠባበቅ ላይ" },
  COMPLETED: { tone: "success", icon: CheckCircle2Icon, en: "Completed", am: "ተጠናቋል" },
  FAILED: { tone: "danger", icon: XCircleIcon, en: "Failed", am: "አልተሳካም" },
}

/** Supplier chat subscription. */
const SUBSCRIPTION_STATUS: Record<string, StatusMeta> = {
  FREE: { tone: "warning", icon: LockIcon, en: "Free — agent routed", am: "ነጻ — በወኪል" },
  ACTIVE: { tone: "success", icon: UnlockIcon, en: "Subscribed — direct chat", am: "ደንበኛ — ቀጥተኛ ውይይት" },
}

/** Agent deal-ticket lifecycle. */
const DEAL_TICKET_STATUS: Record<string, StatusMeta> = {
  PENDING_AGENT: { tone: "warning", icon: ClockIcon, en: "Waiting for agent", am: "ወኪል በመጠባበቅ ላይ" },
  AGENT_ASSIGNED: { tone: "info", icon: HandshakeIcon, en: "Agent assigned", am: "ወኪል ተመድቧል" },
  IN_INSPECTION: { tone: "brand", icon: SearchIcon, en: "In inspection", am: "በምርመራ ላይ" },
  COMPLETED: { tone: "success", icon: CheckCircle2Icon, en: "Completed", am: "ተጠናቋል" },
  CANCELLED: { tone: "danger", icon: BanIcon, en: "Cancelled", am: "ተሰርዟል" },
}

const PAYOUT_STATUS: Record<string, StatusMeta> = {
  PENDING: { tone: "neutral", icon: ClockIcon, en: "Payout pending", am: "ክፍያ በመጠባበቅ ላይ" },
  DUE: { tone: "warning", icon: HandCoinsIcon, en: "Payout due", am: "የሚከፈል" },
  PAID: { tone: "success", icon: CheckCircle2Icon, en: "Paid", am: "ተከፍሏል" },
  VOID: { tone: "neutral", icon: BanIcon, en: "Void", am: "ተሰርዟል" },
}

/** Dispute mediation state. */
const DISPUTE_STATUS: Record<string, StatusMeta> = {
  OPEN: { tone: "danger", icon: ShieldAlertIcon, en: "Open", am: "ክፍት" },
  MEDIATING: { tone: "warning", icon: ScaleIcon, en: "Mediating", am: "በሽምግልና ላይ" },
  RESOLVED_SELLER_CREDIT: {
    tone: "success",
    icon: CheckCircle2Icon,
    en: "Resolved — credited",
    am: "ተፈቷል — ክሬዲት ተሰጥቷል",
  },
  RESOLVED_NO_REFUND: {
    tone: "neutral",
    icon: CheckCircle2Icon,
    en: "Resolved — no refund",
    am: "ተፈቷል — ተመላሽ የለም",
  },
  CLOSED: { tone: "neutral", icon: CheckCircle2Icon, en: "Closed", am: "ተዘግቷል" },
}

const REGISTRY = {
  enquiry: ENQUIRY_STATUS,
  order: ORDER_STATUS,
  verification: VERIFICATION_STATUS,
  walletTx: WALLET_TX_TYPE,
  txStatus: TX_STATUS,
  dispute: DISPUTE_STATUS,
  subscription: SUBSCRIPTION_STATUS,
  dealTicket: DEAL_TICKET_STATUS,
  payout: PAYOUT_STATUS,
} as const

export type StatusDomain = keyof typeof REGISTRY

const FALLBACK: StatusMeta = {
  tone: "neutral",
  icon: ClockIcon,
  en: "Unknown",
  am: "አይታወቅም",
}

/** Looks up a status without rendering, for callers that need only the tone or label. */
export function getStatusMeta(domain: StatusDomain, status: string): StatusMeta {
  return REGISTRY[domain][status] ?? FALLBACK
}

interface StatusBadgeProps extends Omit<React.ComponentProps<"span">, "children"> {
  domain: StatusDomain
  status: string
  locale?: Locale
  /** Renders the icon alone; the label stays available to screen readers. */
  iconOnly?: boolean
  size?: "sm" | "md"
}

export function StatusBadge({
  domain,
  status,
  locale = "en",
  iconOnly = false,
  size = "md",
  className,
  ...props
}: StatusBadgeProps) {
  const meta = getStatusMeta(domain, status)
  const Icon = meta.icon
  const label = locale === "am" ? meta.am : meta.en

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs",
        TONE_CLASS[meta.tone],
        className
      )}
      {...props}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")} aria-hidden="true" />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </span>
  )
}
