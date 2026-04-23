"use client"

import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[50svh] w-full max-w-2xl items-center">
      <Alert variant="destructive" className="gap-3 rounded-2xl p-5 sm:p-6">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4" />
        <AlertTitle>Não foi possível carregar esta etapa.</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            Houve uma falha ao preparar os dados do seu fluxo. Tente novamente
            para seguir de onde você parou.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={reset}>
              Tentar novamente
            </Button>
            {error.digest ? (
              <span className="text-xs text-destructive/80">
                Referência: {error.digest}
              </span>
            ) : null}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
