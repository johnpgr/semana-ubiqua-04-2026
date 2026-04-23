"use client"

import { useMemo } from "react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
} from "@/components/ui/progress"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR")
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

function statusBadgeVariant(status: string) {
  switch (status) {
    case "awaiting_consent":
      return "secondary"
    case "collecting_data":
      return "default"
    case "scoring":
      return "outline"
    case "decided":
      return "default"
    default:
      return "secondary"
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    awaiting_consent: "Aguardando consentimento",
    collecting_data: "Coletando dados",
    scoring: "Scoring",
    decided: "Decidido",
  }
  return map[status] ?? status
}

function decisionBadgeVariant(decision: string | null) {
  switch (decision) {
    case "approved":
      return "default"
    case "approved_reduced":
      return "secondary"
    case "further_review":
      return "outline"
    case "denied":
      return "destructive"
    default:
      return "secondary"
  }
}

function decisionLabel(decision: string | null) {
  if (!decision) return "—"
  const map: Record<string, string> = {
    approved: "Aprovado",
    approved_reduced: "Aprovado reduzido",
    further_review: "Revisão manual",
    denied: "Negado",
  }
  return map[decision] ?? decision
}

type ProfileJoin = {
  name: string
  cpf: string
  mock_profile: string
} | null

type RequestDetailProps = {
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
  transactions: {
    amount: number
    category: string
    description: string
    kind: string
    occurred_at: string
    source: string
  }[]
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
  auditLogs: {
    action: string
    actor: string | null
    created_at: string
    metadata: unknown
  }[]
}

function buildMonthlyFlow(
  transactions: RequestDetailProps["transactions"]
) {
  const map = new Map<string, { month: string; credit: number; debit: number }>()

  for (const t of transactions) {
    const d = new Date(t.occurred_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

    if (!map.has(key)) {
      map.set(key, { month: label, credit: 0, debit: 0 })
    }

    const entry = map.get(key)!
    if (t.kind === "credit") {
      entry.credit += t.amount
    } else {
      entry.debit += t.amount
    }
  }

  return Array.from(map.values()).reverse()
}

export function RequestDetail({
  request,
  consents,
  transactions,
  score,
  auditLogs,
}: RequestDetailProps) {
  const monthlyFlow = useMemo(
    () => buildMonthlyFlow(transactions),
    [transactions]
  )

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
          ← Voltar
        </Link>
      </div>

      <h1 className="text-2xl font-heading font-medium">
        Solicitação {request.id.slice(0, 8)}
      </h1>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="consentimento">Consentimento</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome</span>
                  <span>{request.profile?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF</span>
                  <span>{request.profile?.cpf ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perfil mock</span>
                  <span>{request.profile?.mock_profile ?? "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solicitação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusBadgeVariant(request.status)}>
                    {statusLabel(request.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decisão</span>
                  <Badge variant={decisionBadgeVariant(request.decision)}>
                    {decisionLabel(request.decision)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Valor solicitado
                  </span>
                  <span>
                    {currencyFormatter.format(request.requested_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Valor aprovado
                  </span>
                  <span>
                    {request.approved_amount != null
                      ? currencyFormatter.format(request.approved_amount)
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{dateTimeFormatter.format(new Date(request.created_at))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decidido em</span>
                <span>
                  {request.decided_at
                    ? dateTimeFormatter.format(new Date(request.decided_at))
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consentimento" className="space-y-4 pt-4">
          {consents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum consentimento registrado.
            </p>
          ) : (
            consents.map((c, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>Consentimento #{i + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {c.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Concedido em</span>
                    <span>{dateTimeFormatter.format(new Date(c.granted_at))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User-Agent</span>
                    <span className="max-w-xs truncate">
                      {c.user_agent ?? "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="transacoes" className="space-y-4 pt-4">
          {monthlyFlow.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fluxo mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyFlow}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={((value: number) =>
                        currencyFormatter.format(value)
                      ) as unknown as React.ComponentProps<
                        typeof Tooltip
                      >["formatter"]}
                    />
                    <Bar dataKey="credit" fill="#22c55e" name="Entradas" />
                    <Bar dataKey="debit" fill="#ef4444" name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="rounded-lg border bg-card">
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
                {transactions.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {dateFormatter.format(new Date(t.occurred_at))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.kind === "credit" ? "default" : "destructive"
                        }
                      >
                        {t.kind === "credit" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {t.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {currencyFormatter.format(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="score" className="space-y-4 pt-4">
          {!score ? (
            <p className="text-sm text-muted-foreground">
              Score ainda não calculado.
            </p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium">{score.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Limite sugerido
                    </span>
                    <span className="font-medium">
                      {currencyFormatter.format(score.suggested_limit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decisão</span>
                    <Badge variant={decisionBadgeVariant(request.decision)}>
                      {decisionLabel(request.decision)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dimensões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dimensions.map((dim) => (
                    <Progress key={dim.key} value={dim.value}>
                      <ProgressLabel>{dim.label}</ProgressLabel>
                      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                        {dim.value}
                      </span>
                      <ProgressTrack>
                        <ProgressIndicator />
                      </ProgressTrack>
                    </Progress>
                  ))}
                </CardContent>
              </Card>

              {score.reasons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Razões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1 pl-4 text-sm">
                      {score.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4 pt-4">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum registro de auditoria.
            </p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Ator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, i) => (
                    <TableRow key={i}>
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
