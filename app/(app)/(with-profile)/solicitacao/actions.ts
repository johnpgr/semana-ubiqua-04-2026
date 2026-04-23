"use server"

import { redirect } from "next/navigation"

import { requireCurrentProfile } from "@/lib/auth/profile"
import { getFieldErrors, type FormActionState } from "@/lib/form-action"
import { createClient } from "@/lib/supabase/server"
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
