// =============================================================================
// ECON / ConMart — Field Agent & Transport Partner Registration Wizard
// =============================================================================
// Implements the Driver / Marketplace Hub dispatch specification from Yakob Dan:
// 1. Marketplace Hub Stationing (Megenagna, Gotera, Kality, Ayat, Lebu, etc.)
// 2. Service Profile (Material Finding, Truck/Transport Delivery, or Both)
// 3. Vehicle Profile (Pickup, Isuzu, Sino Truck, Motorcycle, Foot Runner)
// 4. Vetted Driver Documents (Kebele ID, Driving License, Vehicle Libre)
//    - NO Grade 12 educational roadblock
//    - NO Government Guarantor roadblock
// 5. 6-Month Free Introductory Period & Mutual Contact Reveal
// =============================================================================

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MapPin,
  ShieldCheck,
  FileText,
  AlertCircle,
  Truck,
  Users,
  Send,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Phone,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { submitAgentApplicationAction } from "@/app/actions/agents";
import { useLanguage } from "@/lib/i18n/language-context";
import { ETHIOPIAN_MARKETPLACE_HUBS, MarketplaceHub } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

export interface ExistingAgentProfile {
  id?: string;
  userId?: string;
  approvalStatus?: string;
  marketplaceHub?: string | null;
  serviceType?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  identityDocUrl?: string | null;
  drivingLicenseDocUrl?: string | null;
  vehicleLibreDocUrl?: string | null;
  photoUrl?: string | null;
  city?: string | null;
  subCity?: string | null;
  serviceArea?: string | null;
  availableDaysHours?: string | null;
  rejectionReason?: string | null;
  isOnline?: boolean | null;
  introductoryEndsAt?: string | Date | null;
  jobCreditBalance?: Prisma.Decimal | number | string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  [key: string]: unknown;
}

type ServiceTypeOption = "SUPPLIER_ASSISTANCE" | "TRANSPORT_DELIVERY" | "BOTH";
type VehicleTypeOption = "PICKUP" | "ISUZU" | "SINO_TRUCK" | "MOTORCYCLE" | "NONE_FOOT";

interface AgentApplyWizardProps {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  existingProfile: ExistingAgentProfile | null;
}

const HUB_METADATA: Record<MarketplaceHub, { amharic: string; note: string }> = {
  Megenagna: { amharic: "መገናኛ", note: "Central hub for East Addis, CMC, Ayat & Yeka depots" },
  Gotera: { amharic: "ጎተራ", note: "Prime interchange for Kirkos, Kera & heavy logistics" },
  Kality: { amharic: "ቃሊቲ", note: "Steel rebar, cement factories & industrial ring road" },
  Ayat: { amharic: "አያት", note: "Fast-growing residential construction & quarry routes" },
  Lebu: { amharic: "ለቡ", note: "Finfinne corridor, Jomo & Southwest material depots" },
  Merkato: { amharic: "መርካቶ", note: "Wholesale hardware, electrical & finishing trades" },
  Akaki: { amharic: "አቃቂ", note: "Heavy aggregate, stone, and national rail terminal" },
  Piassa: { amharic: "ፒያሳ", note: "Central historic district & urban commercial projects" },
  Saris: { amharic: "ሳሪስ", note: "Southern industrial zone & Debre Zeit trade route" },
  "Tor Hailoch": { amharic: "ጦር ኃይሎች", note: "West corridor, Kolfe & Ambo road logistics" },
  Gerji: { amharic: "ገርጂ", note: "Jackros, Imperial & Bole industrial catchment" },
  CMC: { amharic: "ሲኤምሲ", note: "Real estate heartland & Goro ring road suppliers" },
};

