import { cn } from "@/lib/utils"

function getAspectRatioStyle(ratio: number) {
  return {
    "--ratio": ratio,
  } as React.CSSProperties
}

function AspectRatio({
  ratio,
  className,
  ...props
}: React.ComponentProps<"div"> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={getAspectRatioStyle(ratio)}
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  )
}

export { AspectRatio }
