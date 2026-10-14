"use client";

// =============================================================================
// ECON — About Us & Platform Trust Center
// =============================================================================
// Publicly accessible bilingual showcase explaining ECON's mission,
// depot-direct wholesale procurement, prepaid contact-unlock model,
// 80% deal failure protection, and official Addis Ababa headquarters.
// =============================================================================

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Truck,
  RotateCcw,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  FileSpreadsheet,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export default function AboutPage() {
  const { t, locale } = useLanguage();
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  const pillars = [
    {
      icon: Building2,
      color: "text-primary bg-primary/10 border-primary/20",
      title: t("about_pillar_1_title"),
      desc: t("about_pillar_1_desc"),
    },
    {
      icon: Lock,
      color: "text-info bg-info/10 border-info/20",
      title: t("about_pillar_2_title"),
      desc: t("about_pillar_2_desc"),
    },
    {
      icon: RotateCcw,
      color: "text-success bg-success/10 border-success/20",
      title: t("about_pillar_3_title"),
      desc: t("about_pillar_3_desc"),
    },
    {
      icon: Truck,
      color: "text-info bg-info/10 border-info/20",
      title: t("about_pillar_4_title"),
      desc: t("about_pillar_4_desc"),
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      {/* --- Main Content --- */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/80 to-background py-16 sm:py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("about_hero_badge")}</span>
            </div>

            <h1 className="heading-display text-3xl text-foreground sm:text-5xl lg:text-6xl">
              {t("about_hero_title")}{" "}
              <span className="text-primary">{t("about_hero_highlight")}</span>
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t("about_hero_desc")}
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/buyer/category/all"
                className={cn(buttonVariants({ size: "lg" }), "px-6 font-bold shadow-sm")}
              >
                {t("about_cta_buyer_btn")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-6 font-semibold")}
              >
                {t("about_cta_seller_btn")}
              </Link>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 px-4 sm:px-6 border-b border-border/40 bg-card/20">
          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-12 items-center">
            <div className="md:col-span-5 space-y-4">
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-bold px-3 py-1">
                {t("about_mission_badge")}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t("about_mission_title")}
              </h2>
              <div className="h-1 w-16 bg-amber-500 rounded-full" />
            </div>

            <div className="md:col-span-7 bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xs">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t("about_mission_desc")}
              </p>
              <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-border/40 text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  100% Official VAT Invoicing
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Depot-Direct Wholesale Rates
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Zero Platform Buyer Commission
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Trust Pillars Grid */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t("about_pillars_title", "Our 4 Pillars of Integrity")}
              </h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                {locale === "am"
                  ? "የተገነባው ተቋራጮችን፣ አቅራቢዎችን እና ግንባታዎችን ከተለመዱ የገበያ ችግሮች ለመጠበቅ ነው"
                  : "Engineered specifically to solve trust, discovery, and lead qualification problems in Addis Ababa."}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <Card key={idx} className="border-border/60 bg-card hover:border-primary/40 transition-all hover:shadow-md">
                    <CardContent className="p-6 space-y-4">
                      <div className={cn("inline-flex p-3 rounded-xl border", pillar.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {pillar.desc}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Two-Sided Model: For Buyers & For Suppliers */}
        <section className="py-16 px-4 sm:px-6 bg-card/30 border-y border-border/40">
          <div className="mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t("about_model_title")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {locale === "am"
                  ? "ለገዢዎችና ለአቅራቢዎች ፍትሃዊ፣ ፈጣን እና ዋስትና ያለው ዲጂታል አሰራር"
                  : "A transparent and balanced ecosystem tailored for Ethiopian construction commercial trade."}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Buyer Card */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {t("about_model_buyers_title")}
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {locale === "am" ? "100% በነጻ ያለ ኮሚሽን" : "100% Free · 0% Buyer Commission"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      1
                    </div>
                    <p className="text-muted-foreground">{t("about_model_buyers_step1")}</p>
                  </div>
                  <div className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      2
                    </div>
                    <p className="text-muted-foreground">{t("about_model_buyers_step2")}</p>
                  </div>
                  <div className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      3
                    </div>
                    <p className="text-muted-foreground">{t("about_model_buyers_step3")}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/buyer/category/all"
                    className={cn(buttonVariants({ size: "sm" }), "w-full font-bold shadow-xs")}
                  >
                    {t("hero_btn_start_buying")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Seller Card */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {t("about_model_sellers_title")}
                    </h3>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {locale === "am" ? "የ80% ተመላሽ ዋስትና ያለው" : "Prepaid Wallet · 80% Refund Shield"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-bold text-blue-500">
                      1
                    </div>
                    <p className="text-muted-foreground">{t("about_model_sellers_step1")}</p>
                  </div>
                  <div className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-bold text-blue-500">
                      2
                    </div>
                    <p className="text-muted-foreground">{t("about_model_sellers_step2")}</p>
                  </div>
                  <div className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-bold text-blue-500">
                      3
                    </div>
                    <p className="text-muted-foreground">{t("about_model_sellers_step3")}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/register"
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full font-bold")}
                  >
                    {t("about_cta_seller_btn")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Physical Office & Contact Verification */}
        <section className="py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card p-6 sm:p-10 space-y-8 shadow-xs">
            <div className="space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 font-semibold text-xs">
                {locale === "am" ? "ህጋዊና የታመነ አድራሻ" : "Official Verification"}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                {t("about_contact_office_title")}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{locale === "am" ? "የቢሮ መገኛ" : "Physical Location"}</span>
                </div>
                <p className="text-muted-foreground pl-6 leading-relaxed">
                  {t("about_contact_address_line")}
                </p>
                <div className="flex items-center gap-2 font-bold text-foreground pt-3">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{locale === "am" ? "የስራ ሰዓት" : "Working Hours"}</span>
                </div>
                <p className="text-muted-foreground pl-6">
                  {t("about_contact_hours")}
                </p>
              </div>

              <div className="space-y-3 sm:border-l sm:border-border/60 sm:pl-6">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{t("about_contact_phone_title")}</span>
                </div>
                <div className="pl-6 space-y-2">
                  <a
                    href={`tel:${adminPhone.replace(/\s+/g, "")}`}
                    className="inline-block font-mono text-base font-extrabold text-foreground hover:text-primary transition-colors"
                  >
                    {adminPhone}
                  </a>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "የዕቃዎች ማረጋገጫ፣ የዋሌት ቶፕ-አፕ ወይም ማንኛውም አስተያየት ካለዎት በቀጥታ ይደውሉልን።"
                      : "For supplier depot verification, wallet CBE/Telebirr approvals, and direct contractor support."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-t border-border/50">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("about_cta_title")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {t("about_cta_desc")}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/buyer/category/all"
                className={cn(buttonVariants({ size: "lg" }), "font-bold shadow-md px-6")}
              >
                {t("about_cta_buyer_btn")}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "font-semibold px-6")}
              >
                {t("about_cta_seller_btn")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