export function AgentApplyWizard({ user, existingProfile }: AgentApplyWizardProps) {
  const router = useRouter();
  const { locale } = useLanguage();

  const isAlreadySubmitted =
    existingProfile &&
    (existingProfile.approvalStatus === "UNDER_REVIEW" ||
      existingProfile.approvalStatus === "SUBMITTED" ||
      existingProfile.approvalStatus === "APPROVED");

  const [currentStep, setCurrentStep] = useState<number>(isAlreadySubmitted ? 5 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Step 2: Personal Details & Hub Station ---
  const [fullName, setFullName] = useState(existingProfile?.user?.name || user.name || "");
  const [phone, setPhone] = useState(existingProfile?.user?.phone || user.phone || "");
  const city = existingProfile?.city || "Addis Ababa";
  const [subCity, setSubCity] = useState(existingProfile?.subCity || "Yeka");
  const [marketplaceHub, setMarketplaceHub] = useState<MarketplaceHub>(
    (existingProfile?.marketplaceHub as MarketplaceHub) || "Megenagna"
  );

  // --- Step 3: Service Capabilities & Vehicle ---
  const [serviceType, setServiceType] = useState<ServiceTypeOption>(
    (existingProfile?.serviceType as ServiceTypeOption) || "BOTH"
  );
  const [vehicleType, setVehicleType] = useState<VehicleTypeOption>(
    (existingProfile?.vehicleType as VehicleTypeOption) || "ISUZU"
  );
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState(
    existingProfile?.vehiclePlateNumber || ""
  );
  const [availableDaysHours, setAvailableDaysHours] = useState(
    existingProfile?.availableDaysHours || "Mon - Sat, 8:00 - 18:00"
  );

  // --- Step 4: Driver & Identity Documents ---
  const [identityDocUrl, setIdentityDocUrl] = useState(existingProfile?.identityDocUrl || "");
  const [drivingLicenseDocUrl, setDrivingLicenseDocUrl] = useState(
    existingProfile?.drivingLicenseDocUrl || ""
  );
  const [vehicleLibreDocUrl, setVehicleLibreDocUrl] = useState(
    existingProfile?.vehicleLibreDocUrl || ""
  );
  const [photoUrl, setPhotoUrl] = useState(existingProfile?.photoUrl || "");

  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingLibre, setUploadingLibre] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [termsAgreed, setTermsAgreed] = useState(true);

  // File Upload Helper
  const handleFileUpload = async (
    file: File,
    docType: string,
    setUrl: (url: string) => void,
    setLoading: (l: boolean) => void
  ) => {
    setLoading(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const res = await fetch("/api/upload/agent-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload document");
      }

      setUrl(data.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Document upload failed";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Final Application
  const handleSubmitApplication = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError("Please enter your full legal name as it appears on your Kebele ID.");
      setCurrentStep(2);
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setFormError("Please provide a valid Ethiopian mobile phone number.");
      setCurrentStep(2);
      return;
    }
    if (!marketplaceHub) {
      setFormError("Please select your primary Marketplace Hub.");
      setCurrentStep(2);
      return;
    }
    if (!identityDocUrl) {
      setFormError("Please upload a photo of your Kebele ID or National ID card.");
      setCurrentStep(4);
      return;
    }
    if (serviceType !== "SUPPLIER_ASSISTANCE" && vehicleType !== "NONE_FOOT") {
      if (!vehiclePlateNumber.trim()) {
        setFormError("Please enter your vehicle plate number.");
        setCurrentStep(3);
        return;
      }
      if (!drivingLicenseDocUrl) {
        setFormError("Please upload your driver's license for transport delivery verification.");
        setCurrentStep(4);
        return;
      }
    }
    if (!termsAgreed) {
      setFormError("Please agree to the dispatch partnership terms.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await submitAgentApplicationAction({
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        subCity: subCity.trim(),
        marketplaceHub,
        additionalHubs: [],
        serviceType,
        vehicleType: serviceType === "SUPPLIER_ASSISTANCE" ? "NONE_FOOT" : vehicleType,
        vehiclePlateNumber:
          serviceType === "SUPPLIER_ASSISTANCE" ? null : vehiclePlateNumber.trim() || null,
        identityDocUrl,
        drivingLicenseDocUrl: drivingLicenseDocUrl || null,
        vehicleLibreDocUrl: vehicleLibreDocUrl || null,
        photoUrl: photoUrl || null,
        serviceArea: marketplaceHub,
        availableDaysHours,
        travelRadiusKm: 5,
        guarantorType: "COMMUNITY_OR_OTHER",
        guarantorConsentObtained: false,
        isAvailableForAssignments: true,
      });

      if (!res.success) {
        setFormError(res.error);
        setSubmitting(false);
        return;
      }

      router.push("/agent/leads");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit application. Please retry.";
      setFormError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-primary/25 font-mono text-2xs uppercase tracking-widest font-bold">
              Dispatch Partner Program
            </Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              6-Month Free Launch Period
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {locale === "am"
              ? "የኮንማርት የመስክ ወኪል እና የትራንስፖርት አጋር ምዝገባ"
              : "Field Agent & Transport Partner Registration"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {locale === "am"
              ? "በመረጡት የገበያ ማዕከል (መገናኛ፣ ጎተራ፣ ቃሊቲ...) ሆነው ለግንባታ ደንበኞች ዕቃ በማቅረብ እና በትራንስፖርት ተጠቃሚ ይሁኑ። የትምህርት ማስረጃ እና ዋስ አይጠየቅም።"
              : "Station at your preferred marketplace hub (Megenagna, Gotera, Kality...) to assist contractors with depot sourcing and truck delivery. No Grade 12 or guarantor required."}
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-3 text-right">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Introductory Access</div>
          <div className="text-sm font-black text-primary">0 ETB Lead Fee</div>
          <div className="text-[10px] text-muted-foreground">Keep 100% of your earnings</div>
        </div>
      </div>

      {/* Progress Stepper (Only shown when not already approved) */}
      {!isAlreadySubmitted && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border/40 pb-4">
          {[
            { step: 1, title: "1. Overview", desc: "Earnings & Hub Model" },
            { step: 2, title: "2. Personal & Hub", desc: "Choose your station" },
            { step: 3, title: "3. Capabilities", desc: "Vehicle & services" },
            { step: 4, title: "4. Documents", desc: "Kebele ID & License" },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                if (item.step < currentStep) setCurrentStep(item.step);
              }}
              className={`flex flex-col items-start p-3 rounded-xl text-left transition-all ${
                currentStep === item.step
                  ? "bg-primary/10 border-l-4 border-primary text-foreground shadow-xs"
                  : currentStep > item.step
                  ? "text-muted-foreground hover:bg-muted/40 cursor-pointer"
                  : "text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                {currentStep > item.step ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
                {item.title}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>
      )}

      {formError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* =========================================================================
          STEP 1: PROGRAM OVERVIEW & DISPATCH MODEL
          ========================================================================= */}
      {currentStep === 1 && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <div>
                <CardTitle className="text-base font-bold">
                  How the ConMart Field Partner Network Works
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ride & truck delivery model built for Addis Ababa construction trade
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* 4 Core Principles: Role, Eligibility, Compensation & Trust */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. What is the Job of an Agent? */}
              <div className="rounded-2xl border-2 border-primary/30 p-5 space-y-2.5 bg-primary/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {locale === "am"
                      ? "የኤጀንት ስራ ምንድነው? (What is the Job?)"
                      : "The Job of a ConMart Agent"}
                  </h3>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                  {locale === "am"
                    ? "የኤጀንት ዋነኛ ስራ በሲስተሙ ላልተመዘገቡ ወይም ኦንላይን ላልገቡ የአካባቢ የግንባታ እቃ አቅራቢዎች ደንበኞችን በአካል ሱቃቸው ወይም መጋዘናቸው ድረስ ወስዶ ማሳየት እና ማገናኘት ነው።"
                    : "An agent is an on-the-ground guide who personally shows and navigates buyers to physical material suppliers' shops and yards — especially for suppliers who are not subscribed or active on the online platform."}
                </p>
                <div className="text-[11px] text-muted-foreground">
                  {locale === "am"
                    ? "✓ ከመጋዘን ባለቤቶች ጋር ደንበኛን ማገናኘት እና የትክክለኛውን እቃ ናሙና ማሳየት"
                    : "✓ Bridge offline depot yards with buyers and coordinate physical depot visits"}
                </div>
              </div>

              {/* 2. Who Can Register as an Agent? */}
              <div className="rounded-2xl border-2 border-emerald-500/30 p-5 space-y-2.5 bg-emerald-500/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {locale === "am"
                      ? "ማን ኤጀንት ሆኖ መመዝገብ ይችላል? (Who Can Register?)"
                      : "Who Can Register as an Agent?"}
                  </h3>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                  {locale === "am"
                    ? "በግንባታ ገበያ ቦታዎች (መገናኛ፣ ጎተራ፣ ቃሊቲ፣ አያት፣ ለቡ፣ መርካቶ ወዘተ) የሚሰሩ ደላሎች፣ የመኪና/አይሱዙ/ፒክአፕ አሽከርካሪዎች፣ ጫኝና አውራጆች ወይም ማንኛውም በገበያው ያለ ሰው መመዝገብ ይችላል።"
                    : "Anyone working in local construction market areas — local brokers (ደላላ), truck/pickup/Isuzu drivers (አሽከርካሪዎች), loading workers (ጫኝ/አውራጅ), or depot locators available on-ground."}
                </p>
                <div className="text-[11px] text-muted-foreground">
                  {locale === "am"
                    ? "✓ የ12ኛ ክፍል ሰርተፍኬት ወይም የመንግስት ሰራተኛ ዋስ አይጠየቅም"
                    : "✓ No Grade 12 educational certificate or government employee guarantor required"}
                </div>
              </div>

              {/* 3. Payment: From Suppliers Only (0 ETB from Buyer) */}
              <div className="rounded-2xl border-2 border-amber-500/30 p-5 space-y-2.5 bg-amber-500/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {locale === "am"
                      ? "ክፍያ ከአቅራቢው ብቻ — ከገዢው ምንም አይጠየቅም"
                      : "Paid by Suppliers Only (0 ETB from Buyer)"}
                  </h3>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                  {locale === "am"
                    ? "ኤጀንቱ ኮሚሽኑን የሚያገኘው ከዕቃ አቅራቢዎች ብቻ ነው። ገዢው ምንም ዓይነት ተጨማሪ የኤጀንት ወይም የድካም ክፍያ አይከፍልም።"
                    : "An agent gets payment strictly from the material suppliers upon successful sales. There is NO additional payment or fee charged to the buyer whatsoever."}
                </p>
                <div className="text-[11px] text-muted-foreground">
                  {locale === "am"
                    ? "✓ ገዢዎች በነጻነት ይጠቀማሉ፤ እርስዎ ሙሉ ኮሚሽንዎን ከአቅራቢው ያገኛሉ"
                    : "✓ Buyers pay zero fees for agent guidance; you earn directly from supplier deal commissions"}
                </div>
              </div>

              {/* 4. Trust & Safety: Physical Inspection First */}
              <div className="rounded-2xl border-2 border-blue-500/30 p-5 space-y-2.5 bg-blue-500/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                    4
                  </div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {locale === "am"
                      ? "ገዢዎች ለምን ያምኗችኋል? (Trust & Security)"
                      : "Why Buyers Trust ConMart Agents"}
                  </h3>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                  {locale === "am"
                    ? "የቀበሌ መታወቂያ እና ህጋዊ ሰነዶቻቸው የተረጋገጠ ነው። ገዢው ዕቃውን መጋዘን ውስጥ በአካል አይቶ ሳያረጋግጥ ምንም ክፍያ ለአቅራቢውም አይሰጥም።"
                    : "All agents submit verified Kebele IDs and phone numbers. Agents never collect material funds; buyers physically inspect stock at the yard before settling directly with the supplier."}
                </p>
                <div className="text-[11px] text-muted-foreground">
                  {locale === "am"
                    ? "✓ ቀጥታ የአቅራቢና ገዢ ግንኙነት በግልጽነት እና በህጋዊ ደህንነት ይጠበቃል"
                    : "✓ Transparent, direct transactions with physical depot inspection before any settlement"}
                </div>
              </div>
            </div>

            {/* Hub Stationing & 6-Month Intro Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-border/70 p-4 space-y-2 bg-card">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <MapPin className="size-4" />
                  <span>Marketplace Hub Stationing</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Choose your primary station (Megenagna, Gotera, Kality, Ayat, Lebu...). When a buyer near your hub needs assistance, you receive immediate dispatch.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 p-4 space-y-2 bg-card">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <Phone className="size-4" />
                  <span>Direct Contact Reveal</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mutual phone reveal: the buyer gets your name and contact, and you get the buyer’s direct number to coordinate physical arrival at the yard.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 p-4 space-y-2 bg-card">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-xs">
                  <Sparkles className="size-4" />
                  <span>6-Month Free Intro Access</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  0 ETB registration or platform fee during your first 6 months. Keep 100% of your earnings from suppliers and truck transport.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-sm rounded-xl shadow-md"
            >
              <span>{locale === "am" ? "ምዝገባውን ይጀምሩ" : "Begin Agent Registration"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          STEP 2: PERSONAL DETAILS & MARKETPLACE HUB SELECTION
          ========================================================================= */}
      {currentStep === 2 && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <div>
                  <CardTitle className="text-base font-bold">
                    Personal Details & Marketplace Hub Station
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Where will you be stationed to receive buyer requests?
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="text-xs gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-xs font-bold">
                  Full Legal Name (የሙሉ ስም) *
                </Label>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dawit Bekele Tadesse"
                  className="text-xs"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold">
                  Mobile Phone Number (ስልክ ቁጥር) *
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911 234 567 or +251 91..."
                  className="text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">
                  This phone number will be revealed directly to buyers when you accept jobs.
                </span>
              </div>
            </div>

            {/* City & Sub-city */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold">City (ከተማ)</Label>
                <Input value={city} disabled className="text-xs bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcity" className="text-xs font-bold">
                  Sub-City / Woreda (ክፍለ ከተማ) *
                </Label>
                <Input
                  id="subcity"
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  placeholder="e.g. Yeka, Bole, Akaki-Kality, Kirkos"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Marketplace Hub Selection Grid */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-foreground block">
                    Choose Your Primary Marketplace Hub (ዋና የገበያ ማዕከል ይምረጡ) *
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When a buyer selects this hub, you will receive real-time notifications when you are online.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {ETHIOPIAN_MARKETPLACE_HUBS.map((hub) => {
                  const meta = HUB_METADATA[hub];
                  const isSelected = marketplaceHub === hub;

                  return (
                    <button
                      key={hub}
                      type="button"
                      onClick={() => setMarketplaceHub(hub)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20 text-foreground"
                          : "border-border/80 bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-foreground">{hub}</span>
                        {isSelected ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <MapPin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-primary">{meta.amharic}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-1">
                        {meta.note}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setCurrentStep(3)}
                className="font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 text-xs rounded-xl"
              >
                <span>Continue to Vehicle Details</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          STEP 3: SERVICE CAPABILITIES & VEHICLE DETAILS
          ========================================================================= */}
      {currentStep === 3 && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <div>
                  <CardTitle className="text-base font-bold">
                    Service Capability & Vehicle Profile
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Do you provide material finding, truck transport, or both?
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="text-xs gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Service Type Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-foreground">
                Service Type (የአገልግሎት ዓይነት) *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: "BOTH",
                      title: "Depot Guide + Transport (Recommended)",
                      amharic: "የመጋዘን ዕቃ ማሳየት እና ትራንስፖርት",
                      desc: "Show offline supplier shops to buyers + truck delivery",
                    },
                    {
                      id: "SUPPLIER_ASSISTANCE",
                      title: "Supplier Shop Guide Only",
                      amharic: "የአቅራቢዎች ሱቅ ማሳየት ብቻ (ደላላ/አገናኝ)",
                      desc: "Guide buyers to unsubscribed/offline supplier shops on foot",
                    },
                    {
                      id: "TRANSPORT_DELIVERY",
                      title: "Transport / Truck Delivery Only",
                      amharic: "የትራንስፖርት እና ጭነት ማድረስ (ሹፌር)",
                      desc: "Isuzu, Pickup, or Sino delivery directly from depots",
                    },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setServiceType(st.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      serviceType === st.id
                        ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20 text-foreground"
                        : "border-border/80 bg-card hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-foreground">{st.title}</span>
                      {serviceType === st.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-primary">{st.amharic}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Options (Only if transport selected) */}
            {serviceType !== "SUPPLIER_ASSISTANCE" && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div>
                  <Label className="text-xs font-bold text-foreground">
                    Vehicle Type (የተሽከርካሪ ዓይነት) *
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Select the vehicle you operate for delivery assignments.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { id: "ISUZU", label: "Isuzu (NPR/FSR)", desc: "3.5 - 7 Ton Medium Truck" },
                      { id: "PICKUP", label: "Pickup / Hilux", desc: "1 - 1.5 Ton Light Hauler" },
                      { id: "SINO_TRUCK", label: "Sino / Dump Truck", desc: "10 - 20 Ton Heavy Tipper" },
                      { id: "MOTORCYCLE", label: "Motorcycle", desc: "Fast courier / small parts" },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleType(v.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        vehicleType === v.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground"
                          : "border-border/80 bg-card hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Truck className="h-4 w-4 text-primary" />
                        {vehicleType === v.id && (
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="font-bold text-xs text-foreground">{v.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Plate Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="plate-num" className="text-xs font-bold">
                      Vehicle Plate Number (የሰሌዳ ቁጥር) *
                    </Label>
                    <Input
                      id="plate-num"
                      value={vehiclePlateNumber}
                      onChange={(e) => setVehiclePlateNumber(e.target.value)}
                      placeholder="e.g. 3-B12345 or 3-A98765"
                      className="text-xs font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours" className="text-xs font-bold">
                      Operating Hours (የሥራ ሰዓት)
                    </Label>
                    <Input
                      id="hours"
                      value={availableDaysHours}
                      onChange={(e) => setAvailableDaysHours(e.target.value)}
                      placeholder="e.g. Mon - Sat, 8:00 - 18:00"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setCurrentStep(4)}
                className="font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 text-xs rounded-xl"
              >
                <span>Continue to Documents</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          STEP 4: IDENTITY & DRIVER DOCUMENTS (NO GRADE 12 / NO GUARANTOR)
          ========================================================================= */}
      {currentStep === 4 && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </span>
                <div>
                  <CardTitle className="text-base font-bold">
                    Identity & Driver Verification Documents
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Upload your valid ID and driver credentials for quick verification (~2 to 4 hours)
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="text-xs gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Kebele / National ID (Required) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Kebele / National ID Card (የቀበሌ / የብሔራዊ መታወቂያ) *</span>
                  {identityDocUrl && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </Label>
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <ShieldCheck className="h-6 w-6 text-primary mx-auto" />
                  <div className="text-xs text-muted-foreground">
                    <label
                      htmlFor="id-upload"
                      className="cursor-pointer font-bold text-primary hover:underline"
                    >
                      {uploadingId ? "Uploading ID..." : "Upload Kebele / National ID"}
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      JPG, PNG, or PDF (Max 5 MB)
                    </p>
                  </div>
                  <input
                    id="id-upload"
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    className="hidden"
                    disabled={uploadingId}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "identity", setIdentityDocUrl, setUploadingId);
                    }}
                  />
                  {identityDocUrl && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {identityDocUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Driver's License (Required if vehicle) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Driver&apos;s License (መንጃ ፈቃድ) {serviceType !== "SUPPLIER_ASSISTANCE" ? "*" : ""}</span>
                  {drivingLicenseDocUrl && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </Label>
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary mx-auto" />
                  <div className="text-xs text-muted-foreground">
                    <label
                      htmlFor="license-upload"
                      className="cursor-pointer font-bold text-primary hover:underline"
                    >
                      {uploadingLicense ? "Uploading License..." : "Upload Driver's License"}
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      JPG, PNG, or PDF (Max 5 MB)
                    </p>
                  </div>
                  <input
                    id="license-upload"
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    className="hidden"
                    disabled={uploadingLicense}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        handleFileUpload(
                          file,
                          "driving_license",
                          setDrivingLicenseDocUrl,
                          setUploadingLicense
                        );
                    }}
                  />
                  {drivingLicenseDocUrl && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {drivingLicenseDocUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Vehicle Libre (Required for vehicle owners) */}
              {serviceType !== "SUPPLIER_ASSISTANCE" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold flex items-center justify-between">
                    <span>Vehicle Libre (የተሽከርካሪ ሊብሬ)</span>
                    {vehicleLibreDocUrl && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                  </Label>
                  <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <Truck className="h-6 w-6 text-emerald-600 mx-auto" />
                    <div className="text-xs text-muted-foreground">
                      <label
                        htmlFor="libre-upload"
                        className="cursor-pointer font-bold text-primary hover:underline"
                      >
                        {uploadingLibre ? "Uploading Libre..." : "Upload Vehicle Libre"}
                      </label>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Ownership document or rental permit
                      </p>
                    </div>
                    <input
                      id="libre-upload"
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                      disabled={uploadingLibre}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          handleFileUpload(
                            file,
                            "vehicle_libre",
                            setVehicleLibreDocUrl,
                            setUploadingLibre
                          );
                      }}
                    />
                    {vehicleLibreDocUrl && (
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        {vehicleLibreDocUrl}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Profile Photo / Selfie (Optional) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Profile Photo / Selfie (የግል ፎቶ - አማራጭ)</span>
                  {photoUrl && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </Label>
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <Users className="h-6 w-6 text-muted-foreground mx-auto" />
                  <div className="text-xs text-muted-foreground">
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer font-bold text-primary hover:underline"
                    >
                      {uploadingPhoto ? "Uploading..." : "Upload Selfie / Photo"}
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Clear face photo for contractor trust
                    </p>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "photo", setPhotoUrl, setUploadingPhoto);
                    }}
                  />
                  {photoUrl && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{photoUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Submission */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border/80 bg-background cursor-pointer hover:bg-muted/20 transition-colors">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                />
                <span className="text-xs text-foreground font-medium leading-relaxed">
                  I agree to act as an authorized ConMart Field & Transport Partner stationed at{" "}
                  <strong>{marketplaceHub}</strong>. I understand that when I toggle my status to
                  ONLINE, my contact details will be shared directly with buyers upon accepting assignments.
                </span>
              </label>

              <Button
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="w-full font-bold gap-2 py-6 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Partner Application</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          STEP 5: EXISTING APPLICATION / UNDER REVIEW HOLDING CARD
          ========================================================================= */}
      {isAlreadySubmitted && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-amber-500 animate-pulse" />
                <CardTitle className="text-base font-bold">
                  {existingProfile?.approvalStatus === "APPROVED"
                    ? "Partner Profile Active"
                    : "Application Under Review (በግምገማ ላይ)"}
                </CardTitle>
              </div>
              <Badge
                className={
                  existingProfile?.approvalStatus === "APPROVED"
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                }
              >
                {existingProfile?.approvalStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Registered Profile Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Stationed Hub</span>
                  <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary" />
                    {existingProfile?.marketplaceHub || "Megenagna"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Service & Vehicle</span>
                  <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                    <Truck className="h-3 w-3 text-primary" />
                    {existingProfile?.vehicleType || "ISUZU"}{" "}
                    {existingProfile?.vehiclePlateNumber ? `(${existingProfile.vehiclePlateNumber})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Free Launch Period</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <Sparkles className="h-3 w-3" />
                    6-Month 0 ETB Access
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => router.push("/agent/leads")}
                className="font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <span>Go to Dispatch Jobs & Leads</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="font-semibold text-xs"
              >
                Update Station or Vehicle Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
