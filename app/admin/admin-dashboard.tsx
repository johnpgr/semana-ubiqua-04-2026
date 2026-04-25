"use client"

import { useEffect, useReducer, useRef, useState } from "react"
import Link from "next/link"
import { Activity, Inbox, Radio } from "lucide-react"
import { toast } from "sonner"

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { MOCK_PROFILE_LABELS } from "@/validation/auth"

import { AdminCharts } from "./admin-charts"
import type { AdminRequestRow, CycleStage } from "./page"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR")
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const PAGE_SIZE = 20
const HIGHLIGHT_DURATION_MS = 8_000
const MAX_RECENT_ACTIVITY = 6

type AdminRequestRealtimeRow = Omit<AdminRequestRow, "profile" | "score"> & {
  profile: AdminRequestRow["profile"][] | AdminRequestRow["profile"]
  score: AdminRequestRow["score"][] | AdminRequestRow["score"]
}

type AdminDashboardViewState = {
  statusFilter: string
  decisionFilter: string
  cycleStageFilter: string
  page: number
}

type AdminDashboardViewAction = string | null | React.MouseEvent<HTMLButtonElement>

type RealtimeState = "connecting" | "active" | "error"

type ActivityKind = "insert" | "update" | "delete"

type ActivityEntry = {
  id: string
  kind: ActivityKind
  requestId: string
  title: string
  description: string
  createdAt: string
}

function adminDashboardViewReducer(
  state: AdminDashboardViewState,
  action: AdminDashboardViewAction
): AdminDashboardViewState {
  if (typeof action === "string") {
    if (action.startsWith("status:")) {
      return {
        ...state,
        statusFilter: action.slice("status:".length),
        page: 1,
      }
    }

    if (action.startsWith("decision:")) {
      return {
        ...state,
        decisionFilter: action.slice("decision:".length),
        page: 1,
      }
    }

    if (action.startsWith("cycle:")) {
      return {
        ...state,
        cycleStageFilter: action.slice("cycle:".length),
        page: 1,
      }
    }

    return state
  }

  if (action === null) {
    return state
  }

  const pageAction = action.currentTarget.dataset.pageAction
  const totalPages = Number(action.currentTarget.dataset.totalPages ?? state.page)

  if (pageAction === "prev") {
    return {
      ...state,
      page: Math.max(1, state.page - 1),
    }
  }

  if (pageAction === "next") {
    return {
      ...state,
      page: Math.min(totalPages, state.page + 1),
    }
  }

  const nextPage = Number(action.currentTarget.value)
  if (Number.isNaN(nextPage)) {
    return state
  }

  return {
    ...state,
    page: nextPage,
  }
}

type BadgeVariant = "default" | "link" | "outline" | "secondary" | "ghost" | "destructive"

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

const CYCLE_STAGE_VARIANT: Record<string, BadgeVariant> = {
  pending: "secondary",
  decided: "outline",
  disbursed: "default",
  active: "default",
  paid: "secondary",
  cycle_closed: "default",
}

const CYCLE_STAGE_LABEL: Record<string, string> = {
  pending: "Pendente",
  decided: "Decidido",
  disbursed: "Liberado",
  active: "Ativo",
  paid: "Pago",
  cycle_closed: "Ciclo fechado",
}

const REALTIME_BADGE: Record<RealtimeState, { label: string; variant: BadgeVariant }> = {
  connecting: { label: "Realtime conectando…", variant: "secondary" },
  active: { label: "Realtime ativo", variant: "default" },
  error: { label: "Realtime com falha", variant: "destructive" },
}

const ACTIVITY_BADGE: Record<ActivityKind, { label: string; variant: BadgeVariant }> = {
  insert: { label: "Novo", variant: "default" },
  update: { label: "Atualizado", variant: "outline" },
  delete: { label: "Removido", variant: "secondary" },
}

function normalizeRealtimeRow(data: AdminRequestRealtimeRow): AdminRequestRow {
  return {
    ...data,
    profile: Array.isArray(data.profile) ? data.profile[0] ?? null : data.profile,
    score: Array.isArray(data.score) ? data.score[0] ?? null : data.score,
  }
}

