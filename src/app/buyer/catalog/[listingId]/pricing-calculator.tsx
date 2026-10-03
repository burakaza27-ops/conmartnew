// =============================================================================
// ConMart — Volume Pricing & Cost Estimator (Client Component)
// =============================================================================
// Interactive quantity estimator based strictly on supplier volume tiers.
// Previews exact unit price and material subtotal for the desired order volume.
// Does NOT issue invoices or store cart items; purchase requests are initiated
// via verified Purchase Enquiries or Direct/Mediated chat.
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedUnit } from "@/lib/i18n/translations";

interface PriceTier {
  id: string;
  minQty: number;
  maxQty: number;
  unitPrice: number;
}

interface PricingCalculatorProps {
  unitLabel: string;
  tiers: PriceTier[];
}

export function PricingCalculator({
  unitLabel,
  tiers,
}: PricingCalculatorProps) {
  const { t, locale } = useLanguage();
  const localizedUnit = getLocalizedUnit(unitLabel, locale);

  const [qty, setQty] = useState<string>("");

  const numericQty = parseInt(qty, 10);
  const isValidQty = !isNaN(numericQty) && numericQty > 0;

  // Find the matching tier for the current quantity
  const matchedTier = useMemo(() => {
    if (!isValidQty) return null;
    return (
      tiers.find((t) => numericQty >= t.minQty && numericQty <= t.maxQty) ??
      null
    );
  }, [numericQty, isValidQty, tiers]);

  // Subtotal for the estimated quantity
  const subtotal = useMemo(() => {
    if (!matchedTier || !isValidQty) return null;
    return numericQty * matchedTier.unitPrice;
  }, [numericQty, matchedTier, isValidQty]);

  // Find the nearest tier for guidance messaging
  const tierGuidance = useMemo(() => {
    if (!isValidQty || matchedTier) return null;
    const nearest = tiers.reduce<PriceTier | null>((best, tier) => {
      if (numericQty < tier.minQty) {
        if (!best || tier.minQty < best.minQty) return tier;
      }
      return best;
    }, null);
    return nearest;
  }, [numericQty, isValidQty, matchedTier, tiers]);

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="h-4 w-4 text-primary" />
          {t("calc_title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {tiers.length === 0 ? (
          <div className="py-2 text-center text-xs text-muted-foreground">
            {t("calc_no_tiers")}
          </div>
        ) : (
          <>
            {/* Quantity Input */}
            <div className="space-y-1.5">
              <Label htmlFor="calc-qty" className="text-xs">
                {t("calc_qty_label")} ({localizedUnit})
              </Label>
              <Input
                id="calc-qty"
                type="number"
                min={1}
                step={1}
                placeholder={`e.g., ${tiers[0]?.minQty ?? 100}`}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              {tierGuidance && isValidQty && (
                <p className="text-[11px] text-muted-foreground">
                  {t("calc_min_order")}{" "}
                  <span className="font-medium text-foreground">
                    {tierGuidance.minQty.toLocaleString()} {localizedUnit}
                  </span>{" "}
                  {t("calc_at")} {formatETB(tierGuidance.unitPrice, locale)}/{localizedUnit}
                </p>
              )}
              {isValidQty && !matchedTier && !tierGuidance && (
                <p className="text-[11px] text-destructive">
                  {t("calc_exceeds")}
                </p>
              )}
            </div>

            {/* Estimated Cost Breakdown */}
            {subtotal !== null && matchedTier && (
              <>
                <Separator />
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {numericQty.toLocaleString()} × {formatETB(matchedTier.unitPrice, locale)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatETB(subtotal, locale)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{locale === "am" ? "የአንዱ ዋጋ" : "Tier Unit Price"}</span>
                    <span>{formatETB(matchedTier.unitPrice, locale)} / {localizedUnit}</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
