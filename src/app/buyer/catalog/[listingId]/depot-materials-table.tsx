// ConMart — Depot Available Materials Table (Client Component)
// Shows other active materials at the same depot yard so buyers can identify
// same-trip freight savings. Links to listing detail for enquiry or chat.
// Fully bilingual English & Amharic.

"use client";

import Link from "next/link";
import {
  Building2,
  MapPin,
  Truck,
  ArrowRight,
  Sparkles,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
} from "@/lib/i18n/translations";
import type { CatalogListing } from "@/lib/data/catalog";
import { getProductFallback } from "@/lib/data/category-images";

interface DepotMaterialsTableProps {
  depotName: string;
  location: string;
  listings: CatalogListing[];
}

export function DepotMaterialsTable({
  depotName,
  location,
  listings,
}: DepotMaterialsTableProps) {
  const { t, locale } = useLanguage();

  if (listings.length === 0) {
    return null;
  }

  const localizedLocation = getLocalizedLocation(location, locale);

  return (
    <Card className="border-primary/30 bg-card/80 shadow-md">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                {t("depot_other_materials")}
              </CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
              <span>{depotName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-amber-500" />
                {localizedLocation}
              </span>
            </p>
          </div>

          <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold py-1 px-3 gap-1.5 self-start sm:self-auto">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("depot_freight_advantage")}</span>
          </Badge>
        </div>

        {/* Logistics Callout */}
        <div className="mt-3 rounded-lg border border-border/40 bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <span>{t("depot_bundle_callout")}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Mobile View: Stacked Touch-Friendly Cards (No horizontal panning) */}
        <div className="sm:hidden divide-y divide-border/40">
          {listings.map((item) => {
            const unitLabel = getLocalizedUnit(item.product.unit, locale);
            const itemCategory = getCategoryTitle(
              item.product.category.slug,
              item.product.category.name,
              locale
            );
            return (
              <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        item.imageUrl ||
                        item.product.imageUrl ||
                        getProductFallback(item.product.category.slug)
                      }
                      alt={item.product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/buyer/catalog/${item.id}`}
                      className="font-bold text-xs text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {itemCategory}
                      </Badge>
                      {item.lowestPrice ? (
                        <span className="font-mono font-bold text-xs text-foreground">
                          {formatETB(item.lowestPrice, locale)}
                          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                            /{unitLabel}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          {t("depot_price_on_request")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link href={`/buyer/catalog/${item.id}`} className="shrink-0">
                  <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs font-semibold gap-1">
                    {t("depot_btn_view", "View")}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Multi-column Table */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="text-xs font-semibold">{t("depot_col_material")}</TableHead>
                <TableHead className="text-xs font-semibold">{t("depot_col_category")}</TableHead>
                <TableHead className="text-xs font-semibold">{t("depot_col_wholesale_price")}</TableHead>
                <TableHead className="text-xs font-semibold text-right">{t("depot_col_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((item) => {
                const unitLabel = getLocalizedUnit(item.product.unit, locale);
                const itemCategory = getCategoryTitle(
                  item.product.category.slug,
                  item.product.category.name,
                  locale
                );

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              item.imageUrl ||
                              item.product.imageUrl ||
                              getProductFallback(item.product.category.slug)
                            }
                            alt={item.product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/buyer/catalog/${item.id}`}
                            className="font-semibold text-xs text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {item.product.title}
                          </Link>
                          {item.product.specs && Object.keys(item.product.specs).length > 0 && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {Object.entries(item.product.specs)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {itemCategory}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {item.lowestPrice ? (
                        <div>
                          <span className="font-bold text-xs text-foreground">
                            {formatETB(item.lowestPrice, locale)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            /{unitLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("depot_price_on_request")}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/buyer/catalog/${item.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" title="View listing">
                          {t("depot_btn_view", "View")}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
