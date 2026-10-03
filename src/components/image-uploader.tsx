"use client";

// =============================================================================
// ConMart — Modern Image Uploader Component
// =============================================================================
// Supports:
// 1. Direct device file upload with instant server storage (Supabase + Local Fallback)
// 2. Drag-and-drop zone
// 3. Instant Ethiopian construction material preset templates (zero-latency visual chips)
// 4. Live image preview with aspect ratio preservation and clear/replace action
// =============================================================================

import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Loader2,
  Sparkles,
  Check,
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  TreePine,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

const MATERIAL_PRESETS = [
  {
    name: "OPC Cement",
    nameAm: "ኦፒሲ ሲሚንቶ",
    tag: "Cement",
    tagAm: "ሲሚንቶ",
    icon: Container,
    bg: "bg-slate-800 text-slate-100",
    url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Deformed Rebar",
    nameAm: "የተቆረጠፈ ብረት",
    tag: "Steel",
    tagAm: "ብረታብረት",
    icon: Columns3,
    bg: "bg-amber-950/80 text-amber-300",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "River Sand",
    nameAm: "የወንዝ አሸዋ",
    tag: "Aggregates",
    tagAm: "አሸዋ",
    icon: Mountain,
    bg: "bg-yellow-950/80 text-yellow-300",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Crushed Stone",
    nameAm: "ጠጠር / ኮረት",
    tag: "Aggregates",
    tagAm: "ጠጠር",
    icon: Mountain,
    bg: "bg-stone-800 text-stone-200",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Hollow Blocks",
    nameAm: "ብሎኬት (HCB)",
    tag: "Blocks",
    tagAm: "ብሎኬት",
    icon: LayoutGrid,
    bg: "bg-red-950/70 text-red-300",
    url: "https://images.unsplash.com/photo-1584463699039-44e2b0a1a0df?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Corrugated Roofing",
    nameAm: "የጣሪያ ቆርቆሮ",
    tag: "Roofing",
    tagAm: "ቆርቆሮ",
    icon: Home,
    bg: "bg-cyan-950/70 text-cyan-300",
    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Timber Formwork",
    nameAm: "የፎርምወርክ ሳንቃ",
    tag: "Timber",
    tagAm: "ሳንቃ",
    icon: TreePine,
    bg: "bg-emerald-950/70 text-emerald-300",
    url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80",
  },
];

export function ImageUploader({
  value,
  onChange,
  className,
}: ImageUploaderProps) {
  const { t, locale } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setImageLoadFailed(false);

    // Instant client validation for responsive feedback
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file (JPEG, PNG, WebP, or GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      onChange(data.url);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error uploading image";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        // Preview State
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20 group">
          <div className="relative aspect-video w-full overflow-hidden bg-black/5 flex items-center justify-center">
            {!imageLoadFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Uploaded material"
                onError={() => setImageLoadFailed(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Package className="h-10 w-10 text-primary mb-2 opacity-80" />
                <p className="text-xs font-semibold text-foreground">
                  Material Image Attached
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs">
                  {value}
                </p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
          </div>

          {/* Action buttons on hover */}
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 bg-background/90 text-xs backdrop-blur-xs hover:bg-background shadow-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {t("uploader_replace")}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 shadow-xs"
              onClick={() => {
                onChange("");
                setImageLoadFailed(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="p-3 bg-card border-t border-border/60 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="h-4 w-4" /> {t("uploader_ready")}
            </span>
            <span className="text-muted-foreground truncate max-w-[200px]">
              {value.startsWith("/uploads") ? t("uploader_stored_local") : t("uploader_cloud_storage")}
            </span>
          </div>
        </div>
      ) : (
        // Dropzone State
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 hover:border-primary/50 hover:bg-muted/30",
            isDragging
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border/80 bg-muted/10",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">{t("uploader_uploading")}</p>
              <p className="text-xs text-muted-foreground">{t("uploader_persisting")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("uploader_click_drag")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("uploader_file_support")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded-lg border border-destructive/20">
          {errorMessage}
        </p>
      )}

      {/* Preset Showcase Selector (Zero Network Overhead) */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>{t("uploader_or_preset")}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MATERIAL_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = value === preset.url;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setImageLoadFailed(false);
                }}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg border p-2 text-left transition-all hover:border-primary/50 hover:bg-muted/40",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border/60 bg-card/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-transform group-hover:scale-105 shadow-2xs",
                    preset.bg
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-tight truncate text-foreground">
                    {locale === "am" ? preset.nameAm : preset.name}
                  </p>
                  <span className="text-[9px] text-muted-foreground">
                    {locale === "am" ? preset.tagAm : preset.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
