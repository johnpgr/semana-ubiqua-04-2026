import { notFound } from "next/navigation"
import { evaluateProgressiveCreditState } from "@/lib/creditProgression"
import { createClient } from "@/lib/supabase/server"
import { RequestDetail } from "./request-detail"

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [requestResult, consentsResult, transactionsResult, scoreResult, auditResult] =
    await Promise.all([
    supabase
      .from("credit_requests")
      .select(
        `id, user_id, status, decision, requested_amount, approved_amount,
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

  const request = {
    ...requestResult.data,
    profile: Array.isArray(requestResult.data.profile)
      ? (requestResult.data.profile[0] ?? null)
      : requestResult.data.profile,
  }
  const { data: requestHistory } = await supabase
    .from("credit_requests")
    .select("id, status, decision, approved_amount, created_at, decided_at")
    .eq("user_id", request.user_id)
    .neq("id", request.id)
    .order("created_at", { ascending: false })
    .limit(20)
  const consents = consentsResult.data ?? []
  const transactions = transactionsResult.data ?? []
  const auditLogs = auditResult.data ?? []
  const progression = scoreResult.data
    ? evaluateProgressiveCreditState({
        requestedAmount: request.requested_amount,
        score: scoreResult.data.value,
        baseDecision: (request.decision ?? "further_review") as
          | "approved"
          | "approved_reduced"
          | "further_review"
          | "denied",
        baseSuggestedLimit: scoreResult.data.suggested_limit,
        requestHistory: (requestHistory ?? []).map((historyRow) => ({
          id: historyRow.id,
          status: historyRow.status,
          decision: historyRow.decision,
          approvedAmount: historyRow.approved_amount,
          createdAt: historyRow.created_at,
          decidedAt: historyRow.decided_at,
        })),
      })
    : null

  return (
    <RequestDetail
      request={request}
      progression={progression}
      requestHistory={(requestHistory ?? []).map((historyRow) => ({
        id: historyRow.id,
        status: historyRow.status,
        decision: historyRow.decision,
        approvedAmount: historyRow.approved_amount,
        createdAt: historyRow.created_at,
        decidedAt: historyRow.decided_at,
      }))}
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
