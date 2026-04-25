"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireCurrentProfile } from "@/lib/auth/profile"
import type { FormActionState } from "@/lib/form-action"
import type { Json, TablesInsert } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export type SimulateRepaymentState = FormActionState<
  "request_id",
  { paidAt: string; principal: number; onTime: boolean }
>

type AuditLogInsert = TablesInsert<"audit_logs">

const RequestPayload = z.object({
  request_id: z.uuid("Solicitação inválida."),
})

const DISBURSEMENT_ACTION = "credit_disbursement_simulated"
const REPAYMENT_ACTION = "loan_payment_registered"
const LEGACY_REPAYMENT_ACTION = "loan_repayment_simulated"
const CYCLE_CLOSED_ACTION = "credit_cycle_closed"
const DUE_DAYS = 30

export async function simulateLoanRepayment(
  _prevState: SimulateRepaymentState,
  formData: FormData
): Promise<SimulateRepaymentState> {
  const parsed = RequestPayload.safeParse({
    request_id: formData.get("request_id"),
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
    .select("id, user_id, approved_amount")
    .eq("id", parsed.data.request_id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    console.error("Failed to load request for simulated repayment", {
      error: requestError,
      requestId: parsed.data.request_id,
      userId: profile.id,
    })

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

  const service = createServiceClient()

  // Confirm there is a disbursement
  const { data: disbursement, error: disbursementError } = await service
    .from("audit_logs")
    .select("created_at")
    .eq("entity_type", "credit_request")
    .eq("entity_id", request.id)
    .eq("action", DISBURSEMENT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (disbursementError || !disbursement) {
    if (disbursementError) {
      console.error("Failed to verify simulated disbursement before repayment", {
        error: disbursementError,
        requestId: request.id,
        userId: profile.id,
      })
    }

    return {
      ok: false,
      formError: "Não há liberação de crédito para esta solicitação.",
    }
  }

  // Confirm there is no prior repayment
  const { data: existingRepayment, error: existingError } = await service
    .from("audit_logs")
    .select("created_at, metadata")
    .eq("entity_type", "credit_request")
    .eq("entity_id", request.id)
    .in("action", [REPAYMENT_ACTION, LEGACY_REPAYMENT_ACTION])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    console.error("Failed to verify existing simulated repayment", {
      error: existingError,
      requestId: request.id,
      userId: profile.id,
    })

    return {
      ok: false,
      formError: "Não foi possível verificar o pagamento.",
    }
  }

  if (existingRepayment) {
    return {
      ok: false,
      formError: "Pagamento já registrado para este empréstimo.",
    }
  }

  const paidAt = new Date().toISOString()
  const dueAt = new Date(disbursement.created_at)
  dueAt.setDate(dueAt.getDate() + DUE_DAYS)
  const onTime = new Date(paidAt) <= dueAt
  const principal = request.approved_amount ?? 0

  const repaymentAuditRow: AuditLogInsert = {
    entity_type: "credit_request",
    entity_id: request.id,
    actor: profile.id,
    action: REPAYMENT_ACTION,
    created_at: paidAt,
    metadata: {
      requestId: request.id,
      userId: request.user_id,
      paidAt,
      amount: principal,
      principal,
      onTime,
      source: "user_action",
      previousStatus: "active",
      nextStatus: "paid",
    } satisfies Json,
  }

  const cycleClosedAuditRow: AuditLogInsert = {
    entity_type: "credit_request",
    entity_id: request.id,
    actor: profile.id,
    action: CYCLE_CLOSED_ACTION,
    created_at: paidAt,
    metadata: {
      requestId: request.id,
      userId: request.user_id,
      closedAt: paidAt,
      principal,
      onTime,
      source: "user_action",
    } satisfies Json,
  }

  const { error: insertError } = await service
    .from("audit_logs")
    .insert([repaymentAuditRow, cycleClosedAuditRow])

  if (insertError) {
    console.error("Failed to insert simulated repayment audit logs", {
      error: insertError,
      requestId: request.id,
      userId: profile.id,
    })

    return {
      ok: false,
      formError: "Não foi possível registrar o pagamento.",
    }
  }

  await cleanupDuplicateRepaymentAudits(service, request.id)

  revalidatePath(`/emprestimo/${request.id}`)
  revalidatePath("/minha-conta")
  revalidatePath(`/resultado/${request.id}`)
  revalidatePath("/admin")

  return {
    ok: true,
    data: {
      paidAt,
      principal,
      onTime,
    },
  }
}

async function cleanupDuplicateRepaymentAudits(
  service: ReturnType<typeof createServiceClient>,
  requestId: string
) {
  await cleanupDuplicateAuditAction(service, requestId, REPAYMENT_ACTION)
  await cleanupDuplicateAuditAction(service, requestId, LEGACY_REPAYMENT_ACTION)
  await cleanupDuplicateAuditAction(service, requestId, CYCLE_CLOSED_ACTION)
}

async function cleanupDuplicateAuditAction(
  service: ReturnType<typeof createServiceClient>,
  requestId: string,
  action: string
) {
  const { data: rows, error: loadError } = await service
    .from("audit_logs")
    .select("id")
    .eq("entity_type", "credit_request")
    .eq("entity_id", requestId)
    .eq("action", action)
    .order("created_at", { ascending: true })

  if (loadError || !rows || rows.length <= 1) {
    if (loadError) {
      console.error("Failed to load duplicate simulated loan audit logs", {
        action,
        error: loadError,
        requestId,
      })
    }

    return
  }

  const duplicateIds = rows.slice(1).map((row) => row.id)
  const { error: deleteError } = await service
    .from("audit_logs")
    .delete()
    .in("id", duplicateIds)

  if (deleteError) {
    console.error("Failed to cleanup duplicate simulated loan audit logs", {
      action,
      error: deleteError,
      requestId,
    })
  }
}

