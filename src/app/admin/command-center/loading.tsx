import { Skeleton } from "@/components/ui/skeleton";

export default function CommandCenterLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI grid */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-3.5 space-y-2"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-5 space-y-2"
          >
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-28 rounded-lg mt-2" />
          </div>
        ))}
      </div>

      {/* Tables */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-3"
        >
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
