import {
  inverseNormalizeRange,
  normalizeRange,
  scoreFromParts,
} from "../helpers"
import type { DimensionResult, ScoreMetrics } from "../types"

export function scoreRegularity(metrics: ScoreMetrics): DimensionResult {
  const creditDensity = normalizeRange(metrics.creditCount, 2, 24)
  const gapConsistency = metrics.hasEnoughIncomeGapHistory
    ? inverseNormalizeRange(metrics.incomeGapVolatility, 0.05, 0.85)
    : 0.35
  const maxGapControl = metrics.hasEnoughIncomeGapHistory
    ? inverseNormalizeRange(metrics.incomeGapMaxDays, 8, 35)
    : 0.35
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

  if (!metrics.hasEnoughIncomeGapHistory) {
    reasons.push("Histórico de entradas ainda insuficiente para medir cadência com segurança.")
  }

  return {
    value,
    reasons,
    metrics: {
      creditCount: metrics.creditCount,
      incomeGapAverageDays: metrics.incomeGapAverageDays,
      incomeGapMaxDays: metrics.incomeGapMaxDays,
      incomeGapVolatility: metrics.incomeGapVolatility,
      hasEnoughIncomeGapHistory: metrics.hasEnoughIncomeGapHistory,
    },
  }
}
