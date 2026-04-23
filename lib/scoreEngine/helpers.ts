import type { ScoreMetrics, ScoreTransaction } from "./types"

const DAY_IN_MS = 24 * 60 * 60 * 1000
const MONTH_IN_DAYS = 30
const DISCRETIONARY_CATEGORIES = new Set(["lazer"])

type DatedTransaction = ScoreTransaction & {
  occurredAtDate: Date
}

export function buildScoreMetrics(transactions: ScoreTransaction[]): ScoreMetrics {
  const datedTransactions = toDatedTransactions(transactions)
  const credits = datedTransactions.filter((transaction) => transaction.kind === "credit")
  const debits = datedTransactions.filter((transaction) => transaction.kind === "debit")
  const incomeGaps = getIncomeGaps(credits)
  const historyDays = getHistoryDays(datedTransactions)
  const monthFactor = Math.max(historyDays / MONTH_IN_DAYS, 1)
  const totalIncome = sumAmounts(credits)
  const totalDebits = sumAmounts(debits)
  const monthlySummaries = buildMonthlySummaries(datedTransactions)
  const positiveMonths = monthlySummaries.filter((summary) => summary.income >= summary.debits)
  const debitCategoryCount = new Set(debits.map((transaction) => transaction.category)).size
  const discretionaryDebits = debits.filter((transaction) =>
    DISCRETIONARY_CATEGORIES.has(transaction.category),
  )

  return {
    historyDays,
    transactionCount: datedTransactions.length,
    creditCount: credits.length,
    debitCount: debits.length,
    totalIncome: round(totalIncome),
    totalDebits: round(totalDebits),
    netAmount: round(totalIncome - totalDebits),
    averageMonthlyIncome: round(totalIncome / monthFactor),
    averageMonthlyDebits: round(totalDebits / monthFactor),
    averageMonthlyNet: round((totalIncome - totalDebits) / monthFactor),
    expenseRatio: safeRatio(totalDebits, totalIncome),
    incomeGapAverageDays: average(incomeGaps),
    incomeGapMaxDays: Math.max(...incomeGaps, 0),
    incomeGapVolatility: coefficientOfVariation(incomeGaps),
    incomeAmountVolatility: coefficientOfVariation(credits.map((credit) => credit.amount)),
    activeMonthCount: monthlySummaries.length,
    positiveMonthRatio: safeRatio(positiveMonths.length, monthlySummaries.length),
    debitCategoryCount,
    discretionaryDebitRatio: safeRatio(sumAmounts(discretionaryDebits), totalDebits),
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function normalizeRange(value: number, min: number, max: number) {
  if (max <= min) {
    return 0
  }

  return clamp((value - min) / (max - min), 0, 1)
}

export function inverseNormalizeRange(value: number, min: number, max: number) {
  return 1 - normalizeRange(value, min, max)
}

export function round(value: number) {
  return Math.round(value * 100) / 100
}

export function scoreFromParts(parts: number[]) {
  const score = average(parts) * 1000

  return Math.round(clamp(score, 0, 1000))
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function buildMonthlySummaries(transactions: DatedTransaction[]) {
  const summaries = new Map<string, { income: number; debits: number }>()

  for (const transaction of transactions) {
    const key = `${transaction.occurredAtDate.getUTCFullYear()}-${transaction.occurredAtDate.getUTCMonth()}`
    const summary = summaries.get(key) ?? { income: 0, debits: 0 }

    if (transaction.kind === "credit") {
      summary.income += transaction.amount
    } else {
      summary.debits += transaction.amount
    }

    summaries.set(key, summary)
  }

  return [...summaries.values()]
}

function coefficientOfVariation(values: number[]) {
  if (values.length < 2) {
    return 1
  }

  const mean = average(values)

  if (mean === 0) {
    return 1
  }

  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length

  return Math.sqrt(variance) / mean
}

function getHistoryDays(transactions: DatedTransaction[]) {
  if (transactions.length < 2) {
    return 0
  }

  // eslint-disable-next-line unicorn/no-array-sort -- Avoid ES2023 toSorted; tsconfig targets ES2017.
  const sorted = [...transactions].sort(
    (first, second) =>
      first.occurredAtDate.getTime() - second.occurredAtDate.getTime(),
  )
  const first = sorted[0]?.occurredAtDate.getTime() ?? 0
  const last = sorted.at(-1)?.occurredAtDate.getTime() ?? first

  return Math.max(Math.ceil((last - first) / DAY_IN_MS), 1)
}

function getIncomeGaps(credits: DatedTransaction[]) {
  // eslint-disable-next-line unicorn/no-array-sort -- Avoid ES2023 toSorted; tsconfig targets ES2017.
  const sortedCredits = [...credits].sort(
    (first, second) =>
      first.occurredAtDate.getTime() - second.occurredAtDate.getTime(),
  )

  return sortedCredits.slice(1).map((credit, index) => {
    const previousCredit = sortedCredits[index]

    if (!previousCredit) {
      return 0
    }

    return Math.max(
      Math.round(
        (credit.occurredAtDate.getTime() - previousCredit.occurredAtDate.getTime()) /
          DAY_IN_MS,
      ),
      0,
    )
  })
}

function safeRatio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0
  }

  return numerator / denominator
}

function sumAmounts(transactions: ScoreTransaction[]) {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0)
}

function toDatedTransactions(transactions: ScoreTransaction[]) {
  return transactions
    .map((transaction) => ({
      ...transaction,
      occurredAtDate: new Date(transaction.occurredAt),
    }))
    .filter((transaction) => Number.isFinite(transaction.occurredAtDate.getTime()))
}
