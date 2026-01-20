import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse-soft bg-gray-200 rounded',
        className
      )}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  return (
    <div className={clsx('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  hasImage?: boolean;
}

export function SkeletonCard({ className, hasImage = false }: SkeletonCardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 p-4 space-y-4',
        className
      )}
      aria-hidden="true"
    >
      {hasImage && <Skeleton className="h-32 w-full rounded-lg" />}
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

interface SkeletonListItemProps {
  className?: string;
  hasAvatar?: boolean;
}

export function SkeletonListItem({ className, hasAvatar = false }: SkeletonListItemProps) {
  return (
    <div
      className={clsx('flex items-center gap-4 p-4', className)}
      aria-hidden="true"
    >
      {hasAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

interface SkeletonDeckGridProps {
  count?: number;
}

export function SkeletonDeckGrid({ count = 6 }: SkeletonDeckGridProps) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading decks"
    >
      <span className="sr-only">Loading decks...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4 h-[150px] flex flex-col"
          aria-hidden="true"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-6 w-6 rounded flex-shrink-0 ml-2" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonDashboardProps {
  className?: string;
}

export function SkeletonDashboard({ className }: SkeletonDashboardProps) {
  return (
    <div className={clsx('space-y-6', className)} role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard...</span>

      {/* Header */}
      <div className="flex items-center justify-between" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Content section */}
      <div className="grid gap-6 lg:grid-cols-2" aria-hidden="true">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}
