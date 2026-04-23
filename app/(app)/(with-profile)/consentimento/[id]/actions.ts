"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireCurrentProfile } from "@/lib/auth/profile"
import { getFieldErrors, type FormActionState } from "@/lib/form-action"
import { createClient } from "@/lib/supabase/server"
import { Consent } from "@/validation/consent"

import { processCreditAnalysis } from "../../score-actions"

export type GiveConsentState = FormActionState<"scopes">

function getIpAddress(headerStore: Headers) {
  const forwarded = headerStore.get("x-forwarded-for")

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null
  }

  return headerStore.get("x-real-ip")
}

const ConsentPayload = Consent.extend({
  request_id: z.string().uuid("Solicitação inválida"),
})

export async function giveConsent(
  _prevState: GiveConsentState,
  formData: FormData
): Promise<GiveConsentState> {
  const parsedConsent = ConsentPayload.safeParse({
    request_id: formData.get("request_id"),
    scopes: formData
      .getAll("scopes")
      .filter((value): value is string => typeof value === "string"),
  })

  if (!parsedConsent.success) {
    const fieldErrors = getFieldErrors<"request_id" | "scopes">(
      parsedConsent.error
    )

    return {
      ok: false,
      formError: fieldErrors.request_id?.[0],
      fieldErrors: {
        scopes: fieldErrors.scopes,
      },
    }
  }

  const profile = await requireCurrentProfile()

  const supabase = await createClient()
  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select("id, status")
    .eq("id", parsedConsent.data.request_id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    return {
      ok: false,
      formError: "Não foi possível carregar a solicitação",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "Solicitação não encontrada",
    }
  }

  if (request.status !== "awaiting_consent") {
    redirect(`/resultado/${request.id}`)
  }

  const headerStore = await headers()
  const { error: consentError } = await supabase.from("consents").insert({
    request_id: request.id,
    user_id: profile.id,
    scopes: parsedConsent.data.scopes,
    ip_address: getIpAddress(headerStore),
    user_agent: headerStore.get("user-agent"),
  })

  if (consentError) {
    return {
      ok: false,
      formError: "Não foi possível registrar o consentimento",
    }
  }

  const { error: updateError } = await supabase
    .from("credit_requests")
    .update({
      status: "collecting_data",
    })
    .eq("id", request.id)
    .eq("status", "awaiting_consent")

  if (updateError) {
    return {
      ok: false,
      formError: "Consentimento salvo, mas o status não pôde ser atualizado",
    }
  }

  const analysis = await processCreditAnalysis(request.id)

  if (!analysis.ok) {
    revalidatePath(`/resultado/${request.id}`)
    redirect(`/resultado/${request.id}`)
  }

  revalidatePath(`/resultado/${request.id}`)
  redirect(`/resultado/${request.id}`)
}
