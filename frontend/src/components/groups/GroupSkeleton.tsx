import { GlassCard } from "@/components/glass";
import { Skeleton } from "@/components/ui/skeleton";

export function GroupCardSkeleton() {
  return (
    <GlassCard className="p-5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
      <Skeleton className="mt-5 h-6 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
      <Skeleton className="mt-4 h-8 w-24 rounded-full" />
    </GlassCard>
  );
}

export function GroupsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </div>
  );
}
