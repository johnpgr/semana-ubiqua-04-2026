"use client"

import { useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

type CreditRequestRow = Pick<
  Database["public"]["Tables"]["credit_requests"]["Row"],
  "id" | "requested_amount" | "status" | "decision" | "approved_amount"
>

type ConsentRow = Pick<
  Database["public"]["Tables"]["consents"]["Row"],
  "scopes" | "granted_at"
>

type ScoreRow = Pick<
  Database["public"]["Tables"]["scores"]["Row"],
  "value" | "reasons" | "suggested_limit"
>

type ResultCardProps = {
  initialRequest: CreditRequestRow
  initialConsent: ConsentRow | null
  initialScore: ScoreRow | null
}

export function ResultCard({
  initialRequest,
  initialConsent,
  initialScore,
}: ResultCardProps) {
  const [request, setRequest] = useState(initialRequest)
  const [score, setScore] = useState(initialScore)
  const [pollError, setPollError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const isComplete = Boolean(request.decision && score)

  useEffect(() => {
    if (isComplete) {
      return
    }

    let cancelled = false
    let isPolling = false

    async function pollResult() {
      if (isPolling) {
        return
      }

      isPolling = true

      try {
        const [requestResult, scoreResult] = await Promise.all([
          supabase
            .from("credit_requests")
            .select("id, requested_amount, status, decision, approved_amount")
            .eq("id", initialRequest.id)
            .maybeSingle(),
          supabase
            .from("scores")
            .select("value, reasons, suggested_limit")
            .eq("request_id", initialRequest.id)
            .maybeSingle(),
        ])

        if (cancelled) {
          return
        }

        if (requestResult.error || scoreResult.error) {
          setPollError("Não foi possível atualizar o resultado agora.")
          return
        }

        if (requestResult.data) {
          setRequest(requestResult.data)
        }

        setScore(scoreResult.data ?? null)
        setPollError(null)
      } finally {
        isPolling = false
      }
    }

    void pollResult()
    const intervalId = window.setInterval(() => {
      void pollResult()
    }, 3000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [initialRequest.id, isComplete, supabase])

  const processedScore = score && request.decision ? score : null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Resultado
          </div>
          <CardTitle className="text-2xl">
            {processedScore ? "Análise concluída" : "Processando sua análise"}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            {processedScore
              ? "O score já está disponível para leitura nesta mesma tela."
              : "Os dados mockados ainda serão coletados e pontuados no passo 7 do MVP."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {processedScore ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {processedScore.value}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Decisão</div>
                  <div className="mt-1 text-base font-semibold">
                    {request.decision}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">
                    Limite sugerido
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    {currencyFormatter.format(processedScore.suggested_limit)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Razões
                </h2>
                <ul className="space-y-2 text-sm leading-6">
                  {processedScore.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-5">
                <Spinner className="size-5" />
                <div className="space-y-1">
                  <p className="font-medium">Processando sua análise...</p>
                  <p className="text-sm text-muted-foreground">
                    Atualizamos este resultado automaticamente a cada 3 segundos.
                  </p>
                </div>
              </div>
              {pollError ? (
                <p className="text-sm text-destructive">{pollError}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-muted/40">
        <CardHeader className="space-y-3">
          <CardTitle>Resumo técnico</CardTitle>
          <CardDescription className="space-y-3 text-sm leading-6">
            <p>
              Solicitação: <strong>{request.id}</strong>
            </p>
            <p>
              Valor pedido: <strong>{currencyFormatter.format(request.requested_amount)}</strong>
            </p>
            <p>
              Status: <strong>{request.status}</strong>
            </p>
            <p>
              Consentimento: <strong>{initialConsent ? initialConsent.scopes.join(", ") : "aguardando registro"}</strong>
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
