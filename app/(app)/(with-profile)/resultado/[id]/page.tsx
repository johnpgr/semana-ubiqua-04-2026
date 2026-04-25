import { notFound, redirect } from "next/navigation"

import { requireCurrentProfile } from "@/lib/auth/profile"
import { OPEN_FINANCE_FALLBACK_DESTINATION } from "@/lib/open-finance-connection"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

import { ResultCard } from "./result-card"

type ResultadoPageProps = {
  params: Promise<{ id: string }>
}

type RequestHistoryRow = {
  id: string
  status: string
  decision: string | null
  approved_amount: number | null
  created_at: string
  decided_at: string | null
}

type ResultConsentRow = Pick<
  Database["public"]["Tables"]["consents"]["Row"],
  "scopes" | "granted_at" | "user_agent" | "ip_address"
>

type ResultTransactionRow = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  "amount" | "category" | "description" | "kind" | "occurred_at"
>

type ResultDisbursement = {
  approvedAmount: number
  destination: string
  disbursedAt: string
  status: "active"
}

const DISBURSEMENT_ACTION = "credit_disbursement_simulated"

export default async function ResultadoPage({ params }: ResultadoPageProps) {
  const { id } = await params
  const profile = await requireCurrentProfile()
  const supabase = await createClient()

  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select(
      "id, requested_amount, status, decision, approved_amount, created_at"
    )
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    throw requestError
  }

  if (!request) {
    notFound()
  }

  if (request.status === "awaiting_consent") {
    redirect(`/consentimento/${request.id}`)
  }

  if (request.status === "collecting_data" || request.status === "scoring") {
    redirect(`/analise/${request.id}`)
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("scopes, granted_at, user_agent, ip_address")
    .eq("request_id", request.id)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const service = createServiceClient()
  const [
    { data: score },
    { data: requestHistory },
    { data: transactions },
    { data: disbursement },
  ] = await Promise.all([
    supabase
      .from("scores")
      .select("value, reasons, suggested_limit")
      .eq("request_id", request.id)
      .maybeSingle(),
    supabase
      .from("credit_requests")
      .select("id, status, decision, approved_amount, created_at, decided_at")
      .eq("user_id", profile.id)
      .neq("id", request.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("transactions")
      .select("amount, category, description, kind, occurred_at")
      .eq("request_id", request.id)
      .order("occurred_at", { ascending: false })
      .limit(200),
    service
      .from("audit_logs")
      .select("created_at, metadata")
      .eq("entity_type", "credit_request")
      .eq("entity_id", request.id)
      .eq("action", DISBURSEMENT_ACTION)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <ResultCard
      initialRequest={request}
      initialConsent={consent as ResultConsentRow | null}
      initialScore={score}
      initialTransactions={(transactions ?? []) as ResultTransactionRow[]}
      requestHistory={(requestHistory ?? []) as RequestHistoryRow[]}
      initialMockProfile={profile.mock_profile}
      initialDisbursement={mapDisbursement(disbursement, request.approved_amount)}
      userId={profile.id}
    />
  )
}

function mapDisbursement(
  row:
    | {
        created_at: string
        metadata: Database["public"]["Tables"]["audit_logs"]["Row"]["metadata"]
      }
    | null,
  approvedAmount: number | null
): ResultDisbursement | null {
  if (!row || !approvedAmount) {
    return null
  }

  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? row.metadata
      : null
  const destination =
    typeof metadata?.destination === "string"
      ? metadata.destination
      : OPEN_FINANCE_FALLBACK_DESTINATION

  return {
    approvedAmount,
    destination,
    disbursedAt: row.created_at,
    status: "active",
  }
}

