// =============================================================================
// ConMart — Supplier Leads & Performance Dashboard Card
// =============================================================================
// Implements the critical Supplier Dashboard requirement from Yakob Dan's brief:
// - Views (weekly and monthly)
// - Direct Call taps (weekly)
// - WhatsApp taps (weekly)
// - Directions / Map taps (weekly)
// - Agent-delivered leads (weekly)
// - Weekly interaction growth % (+X% trend badge)
// - Subscription status: Tier, days remaining, 1-click renew button
// =============================================================================

"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  PhoneCall,
  MessageCircle,
  MapPin,
  UserCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";
import type { SupplierLeadsDashboardSummary } from "@/lib/subscription/subscription-service";

interface SupplierLeadsDashboardCardProps {
  summary: SupplierLeadsDashboardSummary;
}

export function SupplierLeadsDashboardCard({ summary }: SupplierLeadsDashboardCardProps) {
  const { locale } = useLanguage();
  const isPositiveGrowth = summary.weeklyGrowthPercentage >= 0;

  return (
    <div className="space-y-4">
      {/* Top Banner: Subscription Status & Expiry Alert */}
      <Card
        className={`border overflow-hidden transition-all shadow-md ${
          summary.isExpired
            ? "border-destructive/60 bg-destructive/5"
            : summary.needsRenewalNotice
            ? "border-amber-500/60 bg-amber-500/5"
            : "border-primary/40 bg-gradient-to-r from-primary/10 via-card to-background"
        }`}
      >
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={`text-xs font-bold uppercase tracking-wider ${
                  summary.status === "ACTIVE"
                    ? "bg-emerald-600 text-white"
                    : summary.status === "PENDING_CONFIRMATION"
                    ? "bg-amber-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {summary.status === "ACTIVE" ? (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {locale === "am" ? "ንቁ ደንበኛ" : "Active Subscriber"}
                  </span>
                ) : summary.status === "PENDING_CONFIRMATION" ? (
                  locale === "am" ? "በማረጋገጥ ላይ" : "Pending Review"
                ) : (
                  locale === "am" ? "ያልነቃ / ያለቀ" : "Expired / Free"
                )}
              </Badge>

              <Badge variant="outline" className="font-mono text-xs font-semibold">
                Tier: {summary.tier}
              </Badge>

              {summary.status === "ACTIVE" && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {summary.daysRemaining} {locale === "am" ? "ቀናት ይቀራሉ" : "days remaining"}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {summary.status === "ACTIVE"
                ? locale === "am"
                  ? "የቀጥታ ስልክ ቁጥርዎ፣ ዋትሳፕዎ እና የመጋዘን አድራሻዎ በካታሎጉ ውስጥ ለገዢዎች ይታያሉ።"
                  : "Your direct phone, WhatsApp deep link, and yard address are visible to buyers across Ethiopia."
                : locale === "am"
                ? "የቀጥታ ስልክዎ ለገዢዎች ተደብቋል። በቀጥታ እንዲደውሉልዎ አሁን ደንበኝነትዎን ያድሱ!"
                : "Direct buyer calls are paused. Renew your subscription to display your phone and WhatsApp number."}
            </p>
          </div>

          <Link href="/seller/subscription">
            <Button
              size="sm"
              variant={summary.isExpired ? "destructive" : "default"}
              className="gap-2 font-bold shadow-xs shrink-0 w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4" />
              <span>{summary.status === "ACTIVE" ? (locale === "am" ? "ዕቅድ ማስተዳደር" : "Manage Subscription") : (locale === "am" ? "አሁን አድስ" : "Renew Subscription")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Leads & Analytics KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              {locale === "am" ? "የገዢዎች ፍላጎት እና ጥሪዎች (Leads Telemetry)" : "Buyer Leads & Direct Contacts"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {locale === "am"
                ? "በዚህ ሳምንት ገዢዎች በእርስዎ መጋዘን ላይ ያደረጓቸው የቀጥታ ግንኙነቶች"
                : "Real-time buyer interactions recorded on your depot and listings this week"}
            </p>
          </div>

          {/* Growth Trend Badge */}
          <Badge
            variant="outline"
            className={`font-mono text-xs font-bold gap-1 px-2.5 py-1 ${
              isPositiveGrowth
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
            }`}
          >
            {isPositiveGrowth ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>
              {isPositiveGrowth ? `+${summary.weeklyGrowthPercentage}%` : `${summary.weeklyGrowthPercentage}%`}{" "}
              {locale === "am" ? "ካለፈው ሳምንት ጋር" : "vs last week"}
            </span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Views */}
          <Card className="border-border/60 bg-card p-4 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">{locale === "am" ? "እይታዎች" : "Total Views"}</span>
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="font-mono text-2xl font-black text-foreground">
              {summary.weeklyViews}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {summary.monthlyViews} {locale === "am" ? "በዚህ ወር" : "this month"}
            </div>
          </Card>

          {/* Card 2: Direct Calls */}
          <Card className="border-border/60 bg-card p-4 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">{locale === "am" ? "የስልክ ጥሪዎች" : "Phone Calls"}</span>
              <PhoneCall className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="font-mono text-2xl font-black text-foreground">
              {summary.weeklyCallClicks}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {locale === "am" ? "በዚህ ሳምንት የተደወሉ" : "taps on 'Call Supplier'"}
            </div>
          </Card>

          {/* Card 3: WhatsApp Inquiries */}
          <Card className="border-border/60 bg-card p-4 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">WhatsApp</span>
              <MessageCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="font-mono text-2xl font-black text-foreground">
              {summary.weeklyWhatsAppClicks}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {locale === "am" ? "የዋትሳፕ መልዕክቶች" : "taps on WhatsApp"}
            </div>
          </Card>

          {/* Card 4: Directions */}
          <Card className="border-border/60 bg-card p-4 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">{locale === "am" ? "አድራሻ / ካርታ" : "Get Directions"}</span>
              <MapPin className="h-4 w-4 text-amber-500" />
            </div>
            <div className="font-mono text-2xl font-black text-foreground">
              {summary.weeklyDirectionsClicks}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {locale === "am" ? "የመጋዘን አድራሻ እይታ" : "taps on Map"}
            </div>
          </Card>

          {/* Card 5: Agent Delivered */}
          <Card className="border-border/60 bg-card p-4 space-y-1.5 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">{locale === "am" ? "በወኪል የመጡ" : "Agent Leads"}</span>
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="font-mono text-2xl font-black text-foreground">
              {summary.weeklyAgentDeliveredLeads}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {locale === "am" ? "በኮንማርት ወኪሎች የተመሩ" : "guided buyer visits"}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
