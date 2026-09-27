import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/glass";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-5">
        <Skeleton className="h-64 w-full" />
      </GlassCard>
      <GlassCard className="p-5">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
