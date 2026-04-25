"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireCurrentProfile } from "@/lib/auth/profile"
import type { FormActionState } from "@/lib/form-action"
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
  request_id: z.uuid("SolicitaÃ§Ã£o invÃ¡lida."),
})

const DISBURSEMENT_ACTION = "credit_disbursement_simulated"
const SIMULATED_DESTINATION = "Banco Horizonte"

export async function simulateCreditDisbursement(
  _prevState: SimulateDisbursementState,
  formData: FormData
): Promise<SimulateDisbursementState> {
  const parsed = RequestPayload.safeParse({
    request_id: formData.get("request_id"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel identificar a solicitaÃ§Ã£o.",
      fieldErrors: {
        request_id: ["SolicitaÃ§Ã£o invÃ¡lida."],
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
      formError: "NÃ£o foi possÃ­vel carregar a solicitaÃ§Ã£o.",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "SolicitaÃ§Ã£o nÃ£o encontrada.",
    }
  }

  if (
    request.decision !== "approved" &&
    request.decision !== "approved_reduced"
  ) {
    return {
      ok: false,
      formError: "Esta decisÃ£o nÃ£o permite liberaÃ§Ã£o de crÃ©dito.",
    }
  }

  if (!request.approved_amount || request.approved_amount <= 0) {
    return {
      ok: false,
      formError: "A solicitaÃ§Ã£o aprovada nÃ£o possui valor liberÃ¡vel.",
    }
  }

  const service = createServiceClient()
  const { data: existingDisbursement, error: existingError } = await service
    .from("audit_logs")
    .select("created_at")
    .eq("entity_type", "credit_request")
    .eq("entity_id", request.id)
    .eq("action", DISBURSEMENT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel verificar a liberaÃ§Ã£o autorizada.",
    }
  }

  const disbursedAt = existingDisbursement?.created_at ?? new Date().toISOString()

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
        destination: SIMULATED_DESTINATION,
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
        formError: "NÃ£o foi possÃ­vel registrar a liberaÃ§Ã£o autorizada.",
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
      destination: SIMULATED_DESTINATION,
      disbursedAt,
      status: "active",
    },
  }
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

