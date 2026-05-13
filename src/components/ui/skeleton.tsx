import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-slate-200/80", className)}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-3.5", className)} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-1/3" />
        <SkeletonText className="w-2/3 h-3" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-5 space-y-3",
        className
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <SkeletonText className="w-full" />
    </div>
  );
}

export function SkeletonStatsGrid({ items = 4 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <SkeletonText className="w-64" />
      </div>
      <SkeletonStatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <SkeletonText className="w-1/3" />
        </div>
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function SkeletonMap({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        "h-[600px] rounded-2xl bg-gradient-to-br from-slate-200/80 to-slate-100",
        className
      )}
    />
  );
}

export function SkeletonMessageList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonText className="w-1/3" />
            <SkeletonText className="w-2/3 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-64 rounded-2xl" />
      </div>
      <div className="flex">
        <Skeleton className="h-16 w-72 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonAuthCheck() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <SkeletonStatsGrid />
        <SkeletonList rows={4} />
      </div>
    </div>
  );
}
