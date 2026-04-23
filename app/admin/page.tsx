import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "./admin-dashboard"

type ProfileJoin = {
  name: string
  cpf: string
  mock_profile: string
} | null

type ScoreJoin = {
  value: number
  suggested_limit: number
} | null

export type AdminRequestRow = {
  id: string
  status: string
  decision: string | null
  requested_amount: number
  approved_amount: number | null
  created_at: string
  decided_at: string | null
  profile: ProfileJoin
  score: ScoreJoin
}

type AdminRequestRowJoin = Omit<AdminRequestRow, "profile" | "score"> & {
  profile: ProfileJoin[] | ProfileJoin
  score: ScoreJoin[] | ScoreJoin
}

function normalizeJoin<T>(value: T[] | T) {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeRequestRow(row: AdminRequestRowJoin): AdminRequestRow {
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

function normalizeRequestRows(rows: AdminRequestRowJoin[]) {
  return rows.map(normalizeRequestRow)
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: rawData, error } = await supabase
    .from("credit_requests")
    .select(
      `id, status, decision, requested_amount, approved_amount,
       created_at, decided_at,
       profile:profiles(name, cpf, mock_profile),
       score:scores(value, suggested_limit)`
    )
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    throw error
  }

  const requests = normalizeRequestRows((rawData ?? []) as AdminRequestRowJoin[])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-medium">
        Solicitações de Crédito
      </h1>
      <AdminDashboard initialRequests={requests} />
    </div>
  )
}
