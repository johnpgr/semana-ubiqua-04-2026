import { clamp, round } from "./helpers"
import type { CreditDecision, ScoreBreakdown, ScoreMetrics } from "./types"

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
  if (score < 470 || breakdown.dataQuality.value < 300) {
    return "denied"
  }

  if (score < 620 || breakdown.dataQuality.value < 520) {
    return "further_review"
  }

  if (score < 760) {
    return "approved_reduced"
  }

  if (requestedAmount && suggestedLimit < requestedAmount * 0.75) {
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
  const maxLimit = requestedAmount && requestedAmount > 0 ? requestedAmount : 15_000

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

  if (decision === "approved" && requestedAmount) {
    reasons.push("Score e limite estimado sustentam a aprovação solicitada.")
  }

  if (decision === "approved" && !requestedAmount) {
    reasons.push("Score e limite estimado sustentam aprovação automática.")
  }

  if (decision === "approved_reduced") {
    reasons.push("Crédito aprovado com valor conservador para preservar capacidade de pagamento.")
  }

  if (decision === "further_review") {
    reasons.push("A solicitação exige análise complementar antes da decisão final.")
  }

  if (decision === "denied") {
    reasons.push("O risco observado está acima do aceitável para concessão automática.")
  }

  if (requestedAmount && suggestedLimit < requestedAmount) {
    reasons.push(
      `Limite sugerido de R$ ${suggestedLimit.toFixed(2)} abaixo do valor solicitado.`,
    )
  }

  return reasons
}
