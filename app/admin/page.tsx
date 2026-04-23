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

  const requests: AdminRequestRow[] = (rawData ?? []).map((row) => {
    const profileArray = row.profile as unknown as ProfileJoin[] | ProfileJoin
    const scoreArray = row.score as unknown as ScoreJoin[] | ScoreJoin

    const profile = Array.isArray(profileArray)
      ? profileArray[0] ?? null
      : profileArray

    const score = Array.isArray(scoreArray)
      ? scoreArray[0] ?? null
      : scoreArray

    return {
      ...row,
      profile,
      score,
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-medium">
        Solicitações de Crédito
      </h1>
      <AdminDashboard initialRequests={requests} />
    </div>
  )
}
