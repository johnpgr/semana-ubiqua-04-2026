import { scoreBehavior } from "./dimensions/behavior"
import { scoreCapacity } from "./dimensions/capacity"
import { scoreDataQuality } from "./dimensions/dataQuality"
import { scoreRegularity } from "./dimensions/regularity"
import { scoreStability } from "./dimensions/stability"
import {
  buildDecisionReasons,
  calculateSuggestedLimit,
  decideCredit,
} from "./decision"
import { buildScoreMetrics } from "./helpers"
import type { ScoreBreakdown, ScoreInput, ScoreResult } from "./types"

export type {
  CreditDecision,
  DimensionResult,
  ScoreBreakdown,
  ScoreDimension,
  ScoreInput,
  ScoreMetrics,
  ScoreResult,
  ScoreTransaction,
} from "./types"

const DIMENSION_WEIGHTS = {
  regularity: 0.22,
  capacity: 0.28,
  stability: 0.2,
  behavior: 0.18,
  dataQuality: 0.12,
} satisfies Record<keyof ScoreBreakdown, number>

export function calculateCreditScore({
  transactions,
  requestedAmount,
}: ScoreInput): ScoreResult {
  const metrics = buildScoreMetrics(transactions)
  const breakdown: ScoreBreakdown = {
    regularity: scoreRegularity(metrics),
    capacity: scoreCapacity(metrics),
    stability: scoreStability(metrics),
    behavior: scoreBehavior(metrics),
    dataQuality: scoreDataQuality(metrics),
  }
  const value = aggregateScore(breakdown)
  const preliminarySuggestedLimit = calculateSuggestedLimit(
    metrics,
    value,
    requestedAmount,
  )
  const decision = decideCredit({
    score: value,
    requestedAmount,
    suggestedLimit: preliminarySuggestedLimit,
    breakdown,
  })
  const suggestedLimit = decision === "denied" ? 0 : preliminarySuggestedLimit
  const reasons = buildReasons(breakdown, {
    decision,
    requestedAmount,
    suggestedLimit,
  })

  return {
    value,
    decision,
    suggestedLimit,
    reasons,
    breakdown,
    metrics,
  }
}

function aggregateScore(breakdown: ScoreBreakdown) {
  const weightedScore = Object.entries(DIMENSION_WEIGHTS).reduce(
    (total, [dimension, weight]) =>
      total + breakdown[dimension as keyof ScoreBreakdown].value * weight,
    0,
  )

  return Math.round(Math.min(Math.max(weightedScore, 0), 1000))
}

function buildReasons(
  breakdown: ScoreBreakdown,
  decisionContext: Parameters<typeof buildDecisionReasons>[0],
) {
  const dimensionReasons = Object.values(breakdown)
    .toSorted((first, second) => second.value - first.value)
    .flatMap((dimension) => dimension.reasons)
    .slice(0, 5)

  return [
    ...buildDecisionReasons(decisionContext),
    ...dimensionReasons,
  ].slice(0, 7)
}
