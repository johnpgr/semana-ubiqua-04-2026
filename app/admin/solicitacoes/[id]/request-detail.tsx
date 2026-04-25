"use client"

import Link from "next/link"
import { AlertCircle, FileSearch } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildAnalysisView } from "@/lib/analysisView"
import type { ProgressiveCreditState } from "@/lib/creditProgression"
import { buildEmailCommunicationBundle } from "@/lib/emailCommunication"
import { buildDecisionExplainability } from "@/lib/explainability"
import { calculateFraudScore } from "@/lib/fraudScore"
import { getMockPartnerIndicatorProfile } from "@/lib/partnerIndicators"
import { evaluatePostCreditMonitoring } from "@/lib/postCreditMonitoring"
import { MOCK_PROFILE_LABELS } from "@/validation/auth"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR")
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})
const chartTick = { fontSize: 10 }

const flowTooltipFormatter = ((value: number) =>
  currencyFormatter.format(value)) as React.ComponentProps<typeof Tooltip>["formatter"]

type BadgeVariant = NonNullable<React.ComponentPropsWithoutRef<typeof Badge>["variant"]>

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  awaiting_consent: "secondary",
  collecting_data: "default",
  scoring: "outline",
  decided: "default",
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_consent: "Aguardando consentimento",
  collecting_data: "Coletando dados",
  scoring: "Scoring",
  decided: "Decidido",
}

const DECISION_VARIANT: Record<string, BadgeVariant> = {
  approved: "default",
  approved_reduced: "secondary",
  further_review: "outline",
  denied: "destructive",
}

const DECISION_LABEL: Record<string, string> = {
  approved: "Aprovado",
  approved_reduced: "Aprovado reduzido",
  further_review: "RevisÃ£o manual",
  denied: "Negado",
}

type ProfileJoin = {
  name: string
  cpf: string
  mock_profile: string
} | null

export type RequestDetailProps = {
  request: {
    id: string
    user_id: string
    status: string
    decision: string | null
    requested_amount: number
    approved_amount: number | null
    created_at: string
    decided_at: string | null
    profile: ProfileJoin
  }
  progression: ProgressiveCreditState | null
  requestHistory: {
    id: string
    status: string
    decision: "approved" | "approved_reduced" | "further_review" | "denied" | null
    approvedAmount: number | null
    createdAt: string
    decidedAt: string | null
  }[]
  consents: {
    scopes: string[]
    granted_at: string
    user_agent: string | null
    ip_address: unknown
  }[]
  consentsError: boolean
  transactions: {
    amount: number
    category: string
    description: string
    kind: string
    occurred_at: string
    source: string
  }[]
  transactionsError: boolean
  score: {
    value: number
    suggested_limit: number
    reasons: string[]
    regularity: number
    capacity: number
    stability: number
    behavior: number
    data_quality: number
  } | null
  scoreError: boolean
  auditLogs: {
    action: string
    actor: string | null
    created_at: string
    metadata: unknown
  }[]
  auditLogsError: boolean
}

