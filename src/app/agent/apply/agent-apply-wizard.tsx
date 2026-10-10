// =============================================================================
// ConMart — 01B Online Agent Registration Wizard (Screens 1 - 4)
// =============================================================================

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Upload,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Building2,
  Users,
  Send,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { submitAgentApplicationAction } from "@/app/actions/agents";
import { useLanguage } from "@/lib/i18n/language-context";

interface AgentApplyWizardProps {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  existingProfile: any | null;
}

const ADDIS_ABABA_SUB_CITIES = [
  { name: "Bole", lat: 9.0054, lng: 38.7891 },
  { name: "Yeka", lat: 9.0345, lng: 38.805 },
  { name: "Kirkos", lat: 9.0122, lng: 38.7562 },
  { name: "Arada", lat: 9.035, lng: 38.752 },
  { name: "Addis Ketema", lat: 9.031, lng: 38.735 },
  { name: "Lideta", lat: 9.008, lng: 38.738 },
  { name: "Kolfe Keranio", lat: 9.015, lng: 38.705 },
  { name: "Gulele", lat: 9.062, lng: 38.742 },
  { name: "Nifas Silk-Lafto", lat: 8.975, lng: 38.742 },
  { name: "Akaky Kaliti", lat: 8.915, lng: 38.765 },
  { name: "Lemi Kura", lat: 9.028, lng: 38.835 },
];

