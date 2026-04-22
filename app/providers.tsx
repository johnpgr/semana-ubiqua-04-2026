import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </TooltipProvider>
  )
}
