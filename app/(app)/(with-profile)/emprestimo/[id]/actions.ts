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
const REPAYMENT_ACTION = "loan_repayment_simulated"
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
    return {
      ok: false,
      formError: "Não há liberação de crédito para esta solicitação.",
    }
  }

  // Confirm there is no prior repayment
  const { data: existingRepayment, error: existingError } = await service
    .from("audit_logs")
    .select("created_at")
    .eq("entity_type", "credit_request")
    .eq("entity_id", request.id)
    .eq("action", REPAYMENT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    return {
      ok: false,
      formError: "Não foi possível verificar o pagamento simulado.",
    }
  }

  if (existingRepayment) {
    return {
      ok: false,
      formError: "Este empréstimo já foi pago simuladamente.",
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
      principal,
      onTime,
      source: "user_action",
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
    return {
      ok: false,
      formError: "Não foi possível registrar o pagamento simulado.",
    }
  }

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
