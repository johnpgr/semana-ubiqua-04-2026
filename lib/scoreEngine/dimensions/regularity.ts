import {
  inverseNormalizeRange,
  normalizeRange,
  scoreFromParts,
} from "../helpers"
import type { DimensionResult, ScoreMetrics } from "../types"

export function scoreRegularity(metrics: ScoreMetrics): DimensionResult {
  const creditDensity = normalizeRange(metrics.creditCount, 2, 24)
  const gapConsistency = inverseNormalizeRange(metrics.incomeGapVolatility, 0.05, 0.85)
  const maxGapControl = inverseNormalizeRange(metrics.incomeGapMaxDays, 8, 35)
  const activeMonths = normalizeRange(metrics.activeMonthCount, 1, 4)
  const value = scoreFromParts([
    creditDensity,
    gapConsistency,
    maxGapControl,
    activeMonths,
  ])
  const reasons: string[] = []

  if (value >= 760) {
    reasons.push("Entradas recorrentes e bem distribuídas ao longo do histórico.")
  } else if (value >= 520) {
    reasons.push("Há recorrência de entradas, mas com intervalos ainda irregulares.")
  } else {
    reasons.push("As entradas são pouco frequentes ou concentradas em poucos períodos.")
  }

  if (metrics.incomeGapMaxDays > 25) {
    reasons.push("Foram observados intervalos longos sem novas entradas.")
  }

  return {
    value,
    reasons,
    metrics: {
      creditCount: metrics.creditCount,
      incomeGapAverageDays: metrics.incomeGapAverageDays,
      incomeGapMaxDays: metrics.incomeGapMaxDays,
      incomeGapVolatility: metrics.incomeGapVolatility,
    },
  }
}
