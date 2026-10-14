// =============================================================================
// ECON — Admin Category & Unlock Fee Editor Component
// =============================================================================

"use client";

import React, { useState, useTransition } from "react";
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/i18n/translations";
import {
  updateCategoryFeeAction,
  toggleCategoryActiveAction,
} from "@/app/actions/categories";

export interface CategoryAdminItem {
  id: string;
  name: string;
  slug: string;
  unlockFee: number;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

interface CategoryFeeEditorProps {
  initialCategories: CategoryAdminItem[];
}

export function CategoryFeeEditor({ initialCategories }: CategoryFeeEditorProps) {
  const [categories, setCategories] = useState<CategoryAdminItem[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFeeValue, setEditFeeValue] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = (cat: CategoryAdminItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const nextState = !cat.isActive;

    startTransition(async () => {
      const res = await toggleCategoryActiveAction({
        categoryId: cat.id,
        isActive: nextState,
      });

      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextState } : c))
        );
        setSuccessMsg(`Category ${cat.name} ${nextState ? "activated" : "deactivated"}.`);
      } else {
        setErrorMsg(res.error || "Failed to update category state.");
      }
    });
  };

  const handleStartEdit = (cat: CategoryAdminItem) => {
    setEditingId(cat.id);
    setEditFeeValue(cat.unlockFee.toString());
  };

  const handleSaveFee = (categoryId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsed = parseFloat(editFeeValue);
    if (isNaN(parsed) || parsed < 0) {
      setErrorMsg("Please enter a valid non-negative fee amount.");
      return;
    }

    startTransition(async () => {
      const res = await updateCategoryFeeAction({
        categoryId,
        unlockFee: parsed,
      });

      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? { ...c, unlockFee: parsed } : c))
        );
        setEditingId(null);
        setSuccessMsg("Unlock fee updated successfully.");
      } else {
        setErrorMsg(res.error || "Failed to update fee.");
      }
    });
  };

  return (
    <Card className="border-border shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Category Control & Introduction Fees
            </CardTitle>
            <CardDescription>
              Configure the introduction unlock fee (ETB) and enable/disable material categories in the catalog.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {categories.length} Categories
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Materials</th>
                <th className="py-3 px-4">Introduction Unlock Fee</th>
                <th className="py-3 px-4">Platform Status</th>
                <th className="py-3 px-4 text-right">Fee Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <tr key={cat.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {cat.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {cat.slug}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                      {cat.productCount}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <Input
                            type="number"
                            min="0"
                            step="25"
                            value={editFeeValue}
                            onChange={(e) => setEditFeeValue(e.target.value)}
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-sm text-foreground">
                          {formatPrice(cat.unlockFee, "en")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
                      >
                        {cat.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                            <span className="text-muted-foreground">Disabled</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveFee(cat.id)}
                            disabled={isPending}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={isPending}
                            className="h-7 px-2 text-xs text-muted-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(cat)}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit Fee
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
