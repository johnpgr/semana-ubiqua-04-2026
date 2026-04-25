"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireCurrentProfile } from "@/lib/auth/profile"
import type { FormActionState } from "@/lib/form-action"
import {
  OPEN_FINANCE_FALLBACK_DESTINATION,
  sanitizeInstitutionName,
} from "@/lib/open-finance-connection"
import type { Json, TablesInsert } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type DisbursementData = {
  approvedAmount: number
  destination: string
  disbursedAt: string
  status: "active"
}

export type SimulateDisbursementState = FormActionState<
  "request_id",
  DisbursementData
>

type AuditLogInsert = TablesInsert<"audit_logs">

const RequestPayload = z.object({
  request_id: z.uuid("Solicitação inválida."),
  destination: z.string().trim().max(120).optional(),
  institution_name: z.string().trim().max(60).optional(),
  account_last4: z.string().regex(/^\d{4}$/).optional(),
})

const DISBURSEMENT_ACTION = "credit_disbursement_simulated"

export async function simulateCreditDisbursement(
  _prevState: SimulateDisbursementState,
  formData: FormData
): Promise<SimulateDisbursementState> {
  const parsed = RequestPayload.safeParse({
    request_id: formData.get("request_id"),
    destination: formData.get("destination") || undefined,
    institution_name: formData.get("institution_name") || undefined,
    account_last4: formData.get("account_last4") || undefined,
  })

  if (!parsed.success) {
    return {
      ok: false,
      formError: "Não foi possível identificar a solicitação.",
      fieldErrors: {
        request_id: ["Solicitação inválida."],
      },
    }
  }

  const profile = await requireCurrentProfile()
  const supabase = await createClient()
  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select("id, user_id, decision, approved_amount")
    .eq("id", parsed.data.request_id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    return {
      ok: false,
      formError: "Não foi possível carregar a solicitação.",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "Solicitação não encontrada.",
    }
  }

  if (
    request.decision !== "approved" &&
    request.decision !== "approved_reduced"
  ) {
    return {
      ok: false,
      formError: "Esta decisão não permite liberação de crédito.",
    }
  }

  if (!request.approved_amount || request.approved_amount <= 0) {
    return {
      ok: false,
      formError: "A solicitação aprovada não possui valor liberável.",
    }
  }

  const service = createServiceClient()
  const { data: existingDisbursement, error: existingError } = await service
    .from("audit_logs")
    .select("created_at, metadata")
    .eq("entity_type", "credit_request")
    .eq("entity_id", request.id)
    .eq("action", DISBURSEMENT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    return {
      ok: false,
      formError: "Não foi possível verificar a liberação autorizada.",
    }
  }

  const disbursedAt = existingDisbursement?.created_at ?? new Date().toISOString()
  const existingMetadata = getMetadata(existingDisbursement?.metadata ?? null)
  const destination =
    typeof existingMetadata?.destination === "string"
      ? existingMetadata.destination
      : getDestination(parsed.data.destination)
  const institutionName =
    typeof existingMetadata?.institutionName === "string"
      ? existingMetadata.institutionName
      : sanitizeInstitutionName(parsed.data.institution_name ?? "")
  const accountLast4 =
    typeof existingMetadata?.accountLast4 === "string"
      ? existingMetadata.accountLast4
      : parsed.data.account_last4

  if (!existingDisbursement) {
    const auditRow: AuditLogInsert = {
      entity_type: "credit_request",
      entity_id: request.id,
      actor: profile.id,
      action: DISBURSEMENT_ACTION,
      created_at: disbursedAt,
      metadata: {
        requestId: request.id,
        userId: request.user_id,
        approvedAmount: request.approved_amount,
        destination,
        institutionName: institutionName || null,
        accountLast4: accountLast4 ?? null,
        status: "active",
        timestamp: disbursedAt,
        source: "user_action",
      } satisfies Json,
    }

    const { error: auditError } = await service
      .from("audit_logs")
      .insert(auditRow)

    if (auditError) {
      return {
        ok: false,
        formError: "Não foi possível registrar a liberação autorizada.",
      }
    }
  }

  await cleanupDuplicateDisbursements(service, request.id)

  revalidatePath(`/resultado/${request.id}`)
  revalidatePath("/minha-conta")

  return {
    ok: true,
    data: {
      approvedAmount: request.approved_amount,
      destination,
      disbursedAt,
      status: "active",
    },
  }
}

function getDestination(value: string | undefined) {
  const destination = sanitizeInstitutionName(value ?? "")

  return destination || OPEN_FINANCE_FALLBACK_DESTINATION
}

function getMetadata(metadata: Json | null) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata
    : null
}

async function cleanupDuplicateDisbursements(
  service: ReturnType<typeof createServiceClient>,
  requestId: string
) {
  const { data: disbursements, error: loadError } = await service
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "credit_request")
    .eq("entity_id", requestId)
    .eq("action", DISBURSEMENT_ACTION)
    .order("created_at", { ascending: true })

  if (loadError || !disbursements || disbursements.length <= 1) {
    if (loadError) {
      console.error("Failed to load duplicate disbursement audit logs", {
        error: loadError,
        requestId,
      })
    }

    return
  }

  const duplicateIds = disbursements.slice(1).map((row) => row.id)
  const { error: deleteError } = await service
    .from("audit_logs")
    .delete()
    .in("id", duplicateIds)

  if (deleteError) {
    console.error("Failed to cleanup duplicate disbursement audit logs", {
      error: deleteError,
      requestId,
    })
  }
}