function describeRow(row: AdminRequestRow) {
  const profileName = row.profile?.name ?? "Cliente sem nome"
  const requestedAmount = currencyFormatter.format(row.requested_amount)
  const status = STATUS_LABEL[row.status] ?? row.status

  return {
    profileName,
    requestedAmount,
    status,
  }
}

function formatProfileLabel(profile: string | null | undefined) {
  if (!profile) {
    return "—"
  }

  if (profile in MOCK_PROFILE_LABELS) {
    return MOCK_PROFILE_LABELS[profile as keyof typeof MOCK_PROFILE_LABELS]
  }

  return profile
}

function buildActivityEntry(kind: ActivityKind, row?: AdminRequestRow, requestId?: string): ActivityEntry {
  const createdAt = new Date().toISOString()

  if (!row) {
    return {
      id: `${kind}-${requestId ?? createdAt}-${createdAt}`,
      kind,
      requestId: requestId ?? "",
      title: "Solicitação removida",
      description: "A solicitação saiu da lista do admin.",
      createdAt,
    }
  }

  const details = describeRow(row)

  if (kind === "insert") {
    return {
      id: `${kind}-${row.id}-${createdAt}`,
      kind,
      requestId: row.id,
      title: `Nova solicitação de ${details.profileName}`,
      description: `${details.requestedAmount} entrou no painel com status ${details.status.toLowerCase()}.`,
      createdAt,
    }
  }

  return {
    id: `${kind}-${row.id}-${createdAt}`,
    kind,
    requestId: row.id,
    title: `Solicitação atualizada: ${details.profileName}`,
    description: `Status atual: ${details.status.toLowerCase()}. Valor solicitado: ${details.requestedAmount}.`,
    createdAt,
  }
}

