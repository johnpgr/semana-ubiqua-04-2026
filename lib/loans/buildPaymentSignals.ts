import type { PaymentCycleSignals } from "@/lib/creditProgression"
import type { Database } from "@/lib/supabase/database.types"
import { createServiceClient } from "@/lib/supabase/service"

const REPAYMENT_ACTION = "loan_repayment_simulated"

export async function buildPaymentSignals(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  requestIds: string[]
): Promise<PaymentCycleSignals> {
  if (requestIds.length === 0) {
    return {
      completedCycles: 0,
      onTimeCycles: 0,
      lateCycles: 0,
      defaultedCycles: 0,
    }
  }

  const { data: rows, error } = await service
    .from("audit_logs")
    .select("metadata")
    .eq("entity_type", "credit_request")
    .in("entity_id", requestIds)
    .eq("action", REPAYMENT_ACTION)

  if (error || !rows) {
    return {
      completedCycles: 0,
      onTimeCycles: 0,
      lateCycles: 0,
      defaultedCycles: 0,
    }
  }

  let completedCycles = 0
  let onTimeCycles = 0
  let lateCycles = 0
  let defaultedCycles = 0

  for (const row of rows) {
    const metadata =
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? row.metadata
        : null

    if (!metadata) continue

    completedCycles++

    const onTime = metadata.onTime === true
    const late = metadata.onTime === false

    if (onTime) {
      onTimeCycles++
    } else if (late) {
      lateCycles++
    }

    // Defaulted: very late (could be derived from metadata if we stored it)
    // For MVP, default is not explicitly tracked; we could infer from a separate flag.
    // Keeping it 0 unless metadata.defaulted === true.
    if (metadata.defaulted === true) {
      defaultedCycles++
    }
  }

  return {
    completedCycles,
    onTimeCycles,
    lateCycles,
    defaultedCycles,
  }
}

export type RepaymentAuditRow = Pick<
  Database["public"]["Tables"]["audit_logs"]["Row"],
  "entity_id" | "created_at" | "metadata"
>

export async function loadRepaymentAudits(
  service: ReturnType<typeof createServiceClient>,
  requestIds: string[]
): Promise<RepaymentAuditRow[]> {
  if (requestIds.length === 0) {
    return []
  }

  const { data, error } = await service
    .from("audit_logs")
    .select("entity_id, created_at, metadata")
    .eq("entity_type", "credit_request")
    .in("entity_id", requestIds)
    .eq("action", REPAYMENT_ACTION)
    .order("created_at", { ascending: false })

  if (error || !data) {
    return []
  }

  return data as RepaymentAuditRow[]
}
