import "server-only"

import type { Database } from "@/lib/supabase/database.types"
import { createServiceClient } from "@/lib/supabase/service"

export type LoanStatus = "active" | "paid" | "overdue"

export type Loan = {
  requestId: string
  amount: number
  destination: string
  disbursedAt: string
  dueAt: string
  repaidAt: string | null
  onTime: boolean | null
  status: LoanStatus
}

const DISBURSEMENT_ACTION = "credit_disbursement_simulated"
const REPAYMENT_ACTION = "loan_payment_registered"
const LEGACY_REPAYMENT_ACTION = "loan_repayment_simulated"
const SIMULATED_DESTINATION = "Banco Horizonte"
const DUE_DAYS = 30

export async function loadLoanForRequest(
  service: ReturnType<typeof createServiceClient>,
  requestId: string
): Promise<Loan | null> {
  const { data: rows, error } = await service
    .from("audit_logs")
    .select("action, created_at, metadata")
    .eq("entity_type", "credit_request")
    .eq("entity_id", requestId)
    .in("action", [
      DISBURSEMENT_ACTION,
      REPAYMENT_ACTION,
      LEGACY_REPAYMENT_ACTION,
    ])
    .order("created_at", { ascending: false })
    .limit(20)

  if (error || !rows || rows.length === 0) {
    return null
  }

  const disbursement = rows.find((row) => row.action === DISBURSEMENT_ACTION)
  const repayment = rows.find(
    (row) =>
      row.action === REPAYMENT_ACTION || row.action === LEGACY_REPAYMENT_ACTION
  )

  if (!disbursement) {
    return null
  }

  return buildLoan({ disbursement, repayment, fallbackRequestId: requestId })
}

export async function loadActiveLoanForUser(
  service: ReturnType<typeof createServiceClient>,
  requestIds: string[]
): Promise<Loan | null> {
  if (requestIds.length === 0) {
    return null
  }

  const { data: rows, error } = await service
    .from("audit_logs")
    .select("action, created_at, metadata, entity_id")
    .eq("entity_type", "credit_request")
    .in("entity_id", requestIds)
    .in("action", [
      DISBURSEMENT_ACTION,
      REPAYMENT_ACTION,
      LEGACY_REPAYMENT_ACTION,
    ])
    .order("created_at", { ascending: false })
    .limit(200)

  if (error || !rows) {
    return null
  }

  const byRequest = new Map<string, { disbursement?: typeof rows[0]; repayment?: typeof rows[0] }>()

  for (const row of rows) {
    const entry = byRequest.get(row.entity_id) ?? {}
    if (row.action === DISBURSEMENT_ACTION && !entry.disbursement) {
      entry.disbursement = row
    }
    if (
      (row.action === REPAYMENT_ACTION || row.action === LEGACY_REPAYMENT_ACTION) &&
      !entry.repayment
    ) {
      entry.repayment = row
    }
    byRequest.set(row.entity_id, entry)
  }

  for (const requestId of requestIds) {
    const entry = byRequest.get(requestId)
    if (entry?.disbursement && !entry.repayment) {
      return buildLoan({
        disbursement: entry.disbursement,
        repayment: undefined,
        fallbackRequestId: requestId,
      })
    }
  }

  for (const requestId of requestIds) {
    const entry = byRequest.get(requestId)
    if (entry?.disbursement && entry.repayment) {
      return buildLoan({
        disbursement: entry.disbursement,
        repayment: entry.repayment,
        fallbackRequestId: requestId,
      })
    }
  }

  return null
}

function buildLoan({
  disbursement,
  repayment,
  fallbackRequestId,
}: {
  disbursement: { created_at: string; metadata: Database["public"]["Tables"]["audit_logs"]["Row"]["metadata"] }
  repayment?: { created_at: string; metadata: Database["public"]["Tables"]["audit_logs"]["Row"]["metadata"] }
  fallbackRequestId: string
}): Loan {
  const disbursedAt = disbursement.created_at
  const dueAt = addDays(disbursedAt, DUE_DAYS)
  const repaidAt = repayment?.created_at ?? null

  const metadata =
    disbursement.metadata &&
    typeof disbursement.metadata === "object" &&
    !Array.isArray(disbursement.metadata)
      ? disbursement.metadata
      : null

  const destination =
    typeof metadata?.destination === "string"
      ? metadata.destination
      : SIMULATED_DESTINATION

  const amount =
    typeof metadata?.approvedAmount === "number"
      ? metadata.approvedAmount
      : 0

  const onTime = repaidAt
    ? new Date(repaidAt).getTime() <= new Date(dueAt).getTime()
    : null

  let status: LoanStatus
  if (repaidAt) {
    status = "paid"
  } else if (new Date() > new Date(dueAt)) {
    status = "overdue"
  } else {
    status = "active"
  }

  return {
    requestId:
      typeof metadata?.requestId === "string" && metadata.requestId.length > 0
        ? metadata.requestId
        : fallbackRequestId,
    amount,
    destination,
    disbursedAt,
    dueAt,
    repaidAt,
    onTime,
    status,
  }
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

