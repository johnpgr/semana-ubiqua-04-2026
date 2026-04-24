import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MinhaContaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["perfil", "conta", "limite", "confianca"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-5 w-28" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
