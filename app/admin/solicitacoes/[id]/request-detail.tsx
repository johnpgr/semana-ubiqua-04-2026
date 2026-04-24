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
import type { ProgressiveCreditState } from "@/lib/creditProgression"
import { buildDecisionExplainability } from "@/lib/explainability"
import { calculateFraudScore } from "@/lib/fraudScore"
import { evaluatePostCreditMonitoring } from "@/lib/postCreditMonitoring"

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
  further_review: "Revisão manual",
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
  const fraudScore =
    score && transactions.length > 0
      ? calculateFraudScore({
          transactions: transactions.map((transaction) => ({
            occurredAt: transaction.occurred_at,
            amount: transaction.amount,
            kind: transaction.kind as "credit" | "debit",
            category: transaction.category,
            description: transaction.description,
            source: transaction.source,
          })),
          deviceTrust: {
            userAgent: latestConsent?.user_agent,
            ipAddress: normalizeIpAddress(latestConsent?.ip_address),
          },
        })
      : null
  const monitoring =
    score && progression
      ? evaluatePostCreditMonitoring({
          transactions: transactions.map((transaction) => ({
            occurredAt: transaction.occurred_at,
            amount: transaction.amount,
            kind: transaction.kind as "credit" | "debit",
            category: transaction.category,
            description: transaction.description,
            source: transaction.source,
          })),
          creditScoreValue: score.value,
          creditDecision: (request.decision ?? "further_review") as
            | "approved"
            | "approved_reduced"
            | "further_review"
            | "denied",
          suggestedLimit: score.suggested_limit,
          approvedAmount: request.approved_amount,
          fraudScoreValue: fraudScore?.value,
          fraudRiskLevel: fraudScore?.riskLevel,
          confidenceLevel: progression.level,
          isFirstConcession: progression.isFirstConcession,
          requestHistory,
        })
      : null
  const explainability =
    score && request.decision
      ? buildDecisionExplainability({
          decision: request.decision as
            | "approved"
            | "approved_reduced"
            | "further_review"
            | "denied",
          scoreValue: score.value,
          suggestedLimit: score.suggested_limit,
          reasons: score.reasons,
          consentScopes: latestConsent?.scopes,
          progressiveCredit: progression,
          fraudScore,
          monitoring,
        })
      : null

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
          Solicitação {request.id.slice(0, 8)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada da análise para a demo do admin.
        </p>
      </div>

      <Tabs defaultValue="resumo">
        <ScrollArea className="w-full whitespace-nowrap rounded-xl">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="consentimento">Consentimento</TabsTrigger>
            <TabsTrigger value="transacoes">Transações</TabsTrigger>
            <TabsTrigger value="score">Score</TabsTrigger>
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
                <KeyValueRow label="Nome">{request.profile?.name ?? "—"}</KeyValueRow>
                <KeyValueRow label="CPF">{request.profile?.cpf ?? "—"}</KeyValueRow>
                <KeyValueRow label="Perfil mock">
                  {request.profile?.mock_profile ?? "—"}
                </KeyValueRow>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Solicitação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <KeyValueRow label="Status">
                  <Badge variant={STATUS_VARIANT[request.status] ?? "secondary"}>
                    {STATUS_LABEL[request.status] ?? request.status}
                  </Badge>
                </KeyValueRow>
                <KeyValueRow label="Decisão">
                  <Badge
                    variant={
                      request.decision
                        ? (DECISION_VARIANT[request.decision] ?? "secondary")
                        : "secondary"
                    }
                  >
                    {request.decision
                      ? (DECISION_LABEL[request.decision] ?? request.decision)
                      : "—"}
                  </Badge>
                </KeyValueRow>
                {progression ? (
                  <KeyValueRow label="Nivel de confianca">
                    <Badge
                      variant={
                        progression.level === "premium"
                          ? "default"
                          : progression.level === "trusted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {progression.levelLabel}
                    </Badge>
                  </KeyValueRow>
                ) : null}
                {fraudScore ? (
                  <KeyValueRow label="Risco de fraude">
                    <Badge variant={getFraudBadgeVariant(fraudScore.riskLevel)}>
                      {getFraudRiskLabel(fraudScore.riskLevel)}
                    </Badge>
                  </KeyValueRow>
                ) : null}
                {monitoring ? (
                  <KeyValueRow label="Monitoramento">
                    <Badge variant={getMonitoringBadgeVariant(monitoring.riskLevel)}>
                      {getMonitoringRiskLabel(monitoring.riskLevel)}
                    </Badge>
                  </KeyValueRow>
                ) : null}
                <KeyValueRow label="Valor solicitado">
                  {currencyFormatter.format(request.requested_amount)}
                </KeyValueRow>
                <KeyValueRow label="Valor aprovado">
                  {request.approved_amount != null
                    ? currencyFormatter.format(request.approved_amount)
                    : "—"}
                </KeyValueRow>
              </CardContent>
            </Card>
          </div>

          {progression ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Credito progressivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      progression.level === "premium"
                        ? "default"
                        : progression.level === "trusted"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {progression.levelLabel}
                  </Badge>
                  {progression.isConservativeInitialOffer ? (
                    <Badge variant="outline">Concessao inicial conservadora</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground">
                  {progression.progressionSummary}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">
                      Aprovadas anteriormente
                    </div>
                    <div className="mt-1 font-medium">
                      {progression.stats.previousApprovedRequests}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Teto desta etapa</div>
                    <div className="mt-1 font-medium">
                      {currencyFormatter.format(progression.appliedCap)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Ciclos pagos em dia</div>
                    <div className="mt-1 font-medium">
                      {progression.stats.onTimeCycles}
                    </div>
                  </div>
                </div>
                {progression.policyNotes.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {progression.policyNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {fraudScore ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Fraud Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getFraudBadgeVariant(fraudScore.riskLevel)}>
                    {getFraudRiskLabel(fraudScore.riskLevel)}
                  </Badge>
                  <Badge variant="outline">Score {fraudScore.value}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {fraudScore.operationalRecommendation}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Transferencias espelhadas</div>
                    <div className="mt-1 font-medium">
                      {fraudScore.metrics.mirroredTransferCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Saida rapida</div>
                    <div className="mt-1 font-medium">
                      {Math.round(fraudScore.metrics.fastOutflowRatio * 100)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Repeticao de valores</div>
                    <div className="mt-1 font-medium">
                      {Math.round(fraudScore.metrics.repeatedAmountRatio * 100)}%
                    </div>
                  </div>
                </div>
                {fraudScore.signals.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {fraudScore.signals.slice(0, 4).map((signal) => (
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
                <CardTitle>Monitoramento pos-credito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getMonitoringBadgeVariant(monitoring.riskLevel)}>
                    {getMonitoringRiskLabel(monitoring.riskLevel)}
                  </Badge>
                  <Badge variant="outline">
                    {getLimitActionLabel(monitoring.limitRecommendation.action)}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {monitoring.monitoringSummary}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Elegibilidade</div>
                    <div className="mt-1 font-medium">
                      {getEligibilityLabel(monitoring.eligibility.status)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-muted-foreground">Limite futuro</div>
                    <div className="mt-1 font-medium">
                      {getLimitActionLabel(monitoring.limitRecommendation.action)}
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

          {explainability ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Explicabilidade juridica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={getDecisionModeBadgeVariant(explainability.decisionMode)}
                  >
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
                  : "—"}
              </KeyValueRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consentimento" className="space-y-4 pt-4">
          {consentsError ? (
            <SectionError
              title="Consentimentos indisponíveis"
              description="Não foi possível buscar os consentimentos desta solicitação."
            />
          ) : consents.length === 0 ? (
            <SectionEmpty
              title="Nenhum consentimento registrado"
              description="Esta solicitação ainda não recebeu escopos aprovados pelo usuário."
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
                      {consent.user_agent ?? "—"}
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
              title="Transações indisponíveis"
              description="A leitura do histórico financeiro falhou nesta consulta."
            />
          ) : transactions.length === 0 ? (
            <SectionEmpty
              title="Nenhuma transação encontrada"
              description="As transações ainda não foram geradas ou não ficaram disponíveis para esta análise."
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
                        <Bar dataKey="debit" fill="#ef4444" name="Saídas" />
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
                          {transaction.kind === "credit" ? "Entrada" : "Saída"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {dateFormatter.format(new Date(transaction.occurred_at))}
                        </span>
                      </div>
                      <KeyValueRow label="Categoria">{transaction.category}</KeyValueRow>
                      <KeyValueRow label="Descrição">
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
                      <TableHead>Descrição</TableHead>
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
                            {transaction.kind === "credit" ? "Entrada" : "Saída"}
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
              title="Score indisponível"
              description="O motor de score não devolveu um resultado acessível nesta consulta."
            />
          ) : !score ? (
            <SectionEmpty
              title="Score ainda não calculado"
              description="A solicitação segue sem breakdown persistido para exibição."
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
                  <KeyValueRow label="Decisão">
                    <Badge
                      variant={
                        request.decision
                          ? (DECISION_VARIANT[request.decision] ?? "secondary")
                          : "secondary"
                      }
                    >
                      {request.decision
                        ? (DECISION_LABEL[request.decision] ?? request.decision)
                        : "—"}
                    </Badge>
                  </KeyValueRow>
                  {fraudScore ? (
                    <KeyValueRow label="Fraud Score">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant={getFraudBadgeVariant(fraudScore.riskLevel)}>
                          {getFraudRiskLabel(fraudScore.riskLevel)}
                        </Badge>
                        <span className="font-medium">{fraudScore.value}</span>
                      </div>
                    </KeyValueRow>
                  ) : null}
                  {monitoring ? (
                    <KeyValueRow label="Pos-credito">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant={getMonitoringBadgeVariant(monitoring.riskLevel)}>
                          {getMonitoringRiskLabel(monitoring.riskLevel)}
                        </Badge>
                        <span className="font-medium">
                          {getEligibilityLabel(monitoring.eligibility.status)}
                        </span>
                      </div>
                    </KeyValueRow>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Dimensões</CardTitle>
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
                    <CardTitle>Razões</CardTitle>
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
                      <Badge
                        variant={getDecisionModeBadgeVariant(explainability.decisionMode)}
                      >
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
                        {explainability.primaryFactors.map((factor) => factor.label).join(", ") || "—"}
                      </span>
                    </KeyValueRow>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4 pt-4">
          {auditLogsError ? (
            <SectionError
              title="Auditoria indisponível"
              description="Os registros de auditoria não puderam ser carregados agora."
            />
          ) : auditLogs.length === 0 ? (
            <SectionEmpty
              title="Nenhum registro de auditoria"
              description="Ainda não houve eventos persistidos para esta solicitação."
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {auditLogs.map((log) => (
                  <Card key={`${log.created_at}-${log.action}`} className="rounded-2xl">
                    <CardContent className="space-y-3 p-4 text-sm">
                      <KeyValueRow label="Data">
                        {dateTimeFormatter.format(new Date(log.created_at))}
                      </KeyValueRow>
                      <KeyValueRow label="Ação">{log.action}</KeyValueRow>
                      <KeyValueRow label="Ator">{log.actor ?? "—"}</KeyValueRow>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden rounded-2xl border bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Ator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={`${log.created_at}-${log.action}`}>
                        <TableCell>
                          {dateTimeFormatter.format(new Date(log.created_at))}
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.actor ?? "—"}</TableCell>
                      </TableRow>
                    ))}
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
