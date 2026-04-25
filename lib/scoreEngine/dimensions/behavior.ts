import {
  inverseNormalizeRange,
  normalizeRange,
  scoreFromParts,
} from "../helpers"
import type { DimensionResult, ScoreMetrics } from "../types"

export function scoreBehavior(metrics: ScoreMetrics): DimensionResult {
  const positiveMonths = normalizeRange(metrics.positiveMonthRatio, 0.35, 1)
  const expenseControl = inverseNormalizeRange(metrics.expenseRatio, 0.55, 1.15)
  const categoryDiversity = normalizeRange(metrics.debitCategoryCount, 2, 6)
  const discretionaryControl = inverseNormalizeRange(
    metrics.discretionaryDebitRatio,
    0.05,
    0.28,
  )
  const value = scoreFromParts([
    positiveMonths,
    expenseControl,
    categoryDiversity,
    discretionaryControl,
  ])
  const reasons: string[] = []

  if (value >= 760) {
    reasons.push("Uso financeiro organizado, com despesas controladas frente às entradas.")
  } else if (value >= 520) {
    reasons.push("Comportamento financeiro aceitável, mas com sinais de aperto.")
  } else {
    reasons.push("O padrão de gastos indica baixa folga ou organização financeira frágil.")
  }

  if (metrics.discretionaryDebitRatio > 0.25) {
    reasons.push("Gastos discricionários têm peso relevante no fluxo observado.")
  }

  return {
    value,
    reasons,
    metrics: {
      positiveMonthRatio: metrics.positiveMonthRatio,
      debitCategoryCount: metrics.debitCategoryCount,
      discretionaryDebitRatio: metrics.discretionaryDebitRatio,
      expenseRatio: metrics.expenseRatio,
    },
  }
}
