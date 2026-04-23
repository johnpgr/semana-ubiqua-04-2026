import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RequestDetail } from "./request-detail"

type RequestProfile = {
  name: string
  cpf: string
  mock_profile: string
} | null

type RequestWithProfileJoin = {
  id: string
  status: string
  decision: string | null
  requested_amount: number
  approved_amount: number | null
  created_at: string
  decided_at: string | null
  profile: RequestProfile[] | RequestProfile
}

function normalizeJoin<T>(value: T[] | T) {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeRequest(request: RequestWithProfileJoin) {
  return {
    id: request.id,
    status: request.status,
    decision: request.decision,
    requested_amount: request.requested_amount,
    approved_amount: request.approved_amount,
    created_at: request.created_at,
    decided_at: request.decided_at,
    profile: normalizeJoin(request.profile),
  }
}

function ensureArray<T>(value: T[] | null) {
  return value ?? []
}

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    requestResult,
    consentsResult,
    transactionsResult,
    scoreResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("credit_requests")
      .select(
        `id, status, decision, requested_amount, approved_amount,
         created_at, decided_at,
         profile:profiles(name, cpf, mock_profile)`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("consents")
      .select("scopes, granted_at, user_agent, ip_address")
      .eq("request_id", id)
      .order("granted_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount, category, description, kind, occurred_at, source")
      .eq("request_id", id)
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase
      .from("scores")
      .select(
        "value, suggested_limit, reasons, regularity, capacity, stability, behavior, data_quality"
      )
      .eq("request_id", id)
      .single(),
    supabase
      .from("audit_logs")
      .select("action, actor, created_at, metadata")
      .eq("entity_type", "credit_request")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ])

  if (requestResult.error || !requestResult.data) {
    notFound()
  }

  const request = normalizeRequest(requestResult.data as RequestWithProfileJoin)
  const consents = ensureArray(consentsResult.data)
  const transactions = ensureArray(transactionsResult.data)
  const auditLogs = ensureArray(auditResult.data)

  return (
    <RequestDetail
      request={request}
      consents={consents}
      transactions={transactions}
      score={scoreResult.data ?? null}
      auditLogs={auditLogs}
    />
  )
}
