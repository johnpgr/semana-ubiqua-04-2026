import type { SyntheticTransaction } from "@/lib/mockData/profiles"

export type ScoreDimension =
  | "regularity"
  | "capacity"
  | "stability"
  | "behavior"
  | "dataQuality"

export type CreditDecision =
  | "approved"
  | "approved_reduced"
  | "further_review"
  | "denied"

export type DimensionResult = {
  value: number
  reasons: string[]
  metrics: Record<string, number>
}

export type ScoreBreakdown = Record<ScoreDimension, DimensionResult>

export type ScoreInput = {
  transactions: SyntheticTransaction[]
  /**
   * Optional because the pure engine can be used before a request is persisted.
   * When present, suggestedLimit is capped at this value.
   */
  requestedAmount?: number
}

export type ScoreResult = {
  value: number
  decision: CreditDecision
  suggestedLimit: number
  reasons: string[]
  breakdown: ScoreBreakdown
  metrics: ScoreMetrics
}

export type ScoreMetrics = {
  historyDays: number
  transactionCount: number
  creditCount: number
  debitCount: number
  totalIncome: number
  totalDebits: number
  netAmount: number
  averageMonthlyIncome: number
  averageMonthlyDebits: number
  averageMonthlyNet: number
  expenseRatio: number
  incomeGapAverageDays: number
  incomeGapMaxDays: number
  incomeGapVolatility: number
  incomeAmountVolatility: number
  activeMonthCount: number
  positiveMonthRatio: number
  debitCategoryCount: number
  discretionaryDebitRatio: number
}
