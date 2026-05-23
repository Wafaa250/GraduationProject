import { surfaceCardClass } from '@/shared/styles/layout'
import { cn } from '@/shared/lib/cn'
import { statCardClass } from '@/shared/styles/appShell'

function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <Bone className="h-36 w-full rounded-2xl" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={statCardClass}>
            <Bone className="size-10 rounded-lg" />
            <Bone className="mt-4 h-8 w-16" />
            <Bone className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn(surfaceCardClass, 'h-64 p-6')} />
        <div className={cn(surfaceCardClass, 'h-64 p-6')} />
      </div>

      <div className={cn(surfaceCardClass, 'p-6')}>
        <Bone className="h-5 w-40" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
