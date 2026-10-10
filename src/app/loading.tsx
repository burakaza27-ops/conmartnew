import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center space-y-4 max-w-sm w-full text-center">
        {/* Animated Brand Skeleton */}
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <div className="h-6 w-6 rounded bg-primary/40" />
        </div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Content Preview Skeletons */}
      <div className="w-full max-w-3xl space-y-4 pt-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
