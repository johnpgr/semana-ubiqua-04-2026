import { notFound, redirect } from "next/navigation"

import { requireCurrentProfile } from "@/lib/auth/profile"
import { createClient } from "@/lib/supabase/server"

import { ResultCard } from "./result-card"

type ResultadoPageProps = {
  params: Promise<{ id: string }>
}

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
    .select("scopes, granted_at")
    .eq("request_id", request.id)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: score } = await supabase
    .from("scores")
    .select("value, reasons, suggested_limit")
    .eq("request_id", request.id)
    .maybeSingle()

  return (
    <ResultCard
      initialRequest={request}
      initialConsent={consent}
      initialScore={score}
    />
  )
}
