import { Skeleton } from "@/components/ui/skeleton";

export default function ProductOffersLoading() {
  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-pulse max-w-5xl mx-auto">
      {/* Back link skeleton */}
      <div className="h-4 w-36 rounded bg-muted/60" />

      {/* Hero Product Card Skeleton */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Image skeleton */}
          <div className="md:col-span-5 aspect-[4/3] rounded-xl bg-muted/70 overflow-hidden" />

          {/* Details skeleton */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>

            <Skeleton className="h-8 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-3/5 rounded" />

            <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-10 w-44 rounded-lg" />
              <Skeleton className="h-3 w-52 rounded" />
            </div>

            <div className="flex gap-3 pt-2">
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Safety notice skeleton */}
      <div className="h-16 rounded-xl border border-border/50 bg-muted/20" />

      {/* Supplying depots title skeleton */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-6 w-48 rounded" />
        <div className="grid gap-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
