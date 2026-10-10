// =============================================================================
// ConMart — Agent Commission Ledger Client View
// =============================================================================
// Displays:
// 1. Total Earned, Total Pending/Due, and Total Paid commissions.
// 2. Weekly settlement guidance (Telebirr / CBE).
// 3. Complete transparent audit table of delivered leads and commission fees.
// =============================================================================

"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import { AgentCommissionStatus } from "@prisma/client";

export interface CommissionRecordItem {
  id: string;
  feeAmount: number;
  status: AgentCommissionStatus;
  notes?: string | null;
  recordedAt: string;
  settledAt?: string | null;
  guidedLead: {
    referenceCode: string;
    materialNeeded: string;
    areaLocation: string;
  };
}

interface CommissionViewProps {
  records: CommissionRecordItem[];
  totalEarned: number;
  totalDue: number;
  totalPaid: number;
}

export function CommissionView({
  records,
  totalEarned,
  totalDue,
  totalPaid,
}: CommissionViewProps) {
  const { locale } = useLanguage();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-primary" />
          {locale === "am" ? "የወኪል ኮሚሽን ሂሳብ" : "Agent Commission Ledger"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {locale === "am"
            ? "በኮንማርት በኩል በተሳካ ሁኔታ ላደረሷቸው ገዢዎች የሚከፈልዎ የኮሚሽን መዝገብ እና የክፍያ ታሪክ።"
            : "Transparent accounting ledger tracking fees earned from successfully delivered guided buyer visits."}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Earned */}
        <Card className="border-border/80 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {locale === "am" ? "ጠቅላላ የተገኘ" : "Total Earned"}
            </span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="font-mono text-3xl font-black text-foreground">
            {formatETB(totalEarned, locale)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {records.length} {locale === "am" ? "የተረከቡ መሪዎች" : "delivered leads"}
          </div>
        </Card>

        {/* Card 2: Due / Pending */}
        <Card className="border-amber-500/40 bg-amber-500/5 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {locale === "am" ? "የሚጠበቅ ክፍያ (Due)" : "Pending Payout"}
            </span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="font-mono text-3xl font-black text-amber-700 dark:text-amber-300">
            {formatETB(totalDue, locale)}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
            {locale === "am" ? "በዚህ ሳምንት የሚለቀቅ" : "Scheduled for Friday settlement"}
          </div>
        </Card>

        {/* Card 3: Paid Out */}
        <Card className="border-emerald-500/40 bg-emerald-500/5 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {locale === "am" ? "የተከፈለ" : "Settled / Paid"}
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {formatETB(totalPaid, locale)}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
            {locale === "am" ? "ወደ ቴሌብር የተላለፈ" : "Transferred to Telebirr"}
          </div>
        </Card>
      </div>

      {/* Settlement Note */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <p>
          {locale === "am"
            ? "የኮንማርት ኮሚሽን ክፍያዎች በየሳምንቱ አርብ ወደ ተመዘገበው የቴሌብር ወይም ሲቢኢ አካውንትዎ ይላካሉ።"
            : "Agent payouts are verified by ConMart accounting and disbursed every Friday directly to your registered Telebirr number."}
        </p>
      </div>

      {/* Ledger Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-border/40 p-4">
          <CardTitle className="text-sm font-bold text-foreground">
            {locale === "am" ? "የኮሚሽን ዝርዝር መዝገብ" : "Commission Records"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {locale === "am"
                ? "እስካሁን ምንም የተመዘገበ ኮሚሽን የለም።"
                : "No commission records yet. Claim and deliver leads to earn fees."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ማጣቀሻ ኮድ" : "Lead Code"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ቁሳቁስ / ቦታ" : "Material / Area"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ኮሚሽን" : "Fee (ETB)"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ሁኔታ" : "Payout Status"}</TableHead>
                    <TableHead className="text-xs font-semibold">{locale === "am" ? "ቀን" : "Date Recorded"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {r.guidedLead.referenceCode}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground block">
                          {r.guidedLead.materialNeeded}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {r.guidedLead.areaLocation}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {formatETB(r.feeAmount, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === AgentCommissionStatus.PAID ? "default" : "secondary"}
                          className={`text-[10px] font-semibold ${
                            r.status === AgentCommissionStatus.PAID
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.recordedAt).toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