function buildMonthlyFlow(transactions: RequestDetailProps["transactions"]) {
  const map = new Map<string, { month: string; credit: number; debit: number }>()

  for (const transaction of transactions) {
    const date = new Date(transaction.occurred_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`

    if (!map.has(key)) {
      map.set(key, { month: label, credit: 0, debit: 0 })
    }

    const entry = map.get(key)!
    if (transaction.kind === "credit") {
      entry.credit += transaction.amount
    } else {
      entry.debit += transaction.amount
    }
  }

  return Array.from(map.values()).toReversed()
}

function SectionError({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

function SectionEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="rounded-2xl border border-dashed bg-card py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearch aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function KeyValueRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-left sm:text-right">{children}</span>
    </div>
  )
}

function formatProfileLabel(profile: string | null | undefined) {
  if (!profile) {
    return "â€”"
  }

  if (profile in MOCK_PROFILE_LABELS) {
    return MOCK_PROFILE_LABELS[profile as keyof typeof MOCK_PROFILE_LABELS]
  }

  return profile
}

export function RequestDetail({
  request,
  progression,
  requestHistory,
  consents,
  consentsError,
  transactions,
  transactionsError,
  score,
  scoreError,
  auditLogs,
  auditLogsError,
}: RequestDetailProps) {
  const monthlyFlow = buildMonthlyFlow(transactions)
  const latestConsent = consents[0]
  const analysisView = buildAnalysisView({
    request,
    consent: latestConsent,
    score,
    transactions,
    requestHistory: requestHistory.map((historyRow) => ({
      id: historyRow.id,
      status: historyRow.status,
      decision: historyRow.decision,
      approved_amount: historyRow.approvedAmount,
      created_at: historyRow.createdAt,
      decided_at: historyRow.decidedAt,
    })),
    mockProfile: request.profile?.mock_profile,
    recipientName: request.profile?.name,
  })
  const effectiveProgression = analysisView?.progressiveCredit ?? progression
  const fraudScore = analysisView?.fraudScore ?? null
  const partnerIndicators = analysisView?.partnerIndicators ?? null
  const partnerFraud = analysisView?.partnerFraud ?? null
  const monitoring = analysisView?.monitoring ?? null
  const explainability = analysisView?.explainability ?? null
  const emailCommunication = analysisView?.emailCommunication ?? null
  const communicationAuditLogs = auditLogs.filter(
    (log) => log.action === "email_communication_generated",
  )
  const deliveryStatusByTemplateKey = buildDeliveryStatusByTemplateKey(auditLogs)

  const dimensions = score
    ? [
        { key: "regularity", label: "Regularidade", value: score.regularity },
        { key: "capacity", label: "Capacidade", value: score.capacity },
        { key: "stability", label: "Estabilidade", value: score.stability },
        { key: "behavior", label: "Comportamento", value: score.behavior },
        { key: "data_quality", label: "Qualidade dos dados", value: score.data_quality },
      ]
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          Voltar
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-medium break-words">
          SolicitaÃ§Ã£o {request.id.slice(0, 8)}
        </h1>
        <p className="text-sm text-muted-foreground">
          VisÃ£o consolidada da anÃ¡lise para operaÃ§Ã£o.
        </p>
      </div>

      <Tabs defaultValue="resumo">
        <ScrollArea className="w-full whitespace-nowrap rounded-xl">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="consentimento">Consentimento</TabsTrigger>
            <TabsTrigger value="transacoes">TransaÃ§Ãµes</TabsTrigger>
            <TabsTrigger value="score">Score</TabsTrigger>
            <TabsTrigger value="comunicacoes">Comunicacoes</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="resumo" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <KeyValueRow label="Nome">{request.profile?.name ?? "â€”"}</KeyValueRow>
                <KeyValueRow label="CPF">{request.profile?.cpf ?? "â€”"}</KeyValueRow>
                <KeyValueRow label="Perfil financeiro">
                  {formatProfileLabel(request.profile?.mock_profile)}
                </KeyValueRow>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>SolicitaÃ§Ã£o</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <KeyValueRow label="Status">
                  <Badge variant={STATUS_VARIANT[request.status] ?? "secondary"}>
                    {STATUS_LABEL[request.status] ?? request.status}
                  </Badge>
                </KeyValueRow>
                <KeyValueRow label="DecisÃ£o">
                  <Badge
                    variant={
                      request.decision
                        ? (DECISION_VARIANT[request.decision] ?? "secondary")
                        : "secondary"
                    }
                  >
                    {request.decision
                      ? (DECISION_LABEL[request.decision] ?? request.decision)
                      : "â€”"}
                  </Badge>
                </KeyValueRow>
                {effectiveProgression ? (
                  <KeyValueRow label="Nivel de confianca">
                    <Badge
                      variant={
                        effectiveProgression.level === "premium"
                          ? "default"
                          : effectiveProgression.level === "trusted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {effectiveProgression.levelLabel}
                    </Badge>
                  </KeyValueRow>
                ) : null}
                {fraudScore ? (
                  <KeyValueRow label="Risco de fraude">
                    <Badge variant={RISK_BADGE_VARIANTS[partnerFraud?.riskLevel ?? fraudScore.riskLevel]}>
                      {FRAUD_RISK_LABELS[partnerFraud?.riskLevel ?? fraudScore.riskLevel]}
                    </Badge>
                  </KeyValueRow>
                ) : null}
                {monitoring ? (
                  <KeyValueRow label="Monitoramento">
                    <Badge variant={RISK_BADGE_VARIANTS[monitoring.riskLevel]}>
                      {MONITORING_RISK_LABELS[monitoring.riskLevel]}
                    </Badge>
                  </KeyValueRow>
                ) : null}
                <KeyValueRow label="Valor solicitado">
                  {currencyFormatter.format(request.requested_amount)}
                </KeyValueRow>
                <KeyValueRow label="Valor aprovado">
                  {request.approved_amount != null
                    ? currencyFormatter.format(request.approved_amount)
                    : "â€”"}
                </KeyValueRow>
              </CardContent>
            </Card>
          </div>

          {effectiveProgression ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Credito progressivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      effectiveProgression.level === "premium"
                        ? "default"
                        : effectiveProgression.level === "trusted"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {effectiveProgression.levelLabel}
                  </Badge>
                  {effectiveProgression.isConservativeInitialOffer ? (
                    <Badge variant="outline">Concessao inicial conservadora</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground">
                  {effectiveProgression.progressionSummary}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">
                      Aprovadas anteriormente
                    </div>
                    <div className="mt-1 font-medium">
                      {effectiveProgression.stats.previousApprovedRequests}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Teto desta etapa</div>
                    <div className="mt-1 font-medium">
                      {currencyFormatter.format(effectiveProgression.appliedCap)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Ciclos pagos em dia</div>
                    <div className="mt-1 font-medium">
                      {effectiveProgression.stats.onTimeCycles}
                    </div>
                  </div>
                </div>
                {effectiveProgression.policyNotes.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {effectiveProgression.policyNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {partnerFraud ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Fraud Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={RISK_BADGE_VARIANTS[partnerFraud.riskLevel]}>
                    {FRAUD_RISK_LABELS[partnerFraud.riskLevel]}
                  </Badge>
                  <Badge variant="outline">Score {partnerFraud.value}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {partnerFraud.operationalRecommendation}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Transferencias espelhadas</div>
                    <div className="mt-1 font-medium">
                      {partnerFraud.metrics.mirroredTransferCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Saida rapida</div>
                    <div className="mt-1 font-medium">
                      {Math.round(partnerFraud.metrics.fastOutflowRatio * 100)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Repeticao de valores</div>
                    <div className="mt-1 font-medium">
                      {Math.round(partnerFraud.metrics.repeatedAmountRatio * 100)}%
                    </div>
                  </div>
                </div>
                {partnerFraud.signals.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {partnerFraud.signals.slice(0, 4).map((signal) => (
                      <li key={signal.key}>
                        <span className="font-medium">{signal.label}:</span>{" "}
                        {signal.detail}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {monitoring ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Acompanhamento inicial de risco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={RISK_BADGE_VARIANTS[monitoring.riskLevel]}>
                    {MONITORING_RISK_LABELS[monitoring.riskLevel]}
                  </Badge>
                  <Badge variant="outline">
                    {LIMIT_ACTION_LABELS[monitoring.limitRecommendation.action]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Leitura projetada no momento da concessao. Ciclos reais de
                  pagamento ainda serao incorporados em evolucoes futuras.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <div className="text-muted-foreground">Elegibilidade</div>
                      <div className="mt-1 font-medium">
                        {ELIGIBILITY_LABELS[monitoring.eligibility.status]}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <div className="text-muted-foreground">Limite futuro</div>
                      <div className="mt-1 font-medium">
                        {LIMIT_ACTION_LABELS[monitoring.limitRecommendation.action]}
                      </div>
                    </div>
                </div>
                {monitoring.alerts.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {monitoring.alerts.slice(0, 4).map((alert) => (
                      <li key={alert.key}>
                        <span className="font-medium">{alert.title}:</span>{" "}
                        {alert.detail}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {partnerIndicators ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Indicadores de parceiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{partnerIndicators.partnerName}</Badge>
                  <Badge
                    variant={
                      PARTNER_SIGNAL_CONFIG[partnerIndicators.impact.confidenceSignal].badgeVariant
                    }
                  >
                    {PARTNER_SIGNAL_CONFIG[partnerIndicators.impact.confidenceSignal].label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{partnerIndicators.summary}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Credito</div>
                    <div className="mt-1 font-medium">
                      {formatSignedNumber(partnerIndicators.impact.creditScoreDelta)} pontos
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Fraude</div>
                    <div className="mt-1 font-medium">
                      {formatSignedNumber(partnerIndicators.impact.fraudScoreDelta)} pontos
                    </div>
                  </div>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                    {partnerIndicators.indicators.map((indicator) => (
                      <li key={`${indicator.partnerId}-${indicator.indicatorType}`}>
                        <span className="font-medium">
                          {PARTNER_INDICATOR_LABELS[indicator.indicatorType]}:
                        </span>{" "}
                        {indicator.indicatorValue}/100 com confianca {Math.round(indicator.confidenceLevel * 100)}%.
                      </li>
                  ))}
                </ul>
                <p className="text-muted-foreground">
                  {partnerIndicators.impact.summary}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {explainability ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Explicabilidade juridica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={DECISION_MODE_BADGE_VARIANTS[explainability.decisionMode]}>
                    {explainability.decisionModeLabel}
                  </Badge>
                  <Badge variant="outline">Mensagem ao usuario</Badge>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{explainability.headline}</div>
                  <p className="text-muted-foreground">{explainability.summary}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <div className="text-muted-foreground">Modo da decisao</div>
                  <div className="mt-1 font-medium">
                    {explainability.decisionModeDescription}
                  </div>
                </div>
                {explainability.primaryFactors.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {explainability.primaryFactors.map((factor) => (
                      <li key={factor.key}>
                        <span className="font-medium">{factor.label}:</span>{" "}
                        {factor.summary}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {explainability.reasons.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {explainability.reasons.map((reason) => (
                      <li key={reason.id}>
                        <span className="font-medium">{reason.title}:</span>{" "}
                        {reason.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {explainability.sensitiveDataNotice ? (
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="font-medium">
                      {explainability.sensitiveDataNotice.title}
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {explainability.sensitiveDataNotice.message}
                    </p>
                  </div>
                ) : null}
                {explainability.futureConsentNotice ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-3">
                    <div className="font-medium">
                      {explainability.futureConsentNotice.title}
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {explainability.futureConsentNotice.message}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {emailCommunication ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Comunicacao oficial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={EMAIL_CATEGORY_CONFIG[emailCommunication.primary.category].badgeVariant}
                  >
                    {EMAIL_CATEGORY_CONFIG[emailCommunication.primary.category].label}
                  </Badge>
                  <Badge variant="outline">
                    {EMAIL_STATUS_LABELS[emailCommunication.primary.status]}
                  </Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <div className="text-muted-foreground">Assunto principal</div>
                  <div className="mt-1 font-medium">
                    {emailCommunication.primary.subject}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {emailCommunication.primary.preview}
                </p>
                <KeyValueRow label="Comunicacoes geradas">
                  {emailCommunication.communications.length}
                </KeyValueRow>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <KeyValueRow label="Criado em">
                {dateTimeFormatter.format(new Date(request.created_at))}
              </KeyValueRow>
              <KeyValueRow label="Decidido em">
                {request.decided_at
                  ? dateTimeFormatter.format(new Date(request.decided_at))
                  : "â€”"}
              </KeyValueRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consentimento" className="space-y-4 pt-4">
          {consentsError ? (
            <SectionError
              title="Consentimentos indisponÃ­veis"
              description="NÃ£o foi possÃ­vel buscar os consentimentos desta solicitaÃ§Ã£o."
            />
          ) : consents.length === 0 ? (
            <SectionEmpty
              title="Nenhum consentimento registrado"
              description="Esta solicitaÃ§Ã£o ainda nÃ£o recebeu escopos aprovados pelo usuÃ¡rio."
            />
          ) : (
            consents.map((consent, index) => (
              <Card key={`${consent.granted_at}-${consent.scopes.join("-")}`} className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Consentimento #{index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {consent.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <KeyValueRow label="Concedido em">
                    {dateTimeFormatter.format(new Date(consent.granted_at))}
                  </KeyValueRow>
                  <KeyValueRow label="User-Agent">
                    <span className="block max-w-full break-words">
                      {consent.user_agent ?? "â€”"}
                    </span>
                  </KeyValueRow>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="transacoes" className="space-y-4 pt-4">
          {transactionsError ? (
            <SectionError
              title="TransaÃ§Ãµes indisponÃ­veis"
              description="A leitura do histÃ³rico financeiro falhou nesta consulta."
            />
          ) : transactions.length === 0 ? (
            <SectionEmpty
              title="Nenhuma transaÃ§Ã£o encontrada"
              description="As transaÃ§Ãµes ainda nÃ£o foram geradas ou nÃ£o ficaram disponÃ­veis para esta anÃ¡lise."
            />
          ) : (
            <>
              {monthlyFlow.length > 0 ? (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Fluxo mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyFlow}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={chartTick} />
                        <YAxis tick={chartTick} />
                        <Tooltip formatter={flowTooltipFormatter} />
                        <Bar dataKey="credit" fill="#22c55e" name="Entradas" />
                        <Bar dataKey="debit" fill="#ef4444" name="SaÃ­das" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}

              <div className="space-y-3 md:hidden">
                {transactions.map((transaction) => (
                  <Card
                    key={`${transaction.occurred_at}-${transaction.amount}-${transaction.description}`}
                    className="rounded-2xl"
                  >
                    <CardContent className="space-y-3 p-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            transaction.kind === "credit" ? "default" : "destructive"
                          }
                        >
                          {transaction.kind === "credit" ? "Entrada" : "SaÃ­da"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {dateFormatter.format(new Date(transaction.occurred_at))}
                        </span>
                      </div>
                      <KeyValueRow label="Categoria">{transaction.category}</KeyValueRow>
                      <KeyValueRow label="DescriÃ§Ã£o">
                        <span className="break-words">{transaction.description}</span>
                      </KeyValueRow>
                      <KeyValueRow label="Valor">
                        {currencyFormatter.format(transaction.amount)}
                      </KeyValueRow>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden rounded-2xl border bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>DescriÃ§Ã£o</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={`${transaction.occurred_at}-${transaction.amount}-${transaction.description}`}
                      >
                        <TableCell>
                          {dateFormatter.format(new Date(transaction.occurred_at))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.kind === "credit"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.kind === "credit" ? "Entrada" : "SaÃ­da"}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {currencyFormatter.format(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="score" className="space-y-4 pt-4">
          {scoreError ? (
            <SectionError
              title="Score indisponÃ­vel"
              description="O motor de score nÃ£o devolveu um resultado acessÃ­vel nesta consulta."
            />
          ) : !score ? (
            <SectionEmpty
              title="Score ainda nÃ£o calculado"
              description="A solicitaÃ§Ã£o segue sem breakdown persistido para exibiÃ§Ã£o."
            />
          ) : (
            <>
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <KeyValueRow label="Score">
                    <span className="font-medium">{score.value}</span>
                  </KeyValueRow>
                  <KeyValueRow label="Limite sugerido">
                    <span className="font-medium">
                      {currencyFormatter.format(score.suggested_limit)}
                    </span>
                  </KeyValueRow>
                  <KeyValueRow label="DecisÃ£o">
                    <Badge
                      variant={
                        request.decision
                          ? (DECISION_VARIANT[request.decision] ?? "secondary")
                          : "secondary"
                      }
                    >
                      {request.decision
                        ? (DECISION_LABEL[request.decision] ?? request.decision)
                        : "â€”"}
                    </Badge>
                  </KeyValueRow>
                  {fraudScore ? (
                    <KeyValueRow label="Fraud Score">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant={RISK_BADGE_VARIANTS[partnerFraud?.riskLevel ?? fraudScore.riskLevel]}>
                          {FRAUD_RISK_LABELS[partnerFraud?.riskLevel ?? fraudScore.riskLevel]}
                        </Badge>
                        <span className="font-medium">{partnerFraud?.value ?? fraudScore.value}</span>
                      </div>
                    </KeyValueRow>
                  ) : null}
                  {monitoring ? (
                    <KeyValueRow label="Acompanhamento inicial">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant={RISK_BADGE_VARIANTS[monitoring.riskLevel]}>
                          {MONITORING_RISK_LABELS[monitoring.riskLevel]}
                        </Badge>
                        <span className="font-medium">
                          {ELIGIBILITY_LABELS[monitoring.eligibility.status]}
                        </span>
                      </div>
                    </KeyValueRow>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>DimensÃµes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dimensions.map((dimension) => (
                    <Progress key={dimension.key} value={dimension.value}>
                      <ProgressLabel>{dimension.label}</ProgressLabel>
                      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                        {dimension.value}
                      </span>
                      <ProgressTrack>
                        <ProgressIndicator />
                      </ProgressTrack>
                    </Progress>
                  ))}
                </CardContent>
              </Card>

              {score.reasons.length > 0 ? (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>RazÃµes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1 pl-4 text-sm">
                      {score.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              {explainability ? (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Leitura explicavel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <KeyValueRow label="Modo da decisao">
                      <Badge variant={DECISION_MODE_BADGE_VARIANTS[explainability.decisionMode]}>
                        {explainability.decisionModeLabel}
                      </Badge>
                    </KeyValueRow>
                    <KeyValueRow label="Resumo">
                      <span className="block break-words">
                        {explainability.summary}
                      </span>
                    </KeyValueRow>
                    <KeyValueRow label="Fatores principais">
                      <span className="block break-words">
                        {explainability.primaryFactors.map((factor) => factor.label).join(", ") || "â€”"}
                      </span>
                    </KeyValueRow>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="comunicacoes" className="space-y-4 pt-4">
          {!emailCommunication ? (
            <SectionEmpty
              title="Nenhuma comunicacao disponivel"
              description="A comunicacao oficial por email ainda nao foi composta para esta solicitacao."
            />
          ) : (
            <>
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Email principal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={EMAIL_CATEGORY_CONFIG[emailCommunication.primary.category].badgeVariant}
                    >
                      {EMAIL_CATEGORY_CONFIG[emailCommunication.primary.category].label}
                    </Badge>
                    <Badge variant="outline">
                      {EMAIL_STATUS_LABELS[emailCommunication.primary.status]}
                    </Badge>
                  </div>
                  <KeyValueRow label="Tipo">
                    {emailCommunication.primary.type}
                  </KeyValueRow>
                  <KeyValueRow label="Assunto">
                    <span className="block break-words">
                      {emailCommunication.primary.subject}
                    </span>
                  </KeyValueRow>
                  <KeyValueRow label="Resumo">
                    <span className="block break-words">
                      {emailCommunication.primary.preview}
                    </span>
                  </KeyValueRow>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="font-medium">Corpo resumido</div>
                    <p className="mt-2">{emailCommunication.primary.content.intro}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-4">
                      {emailCommunication.primary.content.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Bundle de comunicacoes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {emailCommunication.communications.map((communication) => {
                    const deliveryStatus = deliveryStatusByTemplateKey.get(
                      communication.audit.templateKey,
                    )

                    return (
                    <div
                      key={communication.id}
                      className="rounded-xl border border-border/70 bg-muted/30 p-3"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={EMAIL_CATEGORY_CONFIG[communication.category].badgeVariant}
                          >
                            {EMAIL_CATEGORY_CONFIG[communication.category].label}
                          </Badge>
                          <Badge variant="outline">
                            {EMAIL_STATUS_LABELS[communication.status]}
                          </Badge>
                          {deliveryStatus ? (
                            <Badge
                              variant={DELIVERY_STATUS_CONFIG[deliveryStatus].badgeVariant}
                            >
                              {DELIVERY_STATUS_CONFIG[deliveryStatus].label}
                            </Badge>
                          ) : null}
                        </div>
                      <div className="mt-3 font-medium">{communication.subject}</div>
                      <p className="mt-1 text-muted-foreground">
                        {communication.preview}
                      </p>
                    </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Trilha de auditoria da comunicacao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {communicationAuditLogs.length === 0 ? (
                    <SectionEmpty
                      title="Sem eventos de comunicacao"
                      description="A auditoria ainda nao registrou geracao formal de comunicacoes para esta solicitacao."
                    />
                  ) : (
                    communicationAuditLogs.map((log) => {
                      const metadata = parseEmailAuditMetadata(log.metadata)

                      return (
                        <div
                          key={`${log.created_at}-${log.action}-${log.actor}`}
                          className="rounded-xl border border-border/70 bg-muted/30 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{log.action}</div>
                            {metadata?.category ? (
                              <Badge variant={EMAIL_CATEGORY_CONFIG[metadata.category].badgeVariant}>
                                {EMAIL_CATEGORY_CONFIG[metadata.category].label}
                              </Badge>
                            ) : null}
                            {metadata?.status ? (
                              <Badge variant="outline">
                                {EMAIL_STATUS_LABELS[metadata.status]}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {dateTimeFormatter.format(new Date(log.created_at))}
                          </p>
                          {metadata?.subject ? (
                            <p className="mt-2 text-sm">{metadata.subject}</p>
                          ) : null}
                          {metadata?.preview ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {metadata.preview}
                            </p>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4 pt-4">
          {auditLogsError ? (
            <SectionError
              title="Auditoria indisponÃ­vel"
              description="Os registros de auditoria nÃ£o puderam ser carregados agora."
            />
          ) : auditLogs.length === 0 ? (
            <SectionEmpty
              title="Nenhum registro de auditoria"
              description="Ainda nÃ£o houve eventos persistidos para esta solicitaÃ§Ã£o."
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {auditLogs.map((log) => {
                  const metadata =
                    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
                      ? (log.metadata as Record<string, unknown>)
                      : null
                  const label = AUDIT_ACTION_LABELS[log.action] ?? log.action

                  return (
                    <Card key={`${log.created_at}-${log.action}`} className="rounded-2xl">
                      <CardContent className="space-y-3 p-4 text-sm">
                        <KeyValueRow label="Data">
                          {dateTimeFormatter.format(new Date(log.created_at))}
                        </KeyValueRow>
                        <KeyValueRow label="AÃ§Ã£o">{label}</KeyValueRow>
                        <KeyValueRow label="Ator">{log.actor ?? "â€”"}</KeyValueRow>
                        {typeof metadata?.approvedAmount === "number" ? (
                          <KeyValueRow label="Valor">
                            {currencyFormatter.format(metadata.approvedAmount)}
                          </KeyValueRow>
                        ) : null}
                        {typeof metadata?.onTime === "boolean" ? (
                          <KeyValueRow label="Em dia">
                            {metadata.onTime ? "Sim" : "NÃ£o"}
                          </KeyValueRow>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="hidden rounded-2xl border bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>AÃ§Ã£o</TableHead>
                      <TableHead>Ator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const label = AUDIT_ACTION_LABELS[log.action] ?? log.action
                      return (
                        <TableRow key={`${log.created_at}-${log.action}`}>
                          <TableCell>
                            {dateTimeFormatter.format(new Date(log.created_at))}
                          </TableCell>
                          <TableCell>{label}</TableCell>
                          <TableCell>{log.actor ?? "â€”"}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

type FraudRiskLevel = ReturnType<typeof calculateFraudScore>["riskLevel"]
type MonitoringRiskLevel = ReturnType<typeof evaluatePostCreditMonitoring>["riskLevel"]
type DecisionMode = ReturnType<typeof buildDecisionExplainability>["decisionMode"]
type PartnerConfidenceSignal = NonNullable<
  ReturnType<typeof getMockPartnerIndicatorProfile>
>["impact"]["confidenceSignal"]
type PartnerIndicatorType = NonNullable<
  ReturnType<typeof getMockPartnerIndicatorProfile>
>["indicators"][number]["indicatorType"]
type EmailCategory = ReturnType<typeof buildEmailCommunicationBundle>["primary"]["category"]
type EmailStatus = ReturnType<typeof buildEmailCommunicationBundle>["primary"]["status"]
type EligibilityStatus = ReturnType<typeof evaluatePostCreditMonitoring>["eligibility"]["status"]
type LimitAction = ReturnType<typeof evaluatePostCreditMonitoring>["limitRecommendation"]["action"]

const RISK_BADGE_VARIANTS = {
  critical: "destructive",
  high: "destructive",
  moderate: "outline",
  low: "secondary",
} as const satisfies Record<FraudRiskLevel | MonitoringRiskLevel, BadgeVariant>

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
} as const satisfies Record<DecisionMode, BadgeVariant>

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
  { badgeVariant: BadgeVariant; label: string }
>

const PARTNER_INDICATOR_LABELS = {
  performance_score: "Score de desempenho",
  activity_regularity: "Regularidade de atividade",
  activity_level: "Nivel de atividade",
  external_trust: "Confianca externa",
  operational_consistency: "Consistencia operacional",
} as const satisfies Record<PartnerIndicatorType, string>

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

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
} as const satisfies Record<EmailCategory, { badgeVariant: BadgeVariant; label: string }>

const EMAIL_STATUS_LABELS = {
  sent_mock: "Envio configurado",
  queued: "Na fila",
  previewed: "Preview",
  generated: "Gerado",
} as const satisfies Record<EmailStatus, string>

type DeliveryStatus = "sent" | "failed" | "skipped" | "dry_run"

const DELIVERY_STATUS_CONFIG = {
  sent: { badgeVariant: "default", label: "Enviado" },
  failed: { badgeVariant: "destructive", label: "Falha" },
  skipped: { badgeVariant: "outline", label: "Ignorado" },
  dry_run: { badgeVariant: "secondary", label: "Ativo" },
} as const satisfies Record<DeliveryStatus, { badgeVariant: BadgeVariant; label: string }>

const DELIVERY_ACTION_TO_STATUS: Record<string, DeliveryStatus> = {
  email_delivery_sent: "sent",
  email_delivery_failed: "failed",
  email_delivery_skipped: "skipped",
  email_delivery_dry_run: "dry_run",
}

function buildDeliveryStatusByTemplateKey(
  auditLogs: RequestDetailProps["auditLogs"],
): Map<string, DeliveryStatus> {
  const latestByTemplateKey = new Map<
    string,
    { status: DeliveryStatus; createdAt: string }
  >()

  for (const log of auditLogs) {
    const status = DELIVERY_ACTION_TO_STATUS[log.action]
    if (!status) continue
    if (!log.metadata || typeof log.metadata !== "object" || Array.isArray(log.metadata)) {
      continue
    }
    const templateKey = (log.metadata as { template_key?: unknown }).template_key
    if (typeof templateKey !== "string" || templateKey.length === 0) continue
    const createdAt = log.created_at
    const existing = latestByTemplateKey.get(templateKey)
    if (!existing || existing.createdAt < createdAt) {
      latestByTemplateKey.set(templateKey, { status, createdAt })
    }
  }

  const result = new Map<string, DeliveryStatus>()
  for (const [templateKey, entry] of latestByTemplateKey.entries()) {
    result.set(templateKey, entry.status)
  }
  return result
}

function parseEmailAuditMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }

  const value = metadata as {
    category?: ReturnType<typeof buildEmailCommunicationBundle>["primary"]["category"]
    status?: ReturnType<typeof buildEmailCommunicationBundle>["primary"]["status"]
    subject?: string
    preview?: string
  }

  return {
    category: value.category,
    status: value.status,
    subject: value.subject,
    preview: value.preview,
  }
}

const ELIGIBILITY_LABELS = {
  blocked: "Bloqueada",
  review_required: "Revisao obrigatoria",
  frozen: "Congelada",
  watch: "Em observacao",
  eligible: "Elegivel",
} as const satisfies Record<EligibilityStatus, string>

const LIMIT_ACTION_LABELS = {
  manual_review: "Revisao manual",
  reduce_future_exposure: "Reduzir exposicao",
  freeze_growth: "Congelar crescimento",
  renegotiation_watch: "Observar renegociacao",
  maintain: "Manter limite",
} as const satisfies Record<LimitAction, string>

const AUDIT_ACTION_LABELS: Record<string, string> = {
  credit_disbursement_simulated: "LiberaÃ§Ã£o autorizada",
  loan_repayment_simulated: "Pagamento",
  credit_cycle_closed: "Ciclo concluÃ­do",
  email_communication_generated: "ComunicaÃ§Ã£o gerada",
}


