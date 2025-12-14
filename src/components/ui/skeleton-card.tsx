import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-5 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-muted rounded animate-shimmer w-3/4" />
          <div className="h-4 bg-muted rounded animate-shimmer w-1/2" />
        </div>
        <div className="h-6 w-16 bg-muted rounded animate-shimmer" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-20 bg-muted rounded animate-shimmer" />
        <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-8 w-24 bg-muted rounded animate-shimmer" />
        <div className="h-9 w-20 bg-muted rounded animate-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-muted rounded animate-shimmer" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-muted/50 rounded animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-3">
      <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
      <div className="h-8 w-16 bg-muted rounded animate-shimmer" />
      <div className="h-3 w-32 bg-muted rounded animate-shimmer" />
    </div>
  );
}
