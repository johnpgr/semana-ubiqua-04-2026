"use client"

import { ShieldAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[50svh] w-full max-w-3xl items-center">
      <Alert variant="destructive" className="gap-3 rounded-2xl p-5 sm:p-6">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4" />
        <AlertTitle>O painel admin não carregou corretamente.</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            Não foi possível buscar os dados mais recentes. Recarregue esta tela
            para retomar a jornada com o estado atual do sistema.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" onClick={reset}>
              Recarregar painel
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

