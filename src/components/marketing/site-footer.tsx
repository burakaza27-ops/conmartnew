"use client";

import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { useLanguage } from "@/lib/i18n/language-context";

export function SiteFooter() {
  const { t } = useLanguage();
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <Logo href="/" subtitle="Ethiopia" size="sm" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t(
              "brand_tagline",
              "Ethiopia’s B2B marketplace for depot-direct construction materials."
            )}
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
            {t("nav_categories", "Marketplace")}
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/buyer" className="transition-colors hover:text-foreground">
                {t("nav_categories", "Browse categories")}
              </Link>
            </li>
            <li>
              <Link
                href="/buyer/category/all"
                className="transition-colors hover:text-foreground"
              >
                {t("nav_all_materials", "All materials")}
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition-colors hover:text-foreground">
                {t("nav_about", "About ECON")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
            {t("footer_suppliers_heading", "Suppliers")}
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/register" className="transition-colors hover:text-foreground">
                {t("about_cta_seller_btn", "Register as a supplier")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-foreground">
                {t("nav_seller_portal", "Supplier portal")}
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition-colors hover:text-foreground">
                {t("about_pillar_3_title", "80% refund credit")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
            {t("nav_support", "Desk")}
          </h2>
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Phone className="size-3.5 text-primary" />
            {adminPhone}
          </p>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Addis Ababa, Bole
          </p>
        </div>
      </div>

      <div className="border-t border-border/70">
        <p className="mx-auto max-w-6xl px-4 py-4 text-2xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} ECON Ethiopia. {t("footer_tagline")}
        </p>
      </div>
    </footer>
  );
}
