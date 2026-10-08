import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Tabs / Filter bar */}
      <div className="flex gap-2 border-b border-border/60 pb-3">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Table Content */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <SkeletonTable rows={6} columns={6} />
      </div>
    </div>
  );
}
