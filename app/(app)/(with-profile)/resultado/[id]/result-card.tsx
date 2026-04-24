"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { evaluateProgressiveCreditState } from "@/lib/creditProgression"
import { buildDecisionExplainability } from "@/lib/explainability"
import { calculateFraudScore } from "@/lib/fraudScore"
import { evaluatePostCreditMonitoring } from "@/lib/postCreditMonitoring"
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
  "scopes" | "granted_at" | "user_agent" | "ip_address"
>

type ScoreRow = Pick<
  Database["public"]["Tables"]["scores"]["Row"],
  "value" | "reasons" | "suggested_limit"
>

type TransactionRow = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  "amount" | "category" | "description" | "kind" | "occurred_at"
>

type RequestHistoryRow = {
  id: string
  status: string
  decision: string | null
  approved_amount: number | null
  created_at: string
  decided_at: string | null
}

type ResultCardProps = {
  initialRequest: CreditRequestRow
  initialConsent: ConsentRow | null
  initialScore: ScoreRow | null
  initialTransactions: TransactionRow[]
  requestHistory: RequestHistoryRow[]
}

export function ResultCard({
  initialRequest,
  initialConsent,
  initialScore,
  initialTransactions,
  requestHistory,
}: ResultCardProps) {
  const [request, setRequest] = useState(initialRequest)
  const [score, setScore] = useState(initialScore)
  const [transactions, setTransactions] = useState(initialTransactions)
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
        const [requestResult, scoreResult, transactionsResult] = await Promise.all([
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
          supabase
            .from("transactions")
            .select("amount, category, description, kind, occurred_at")
            .eq("request_id", initialRequest.id)
            .order("occurred_at", { ascending: false })
            .limit(200),
        ])

        if (cancelled) {
          return
        }

        if (requestResult.error || scoreResult.error || transactionsResult.error) {
          setPollError("Nao foi possivel atualizar o resultado agora.")
          return
        }

        if (requestResult.data) {
          setRequest(requestResult.data)
        }

        setScore(scoreResult.data ?? null)
        setTransactions(transactionsResult.data ?? [])
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
  const progressiveCredit =
    processedScore && request.decision
      ? evaluateProgressiveCreditState({
          requestedAmount: request.requested_amount,
          score: processedScore.value,
          baseDecision: request.decision,
          baseSuggestedLimit: processedScore.suggested_limit,
          requestHistory: requestHistory.map((historyRow) => ({
            id: historyRow.id,
            status: historyRow.status,
            decision:
              historyRow.decision as
                | "approved"
                | "approved_reduced"
                | "further_review"
                | "denied"
                | null,
            approvedAmount: historyRow.approved_amount,
            createdAt: historyRow.created_at,
            decidedAt: historyRow.decided_at,
          })),
        })
      : null
  const fraudScore =
    processedScore && transactions.length > 0
      ? calculateFraudScore({
          transactions: transactions.map((transaction) => ({
            occurredAt: transaction.occurred_at,
            amount: transaction.amount,
            kind: transaction.kind,
            category: transaction.category,
            description: transaction.description,
          })),
          deviceTrust: {
            userAgent: initialConsent?.user_agent,
            ipAddress: normalizeIpAddress(initialConsent?.ip_address),
          },
        })
      : null
  const monitoring =
    processedScore && progressiveCredit
      ? evaluatePostCreditMonitoring({
          transactions: transactions.map((transaction) => ({
            occurredAt: transaction.occurred_at,
            amount: transaction.amount,
            kind: transaction.kind,
            category: transaction.category,
            description: transaction.description,
          })),
          creditScoreValue: processedScore.value,
          creditDecision: request.decision as
            | "approved"
            | "approved_reduced"
            | "further_review"
            | "denied",
          suggestedLimit: processedScore.suggested_limit,
          approvedAmount: request.approved_amount,
          fraudScoreValue: fraudScore?.value,
          fraudRiskLevel: fraudScore?.riskLevel,
          confidenceLevel: progressiveCredit.level,
          isFirstConcession: progressiveCredit.isFirstConcession,
          requestHistory: requestHistory.map((historyRow) => ({
            id: historyRow.id,
            status: historyRow.status,
            decision:
              historyRow.decision as
                | "approved"
                | "approved_reduced"
                | "further_review"
                | "denied"
                | null,
            approvedAmount: historyRow.approved_amount,
            createdAt: historyRow.created_at,
            decidedAt: historyRow.decided_at,
          })),
        })
      : null
  const explainability =
    processedScore && request.decision
      ? buildDecisionExplainability({
          decision: request.decision as
            | "approved"
            | "approved_reduced"
            | "further_review"
            | "denied",
          scoreValue: processedScore.value,
          suggestedLimit: processedScore.suggested_limit,
          reasons: processedScore.reasons,
          consentScopes: initialConsent?.scopes,
          progressiveCredit,
          fraudScore,
          monitoring,
        })
      : null

  const progressiveBadgeVariant =
    progressiveCredit?.level === "premium"
      ? "default"
      : progressiveCredit?.level === "trusted"
        ? "secondary"
        : progressiveCredit?.level === "initial_confidence"
          ? "outline"
          : "secondary"

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Resultado
          </div>
          <CardTitle className="text-2xl">
            {processedScore ? "Analise concluida" : "Processando sua analise"}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            {processedScore
              ? "O score ja esta disponivel e o limite agora tambem considera a progressao de confianca do produto."
              : "Os dados mockados ainda serao coletados e pontuados no fluxo atual do MVP."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {processedScore ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-5">
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {processedScore.value}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Decisao</div>
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
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Risco de fraude</div>
                  <div className="mt-2">
                    {fraudScore ? (
                      <Badge variant={getFraudBadgeVariant(fraudScore.riskLevel)}>
                        {getFraudRiskLabel(fraudScore.riskLevel)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Aguardando</Badge>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Monitoramento</div>
                  <div className="mt-2">
                    {monitoring ? (
                      <Badge variant={getMonitoringBadgeVariant(monitoring.riskLevel)}>
                        {getMonitoringRiskLabel(monitoring.riskLevel)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Aguardando</Badge>
                    )}
                  </div>
                </div>
              </div>

              {progressiveCredit ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={progressiveBadgeVariant}>
                      {progressiveCredit.levelLabel}
                    </Badge>
                    {progressiveCredit.isConservativeInitialOffer ? (
                      <Badge variant="outline">Concessao inicial conservadora</Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">
                      Credito progressivo
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {progressiveCredit.progressionSummary}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm leading-6">
                    {progressiveCredit.policyNotes.map((note) => (
                      <li
                        key={note}
                        className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">
                        Aprovacoes anteriores
                      </div>
                      <div className="mt-1 font-semibold">
                        {progressiveCredit.stats.previousApprovedRequests}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">Teto desta etapa</div>
                      <div className="mt-1 font-semibold">
                        {currencyFormatter.format(progressiveCredit.appliedCap)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">Evolucao futura</div>
                      <div className="mt-1 font-semibold">
                        {progressiveCredit.isFirstConcession
                          ? "Observar ciclos futuros"
                          : "Seguir acumulando confianca"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {fraudScore ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getFraudBadgeVariant(fraudScore.riskLevel)}>
                      {getFraudRiskLabel(fraudScore.riskLevel)}
                    </Badge>
                    <Badge variant="outline">Fraud Score {fraudScore.value}</Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">Antifraude comportamental</h2>
                    <p className="text-sm text-muted-foreground">
                      {fraudScore.operationalRecommendation}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm leading-6">
                    {fraudScore.signals.slice(0, 3).map((signal) => (
                      <li
                        key={signal.key}
                        className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                      >
                        <span className="font-medium">{signal.label}:</span>{" "}
                        {signal.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {monitoring ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getMonitoringBadgeVariant(monitoring.riskLevel)}>
                      {getMonitoringRiskLabel(monitoring.riskLevel)}
                    </Badge>
                    <Badge variant="outline">
                      {getLimitActionLabel(monitoring.limitRecommendation.action)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">Monitoramento pos-credito</h2>
                    <p className="text-sm text-muted-foreground">
                      {monitoring.monitoringSummary}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm leading-6">
                    {monitoring.alerts.slice(0, 3).map((alert) => (
                      <li
                        key={alert.key}
                        className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                      >
                        <span className="font-medium">{alert.title}:</span>{" "}
                        {alert.detail}
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">Elegibilidade</div>
                      <div className="mt-1 font-semibold">
                        {getEligibilityLabel(monitoring.eligibility.status)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">Limite futuro</div>
                      <div className="mt-1 font-semibold">
                        {getLimitActionLabel(monitoring.limitRecommendation.action)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {explainability ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getDecisionModeBadgeVariant(explainability.decisionMode)}>
                      {explainability.decisionModeLabel}
                    </Badge>
                    <Badge variant="outline">Explicacao da decisao</Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">
                      Explicabilidade juridica
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {explainability.summary}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="text-sm font-medium">{explainability.headline}</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {explainability.decisionModeDescription}
                    </p>
                  </div>
                  {explainability.primaryFactors.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Fatores principais
                      </h3>
                      <ul className="space-y-2 text-sm leading-6">
                        {explainability.primaryFactors.map((factor) => (
                          <li
                            key={factor.key}
                            className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                          >
                            <span className="font-medium">{factor.label}:</span>{" "}
                            {factor.summary}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Razoes da decisao
                    </h3>
                    <ul className="space-y-2 text-sm leading-6">
                      {explainability.reasons.map((reason) => (
                        <li
                          key={reason.id}
                          className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                        >
                          <span className="font-medium">{reason.title}:</span>{" "}
                          {reason.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {explainability.sensitiveDataNotice ? (
                    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                      <div className="text-sm font-medium">
                        {explainability.sensitiveDataNotice.title}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {explainability.sensitiveDataNotice.message}
                      </p>
                    </div>
                  ) : null}
                  {explainability.futureConsentNotice ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
                      <div className="text-sm font-medium">
                        {explainability.futureConsentNotice.title}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {explainability.futureConsentNotice.message}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-5">
                <Spinner className="size-5" />
                <div className="space-y-1">
                  <p className="font-medium">Processando sua analise...</p>
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
          <CardTitle>Resumo tecnico</CardTitle>
          <CardDescription className="space-y-3 text-sm leading-6">
            <p>
              Solicitacao: <strong>{request.id}</strong>
            </p>
            <p>
              Valor pedido:{" "}
              <strong>
                {currencyFormatter.format(request.requested_amount)}
              </strong>
            </p>
            <p>
              Status: <strong>{request.status}</strong>
            </p>
            {progressiveCredit ? (
              <p>
                Nivel de confianca:{" "}
                <strong>{progressiveCredit.levelLabel}</strong>
              </p>
            ) : null}
            {fraudScore ? (
              <p>
                Fraude: <strong>{getFraudRiskLabel(fraudScore.riskLevel)}</strong>
              </p>
            ) : null}
            {monitoring ? (
              <p>
                Monitoramento:{" "}
                <strong>{getMonitoringRiskLabel(monitoring.riskLevel)}</strong>
              </p>
            ) : null}
            <p>
              Consentimento:{" "}
              <strong>
                {initialConsent
                  ? initialConsent.scopes.join(", ")
                  : "aguardando registro"}
              </strong>
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function getFraudBadgeVariant(riskLevel: ReturnType<typeof calculateFraudScore>["riskLevel"]) {
  switch (riskLevel) {
    case "critical":
      return "destructive"
    case "high":
      return "destructive"
    case "moderate":
      return "outline"
    case "low":
    default:
      return "secondary"
  }
}

function getFraudRiskLabel(riskLevel: ReturnType<typeof calculateFraudScore>["riskLevel"]) {
  switch (riskLevel) {
    case "critical":
      return "Fraude critica"
    case "high":
      return "Fraude alta"
    case "moderate":
      return "Fraude moderada"
    case "low":
    default:
      return "Fraude baixa"
  }
}

function getMonitoringBadgeVariant(
  riskLevel: ReturnType<typeof evaluatePostCreditMonitoring>["riskLevel"],
) {
  switch (riskLevel) {
    case "critical":
      return "destructive"
    case "high":
      return "destructive"
    case "moderate":
      return "outline"
    case "low":
    default:
      return "secondary"
  }
}

function getMonitoringRiskLabel(
  riskLevel: ReturnType<typeof evaluatePostCreditMonitoring>["riskLevel"],
) {
  switch (riskLevel) {
    case "critical":
      return "Risco critico"
    case "high":
      return "Risco alto"
    case "moderate":
      return "Risco moderado"
    case "low":
    default:
      return "Risco baixo"
  }
}

function getDecisionModeBadgeVariant(
  decisionMode: ReturnType<typeof buildDecisionExplainability>["decisionMode"],
) {
  switch (decisionMode) {
    case "preventive_block":
      return "destructive"
    case "review_additional":
      return "outline"
    case "automatic":
    default:
      return "secondary"
  }
}

function getEligibilityLabel(
  status: ReturnType<typeof evaluatePostCreditMonitoring>["eligibility"]["status"],
) {
  switch (status) {
    case "blocked":
      return "Bloqueada"
    case "review_required":
      return "Revisao obrigatoria"
    case "frozen":
      return "Congelada"
    case "watch":
      return "Em observacao"
    case "eligible":
    default:
      return "Elegivel"
  }
}

function getLimitActionLabel(
  action: ReturnType<typeof evaluatePostCreditMonitoring>["limitRecommendation"]["action"],
) {
  switch (action) {
    case "manual_review":
      return "Revisao manual"
    case "reduce_future_exposure":
      return "Reduzir exposicao"
    case "freeze_growth":
      return "Congelar crescimento"
    case "renegotiation_watch":
      return "Observar renegociacao"
    case "maintain":
    default:
      return "Manter limite"
  }
}

function normalizeIpAddress(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (value == null) {
    return null
  }

  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}
