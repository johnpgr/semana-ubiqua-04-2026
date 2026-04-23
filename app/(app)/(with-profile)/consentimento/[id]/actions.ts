"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireCurrentProfile } from "@/lib/auth/profile"
import type { DocumentRecord } from "@/lib/documents"
import { getFieldErrors, type FormActionState } from "@/lib/form-action"
import {
  deleteDocumentForRequest,
  uploadDocumentForRequest,
} from "@/lib/storage/documents"
import { createClient } from "@/lib/supabase/server"
import { Consent } from "@/validation/consent"

export type GiveConsentState = FormActionState<"scopes">
export type UploadDocumentState = FormActionState<
  "file" | "request_id",
  {
    document: DocumentRecord
  }
>
export type RemoveDocumentState = FormActionState<"document_id" | "request_id">

const ConsentPayload = Consent.extend({
  request_id: z.string().uuid("Solicitacao invalida"),
})

function getIpAddress(headerStore: Headers) {
  const forwarded = headerStore.get("x-forwarded-for")

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null
  }

  return headerStore.get("x-real-ip")
}

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
      formError: "Nao foi possivel carregar a solicitacao",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "Solicitacao nao encontrada",
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
      formError: "Nao foi possivel registrar o consentimento",
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
      formError: "Consentimento salvo, mas o status nao pode ser atualizado",
    }
  }

  revalidatePath(`/resultado/${request.id}`)
  redirect(`/resultado/${request.id}`)
}

export async function uploadDocument(
  _prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  const profile = await requireCurrentProfile()
  const supabase = await createClient()
  const requestId = formData.get("request_id")
  const normalizedRequestId = typeof requestId === "string" ? requestId : ""
  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select("id, status")
    .eq("id", normalizedRequestId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    return {
      ok: false,
      formError: "Nao foi possivel carregar a solicitacao",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "Solicitacao nao encontrada",
    }
  }

  if (request.status !== "awaiting_consent") {
    return {
      ok: false,
      formError: "Os documentos so podem ser enviados antes do consentimento",
    }
  }

  const uploadResult = await uploadDocumentForRequest({
    file: formData.get("file"),
    requestId: request.id,
    supabase,
    userId: profile.id,
  })

  if (!uploadResult.ok) {
    switch (uploadResult.error.code) {
      case "INVALID_REQUEST_ID":
        return {
          ok: false,
          formError: uploadResult.error.message,
        }
      case "FILE_REQUIRED":
      case "FILE_TOO_LARGE":
      case "UNSUPPORTED_MIME_TYPE":
        return {
          ok: false,
          fieldErrors: {
            file: [uploadResult.error.message],
          },
        }
      default:
        return {
          ok: false,
          formError: uploadResult.error.message,
        }
    }
  }

  revalidatePath(`/consentimento/${uploadResult.data.document.request_id}`)

  return {
    ok: true,
    data: {
      document: uploadResult.data.document,
    },
  }
}

export async function removeDocument(
  _prevState: RemoveDocumentState,
  formData: FormData
): Promise<RemoveDocumentState> {
  const profile = await requireCurrentProfile()
  const supabase = await createClient()
  const documentId = formData.get("document_id")
  const requestId = formData.get("request_id")
  const removeResult = await deleteDocumentForRequest({
    documentId: typeof documentId === "string" ? documentId : "",
    requestId: typeof requestId === "string" ? requestId : "",
    supabase,
    userId: profile.id,
  })

  if (!removeResult.ok) {
    return {
      ok: false,
      formError: removeResult.error.message,
    }
  }

  if (typeof requestId === "string" && requestId) {
    revalidatePath(`/consentimento/${requestId}`)
  }

  return {
    ok: true,
  }
}
