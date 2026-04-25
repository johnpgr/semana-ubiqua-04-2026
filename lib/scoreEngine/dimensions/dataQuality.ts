import { normalizeRange, scoreFromParts } from "../helpers"
import type { DimensionResult, ScoreMetrics } from "../types"

export function scoreDataQuality(metrics: ScoreMetrics): DimensionResult {
  const historyDepth = normalizeRange(metrics.historyDays, 14, 120)
  const transactionDepth = normalizeRange(metrics.transactionCount, 8, 90)
  const creditDepth = normalizeRange(metrics.creditCount, 2, 20)
  const activeMonths = normalizeRange(metrics.activeMonthCount, 1, 4)
  const value = scoreFromParts([historyDepth, transactionDepth, creditDepth, activeMonths])
  const reasons: string[] = []

  if (value >= 760) {
    reasons.push("Histórico suficiente para uma análise consistente.")
  } else if (value >= 520) {
    reasons.push("Histórico utilizável, mas ainda com volume limitado de dados.")
  } else {
    reasons.push("Histórico insuficiente para alta confiança na decisão.")
  }

  return {
    value,
    reasons,
    metrics: {
      historyDays: metrics.historyDays,
      transactionCount: metrics.transactionCount,
      creditCount: metrics.creditCount,
      activeMonthCount: metrics.activeMonthCount,
    },
  }
}
