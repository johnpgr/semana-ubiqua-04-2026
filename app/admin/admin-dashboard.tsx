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

const STATUS_VARIANT: Record<string, string> = {
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

const DECISION_VARIANT: Record<string, string> = {
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

  const filtered = requests.filter((r) => {
    const statusOk = statusFilter === "all" || r.status === statusFilter
    const decisionOk = decisionFilter === "all" || r.decision === decisionFilter
    return statusOk && decisionOk
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  useEffect(() => {
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

      return data
        ? {
            ...(data as AdminRequestRealtimeRow),
            profile: Array.isArray(data.profile) ? data.profile[0] ?? null : data.profile,
            score: Array.isArray(data.score) ? data.score[0] ?? null : data.score,
          }
        : null
    }

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
          const row = await fetchRequestRow(id)

          if (!row) return

          if (payload.eventType === "INSERT") {
            setRequests((prev) => [row, ...prev])
            toast.success("Nova solicitação recebida")
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) =>
              prev.map((r) => (r.id === id ? row : r))
            )
            toast.info("Solicitação atualizada")
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
                  <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={row.decision ? (DECISION_VARIANT[row.decision] ?? "secondary") : "secondary"}>
                    {row.decision ? (DECISION_LABEL[row.decision] ?? row.decision) : "—"}
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
                aria-disabled={safePage === 1}
                className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pageNumbers.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === safePage}
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
                aria-disabled={safePage === totalPages}
                className={
                  safePage === totalPages
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
