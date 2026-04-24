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
import {
  getMonitoringPresentationCopy,
  getUserSafeFraudSummary,
  getUserSafePartnerSummary,
  getUserVisibleCommunications,
} from "@/lib/analysisPresentation"
import { buildAnalysisView } from "@/lib/analysisView"
import {
  getCreditDecisionLabel,
  getRequestStatusLabel,
} from "@/lib/credit-requests"
import { buildEmailCommunicationBundle } from "@/lib/emailCommunication"
import { buildDecisionExplainability } from "@/lib/explainability"
import { calculateFraudScore } from "@/lib/fraudScore"
import { getMockPartnerIndicatorProfile } from "@/lib/partnerIndicators"
import { evaluatePostCreditMonitoring } from "@/lib/postCreditMonitoring"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { ConsentScopeLabels } from "@/validation/consent"

import { SimulatedDisbursementCard } from "./simulated-disbursement-card"

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

type DisbursementSnapshot = {
  approvedAmount: number
  destination: string
  disbursedAt: string
  status: "active"
}

type ResultCardProps = {
  initialRequest: CreditRequestRow
  initialConsent: ConsentRow | null
  initialScore: ScoreRow | null
  initialTransactions: TransactionRow[]
  requestHistory: RequestHistoryRow[]
  initialMockProfile: string | null
  initialDisbursement: DisbursementSnapshot | null
}

