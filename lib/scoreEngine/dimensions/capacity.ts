import {
  inverseNormalizeRange,
  normalizeRange,
  scoreFromParts,
} from "../helpers"
import type { DimensionResult, ScoreMetrics } from "../types"

export function scoreCapacity(metrics: ScoreMetrics): DimensionResult {
  const incomeStrength = normalizeRange(metrics.averageMonthlyIncome, 900, 7000)
  const netStrength = normalizeRange(metrics.averageMonthlyNet, 150, 3200)
  const expenseControl = inverseNormalizeRange(metrics.expenseRatio, 0.45, 1.08)
  const value = scoreFromParts([incomeStrength, netStrength, expenseControl])
  const reasons: string[] = []

  if (value >= 760) {
    reasons.push("Renda estimada e sobra mensal sustentam boa capacidade de pagamento.")
  } else if (value >= 520) {
    reasons.push("Capacidade de pagamento moderada, com margem mensal limitada.")
  } else {
    reasons.push("A margem financeira estimada é baixa para assumir novo crédito.")
  }

  if (metrics.expenseRatio > 0.9) {
    reasons.push("As saídas consomem quase toda a renda observada.")
  }

  return {
    value,
    reasons,
    metrics: {
      averageMonthlyIncome: metrics.averageMonthlyIncome,
      averageMonthlyDebits: metrics.averageMonthlyDebits,
      averageMonthlyNet: metrics.averageMonthlyNet,
      expenseRatio: metrics.expenseRatio,
    },
  }
}
