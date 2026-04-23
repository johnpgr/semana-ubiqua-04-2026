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
    status: string
    decision: string | null
    requested_amount: number
    approved_amount: number | null
    created_at: string
    decided_at: string | null
    profile: ProfileJoin
  }
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
