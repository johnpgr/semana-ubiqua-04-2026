import type { Database } from "@/lib/supabase/database.types"

export type RequestStatus = Database["public"]["Enums"]["request_status"]
export type CreditDecision = Database["public"]["Enums"]["credit_decision"]

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  awaiting_consent: "Aguardando consentimento",
  collecting_data: "Coletando dados",
  scoring: "Em análise",
  decided: "Concluída",
}

export const CREDIT_DECISION_LABEL: Record<CreditDecision, string> = {
  approved: "Aprovada",
  approved_reduced: "Aprovada com limite reduzido",
  further_review: "Em revisão adicional",
  denied: "Não aprovada",
}

export function getRequestStatusLabel(status: RequestStatus) {
  return REQUEST_STATUS_LABEL[status]
}

export function getCreditDecisionLabel(decision: CreditDecision) {
  return CREDIT_DECISION_LABEL[decision]
}
