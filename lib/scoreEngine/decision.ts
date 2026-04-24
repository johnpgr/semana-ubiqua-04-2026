import { clamp, round } from "./helpers"
import type { CreditDecision, ScoreBreakdown, ScoreMetrics } from "./types"

const APPROVED_REASON_BY_REQUEST_CONTEXT = {
  requested: "Score e limite estimado sustentam a aprovação solicitada.",
  automatic: "Score e limite estimado sustentam aprovação automática.",
} as const

const DECISION_BASE_REASONS = {
  approved_reduced:
    "Crédito aprovado com valor conservador para preservar capacidade de pagamento.",
  further_review:
    "A solicitação exige análise complementar antes da decisão final.",
  denied:
    "O risco observado está acima do aceitável para concessão automática.",
} as const satisfies Partial<Record<CreditDecision, string>>

export function decideCredit({
  score,
  requestedAmount,
  suggestedLimit,
  breakdown,
}: {
  score: number
  requestedAmount?: number
  suggestedLimit: number
  breakdown: ScoreBreakdown
}): CreditDecision {
  if (score < 400 || breakdown.dataQuality.value < 300) {
    return "denied"
  }

  if (score < 500 || breakdown.dataQuality.value < 520) {
    return "further_review"
  }

  if (score < 650) {
    return "approved_reduced"
  }

  if (
    requestedAmount !== undefined &&
    requestedAmount > 0 &&
    suggestedLimit < requestedAmount * 0.75
  ) {
    return "approved_reduced"
  }

  return "approved"
}

export function calculateSuggestedLimit(
  metrics: ScoreMetrics,
  score: number,
  requestedAmount?: number,
) {
  const monthlyNet = Math.max(metrics.averageMonthlyNet, 0)
  const monthlyIncome = Math.max(metrics.averageMonthlyIncome, 0)
  const baseCapacity = Math.min(monthlyNet * 2.5, monthlyIncome * 0.8)
  const scoreMultiplier = 0.35 + (clamp(score, 0, 1000) / 1000) * 1.15
  const rawLimit = baseCapacity * scoreMultiplier
  const maxLimit =
    requestedAmount !== undefined && requestedAmount > 0 ? requestedAmount : 15_000

  return round(clamp(rawLimit, 0, maxLimit))
}

export function buildDecisionReasons({
  decision,
  suggestedLimit,
  requestedAmount,
}: {
  decision: CreditDecision
  suggestedLimit: number
  requestedAmount?: number
}) {
  const reasons: string[] = []

  if (decision === "approved" && requestedAmount !== undefined && requestedAmount > 0) {
    reasons.push(APPROVED_REASON_BY_REQUEST_CONTEXT.requested)
  }

  if (
    decision === "approved" &&
    (requestedAmount === undefined || requestedAmount <= 0)
  ) {
    reasons.push(APPROVED_REASON_BY_REQUEST_CONTEXT.automatic)
  }

  if (decision === "approved_reduced") {
    reasons.push(DECISION_BASE_REASONS.approved_reduced)
  }

  if (decision === "further_review") {
    reasons.push(DECISION_BASE_REASONS.further_review)
  }

  if (decision === "denied") {
    reasons.push(DECISION_BASE_REASONS.denied)
  }

  if (
    decision !== "denied" &&
    requestedAmount !== undefined &&
    requestedAmount > 0 &&
    suggestedLimit < requestedAmount
  ) {
    reasons.push(
      `Limite sugerido de R$ ${suggestedLimit.toFixed(2)} abaixo do valor solicitado.`,
    )
  }

  return reasons
}
