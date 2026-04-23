import { Skeleton } from "@/components/ui/skeleton"

function FlowCardSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <FlowCardSkeleton />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <FlowCardSkeleton />
        <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
