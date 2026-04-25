import { Skeleton } from "@/components/ui/skeleton"

const loadingRows = ["bank", "score", "fraud", "progressive", "explainability"]

export default function AnaliseLoading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
      <div className="flex flex-col gap-4 rounded-xl border bg-background/90 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-2 w-full" />
        <div className="grid gap-3">
          {loadingRows.map((row) => (
            <Skeleton className="h-20 w-full" key={row} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