export function ResultCard({
  initialRequest,
  initialConsent,
  initialScore,
  initialTransactions,
  requestHistory,
  initialMockProfile,
  initialDisbursement,
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
        const [requestResult, scoreResult, transactionsResult] =
          await Promise.all([
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

        if (
          requestResult.error ||
          scoreResult.error ||
          transactionsResult.error
        ) {
          setPollError("Não foi possível atualizar o resultado agora.")
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
  const analysisView = buildAnalysisView({
    request,
    consent: initialConsent,
    score: processedScore,
    transactions,
    requestHistory,
    mockProfile: initialMockProfile,
  })
  const progressiveCredit = analysisView?.progressiveCredit ?? null
  const fraudScore = analysisView?.fraudScore ?? null
  const partnerFraud = analysisView?.partnerFraud ?? null
  const monitoring = analysisView?.monitoring ?? null
  const partnerIndicators = analysisView?.partnerIndicators ?? null
  const explainability = analysisView?.explainability ?? null
  const emailCommunication = analysisView?.emailCommunication ?? null
  const userEmailCommunication =
    getUserVisibleCommunications(emailCommunication)
  const safeFraudSummary = partnerFraud
    ? getUserSafeFraudSummary(partnerFraud)
    : null
  const monitoringCopy = monitoring
    ? getMonitoringPresentationCopy(monitoring)
    : null
  const consentScopeSummary = initialConsent
    ? initialConsent.scopes.map((scope) => ConsentScopeLabels[scope]).join(", ")
    : "Aguardando registro"

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
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {processedScore.value}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Decisao</div>
                  <div className="mt-1 text-base font-semibold">
                    {request.decision
                      ? getCreditDecisionLabel(request.decision)
                      : "Em análise"}
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

              {progressiveCredit ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={progressiveBadgeVariant}>
                      {progressiveCredit.levelLabel}
                    </Badge>
                    {progressiveCredit.isConservativeInitialOffer ? (
                      <Badge variant="outline">
                        Concessao inicial conservadora
                      </Badge>
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
                      <div className="text-muted-foreground">
                        Teto desta etapa
                      </div>
                      <div className="mt-1 font-semibold">
                        {currencyFormatter.format(progressiveCredit.appliedCap)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">
                        Evolucao futura
                      </div>
                      <div className="mt-1 font-semibold">
                        {progressiveCredit.isFirstConcession
                          ? "Observar ciclos futuros"
                          : "Seguir acumulando confianca"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {partnerFraud ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={RISK_BADGE_VARIANTS[partnerFraud.riskLevel]}
                    >
                      {FRAUD_RISK_LABELS[partnerFraud.riskLevel]}
                    </Badge>
                    <Badge variant="outline">Resumo de seguranca</Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">
                      {safeFraudSummary?.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {safeFraudSummary?.summary}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm leading-6">
                    {safeFraudSummary?.notes.map((note) => (
                      <li
                        key={note}
                        className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {monitoring ? (
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={RISK_BADGE_VARIANTS[monitoring.riskLevel]}>
                      {MONITORING_RISK_LABELS[monitoring.riskLevel]}
                    </Badge>
                    <Badge variant="outline">
                      {
                        LIMIT_ACTION_LABELS[
                          monitoring.limitRecommendation.action
                        ]
                      }
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">
                      {monitoringCopy?.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {monitoringCopy?.summary}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">
                        Leitura inicial
                      </div>
                      <div className="mt-1 font-semibold">
                        {monitoringCopy?.status}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-muted-foreground">Limite futuro</div>
                      <div className="mt-1 font-semibold">
                        {
                          LIMIT_ACTION_LABELS[
                            monitoring.limitRecommendation.action
                          ]
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {partnerIndicators ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {partnerIndicators.partnerName}
                    </Badge>
                    <Badge
                      variant={
                        PARTNER_SIGNAL_CONFIG[
                          partnerIndicators.impact.confidenceSignal
                        ].badgeVariant
                      }
                    >
                      {
                        PARTNER_SIGNAL_CONFIG[
                          partnerIndicators.impact.confidenceSignal
                        ].label
                      }
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">
                      Indicadores externos de parceiro
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {partnerIndicators.summary}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getUserSafePartnerSummary(
                      partnerIndicators.impact.confidenceSignal
                    )}
                  </p>
                </div>
              ) : null}

              {explainability ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        DECISION_MODE_BADGE_VARIANTS[
                          explainability.decisionMode
                        ]
                      }
                    >
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
                    <div className="text-sm font-medium">
                      {explainability.headline}
                    </div>
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

              {userEmailCommunication.primary ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        EMAIL_CATEGORY_CONFIG[
                          userEmailCommunication.primary.category
                        ].badgeVariant
                      }
                    >
                      {
                        EMAIL_CATEGORY_CONFIG[
                          userEmailCommunication.primary.category
                        ].label
                      }
                    </Badge>
                    <Badge variant="outline">
                      {
                        EMAIL_STATUS_LABELS[
                          userEmailCommunication.primary.status
                        ]
                      }
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">
                      Comunicacao oficial por email
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Preview do email principal que o OpenCred geraria neste
                      momento.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Assunto
                    </div>
                    <div className="mt-1 text-sm font-medium">
                      {userEmailCommunication.primary.subject}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {userEmailCommunication.primary.preview}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Corpo resumido
                    </div>
                    <p className="mt-2 text-sm">
                      {userEmailCommunication.primary.content.intro}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6">
                      {userEmailCommunication.primary.content.highlights.map(
                        (highlight) => (
                          <li
                            key={highlight}
                            className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                          >
                            {highlight}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  {userEmailCommunication.communications.length > 1 ? (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Outras comunicacoes geradas
                      </h3>
                      <ul className="space-y-2 text-sm">
                        {userEmailCommunication.communications
                          .slice(1)
                          .map((communication) => (
                            <li
                              key={communication.id}
                              className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                            >
                              <span className="font-medium">
                                {communication.subject}
                              </span>
                              <span className="block text-muted-foreground">
                                {communication.preview}
                              </span>
                            </li>
                          ))}
                      </ul>
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
                    Atualizamos este resultado automaticamente a cada 3
                    segundos.
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

      <div className="flex flex-col gap-4 self-start">
        <Card className="border border-border/70 bg-muted/40">
          <CardHeader className="space-y-3">
            <CardTitle>Resumo da análise</CardTitle>
            <CardDescription className="space-y-3 text-sm leading-6">
              <p>
                Número da solicitação: <strong>{request.id}</strong>
              </p>
              <p>
                Valor pedido:{" "}
                <strong>
                  {currencyFormatter.format(request.requested_amount)}
                </strong>
              </p>
              <p>
                Status: <strong>{getRequestStatusLabel(request.status)}</strong>
              </p>
              {progressiveCredit ? (
                <p>
                  Nível de confiança:{" "}
                  <strong>{progressiveCredit.levelLabel}</strong>
                </p>
              ) : null}
              {fraudScore ? (
                <p>
                  Fraude:{" "}
                  <strong>
                    {
                      FRAUD_RISK_LABELS[
                        partnerFraud?.riskLevel ?? fraudScore.riskLevel
                      ]
                    }
                  </strong>
                </p>
              ) : null}
              {monitoring ? (
                <p>
                  Monitoramento:{" "}
                  <strong>
                    {MONITORING_RISK_LABELS[monitoring.riskLevel]}
                  </strong>
                </p>
              ) : null}
              <p>
                Consentimento: <strong>{consentScopeSummary}</strong>
              </p>
            </CardDescription>
          </CardHeader>
        </Card>

        {processedScore ? (
          <SimulatedDisbursementCard
            approvedAmount={request.approved_amount}
            decision={request.decision}
            initialDisbursement={initialDisbursement}
            requestId={request.id}
            requestedAmount={request.requested_amount}
          />
        ) : null}
      </div>
    </div>
  )
}

type FraudRiskLevel = ReturnType<typeof calculateFraudScore>["riskLevel"]
type MonitoringRiskLevel = ReturnType<
  typeof evaluatePostCreditMonitoring
>["riskLevel"]
type DecisionMode = ReturnType<
  typeof buildDecisionExplainability
>["decisionMode"]
type PartnerConfidenceSignal = NonNullable<
  ReturnType<typeof getMockPartnerIndicatorProfile>
>["impact"]["confidenceSignal"]
type EmailCategory = ReturnType<
  typeof buildEmailCommunicationBundle
>["primary"]["category"]
type EmailStatus = ReturnType<
  typeof buildEmailCommunicationBundle
>["primary"]["status"]
type LimitAction = ReturnType<
  typeof evaluatePostCreditMonitoring
>["limitRecommendation"]["action"]

const RISK_BADGE_VARIANTS = {
  critical: "destructive",
  high: "destructive",
  moderate: "outline",
  low: "secondary",
} as const satisfies Record<FraudRiskLevel | MonitoringRiskLevel, string>

const FRAUD_RISK_LABELS = {
  critical: "Fraude critica",
  high: "Fraude alta",
  moderate: "Fraude moderada",
  low: "Fraude baixa",
} as const satisfies Record<FraudRiskLevel, string>

const MONITORING_RISK_LABELS = {
  critical: "Risco critico",
  high: "Risco alto",
  moderate: "Risco moderado",
  low: "Risco baixo",
} as const satisfies Record<MonitoringRiskLevel, string>

const DECISION_MODE_BADGE_VARIANTS = {
  preventive_block: "destructive",
  review_additional: "outline",
  automatic: "secondary",
} as const satisfies Record<DecisionMode, string>

const PARTNER_SIGNAL_CONFIG = {
  caution: {
    badgeVariant: "outline",
    label: "Reforca cautela",
  },
  neutral: {
    badgeVariant: "secondary",
    label: "Complemento moderado",
  },
  reinforce: {
    badgeVariant: "default",
    label: "Reforca confianca",
  },
} as const satisfies Record<
  PartnerConfidenceSignal,
  { badgeVariant: string; label: string }
>

const EMAIL_CATEGORY_CONFIG = {
  decision: {
    badgeVariant: "secondary",
    label: "Decisao",
  },
  transparency: {
    badgeVariant: "outline",
    label: "Transparencia",
  },
  risk: {
    badgeVariant: "outline",
    label: "Risco",
  },
  security: {
    badgeVariant: "destructive",
    label: "Seguranca",
  },
  operation: {
    badgeVariant: "secondary",
    label: "Operacao",
  },
} as const satisfies Record<
  EmailCategory,
  { badgeVariant: string; label: string }
>

const EMAIL_STATUS_LABELS = {
  sent_mock: "Envio mockado",
  queued: "Na fila",
  previewed: "Preview",
  generated: "Gerado",
} as const satisfies Record<EmailStatus, string>

const LIMIT_ACTION_LABELS = {
  manual_review: "Revisao manual",
  reduce_future_exposure: "Reduzir exposicao",
  freeze_growth: "Congelar crescimento",
  renegotiation_watch: "Observar renegociacao",
  maintain: "Manter limite",
} as const satisfies Record<LimitAction, string>
