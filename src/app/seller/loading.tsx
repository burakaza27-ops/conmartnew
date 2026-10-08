import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

export default function SellerLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Top Banner / Welcome skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Subscription & Referral row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Active Listings / Enquiries Table */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  );
}
