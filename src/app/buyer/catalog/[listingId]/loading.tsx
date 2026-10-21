import { Skeleton } from "@/components/ui/skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-pulse max-w-5xl mx-auto">
      {/* Back button */}
      <div className="h-4 w-32 rounded bg-muted/60" />

      {/* Main card grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="aspect-[16/10] w-full rounded-2xl bg-muted/70 overflow-hidden" />
          <div className="h-16 rounded-xl border border-border/50 bg-muted/20" />
          <div className="h-28 rounded-xl border border-border/50 bg-muted/20" />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <div className="pt-4 space-y-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
