import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RequestDetail, type RequestDetailProps } from "./request-detail"

const emptyConsents: RequestDetailProps["consents"] = []
const emptyTransactions: RequestDetailProps["transactions"] = []
const emptyAuditLogs: RequestDetailProps["auditLogs"] = []

type RawRequest = {
  id: string
  status: string
  decision: string | null
  requested_amount: number
  approved_amount: number | null
  created_at: string
  decided_at: string | null
  profile:
    | { name: string; cpf: string; mock_profile: string }[]
    | { name: string; cpf: string; mock_profile: string }
    | null
}

function flattenProfileJoin(raw: RawRequest) {
  return {
    ...raw,
    profile: Array.isArray(raw.profile) ? raw.profile[0] ?? null : raw.profile,
  }
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
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select("action, actor, created_at, metadata")
      .eq("entity_type", "credit_request")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  if (requestResult.error || !requestResult.data) {
    notFound()
  }

  const request = flattenProfileJoin(requestResult.data as RawRequest)
  const consents = consentsResult.data ?? emptyConsents
  const transactions = transactionsResult.data ?? emptyTransactions
  const auditLogs = auditResult.data ?? emptyAuditLogs

  return (
    <RequestDetail
      request={request}
      consents={consents}
      consentsError={!!consentsResult.error}
      transactions={transactions}
      transactionsError={!!transactionsResult.error}
      score={scoreResult.data ?? null}
      scoreError={!!scoreResult.error}
      auditLogs={auditLogs}
      auditLogsError={!!auditResult.error}
    />
  )
}