function DashboardEmptyState({
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
          <Inbox aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function AdminDashboard({
  initialRequests,
  cycleStages,
}: {
  initialRequests: AdminRequestRow[]
  cycleStages: Record<string, CycleStage>
}) {
  const [requests, setRequests] = useState<AdminRequestRow[]>(initialRequests)
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("connecting")
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([])
  const [highlightedIds, setHighlightedIds] = useState<Record<string, ActivityKind>>({})
  const highlightTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [{ statusFilter, decisionFilter, cycleStageFilter, page }, dispatchView] = useReducer(
    adminDashboardViewReducer,
    {
      statusFilter: "all",
      decisionFilter: "all",
      cycleStageFilter: "all",
      page: 1,
    }
  )

  const filtered = requests.filter((request) => {
    const statusOk = statusFilter === "all" || request.status === statusFilter
    const decisionOk =
      decisionFilter === "all" || request.decision === decisionFilter
    const stage = cycleStages[request.id] ?? "pending"
    const cycleStageOk = cycleStageFilter === "all" || stage === cycleStageFilter
    return statusOk && decisionOk && cycleStageOk
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  useEffect(() => {
    const highlightMap = highlightTimeouts.current

    function highlightRequest(requestId: string, kind: ActivityKind) {
      const timeout = highlightMap.get(requestId)
      if (timeout) {
        clearTimeout(timeout)
      }

      setHighlightedIds((prev) => ({
        ...prev,
        [requestId]: kind,
      }))

      const nextTimeout = setTimeout(() => {
        setHighlightedIds((prev) => {
          const next = { ...prev }
          delete next[requestId]
          return next
        })
        highlightTimeouts.current.delete(requestId)
      }, HIGHLIGHT_DURATION_MS)

      highlightMap.set(requestId, nextTimeout)
    }

    function registerActivity(entry: ActivityEntry) {
      setRecentActivity((prev) => [entry, ...prev].slice(0, MAX_RECENT_ACTIVITY))
    }

    const supabase = createClient()

    async function fetchRequestRow(id: string) {
      const { data } = await supabase
        .from("credit_requests")
        .select(
          `id, status, decision, requested_amount, approved_amount,
           created_at, decided_at,
           profile:profiles(name, cpf, mock_profile),
           score:scores(value, suggested_limit)`
        )
        .eq("id", id)
        .single()

      return data ? normalizeRealtimeRow(data as AdminRequestRealtimeRow) : null
    }

    const channel = supabase
      .channel("admin:credit_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_requests" },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const id = payload.old.id as string
            setRequests((prev) => prev.filter((request) => request.id !== id))
            registerActivity(buildActivityEntry("delete", undefined, id))
            toast.info("Solicitação removida do painel")
            return
          }

          const id = payload.new.id as string
          const row = await fetchRequestRow(id)

          if (!row) {
            return
          }

          if (payload.eventType === "INSERT") {
            setRequests((prev) => [row, ...prev.filter((request) => request.id !== id)])
            registerActivity(buildActivityEntry("insert", row))
            highlightRequest(id, "insert")
            toast.success("Nova solicitação recebida")
            return
          }

          setRequests((prev) => prev.map((request) => (request.id === id ? row : request)))
          registerActivity(buildActivityEntry("update", row))
          highlightRequest(id, "update")
          toast.info("Solicitação atualizada")
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeState("active")
          return
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeState("error")
        }
      })

    return () => {
      highlightMap.forEach((timeout) => clearTimeout(timeout))
      highlightMap.clear()
      void supabase.removeChannel(channel)
    }
  }, [])

  const realtimeBadge = REALTIME_BADGE[realtimeState]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={`status:${statusFilter}`} onValueChange={dispatchView}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status:all">Todos os status</SelectItem>
            <SelectItem value="status:awaiting_consent">
              Aguardando consentimento
            </SelectItem>
            <SelectItem value="status:collecting_data">Coletando dados</SelectItem>
            <SelectItem value="status:scoring">Scoring</SelectItem>
            <SelectItem value="status:decided">Decidido</SelectItem>
          </SelectContent>
        </Select>

        <Select value={`decision:${decisionFilter}`} onValueChange={dispatchView}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Decisão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="decision:all">Todas as decisões</SelectItem>
            <SelectItem value="decision:approved">Aprovado</SelectItem>
            <SelectItem value="decision:approved_reduced">Aprovado reduzido</SelectItem>
            <SelectItem value="decision:further_review">Revisão manual</SelectItem>
            <SelectItem value="decision:denied">Negado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={`cycle:${cycleStageFilter}`} onValueChange={dispatchView}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Etapa do ciclo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cycle:all">Todas as etapas</SelectItem>
            <SelectItem value="cycle:pending">Pendente</SelectItem>
            <SelectItem value="cycle:active">Ativo</SelectItem>
            <SelectItem value="cycle:paid">Pago</SelectItem>
            <SelectItem value="cycle:cycle_closed">Ciclo fechado</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-2 sm:ml-auto sm:items-end">
          <Badge variant={realtimeBadge.variant} className="w-fit">
            <Radio aria-hidden="true" className="mr-1 size-3" />
            {realtimeBadge.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {filtered.length} solicitação{filtered.length !== 1 ? "ões" : ""}
          </span>
        </div>
      </div>

      {realtimeState === "error" ? (
        <Alert variant="destructive">
          <Activity aria-hidden="true" />
          <AlertTitle>Realtime interrompido no admin</AlertTitle>
          <AlertDescription>
            O painel continua exibindo os dados já carregados, mas novas mudanças
            podem demorar a aparecer até a conexão voltar.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminCharts requests={filtered} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="hidden rounded-2xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPF / Nome</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decisão</TableHead>
                  <TableHead>Etapa do ciclo</TableHead>
                  <TableHead className="text-right">Valor solicitado</TableHead>
                  <TableHead className="text-right">Valor aprovado</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((row) => {
                  const highlightKind = highlightedIds[row.id]
                  const cycleStage = cycleStages[row.id] ?? "pending"

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "transition-colors",
                        highlightKind === "insert" &&
                          "bg-emerald-500/8 ring-1 ring-inset ring-emerald-500/20",
                        highlightKind === "update" &&
                          "bg-blue-500/8 ring-1 ring-inset ring-blue-500/20"
                      )}
                    >
                      <TableCell>
                        <Link
                          href={`/admin/solicitacoes/${row.id}`}
                          className="block min-w-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">
                              {row.profile?.name ?? "—"}
                            </span>
                            {highlightKind ? (
                              <Badge variant={ACTIVITY_BADGE[highlightKind].variant}>
                                {ACTIVITY_BADGE[highlightKind].label}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {row.profile?.cpf ?? "—"}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatProfileLabel(row.profile?.mock_profile)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.decision
                              ? (DECISION_VARIANT[row.decision] ?? "secondary")
                              : "secondary"
                          }
                        >
                          {row.decision ? (DECISION_LABEL[row.decision] ?? row.decision) : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={CYCLE_STAGE_VARIANT[cycleStage] ?? "secondary"}>
                          {CYCLE_STAGE_LABEL[cycleStage] ?? cycleStage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(row.requested_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.approved_amount != null
                          ? currencyFormatter.format(row.approved_amount)
                          : "—"}
                      </TableCell>
                      <TableCell>{row.score ? row.score.value : "—"}</TableCell>
                      <TableCell>
                        {dateFormatter.format(new Date(row.created_at))}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-6">
                      <DashboardEmptyState
                        title="Nenhuma solicitação neste filtro"
                        description="Ajuste os filtros ou aguarde novas análises entrarem no painel."
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {paged.map((row) => {
              const highlightKind = highlightedIds[row.id]
              const cycleStage = cycleStages[row.id] ?? "pending"

              return (
                <Card
                  key={row.id}
                  className={cn(
                    "rounded-2xl transition-colors",
                    highlightKind === "insert" &&
                      "border-emerald-500/40 bg-emerald-500/8",
                    highlightKind === "update" && "border-blue-500/40 bg-blue-500/8"
                  )}
                >
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/solicitacoes/${row.id}`}
                          className="block min-w-0"
                        >
                          <p className="truncate font-medium">
                            {row.profile?.name ?? "Cliente sem nome"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.profile?.cpf ?? "Sem CPF"}
                          </p>
                        </Link>
                      </div>
                      {highlightKind ? (
                        <Badge variant={ACTIVITY_BADGE[highlightKind].variant}>
                          {ACTIVITY_BADGE[highlightKind].label}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                      <Badge
                        variant={
                          row.decision
                            ? (DECISION_VARIANT[row.decision] ?? "secondary")
                            : "secondary"
                        }
                      >
                        {row.decision ? (DECISION_LABEL[row.decision] ?? row.decision) : "Sem decisão"}
                      </Badge>
                      <Badge variant={CYCLE_STAGE_VARIANT[cycleStage] ?? "secondary"}>
                        {CYCLE_STAGE_LABEL[cycleStage] ?? cycleStage}
                      </Badge>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Solicitado</dt>
                        <dd className="break-words font-medium">
                          {currencyFormatter.format(row.requested_amount)}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Aprovado</dt>
                        <dd className="break-words font-medium">
                          {row.approved_amount != null
                            ? currencyFormatter.format(row.approved_amount)
                            : "—"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Score</dt>
                        <dd>{row.score?.value ?? "—"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Criado em</dt>
                        <dd>{dateFormatter.format(new Date(row.created_at))}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )
            })}

            {paged.length === 0 ? (
              <DashboardEmptyState
                title="Nenhuma solicitação neste filtro"
                description="Ajuste os filtros ou aguarde novas análises entrarem no painel."
              />
            ) : null}
          </div>

          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={dispatchView}
                    data-page-action="prev"
                    aria-disabled={safePage === 1}
                    className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {pageNumbers.map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === safePage}
                      onClick={dispatchView}
                      value={pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={dispatchView}
                    data-page-action="next"
                    data-total-pages={totalPages}
                    aria-disabled={safePage === totalPages}
                    className={
                      safePage === totalPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Atividade recente</CardTitle>
            <p className="text-sm text-muted-foreground">
              Destaques persistentes para mostrar atualizações ao vivo.
            </p>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <DashboardEmptyState
                title="Sem atualizações ao vivo ainda"
                description="Novas solicitações e mudanças de status vão aparecer aqui em tempo real."
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border bg-background/70 p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={ACTIVITY_BADGE[activity.kind].variant}>
                        {ACTIVITY_BADGE[activity.kind].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {dateTimeFormatter.format(new Date(activity.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    {activity.requestId ? (
                      <Link
                        href={`/admin/solicitacoes/${activity.requestId}`}
                        className="mt-2 inline-flex text-sm text-primary hover:underline"
                      >
                        Abrir solicitação
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


