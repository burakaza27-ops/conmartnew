"use client";

// =============================================================================
// ECON — About Us, Platform Governance & Trust Center
// =============================================================================
// Comprehensive overview requested by client (Yakob Dan Review):
// 1. Vision & Mission
// 2. Clear System Workflow / User's Guide (Buyers, Suppliers, Field Agents)
// 3. Rights and Responsibilities Matrix (Buyers & Suppliers)
// 4. Terms and Conditions (Governed under Ethiopian Commercial Code & E-Commerce Proclamation)
// 5. Legal Disclaimer & Limitation of Liability (Placed at bottom as ordered to prevent trust issues, while providing complete legal shield for system owner)
// 6. Interactive "I Agree to These Terms" button with persistent state
// =============================================================================

import React, { useState, useEffect } from "react";
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
  Lock,
  Sparkles,
  ShieldAlert,
  Scale,
  FileText,
  Check,
  AlertTriangle,
  UserCheck,
  HardHat,
  Store,
  ShieldCheck,
} from "lucide-react";

import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export default function AboutPage() {
  const { t, locale } = useLanguage();
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  // Active guide tab: 'buyer' | 'supplier' | 'agent'
  const [guideTab, setGuideTab] = useState<"buyer" | "supplier" | "agent">("buyer");

  // Interactive Agreement State (initialized lazily from localStorage to avoid effect cascades)
  const [agreed, setAgreed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("econ_terms_agreed_v2");
      return stored ? Boolean(JSON.parse(stored).agreed) : false;
    } catch {
      return false;
    }
  });

  const [agreedAt, setAgreedAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("econ_terms_agreed_v2");
      return stored ? JSON.parse(stored).timestamp || null : null;
    } catch {
      return null;
    }
  });

  const handleToggleAgree = () => {
    const nextState = !agreed;
    const now = new Date().toLocaleString(locale === "am" ? "am-ET" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    setAgreed(nextState);
    setAgreedAt(nextState ? now : null);

    try {
      if (nextState) {
        localStorage.setItem(
          "econ_terms_agreed_v2",
          JSON.stringify({ agreed: true, timestamp: now, version: "2.4" })
        );
      } else {
        localStorage.removeItem("econ_terms_agreed_v2");
      }
    } catch {
      // Fallback
    }
  };

  const pillars = [
    {
      icon: Building2,
      color: "text-primary bg-primary/10 border-primary/20",
      title: locale === "am" ? "የተረጋገጡ አቅራቢዎች" : "Verified Depot Network",
      desc:
        locale === "am"
          ? "ሁሉም የተመዘገቡ አቅራቢዎች የንግድ ፈቃዳቸውና የመጋዘን ህልውናቸው በአስተዳዳሪው በአካል የተረጋገጠ ነው።"
          : "Every supplier profile is audited for active business licenses, TIN certificates, and depot yard legitimacy before activation.",
    },
    {
      icon: Lock,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      title: locale === "am" ? "100% ህጋዊ የቫት ደረሰኝ" : "Official 15% VAT Invoicing",
      desc:
        locale === "am"
          ? "ከደላሎች አሰራር ውጭ በመውጣት ለግንባታ ፕሮጀክትዎ ህጋዊ የግብር እና የሂሳብ ሰነድ በቀጥታ ያግኙ።"
          : "Procure directly from registered taxpayers and receive certified commercial proformas and VAT sales invoices.",
    },
    {
      icon: RotateCcw,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      title: locale === "am" ? "የዋጋ ግልጽነትና እርከኖች" : "Transparent Volume Tiers",
      desc:
        locale === "am"
          ? "የብረት ዲያሜትር (8-20ሚሜ)፣ የሲሚንቶ አይነቶች እና የጅምላ ዋጋ እርከኖች ያለምንም መደበቅ በግልጽ ይታያሉ።"
          : "Real-time depot pricing across steel bars, cement grades, and finishing materials with tiered discounts for bulk orders.",
    },
    {
      icon: Truck,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      title: locale === "am" ? "የሜዳ ኤጀንት ድጋፍ" : "On-Ground Agent Support",
      desc:
        locale === "am"
          ? "የጣቢያ መሐንዲሶችና ገዢዎች በመጋዘኑ ያሉ እቃዎችን እንዲያረጋግጡ እና ጭነት እንዲያቀናጁ ድጋፍ ይሰጣሉ።"
          : "Local field agents verify physical stock at depots and coordinate seamless transport loading to project sites.",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 space-y-16 sm:space-y-24 pb-20">
        {/* =============================================================== */}
        {/* HERO SECTION                                                    */}
        {/* =============================================================== */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/90 via-background to-background py-16 sm:py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {locale === "am"
                  ? "የኢኮን መድረክ መመሪያ እና ህጋዊ ስምምነት"
                  : "Platform Guide, Governance & Legal Framework"}
              </span>
            </div>

            <h1 className="heading-display text-3xl sm:text-5xl lg:text-6xl text-foreground font-extrabold tracking-tight">
              {locale === "am" ? (
                <>
                  የኢትዮጵያ ግንባታ እቃዎች ንግድን በቴክኖሎጂ{" "}
                  <span className="text-primary">የማዘመን ራዕይ</span>
                </>
              ) : (
                <>
                  Modernizing Ethiopian Construction Procurement Through{" "}
                  <span className="text-primary">Transparency & Trust</span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {locale === "am"
                ? "ኢኮን (Econ) ተቋራጮችን፣ ኢንጂነሮችን እና ግንበኞችን ከአዲስ አበባ እና ከክልል መጋዘኖች፣ ፋብሪካዎችና አስመጪዎች ጋር በቀጥታ የሚያገናኝ ዘመናዊ የB2B መድረክ ነው።"
                : "Econ is Ethiopia's dedicated B2B construction marketplace connecting contractors, developers, and builders directly with verified factories, steel mills, and depot distributors across Addis Ababa."}
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/buyer/category/all"
                className={cn(buttonVariants({ size: "lg" }), "px-6 font-bold shadow-sm")}
              >
                {locale === "am" ? "የዕቃዎችን ካታሎግ ይመልከቱ" : "Browse Material Catalog"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "px-6 font-semibold"
                )}
              >
                {locale === "am" ? "እንደ አቅራቢ ይመዝገቡ" : "Register as Supplier"}
              </Link>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 1. VISION & MISSION                                             */}
        {/* =============================================================== */}
        <section className="px-4 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold px-3 py-1">
                {locale === "am" ? "1. ራዕይ እና ተልዕኮ" : "1. Vision & Mission"}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {locale === "am"
                  ? "ለምን ኢኮን ተፈጠረ? አላማችን ምንድን ነው?"
                  : "Why Econ Exists: Our Purpose & Core Mission"}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Vision Card */}
              <Card className="border border-border/80 bg-card shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold border border-amber-500/20">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {locale === "am" ? "የወደፊት ራዕይ" : "Our Vision"}
                      </span>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {locale === "am" ? "ግልጽና ደረጃውን የጠበቀ የግንባታ ገበያ" : "A Standardized Construction Marketplace"}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p>
                    {locale === "am"
                      ? "በኢትዮጵያ ግንባታ ዘርፍ ውስጥ ለረጅም ዓመታት የቆየውን ህገወጥ የደላሎች ጣልቃ-ገብነት፣ የዋጋ ንረት፣ ሀሰተኛ የብረት ዲያሜትር መግለጫ እና የጥራት ጉድለትን በዘመናዊ ዲጂታል ቴክኖሎጂ ሙሉ በሙሉ ማስወገድ።"
                      : "To eliminate informal broker cartels, speculative price gouging, fake steel specifications, and supply chain bottlenecks through a transparent digital marketplace serving projects across Ethiopia."}
                  </p>
                  <p>
                    {locale === "am"
                      ? "ማንኛውም ተቋራጭ ወይም የቤት ሰሪ ትክክለኛውን ፋብሪካ፣ ትክክለኛውን መጋዘንና የገበያ ዋጋ በሰከንዶች ውስጥ አግኝቶ ያለምንም ማጭበርበር ፕሮጀክቱን እንዲያጠናቅቅ ማስቻል ነው።"
                      : "We envision an Ethiopian construction ecosystem where contractors of every tier procure verified materials with complete price transparency, official tax documentation, and guaranteed standard compliance."}
                  </p>
                </CardContent>
              </Card>

              {/* Mission Card */}
              <Card className="border border-border/80 bg-card shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold border border-blue-500/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {locale === "am" ? "ተልዕኮ" : "Our Mission"}
                      </span>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {locale === "am" ? "ቀጥታ የመጋዘን ግንኙነትና የታመነ መረጃ" : "Direct Depot Connectivity & Reliable Data"}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p>
                    {locale === "am"
                      ? "ህጋዊ ፍቃድ ያላቸውን የብረት፣ የሲሚንቶ፣ የቀለም፣ የሴራሚክ እና የጣሪያ ቆርቆሮ አቅራቢዎች መጋዘናቸውን በአካል በማረጋገጥ በካታሎግ ማሰባሰብ እና ለገዢዎች ግልጽ የሆነ የጅምላ ዋጋ እርከን ማቅረብ።"
                      : "To systematically catalog verified suppliers, warehouses, and factories across Addis Ababa, publishing real-time stock levels, genuine technical specifications, and official volume-discount proformas."}
                  </p>
                  <p>
                    {locale === "am"
                      ? "ገዢዎች ከመክፈላቸው በፊት በአካል ሄደው እንዲያረጋግጡ የሚያስችል አድራሻና የሜዳ ኤጀንት ድጋፍ በመስጠት ደህንነቱ የተጠበቀ የንግድ ልውውጥ መፍጠር።"
                      : "To empower contractors with physical inspection tools, GPS depot locators, and verified merchant credentials, safeguarding builders from fraud, ghost inventory, and delivery defaults."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 4 Pillars of Integrity Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <Card key={idx} className="border-border/60 bg-card/60 hover:border-primary/40 transition-all hover:shadow-xs">
                    <CardContent className="p-4 space-y-2.5">
                      <div className={cn("inline-flex p-2 rounded-lg border", pillar.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-foreground">
                        {pillar.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {pillar.desc}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 2. CLEAR WORK FLOW / USER'S GUIDE                               */}
        {/* =============================================================== */}
        <section className="py-16 px-4 sm:px-6 bg-card/40 border-y border-border/50">
          <div className="mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-3">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold px-3 py-1">
                {locale === "am" ? "2. የስርዓቱ አሰራር መመሪያ" : "2. System Workflow & User Guide"}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {locale === "am" ? "ኢኮን እንዴት ይሰራል? (ደረጃ በደረጃ)" : "How Econ Works: Step-by-Step Guide"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                {locale === "am"
                  ? "ለገዢዎች፣ ለአቅራቢዎች እና ለሜዳ ኤጀንቶች የተዘጋጀ ቀላልና ግልጽ ዲጂታል አሰራር"
                  : "Transparent, role-tailored operational workflows built for Ethiopian construction commerce."}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 rounded-xl bg-muted/80 border border-border/60 gap-1">
                <button
                  type="button"
                  onClick={() => setGuideTab("buyer")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    guideTab === "buyer"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HardHat className="h-3.5 w-3.5 text-amber-500" />
                  <span>{locale === "am" ? "ለገዢዎችና ተቋራጮች" : "For Buyers & Contractors"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab("supplier")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    guideTab === "supplier"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Store className="h-3.5 w-3.5 text-blue-500" />
                  <span>{locale === "am" ? "ለአቅራቢዎችና መጋዘኖች" : "For Suppliers & Depots"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab("agent")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    guideTab === "agent"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{locale === "am" ? "ለሜዳ ኤጀንቶች" : "For Field Agents"}</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: BUYER */}
            {guideTab === "buyer" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-200">
                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 font-extrabold flex items-center justify-center text-sm border border-amber-500/20">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "ዕቃዎችን ይፈልጉና ያወዳድሩ" : "1. Search & Compare"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "የብረት ዲያሜትር (6-32ሚሜ)፣ የሲሚንቶ አይነቶች (OPC/PPC) እና ሌሎች እቃዎችን በዋጋ እርከን ያወዳድሩ።"
                      : "Browse real-time depot prices across rebar diameters, cement grades, and finishing materials."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 font-extrabold flex items-center justify-center text-sm border border-amber-500/20">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "ፕሮፎርማ ያውጡ / አድራሻ ያግኙ" : "2. Request Proforma / Contact"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "15% ቫት ያካተተ ህጋዊ ፕሮፎርማ ያውጡ ወይም የአቅራቢውን ስልክና ትክክለኛ የመጋዘን አድራሻ ይክፈቱ።"
                      : "Generate an official VAT proforma invoice or unlock the supplier's verified phone and physical depot location."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3 border-amber-500/40 bg-amber-500/5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 text-white font-extrabold flex items-center justify-center text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
                    <span>{locale === "am" ? "መጋዘን ሄደው በአካል ያረጋግጡ" : "3. Physical Depot Inspection"}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "ክፍያ ከመፈጸምዎ በፊት የግድ ወደ አቅራቢው መጋዘን በመሄድ የዕቃውን ጥራት፣ ዲያሜትርና መኖሩን በአካል ያረጋግጡ!"
                      : "Crucial Step: Physically inspect material specs, steel grade, gauge, and inventory in the supplier's yard before releasing payment."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-sm border border-emerald-500/20">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "ይክፈሉና ዕቃዎን ይረከቡ" : "4. Settle & Fulfill"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "በአቅራቢው ህጋዊ የባንክ አካውንት ይክፈሉ፣ ህጋዊ ደረሰኝዎን ይቀበሉ እና የጭነት ትራንስፖርት ያስተባብሩ።"
                      : "Pay directly to the verified supplier's business bank account, receive your certified VAT receipt, and coordinate delivery."}
                  </p>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: SUPPLIER */}
            {guideTab === "supplier" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-200">
                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 font-extrabold flex items-center justify-center text-sm border border-blue-500/20">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "በህጋዊ ሰነድ ይመዝገቡ" : "1. Register Business"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "የኩባንያዎን ስም፣ የግብር ከፋይ መለያ ቁጥር (TIN)፣ የንግድ ፈቃድ እና የመጋዘን ቦታዎን ያስገቡ።"
                      : "Submit your official company details, TIN number, valid trade license, and warehouse location."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3 border-blue-500/40 bg-blue-500/5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 text-white font-extrabold flex items-center justify-center text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "የአስተዳዳሪ ማረጋገጫ ይጠብቁ" : "2. Admin Approval Gate"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "የተመዘገቡ አቅራቢዎች በEcon አስተዳዳሪ ተገምግመው ህጋዊነታቸው እስኪረጋገጥ ድረስ እቃዎችን መለጠፍ አይችሉም።"
                      : "Our compliance team reviews trade credentials to ensure buyers only interact with legally operating merchants."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 font-extrabold flex items-center justify-center text-sm border border-blue-500/20">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "እቃዎችን በባች ይለጥፉ" : "3. Post Custom Inventory"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "ያለዎትን ክምችት፣ ብራንድ (አቢሲኒያ፣ ኬብሮን፣ ዳንጎቴ)፣ ዲያሜትር፣ ደረጃና የጅምላ ዋጋ በነጻነት ያስገቡ።"
                      : "Enter custom material titles, brands, steel specifications, and volume pricing tiers directly."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-sm border border-emerald-500/20">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "እውነተኛ ገዢዎችን ያግኙ" : "4. Close Direct Sales"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "ከደላላ ነጻ ሆነው ትክክለኛ ተቋራጮችን በቀጥታ በማነጋገር ግብይትዎን በፍጥነት ያጠናቅቁ።"
                      : "Receive direct buyer calls and proforma requests from active construction sites ready to purchase."}
                  </p>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: AGENT */}
            {guideTab === "agent" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-200">
                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-sm border border-emerald-500/20">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "ማን ኤጀንት መሆን ይችላል?" : "1. Who Can Register?"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "በገበያ ቦታዎች (መገናኛ፣ ጎተራ፣ ቃሊቲ፣ አያት፣ ለቡ ወዘተ) የሚሰሩ ደላሎች፣ ሹፌሮች (አይሱዙ/ፒክአፕ)፣ ጫኝና አውራጆች ወይም ማንኛውም በገበያው ያለ ሰው መመዝገብ ይችላል።"
                      : "Local brokers (ደላላ), truck/pickup drivers (አሽከርካሪዎች), loading crews, and on-ground market locators stationed at key building trade hubs."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-sm border border-emerald-500/20">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "የአቅራቢዎችን ሱቅ ማሳየት" : "2. Show Supplier Shops"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "የኤጀንት ዋነኛ ስራ በሲስተሙ ላልተመዘገቡ ወይም ኦንላይን ላልገቡ የአካባቢ አቅራቢዎች ደንበኞችን በአካል ሱቃቸውና መጋዘናቸው ድረስ ወስዶ ማሳየት ነው።"
                      : "An agent personally guides buyers to physical material suppliers' shops and yards — especially for suppliers who are not subscribed on the online system."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3 border-emerald-500/30 bg-emerald-500/5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "ክፍያ ከአቅራቢው ብቻ (0 ETB)" : "3. Paid by Suppliers Only"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "ኤጀንቱ ኮሚሽኑን የሚያገኘው ከአቅራቢው ብቻ ነው። ገዢው ለኤጀንቱ ምንም አይነት ተጨማሪ ክፍያ አይከፍልም (0 ETB)።"
                      : "The agent is compensated strictly by the material suppliers. Buyers pay ZERO additional commission or service fees to the agent."}
                  </p>
                </Card>

                <Card className="border-border/70 bg-card p-5 space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-sm border border-emerald-500/20">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === "am" ? "በአካል ማረጋገጥና መተማመን" : "4. Physical Inspection First"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "am"
                      ? "ኤጀንቱ የቀበሌ መታወቂያው የተረጋገጠ ነው። ገዢው ዕቃውን መጋዘን ውስጥ በአካል አይቶ ሳያረጋግጥ ምንም ክፍያ ለአቅራቢውም አይሰጥም።"
                      : "All agents are vetted with Kebele IDs. The buyer physically inspects materials at the depot before settling payment directly with the merchant."}
                  </p>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* =============================================================== */}
        {/* 3. RIGHTS AND RESPONSIBILITIES MATRIX                           */}
        {/* =============================================================== */}
        <section className="px-4 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold px-3 py-1">
                {locale === "am" ? "3. መብትና ግዴታ" : "3. Rights & Responsibilities"}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {locale === "am"
                  ? "የገዢዎች እና የአቅራቢዎች ህጋዊ መብትና ግዴታ"
                  : "Buyer & Supplier Rights and Responsibilities"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                {locale === "am"
                  ? "በኢኮን መድረክ ላይ ግብይት ሲፈጽሙ በግልጽ የተቀመጡ የሁለቱም ወገኖች ህጋዊ ድንጋጌዎች"
                  : "Clearly defined mutual obligations ensuring fairness, accountability, and ethical commerce."}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Buyer Matrix Card */}
              <Card className="border border-border/80 bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base font-bold text-foreground">
                      {locale === "am" ? "የገዢዎች / ተቋራጮች መብትና ግዴታ" : "Buyers & Contractors"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5 text-xs sm:text-sm">
                  {/* Buyer Rights */}
                  <div className="space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>{locale === "am" ? "የገዢ መብቶች (Buyer Rights)" : "Buyer Rights"}</span>
                    </p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                      <li>
                        {locale === "am"
                          ? "ክፍያ ከመፈጸምዎ በፊት ወደ አቅራቢው መጋዘን በአካል ሄደው ዕቃውን የመፈተሽ ሙሉ መብት።"
                          : "Right to physically inspect materials at the depot yard before making payment."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "የብረቱን ትክክለኛ ዲያሜትር፣ የጥራት ማረጋገጫ (Mill Test) እና የኢትዮጵያ ደረጃዎች ኤጀንሲ ሰነድ የመጠየቅ መብት።"
                          : "Right to demand verified steel mill test certificates and ESA standards compliance."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "ለተፈጸመው ማንኛውም ግብይት ህጋዊ የ15% ቫት (VAT) ደረሰኝ ከአቅራቢው የመቀበል መብት።"
                          : "Right to receive an official certified 15% VAT sales invoice from registered merchants."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "ሀሰተኛ መረጃ የለጠፈ ወይም የማይገኝ አቅራቢን ለኢኮን አስተዳዳሪ ሪፖርት የማድረግ መብት።"
                          : "Right to report unverified, unresponsive, or misrepresenting vendors to platform administrators."}
                      </li>
                    </ul>
                  </div>

                  {/* Buyer Responsibilities */}
                  <div className="space-y-2 border-t border-border/40 pt-4">
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{locale === "am" ? "የገዢ ግዴታዎች (Buyer Duties)" : "Buyer Responsibilities"}</span>
                    </p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                      <li className="font-semibold text-foreground">
                        {locale === "am"
                          ? "ዕቃውንና መጋዘኑን በአካል ሳያረጋግጡ በስልክ ወይም በኦንላይን ምንም አይነት ቅድመ-ክፍያ ያለመስጠት ጥብቅ ግዴታ።"
                          : "Strict duty to physically visit the depot and verify inventory existence BEFORE transferring money."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "የባንክ ክፍያ ሲፈጽሙ ገንዘቡ የሚገባበት አካውንት የአቅራቢው ህጋዊ ድርጅት ስም መሆኑን የማረጋገጥ ግዴታ።"
                          : "Duty to verify that supplier bank accounts match the legally registered company name."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "የተረከቡትን ዕቃ የጭነትና የማውረድ ደንቦችን በአግባቡ የማክበር ግዴታ።"
                          : "Duty to respect agreed loading bay, safety protocols, and dispatch terms."}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Matrix Card */}
              <Card className="border border-border/80 bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 bg-blue-500/5">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base font-bold text-foreground">
                      {locale === "am" ? "የአቅራቢዎች / መጋዘኖች መብትና ግዴታ" : "Suppliers & Material Depots"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5 text-xs sm:text-sm">
                  {/* Supplier Rights */}
                  <div className="space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>{locale === "am" ? "የአቅራቢ መብቶች (Supplier Rights)" : "Supplier Rights"}</span>
                    </p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                      <li>
                        {locale === "am"
                          ? "የእቃዎቻቸውን የጅምላ ዋጋ፣ የዋጋ እርከን እና የክፍያ ሁኔታ በነጻነት የመወሰን መብት።"
                          : "Right to set commercial wholesale prices, volume discount tiers, and payment modalities."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "አጠራጣሪ ወይም ህገወጥ የሚመስሉ የግዢ ትዕዛዞችን ያለመቀበል መብት።"
                          : "Right to decline suspicious, fraudulent, or unverified purchase orders."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "ከኢኮን ድጋፍ ሰጪ ቡድን ፈጣን የቴክኒክና የሽምግልና ድጋፍ የማግኘት መብት።"
                          : "Right to receive prompt platform dispute mediation and technical store assistance."}
                      </li>
                    </ul>
                  </div>

                  {/* Supplier Responsibilities */}
                  <div className="space-y-2 border-t border-border/40 pt-4">
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{locale === "am" ? "የአቅራቢ ግዴታዎች (Supplier Duties)" : "Supplier Responsibilities"}</span>
                    </p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                      <li className="font-semibold text-foreground">
                        {locale === "am"
                          ? "በመጋዘን ውስጥ በእርግጥ ያለ እና ደረጃውን የጠበቀ እውነተኛ የግንባታ እቃ ብቻ የመዘርዘር ግዴታ።"
                          : "Duty to list only genuine, verified construction goods actually present in the depot."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "የብረቱን ዲያሜትር (ለምሳሌ፡ 16ሚሜ ተብሎ 14ሚሜ) አለማዛባት እና ትክክለኛውን ግሬድ (Grade 60/75) የመግለጽ ግዴታ።"
                          : "Strict prohibition against misrepresenting steel diameter (e.g. 14mm as 16mm) or alloy grades."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "ክፍያ ከተቀበሉ በኋላ ያለምንም ማመንታት እቃውን በስምምነቱ መሰረት የማስረከብ ጥብቅ ህጋዊ ግዴታ።"
                          : "Strict legal obligation to fulfill orders and release cargo immediately upon verified payment."}
                      </li>
                      <li>
                        {locale === "am"
                          ? "ህጋዊ የታደሰ የንግድ ፈቃድና የግብር ከፋይ መለያ (TIN) ይዞ የመገኘት ግዴታ።"
                          : "Obligation to maintain active, compliant Ethiopian trade licenses and tax standing."}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 4. TERMS AND CONDITIONS                                         */}
        {/* =============================================================== */}
        <section className="py-16 px-4 sm:px-6 bg-card/30 border-y border-border/50">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-bold px-3 py-1">
                {locale === "am" ? "4. ውሎች እና ደንቦች" : "4. Terms & Conditions"}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {locale === "am" ? "የመድረኩ ጠቅላላ የአጠቃቀም ውል" : "General Terms of Platform Service"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                {locale === "am"
                  ? "በኢትዮጵያ የንግድ ህግ እና የኤሌክትሮኒክስ ግብይት አዋጅ ቁጥር 1205/2012 መሰረት የሚተዳደር"
                  : "Governed under the Commercial Code of Ethiopia and Electronic Commerce Proclamation No. 1205/2020."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>
                    {locale === "am"
                      ? "4.1 የመድረኩ ማንነትና የቴክኖሎጂ አገልጋይነት"
                      : "4.1 Platform Nature & Intermediary Status"}
                  </span>
                </h3>
                <p>
                  {locale === "am"
                    ? "ኢኮን (Econ) በኢትዮጵያ ውስጥ ገዢዎችንና ገለልተኛ አቅራቢዎችን የሚያገናኝ የቴክኖሎጂ ማውጫ እና የመረጃ ማገናኛ (Directory & Matching Platform) ብቻ ነው። መድረኩ ራሱ የዕቃዎች ባለቤት አይደለም፤ እቃዎችን በአካል አያጓጉዝም ወይም አያከማችም።"
                    : "Econ operates solely as an independent B2B technology directory and intermediary discovery platform connecting commercial buyers with registered third-party suppliers. Econ does not own, warehouse, or physically transport construction materials listed on the catalog."}
                </p>
              </div>

              <div className="space-y-2 border-t border-border/40 pt-4">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>
                    {locale === "am"
                      ? "4.2 የመለያ አጠቃቀም እና የውሸት መረጃ ክልከላ"
                      : "4.2 User Account Compliance & Fraud Prohibition"}
                  </span>
                </h3>
                <p>
                  {locale === "am"
                    ? "በመድረኩ ላይ የሚመዘገብ ማንኛውም ተጠቃሚ ትክክለኛ ስም፣ ስልክ እና የንግድ ሰነድ የማስገባት ግዴታ አለበት። ሀሰተኛ የንግድ ፈቃድ ማቅረብ፣ የዋጋ ማጭበርበር ወይም የማይገኝ እቃ መመዝገብ መለያው ወዲያውኑ እንዲዘጋ እና ጉዳዩ ለህግ አካላት እንዲተላለፍ ያደርጋል።"
                    : "All registered accounts must provide accurate corporate identities, valid Ethiopian TINs, and verifiable depot addresses. Submitting forged trade licenses, deceptive specifications, or ghost listings results in immediate account suspension and referral to regulatory authorities."}
                </p>
              </div>

              <div className="space-y-2 border-t border-border/40 pt-4">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>
                    {locale === "am"
                      ? "4.3 የዋጋ እና የቫት ደረሰኝ ስምምነት"
                      : "4.3 Commercial Pricing & Official Tax Compliance"}
                  </span>
                </h3>
                <p>
                  {locale === "am"
                    ? "በመድረኩ ላይ የሚታዩ ዋጋዎች አመላካች የጅምላ ዋጋዎች ናቸው። የመጨረሻው የሽያጭ ዋጋ እና የክፍያ ውል በገዢው እና በአቅራቢው መካከል በሚደረግ ቀጥታ ስምምነት የሚወሰን ሲሆን፣ ሁሉም የንግድ ሽያጮች ህጋዊ የ15% ቫት ደረሰኝ ሊኖራቸው ይገባል።"
                    : "Prices listed in the catalog reflect current depot volume tiers. Final commercial rates, delivery surcharges, and payment modalities are directly agreed between buyer and merchant, and must conform strictly to Ethiopian tax regulations."}
                </p>
              </div>

              <div className="space-y-2 border-t border-border/40 pt-4">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>
                    {locale === "am"
                      ? "4.4 የመስክ ኤጀንቶች (Field Agents) ስራ፣ ክፍያ እና የገዢዎች ነፃ አገልግሎት"
                      : "4.4 Field Agents Role, Supplier-Paid Commission & Zero Buyer Cost"}
                  </span>
                </h3>
                <p>
                  {locale === "am"
                    ? "የኢኮን የመስክ ወኪሎች (Agents) በሲስተሙ ላልገቡ ወይም ኦንላይን ለማይጠቀሙ የአካባቢ አቅራቢዎች ደንበኞችን በአካል ሱቃቸው ድረስ ወስደው የሚያሳዩ የአካባቢ ደላሎች፣ አሽከርካሪዎች እና አስጎብኚዎች ናቸው። ኤጀንቱ ክፍያ የሚያገኘው ከአቅራቢው ብቻ ሲሆን፣ ገዢው ምንም ዓይነት ተጨማሪ የኤጀንት ክፍያ (0 ETB) አይከፍልም። ገዢው ማንኛውንም ክፍያ ከመስጠቱ በፊት መጋዘኑ ድረስ በአካል ሄዶ ዕቃውን ማረጋገጥ አለበት።"
                    : "ConMart Field Agents are vetted local market navigators (brokers, drivers, loading crews, and area guides) whose primary role is to personally guide buyers to physical material suppliers' shops and yards — especially for suppliers who are not subscribed online. Agents are compensated strictly by material suppliers; buyers pay ZERO additional commission or fees. Buyers remain strictly obligated to physically inspect stock at the depot before issuing payment directly to the merchant."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 5. LEGAL DISCLAIMER & LIMITATION OF LIABILITY                   */}
        {/* (CRITICAL REQUIREMENT: PLACED AT THE BOTTOM AS DIRECTED BY CLIENT) */}
        {/* =============================================================== */}
        <section className="px-4 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold shrink-0 border border-destructive/20 mt-0.5">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px] font-bold uppercase tracking-wider mb-1">
                    {locale === "am" ? "ህጋዊ ማሳሰቢያ እና የሃላፊነት ወሰን" : "Legal Notice & Platform Limitation of Liability"}
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {locale === "am"
                      ? "5. የኢኮን ስርዓት ባለቤት የሃላፊነት ወሰን እና ጥብቅ የገዢ ማሳሰቢያ"
                      : "5. Platform Non-Liability Disclaimer & Mandatory Physical Verification"}
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed border-t border-destructive/20 pt-4">
                <div className="rounded-xl border border-destructive/30 bg-background/80 p-4 space-y-2">
                  <p className="font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {locale === "am"
                        ? "አቅራቢው ግዴታውን ካልተወጣ የሲስተሙ ባለቤት ተጠያቂ አይደለም"
                        : "System Owner Is Not Liable for Supplier Defaults or Contract Breaches"}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {locale === "am"
                      ? "የኢኮን (Econ) መድረክ አገልግሎት የአቅራቢዎችን አድራሻ እና የእቃ መረጃ ማስተዋወቅ ብቻ ነው። ማንኛውም አቅራቢ ግዴታውን ባይወጣ፣ ጥራት የጎደለው እቃ ቢያቀርብ፣ ጭነቱን ቢያዘገይ ወይም የገባውን ውል ቢያፈርስ የመድረኩ ባለቤትና አስተዳዳሪዎች በምንም አይነት መንገድ በህግ ተጠያቂ አይሆኑም።"
                      : "The Econ platform functions solely as a commercial directory and introductory listing service. Under no circumstances shall the platform owner, developers, operators, or affiliates be legally or financially liable if an independent supplier fails to fulfill their duties, delays delivery, provides non-conforming items, or breaches commercial agreements."}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-background/80 p-4 space-y-2">
                  <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {locale === "am"
                        ? "ገዢው ማንኛውንም ክፍያ ከመስጠቱ በፊት መጋዘኑ ድረስ በአካል ሄዶ ማረጋገጥ አለበት"
                        : "Buyers Must Physically Inspect Materials at the Depot Prior to Any Payment"}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {locale === "am"
                      ? "ሲስተሙ የአቅራቢውን አድራሻ ብቻ ስለሚሰጥ፣ ገዢው ማንኛውንም ክፍያ ከመፈጸሙ በፊት ወደ አቅራቢው መጋዘን በአካል ሄዶ የዕቃውን ትክክለኛነት፣ መኖሩንና ደረጃውን ማረጋገጥ የራሱ የገዢው ሃላፊነት ነው። በስልክ ወይም በኦንላይን ዕቃውን ሳያረጋግጡ በሚሰጥ ቅድመ-ክፍያ እና በሚደርስ የስርቆት ወይም የማጭበርበር ጉዳት የኢኮን ሲስተም ባለቤት ምንም አይነት ሃላፊነት አይወስድም።"
                      : "Because the platform provides supplier directory addresses only, the buyer is strictly responsible for physically visiting the supplier's warehouse or yard to inspect stock authenticity, diameter, and quantity BEFORE releasing any payment. Econ assumes zero liability for off-platform financial losses, unauthorized wire transfers, theft, or default."}
                  </p>
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  {locale === "am"
                    ? "ማስታወሻ፡ ይህ ህጋዊ ማሳሰቢያ በገዢዎችና በአቅራቢዎች መካከል የሚደረጉ ቀጥታ ግንኙነቶችን ህጋዊ ደህንነት ለመጠበቅ እና የመድረኩን አገልግሎት በገለልተኝነት ለማስኬድ የተደነገገ ነው።"
                    : "Notice: This legal limitation protects both commercial integrity and clarifies that sales contracts are entered into strictly and directly between independent buyers and independent suppliers."}
                </p>
              </div>

              {/* =============================================================== */}
              {/* 6. INTERACTIVE "I AGREE" BUTTON                                */}
              {/* =============================================================== */}
              <div className="border-t border-destructive/20 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                      agreed
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {agreed ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {agreed
                        ? locale === "am"
                          ? "በውሉና ደንቦቹ ሙሉ በሙሉ ተስማምተዋል"
                          : "Terms & Conditions Acknowledged"
                        : locale === "am"
                        ? "ውሉንና የሃላፊነት ወሰኑን ይቀበሉ"
                        : "Acknowledge Platform Terms & Disclaimer"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {agreed && agreedAt
                        ? `${locale === "am" ? "የተስማሙበት ቀን፦" : "Agreed on:"} ${agreedAt}`
                        : locale === "am"
                        ? "መድረኩን ከመጠቀምዎ በፊት ውሉን ያንብቡና 'ተስማምቻለሁ' የሚለውን ይጫኑ"
                        : "Click the agreement button below to record your formal consent"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleToggleAgree}
                  className={cn(
                    "text-xs font-bold gap-2 px-6 py-2.5 transition-all shadow-md",
                    agreed
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  )}
                >
                  {agreed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{locale === "am" ? "በውሉ ተስማምቻለሁ (ተረጋግጧል)" : "I Agree to These Terms (Agreed)"}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{locale === "am" ? "በውሉና ደንቦቹ ተስማምቻለሁ" : "I Agree to These Terms"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* PHYSICAL OFFICE & OFFICIAL SUPPORT                              */}
        {/* =============================================================== */}
        <section className="px-4 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card p-6 sm:p-10 space-y-8 shadow-xs">
            <div className="space-y-2">
              <Badge variant="outline" className="text-primary border-primary/30 font-semibold text-xs">
                {locale === "am" ? "ህጋዊና የታመነ አድራሻ" : "Official Verification & Office"}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                {locale === "am" ? "የኢኮን ዋና ቢሮ እና የቀጥታ ድጋፍ" : "Econ Headquarters & Direct Operations"}
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
                      ? "የዕቃዎች ማረጋገጫ፣ የአቅራቢነት ምዝገባ ወይም ማንኛውም አስተያየት ካለዎት በቀጥታ ይደውሉልን።"
                      : "For supplier depot verification, business compliance review, and contractor trade support."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* BOTTOM CTA BANNER                                               */}
        {/* =============================================================== */}
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-t border-border/50">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {locale === "am" ? "ዛሬውኑ ንግድዎን በኢኮን ይጀምሩ" : "Ready to Experience Transparent Construction Trade?"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {locale === "am"
                ? "የግንባታ እቃዎችን ካታሎግ ይመልከቱ ወይም እንደ የተረጋገጠ አቅራቢ ሆነው መጋዘንዎን ያስመዝግቡ።"
                : "Explore real-time depot prices across Addis Ababa or register your warehouse as an approved supplier."}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/buyer/category/all"
                className={cn(buttonVariants({ size: "lg" }), "font-bold shadow-md px-6")}
              >
                {locale === "am" ? "ዕቃዎችን ይፈልጉ" : "Browse Materials"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "font-semibold px-6"
                )}
              >
                {locale === "am" ? "አቅራቢ ሆነው ይመዝገቡ" : "Register as Supplier"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
