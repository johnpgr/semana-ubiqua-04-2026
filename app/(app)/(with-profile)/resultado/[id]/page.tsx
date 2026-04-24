import { notFound, redirect } from "next/navigation"

import { requireCurrentProfile } from "@/lib/auth/profile"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

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

  const { data: consent } = await supabase
    .from("consents")
    .select("scopes, granted_at, user_agent, ip_address")
    .eq("request_id", request.id)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const [{ data: score }, { data: requestHistory }, { data: transactions }] =
    await Promise.all([
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
  ])

  return (
    <ResultCard
      initialRequest={request}
      initialConsent={consent as ResultConsentRow | null}
      initialScore={score}
      initialTransactions={(transactions ?? []) as ResultTransactionRow[]}
      requestHistory={(requestHistory ?? []) as RequestHistoryRow[]}
    />
  )
}
