"use client"

import { useEffect, useReducer, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { createClient } from "@/lib/supabase/client"
import type { AdminRequestRow } from "./page"
import { AdminCharts } from "./admin-charts"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR")

const PAGE_SIZE = 20

type AdminRequestRealtimeRow = Omit<AdminRequestRow, "profile" | "score"> & {
  profile: AdminRequestRow["profile"][] | AdminRequestRow["profile"]
  score: AdminRequestRow["score"][] | AdminRequestRow["score"]
}

type AdminDashboardViewState = {
  statusFilter: string
  decisionFilter: string
  page: number
}

type AdminDashboardViewAction = string | null | React.MouseEvent<HTMLButtonElement>

function normalizeJoin<T>(value: T[] | T) {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeRequestRow(row: AdminRequestRealtimeRow): AdminRequestRow {
  return {
    id: row.id,
    status: row.status,
    decision: row.decision,
    requested_amount: row.requested_amount,
    approved_amount: row.approved_amount,
    created_at: row.created_at,
    decided_at: row.decided_at,
    profile: normalizeJoin(row.profile),
    score: normalizeJoin(row.score),
  }
}

function filterRequests(
  requests: AdminRequestRow[],
  statusFilter: string,
  decisionFilter: string
) {
  return requests.filter((request) => {
    const statusOk = statusFilter === "all" || request.status === statusFilter
    const decisionOk =
      decisionFilter === "all" || request.decision === decisionFilter
    return statusOk && decisionOk
  })
}

function buildPageNumbers(totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1)
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

export function AdminDashboard({
  initialRequests,
}: {
  initialRequests: AdminRequestRow[]
}) {
  const [requests, setRequests] = useState<AdminRequestRow[]>(initialRequests)
  const [{ statusFilter, decisionFilter, page }, dispatchView] = useReducer(
    adminDashboardViewReducer,
    {
      statusFilter: "all",
      decisionFilter: "all",
      page: 1,
    }
  )

  const filtered = filterRequests(requests, statusFilter, decisionFilter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pageNumbers = buildPageNumbers(totalPages)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("admin:credit_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credit_requests" },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const id = payload.old.id as string
            setRequests((prev) => prev.filter((r) => r.id !== id))
            toast.info("Solicitação removida")
            return
          }

          const id = payload.new.id as string

          if (payload.eventType === "INSERT") {
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

            if (data) {
              const row = normalizeRequestRow(data as AdminRequestRealtimeRow)

              setRequests((prev) => [row, ...prev])
              toast.success("Nova solicitação recebida")
            }
          } else if (payload.eventType === "UPDATE") {
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

            if (data) {
              const row = normalizeRequestRow(data as AdminRequestRealtimeRow)

              setRequests((prev) =>
                prev.map((r) => (r.id === id ? row : r))
              )
              toast.info("Solicitação atualizada")
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={`status:${statusFilter}`}
          onValueChange={dispatchView}
        >
          <SelectTrigger className="w-48">
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

        <Select
          value={`decision:${decisionFilter}`}
          onValueChange={dispatchView}
        >
          <SelectTrigger className="w-48">
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

        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} solicitação
          {filtered.length !== 1 ? "es" : ""}
        </span>
      </div>

      <AdminCharts requests={filtered} />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CPF / Nome</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Decisão</TableHead>
              <TableHead className="text-right">Valor solicitado</TableHead>
              <TableHead className="text-right">Valor aprovado</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/admin/solicitacoes/${row.id}`}
                    className="block"
                  >
                    <div className="font-medium">
                      {row.profile?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.profile?.cpf ?? "—"}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {row.profile?.mock_profile ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(row.status)}>
                    {statusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={decisionBadgeVariant(row.decision)}>
                    {decisionLabel(row.decision)}
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
                <TableCell>
                  {row.score ? row.score.value : "—"}
                </TableCell>
                <TableCell>
                  {dateFormatter.format(new Date(row.created_at))}
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={dispatchView}
                data-page-action="prev"
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pageNumbers.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={dispatchView}
                  value={p}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={dispatchView}
                data-page-action="next"
                data-total-pages={totalPages}
                aria-disabled={page === totalPages}
                className={
                  page === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
