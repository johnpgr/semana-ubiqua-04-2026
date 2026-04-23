"use client"

import { useEffect, useState } from "react"
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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [decisionFilter, setDecisionFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  function handleStatusChange(v: string) {
    setStatusFilter(v)
    setPage(1)
  }

  function handleDecisionChange(v: string) {
    setDecisionFilter(v)
    setPage(1)
  }

  const filtered = requests.filter((r) => {
    const statusOk = statusFilter === "all" || r.status === statusFilter
    const decisionOk =
      decisionFilter === "all" || r.decision === decisionFilter
    return statusOk && decisionOk
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
              const profileArray = data.profile as unknown as
                | AdminRequestRow["profile"][]
                | AdminRequestRow["profile"]
              const scoreArray = data.score as unknown as
                | AdminRequestRow["score"][]
                | AdminRequestRow["score"]

              const row: AdminRequestRow = {
                ...(data as Omit<
                  AdminRequestRow,
                  "profile" | "score"
                >),
                profile: Array.isArray(profileArray)
                  ? profileArray[0] ?? null
                  : profileArray,
                score: Array.isArray(scoreArray)
                  ? scoreArray[0] ?? null
                  : scoreArray,
              }

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
              const profileArray = data.profile as unknown as
                | AdminRequestRow["profile"][]
                | AdminRequestRow["profile"]
              const scoreArray = data.score as unknown as
                | AdminRequestRow["score"][]
                | AdminRequestRow["score"]

              const row: AdminRequestRow = {
                ...(data as Omit<
                  AdminRequestRow,
                  "profile" | "score"
                >),
                profile: Array.isArray(profileArray)
                  ? profileArray[0] ?? null
                  : profileArray,
                score: Array.isArray(scoreArray)
                  ? scoreArray[0] ?? null
                  : scoreArray,
              }

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
          value={statusFilter}
          onValueChange={(v) => handleStatusChange(v ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="awaiting_consent">
              Aguardando consentimento
            </SelectItem>
            <SelectItem value="collecting_data">Coletando dados</SelectItem>
            <SelectItem value="scoring">Scoring</SelectItem>
            <SelectItem value="decided">Decidido</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={decisionFilter}
          onValueChange={(v) => handleDecisionChange(v ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Decisão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as decisões</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="approved_reduced">Aprovado reduzido</SelectItem>
            <SelectItem value="further_review">Revisão manual</SelectItem>
            <SelectItem value="denied">Negado</SelectItem>
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
