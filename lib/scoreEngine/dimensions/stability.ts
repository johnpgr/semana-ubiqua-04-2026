import { inverseNormalizeRange, scoreFromParts } from "../helpers"
import type { DimensionResult, ScoreMetrics } from "../types"

export function scoreStability(metrics: ScoreMetrics): DimensionResult {
  const incomeValueStability = inverseNormalizeRange(
    metrics.incomeAmountVolatility,
    0.08,
    1.15,
  )
  const incomeCadenceStability = inverseNormalizeRange(
    metrics.incomeGapVolatility,
    0.08,
    1,
  )
  const maxGapStability = inverseNormalizeRange(metrics.incomeGapMaxDays, 10, 45)
  const value = scoreFromParts([
    incomeValueStability,
    incomeCadenceStability,
    maxGapStability,
  ])
  const reasons: string[] = []

  if (value >= 760) {
    reasons.push("Fluxo financeiro estável, com baixa volatilidade nas entradas.")
  } else if (value >= 520) {
    reasons.push("Fluxo financeiro com oscilações, mas ainda com algum padrão.")
  } else {
    reasons.push("Alta volatilidade nas entradas reduz a previsibilidade do fluxo.")
  }

  return {
    value,
    reasons,
    metrics: {
      incomeAmountVolatility: metrics.incomeAmountVolatility,
      incomeGapVolatility: metrics.incomeGapVolatility,
      incomeGapMaxDays: metrics.incomeGapMaxDays,
    },
  }
}