export function AgentApplyWizard({ user, existingProfile }: AgentApplyWizardProps) {
  const router = useRouter();
  const { locale } = useLanguage();

  const [currentStep, setCurrentStep] = useState<number>(existingProfile ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Step 2: Personal Details & Education ---
  const [fullName, setFullName] = useState(existingProfile?.user?.name || user.name || "");
  const [phone, setPhone] = useState(existingProfile?.user?.phone || user.phone || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(!!user.phone);
  const [city, setCity] = useState(existingProfile?.city || "Addis Ababa");
  const [subCity, setSubCity] = useState(existingProfile?.subCity || "Bole");
  const [grade12DocUrl, setGrade12DocUrl] = useState(existingProfile?.grade12DocUrl || "");
  const [identityDocUrl, setIdentityDocUrl] = useState(existingProfile?.identityDocUrl || "");
  const [uploadingGrade12, setUploadingGrade12] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);

  // --- Step 3: Work Area & Availability ---
  const [serviceArea, setServiceArea] = useState(existingProfile?.serviceArea || "Bole");
  const [travelRadiusKm, setTravelRadiusKm] = useState<number>(existingProfile?.travelRadiusKm || 5);
  const [availableDaysHours, setAvailableDaysHours] = useState(
    existingProfile?.availableDaysHours || "Mon - Fri, 9:00 - 17:00"
  );
  const [isAvailableForAssignments, setIsAvailableForAssignments] = useState<boolean>(
    existingProfile?.isAvailableForAssignments ?? true
  );
  const [latitude, setLatitude] = useState<number>(existingProfile?.latitude || 9.0054);
  const [longitude, setLongitude] = useState<number>(existingProfile?.longitude || 38.7891);

  // --- Step 4: Guarantee & Consent ---
  const [guarantorType, setGuarantorType] = useState<"GOVERNMENT_EMPLOYEE" | "COMMUNITY_OR_OTHER">(
    existingProfile?.guarantorType || "GOVERNMENT_EMPLOYEE"
  );
  const [guarantorName, setGuarantorName] = useState(existingProfile?.guarantorName || "");
  const [guarantorPhone, setGuarantorPhone] = useState(existingProfile?.guarantorPhone || "");
  const [guarantorEmployer, setGuarantorEmployer] = useState(existingProfile?.guarantorEmployer || "");
  const [guarantorRelationship, setGuarantorRelationship] = useState(
    existingProfile?.guarantorRelationship || ""
  );
  const [guarantorDocUrl, setGuarantorDocUrl] = useState(existingProfile?.guarantorDocUrl || "");
  const [guarantorDescription, setGuarantorDescription] = useState(
    existingProfile?.guarantorDescription || ""
  );
  const [guarantorConsentObtained, setGuarantorConsentObtained] = useState<boolean>(
    existingProfile?.guarantorConsentObtained ?? false
  );
  const [uploadingGuarantorDoc, setUploadingGuarantorDoc] = useState(false);

  // File Upload Helper
  const handleFileUpload = async (
    file: File,
    docType: "grade12" | "id" | "guarantor",
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
    } catch (err: any) {
      setFormError(err.message || "Document upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = () => {
    setCodeSent(true);
    // Auto-fill simulation code
    setTimeout(() => {
      setVerificationCode("582190");
      setPhoneVerified(true);
    }, 1200);
  };

  const handleSubCitySelect = (selectedName: string) => {
    setSubCity(selectedName);
    setServiceArea(selectedName);
    const found = ADDIS_ABABA_SUB_CITIES.find((c) => c.name === selectedName);
    if (found) {
      setLatitude(found.lat);
      setLongitude(found.lng);
    }
  };

  // Submit Final Application
  const handleSubmitApplication = async () => {
    if (!guarantorConsentObtained) {
      setFormError("You must confirm that guarantor consent has been obtained.");
      return;
    }
    if (!grade12DocUrl) {
      setFormError("Please upload your Grade 12 completion document.");
      return;
    }
    if (!identityDocUrl) {
      setFormError("Please upload your National ID document.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await submitAgentApplicationAction({
        fullName,
        phone,
        city,
        subCity,
        grade12DocUrl,
        identityDocUrl,
        serviceArea,
        latitude,
        longitude,
        travelRadiusKm,
        availableDaysHours,
        isAvailableForAssignments,
        guarantorType,
        guarantorName,
        guarantorPhone,
        guarantorEmployer: guarantorEmployer || undefined,
        guarantorRelationship: guarantorRelationship || undefined,
        guarantorDocUrl: guarantorDocUrl || undefined,
        guarantorDescription: guarantorDescription || undefined,
        guarantorConsentObtained: true,
      });

      if (!res.success) {
        setFormError(res.error);
        setSubmitting(false);
        return;
      }

      router.push("/agent/leads");
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit application. Please retry.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 01B Top Brief Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-black tracking-widest text-primary uppercase">
              CONMART 01B
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs font-semibold text-muted-foreground">
              Online Agent Registration & Approval
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {locale === "am" ? "የኮሚሽን ወኪል ምዝገባ እና ማረጋገጫ" : "Online Agent Registration & Vetting"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {locale === "am"
              ? "በመረጡት አካባቢ በትርፍ ጊዜ ይስሩ • የሰነድ ማረጋገጫ እና ፍቃድ ያስፈልጋል"
              : "Apply online • Work part-time near your chosen area • Approval required"}
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-bold rounded-full w-fit">
          Local People Stronger Markets
        </Badge>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border/40 pb-4">
        {[
          { step: 1, title: "1. Choose Role", desc: "Eligibility rules" },
          { step: 2, title: "2. Personal & Edu", desc: "ID & Grade 12" },
          { step: 3, title: "3. Work Area", desc: "Map pin & radius" },
          { step: 4, title: "4. Guarantee", desc: "Guarantor & consent" },
        ].map((item) => (
          <button
            key={item.step}
            type="button"
            onClick={() => {
              if (item.step < currentStep) setCurrentStep(item.step);
            }}
            className={`flex flex-col items-start p-2.5 rounded-lg text-left transition-colors ${
              currentStep === item.step
                ? "bg-primary/10 border-l-4 border-primary text-foreground"
                : currentStep > item.step
                ? "text-muted-foreground hover:bg-muted/40 cursor-pointer"
                : "text-muted-foreground/50 cursor-not-allowed"
            }`}
          >
            <span className="text-xs font-bold flex items-center gap-1.5">
              {currentStep > item.step ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
              {item.title}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</span>
          </button>
        ))}
      </div>

      {formError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: ROLE SELECTION & ELIGIBILITY */}
      {currentStep === 1 && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <div>
                <CardTitle className="text-base font-bold">Choose your role</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Create an account and select how you want to use CONMART.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Role Cards */}
              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Buyer</p>
                      <p className="text-xs text-muted-foreground">Find construction materials</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Supplier</p>
                      <p className="text-xs text-muted-foreground">List and sell your products</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Selected Agent Card */}
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 shadow-sm ring-2 ring-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-primary">Apply as Agent</p>
                        <p className="text-xs text-muted-foreground">
                          Help buyers visit nearby construction suppliers
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              {/* Right Eligibility Requirements Box */}
              <div className="rounded-xl border border-border/80 bg-card p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    Help buyers visit nearby construction suppliers.
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    As a local part-time agent, you can earn by helping buyers connect with trusted
                    suppliers in your area.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    Eligibility requirements
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Completed Grade 12</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Government-employee guarantor OR another accepted guarantee</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Part-time availability in your local area</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
                  This is a part-time opportunity, not a full-time job.
                </div>

                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-full font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <span>Continue Application</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PERSONAL DETAILS & EDUCATION */}
      {currentStep === 2 && (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <div>
                  <CardTitle className="text-base font-bold">
                    Personal details & education
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Tell us about yourself and upload required documents.
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
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="agent-name" className="text-xs font-bold">
                  Full name *
                </Label>
                <Input
                  id="agent-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Abebe Kifle"
                  className="text-xs"
                />
              </div>

              {/* Phone Number & SMS Verification Simulation */}
              <div className="space-y-2">
                <Label htmlFor="agent-phone" className="text-xs font-bold">
                  Phone number *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="agent-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0912 345 678"
                    className="text-xs font-mono"
                  />
                  {!phoneVerified && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSendCode}
                      disabled={codeSent}
                      className="text-xs font-bold shrink-0 bg-primary hover:bg-primary/90"
                    >
                      {codeSent ? "Code Sent" : "Send code"}
                    </Button>
                  )}
                  {phoneVerified && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1 text-xs shrink-0 px-2 py-1">
                      <Check className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                {codeSent && !phoneVerified && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="text-xs font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPhoneVerified(true)}
                      className="text-xs"
                    >
                      Verify
                    </Button>
                  </div>
                )}
              </div>

              {/* City / Town */}
              <div className="space-y-2">
                <Label htmlFor="agent-city" className="text-xs font-bold">
                  City / town *
                </Label>
                <select
                  id="agent-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs"
                >
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Adama">Adama</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Mekelle">Mekelle</option>
                </select>
              </div>

              {/* Sub-city / Woreda */}
              <div className="space-y-2">
                <Label htmlFor="agent-subcity" className="text-xs font-bold">
                  Sub-city / woreda *
                </Label>
                <select
                  id="agent-subcity"
                  value={subCity}
                  onChange={(e) => handleSubCitySelect(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs"
                >
                  {ADDIS_ABABA_SUB_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
              {/* Grade 12 completion document */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Grade 12 completion document *</span>
                  {grade12DocUrl && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </Label>
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto" />
                  <div className="text-xs text-muted-foreground">
                    <label
                      htmlFor="grade12-upload"
                      className="cursor-pointer font-bold text-primary hover:underline"
                    >
                      {uploadingGrade12 ? "Uploading..." : "Upload document"}
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      PDF, JPG or PNG (Max 5 MB)
                    </p>
                  </div>
                  <input
                    id="grade12-upload"
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    className="hidden"
                    disabled={uploadingGrade12}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, "grade12", setGrade12DocUrl, setUploadingGrade12);
                      }
                    }}
                  />
                  {grade12DocUrl && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {grade12DocUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* National Identity Document (ID) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Identity document (ID) *</span>
                  {identityDocUrl && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                </Label>
                <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2 bg-muted/10 hover:bg-muted/20 transition-colors">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground mx-auto" />
                  <div className="text-xs text-muted-foreground">
                    <label
                      htmlFor="id-upload"
                      className="cursor-pointer font-bold text-primary hover:underline"
                    >
                      {uploadingId ? "Uploading..." : "Upload document"}
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      PDF, JPG or PNG (Max 5 MB)
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
                      if (file) {
                        handleFileUpload(file, "id", setIdentityDocUrl, setUploadingId);
                      }
                    }}
                  />
                  {identityDocUrl && (
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {identityDocUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/40">
              <span className="text-[11px] text-muted-foreground">
                Final document rules set by CONMART.
              </span>
              <Button
                onClick={() => {
                  if (!fullName.trim()) {
                    setFormError("Full name is required.");
                    return;
                  }
                  if (!phone.trim()) {
                    setFormError("Phone number is required.");
                    return;
                  }
                  if (!grade12DocUrl) {
                    setFormError("Please upload your Grade 12 completion document.");
                    return;
                  }
                  if (!identityDocUrl) {
                    setFormError("Please upload your National ID document.");
                    return;
                  }
                  setFormError(null);
                  setCurrentStep(3);
                }}
                className="font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: WORK AREA & AVAILABILITY */}
      {currentStep === 3 && (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <div>
                  <CardTitle className="text-base font-bold">Work area & availability</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Choose where you can work and when you are available.
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
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Visual Map Preview Graphic */}
              <div className="space-y-4">
                <div className="relative rounded-2xl border border-border bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[300px] overflow-hidden text-center">
                  {/* Concentric service area circles */}
                  <div className="absolute size-56 rounded-full border border-primary/20 bg-primary/5 animate-pulse" />
                  <div className="absolute size-40 rounded-full border border-primary/40 bg-primary/10" />

                  {/* Agent Center Marker */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <MapPin className="size-5" />
                    </div>
                    <span className="mt-2 text-xs font-black text-white">Agent service area</span>
                    <span className="text-[11px] text-primary font-bold">
                      {serviceArea} ({travelRadiusKm} km)
                    </span>
                  </div>

                  {/* Scattered Supplier Pins around center */}
                  <div className="absolute top-8 left-12 flex items-center gap-1 text-[10px] text-blue-400 font-semibold bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <Building2 className="h-3 w-3" /> Supplier
                  </div>
                  <div className="absolute top-12 right-10 flex items-center gap-1 text-[10px] text-blue-400 font-semibold bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <Building2 className="h-3 w-3" /> Supplier
                  </div>
                  <div className="absolute bottom-8 right-14 flex items-center gap-1 text-[10px] text-blue-400 font-semibold bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <Building2 className="h-3 w-3" /> Supplier
                  </div>
                  <div className="absolute bottom-10 left-10 flex items-center gap-1 text-[10px] text-blue-400 font-semibold bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <Building2 className="h-3 w-3" /> Supplier
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-primary" />
                    Your selected area
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-blue-500" />
                    Suppliers in depot network
                  </span>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    No continuous location tracking. Do not display home address publicly.
                  </span>
                </div>
              </div>

              {/* Right Form Fields */}
              <div className="space-y-5">
                {/* Choose service area */}
                <div className="space-y-2">
                  <Label htmlFor="agent-service-area" className="text-xs font-bold">
                    Choose service area *
                  </Label>
                  <select
                    id="agent-service-area"
                    value={serviceArea}
                    onChange={(e) => handleSubCitySelect(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs"
                  >
                    {ADDIS_ABABA_SUB_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Set approximate map pin */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Set approximate map pin</Label>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 text-xs bg-muted/20">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {serviceArea} Coordinates
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Lat: {latitude.toFixed(4)}°, Lng: {longitude.toFixed(4)}°
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-primary">
                      Preset Pin
                    </Badge>
                  </div>
                </div>

                {/* Travel radius (km) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label htmlFor="agent-radius" className="font-bold">
                      Travel radius (km)
                    </Label>
                    <span className="font-mono font-bold text-primary">{travelRadiusKm} km</span>
                  </div>
                  <input
                    id="agent-radius"
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={travelRadiusKm}
                    onChange={(e) => setTravelRadiusKm(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1 km</span>
                    <span>5 km (Recommended)</span>
                    <span>20 km</span>
                  </div>
                </div>

                {/* Available days & hours */}
                <div className="space-y-2">
                  <Label htmlFor="agent-hours" className="text-xs font-bold">
                    Available days & hours *
                  </Label>
                  <select
                    id="agent-hours"
                    value={availableDaysHours}
                    onChange={(e) => setAvailableDaysHours(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs"
                  >
                    <option value="Mon - Fri, 9:00 - 17:00">Mon - Fri, 9:00 - 17:00</option>
                    <option value="Mon - Sat, 8:30 - 18:00">Mon - Sat, 8:30 - 18:00</option>
                    <option value="Weekends, 9:00 - 18:00">Weekends, 9:00 - 18:00</option>
                    <option value="Mornings only (8:00 - 12:00)">Mornings only (8:00 - 12:00)</option>
                    <option value="Afternoons only (13:00 - 18:00)">Afternoons only (13:00 - 18:00)</option>
                  </select>
                </div>

                {/* Available for assignments switch */}
                <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/10">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold cursor-pointer">
                      Available for assignments
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Allow nearby buyers to be matched to your coverage area
                    </p>
                  </div>
                  <Switch
                    checked={isAvailableForAssignments}
                    onCheckedChange={setIsAvailableForAssignments}
                  />
                </div>

                <Button
                  onClick={() => {
                    setFormError(null);
                    setCurrentStep(4);
                  }}
                  className="w-full font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                >
                  <span>Continue to Guarantee</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: GUARANTEE & CONSENT */}
      {currentStep === 4 && (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </span>
                <div>
                  <CardTitle className="text-base font-bold">Guarantee & consent</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Provide a guarantor or an alternative guarantee.
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
          <CardContent className="p-6 space-y-6">
            {/* Guarantee Type Radio Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Select guarantee type (one option)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setGuarantorType("GOVERNMENT_EMPLOYEE")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    guarantorType === "GOVERNMENT_EMPLOYEE"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        guarantorType === "GOVERNMENT_EMPLOYEE"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {guarantorType === "GOVERNMENT_EMPLOYEE" && (
                        <div className="size-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Government-employee guarantor
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        A government employee agrees to act as your guarantor.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setGuarantorType("COMMUNITY_OR_OTHER")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    guarantorType === "COMMUNITY_OR_OTHER"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        guarantorType === "COMMUNITY_OR_OTHER"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {guarantorType === "COMMUNITY_OR_OTHER" && (
                        <div className="size-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Other guarantee — subject to review
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Provide another accepted guarantee (e.g. community leader, recognized
                        organization, or other).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Option A: Government Employee Fields */}
            {guarantorType === "GOVERNMENT_EMPLOYEE" && (
              <div className="rounded-xl border border-border/80 p-5 space-y-4 bg-muted/10">
                <span className="text-xs font-bold text-foreground block">
                  Guarantor details (government employee)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="guar-name" className="text-xs">
                      Guarantor name *
                    </Label>
                    <Input
                      id="guar-name"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      placeholder="e.g. Tesfaye Degu"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guar-phone" className="text-xs">
                      Phone number *
                    </Label>
                    <Input
                      id="guar-phone"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      placeholder="e.g. 0912 345 678"
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guar-emp" className="text-xs">
                      Employer / organization
                    </Label>
                    <Input
                      id="guar-emp"
                      value={guarantorEmployer}
                      onChange={(e) => setGuarantorEmployer(e.target.value)}
                      placeholder="e.g. City Administration"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guar-rel" className="text-xs">
                      Relationship
                    </Label>
                    <Input
                      id="guar-rel"
                      value={guarantorRelationship}
                      onChange={(e) => setGuarantorRelationship(e.target.value)}
                      placeholder="e.g. Colleague"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs flex items-center justify-between">
                    <span>Supporting document (Employment letter / ID)</span>
                    {guarantorDocUrl && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                  </Label>
                  <div className="rounded-lg border border-dashed border-border p-3 text-center bg-card">
                    <label
                      htmlFor="guar-doc-upload"
                      className="cursor-pointer text-xs font-bold text-primary hover:underline"
                    >
                      {uploadingGuarantorDoc ? "Uploading..." : "Upload document (PDF, JPG or PNG)"}
                    </label>
                    <input
                      id="guar-doc-upload"
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                      disabled={uploadingGuarantorDoc}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, "guarantor", setGuarantorDocUrl, setUploadingGuarantorDoc);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Option B: Other Guarantee Details */}
            {guarantorType === "COMMUNITY_OR_OTHER" && (
              <div className="rounded-xl border border-border/80 p-5 space-y-4 bg-muted/10">
                <span className="text-xs font-bold text-foreground block">
                  Alternative guarantee details
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="alt-name" className="text-xs">
                      Contact / Leader name *
                    </Label>
                    <Input
                      id="alt-name"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      placeholder="e.g. Woreda Community Leader"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="alt-phone" className="text-xs">
                      Contact phone *
                    </Label>
                    <Input
                      id="alt-phone"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      placeholder="e.g. 0911 223 344"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alt-desc" className="text-xs">
                    Describe your guarantee *
                  </Label>
                  <Textarea
                    id="alt-desc"
                    value={guarantorDescription}
                    onChange={(e) => setGuarantorDescription(e.target.value)}
                    placeholder="e.g. Community leader reference, recognized organization affiliation, or property deed."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center justify-between">
                    <span>Supporting evidence document</span>
                    {guarantorDocUrl && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                      </span>
                    )}
                  </Label>
                  <div className="rounded-lg border border-dashed border-border p-3 text-center bg-card">
                    <label
                      htmlFor="alt-doc-upload"
                      className="cursor-pointer text-xs font-bold text-primary hover:underline"
                    >
                      {uploadingGuarantorDoc ? "Uploading..." : "Upload document (PDF, JPG or PNG)"}
                    </label>
                    <input
                      id="alt-doc-upload"
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                      disabled={uploadingGuarantorDoc}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, "guarantor", setGuarantorDocUrl, setUploadingGuarantorDoc);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Consent & Submit */}
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border/80 bg-background cursor-pointer hover:bg-muted/20">
                <input
                  type="checkbox"
                  checked={guarantorConsentObtained}
                  onChange={(e) => setGuarantorConsentObtained(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                />
                <span className="text-xs text-foreground font-semibold">
                  Guarantor consent obtained. I confirm that the named individual or organization has
                  authorized acting as my guarantor for ConMart field representation.
                </span>
              </label>

              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>CONMART verifies guarantee and identity before approval.</span>
              </div>

              <Button
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="w-full font-bold gap-2 py-6 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
