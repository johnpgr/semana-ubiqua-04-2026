import { Skeleton } from "@/components/ui/skeleton"

function DashboardPanelSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <Skeleton className="mb-4 h-5 w-32" />
      <Skeleton className="h-44 w-full" />
    </div>
  )
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-full sm:w-48" />
        <Skeleton className="h-10 w-full sm:w-48" />
        <Skeleton className="h-5 w-28 sm:ml-auto" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardPanelSkeleton />
        <DashboardPanelSkeleton />
        <DashboardPanelSkeleton />
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <div className="space-y-3">
          {["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"].map((rowKey) => (
            <Skeleton key={rowKey} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
