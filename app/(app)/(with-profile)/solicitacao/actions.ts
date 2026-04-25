"use server"

import { redirect } from "next/navigation"

import { requireCurrentProfile } from "@/lib/auth/profile"
import { getFieldErrors, type FormActionState } from "@/lib/form-action"
import { canRequestNewLoan } from "@/lib/loans/canRequestNewLoan"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { CreditRequest } from "@/validation/credit-request"

export type CreateCreditRequestState = FormActionState<"requested_amount">

export async function createCreditRequest(
  _prevState: CreateCreditRequestState,
  formData: FormData
): Promise<CreateCreditRequestState> {
  const parsedRequest = CreditRequest.safeParse({
    requested_amount: formData.get("requested_amount"),
  })

  if (!parsedRequest.success) {
    return {
      ok: false,
      fieldErrors: getFieldErrors<"requested_amount">(parsedRequest.error),
    }
  }

  const profile = await requireCurrentProfile()
  const supabase = await createClient()

  // Eligibility guard
  const { data: userRequests } = await supabase
    .from("credit_requests")
    .select("id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const requestIds = (userRequests ?? []).map((r) => r.id)
  const service = createServiceClient()
  const eligibility = await canRequestNewLoan(service, profile.id, requestIds)

  if (!eligibility.allowed) {
    return {
      ok: false,
      formError: eligibility.label,
    }
  }

  const { data, error } = await supabase
    .from("credit_requests")
    .insert({
      user_id: profile.id,
      requested_amount: parsedRequest.data.requested_amount,
      status: "awaiting_consent",
    })
    .select("id")
    .single()

  if (error || !data) {
    return {
      ok: false,
      formError: "Não foi possível registrar a solicitação agora",
    }
  }

  redirect(`/consentimento/${data.id}`)
}
