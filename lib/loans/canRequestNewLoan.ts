import "server-only"

import { createServiceClient } from "@/lib/supabase/service"
import { loadActiveLoanForUser } from "./index"

export type NewLoanEligibility =
  | { allowed: true; reason: null; label: null }
  | {
      allowed: false
      reason: "active_loan" | "request_in_progress"
      label: string
    }

export async function canRequestNewLoan(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  requestIds: string[]
): Promise<NewLoanEligibility> {
  const activeLoan = await loadActiveLoanForUser(service, requestIds)

  if (activeLoan && (activeLoan.status === "active" || activeLoan.status === "overdue")) {
    return {
      allowed: false,
      reason: "active_loan",
      label:
        activeLoan.status === "overdue"
          ? "Você possui um empréstimo em aberto vencido. Conclua o pagamento para solicitar novo crédito."
          : "Você possui um empréstimo ativo. Conclua o pagamento para solicitar novo crédito.",
    }
  }

  // Check for in-progress requests
  const { data: openRequests, error } = await service
    .from("credit_requests")
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["awaiting_consent", "collecting_data", "scoring"])
    .limit(1)

  if (!error && openRequests && openRequests.length > 0) {
    return {
      allowed: false,
      reason: "request_in_progress",
      label: "Você já tem uma solicitação em andamento. Aguarde a conclusão.",
    }
  }

  return {
    allowed: true,
    reason: null,
    label: null,
  }
}
