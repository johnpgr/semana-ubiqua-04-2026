import assert from "node:assert/strict"

import { evaluatePostCreditMonitoring } from "../../lib/postCreditMonitoring"
import type { ScoreTransaction } from "../../lib/scoreEngine"

type NamedTest = {
  name: string
  run: () => void
}

function credit(
  occurredAt: string,
  amount: number,
  category = "salario",
): ScoreTransaction {
  return {
    occurredAt,
    amount,
    kind: "credit",
    category,
    description: "Recebimento",
  }
}

function debit(
  occurredAt: string,
  amount: number,
  category = "contas",
): ScoreTransaction {
  return {
    occurredAt,
    amount,
    kind: "debit",
    category,
    description: "Pagamento",
  }
}

const stableTransactions: ScoreTransaction[] = [
  credit("2026-01-05T10:00:00.000Z", 6200),
  debit("2026-01-10T10:00:00.000Z", 2100, "aluguel"),
  debit("2026-01-16T10:00:00.000Z", 900, "alimentacao"),
  credit("2026-02-05T10:00:00.000Z", 6300),
  debit("2026-02-09T10:00:00.000Z", 2200, "aluguel"),
  debit("2026-02-18T10:00:00.000Z", 950, "servicos"),
]

const fragileTransactions: ScoreTransaction[] = [
  credit("2026-04-01T10:00:00.000Z", 3000),
  debit("2026-04-01T18:00:00.000Z", 2800, "transferencia"),
  credit("2026-04-04T10:00:00.000Z", 2900),
  debit("2026-04-05T09:00:00.000Z", 2750, "contas"),
]

export const postCreditMonitoringTests: NamedTest[] = [
  {
    name: "evaluatePostCreditMonitoring keeps mature healthy relationship in low risk",
    run: () => {
      const result = evaluatePostCreditMonitoring({
        transactions: stableTransactions,
        creditScoreValue: 790,
        creditDecision: "approved",
        suggestedLimit: 5000,
        approvedAmount: 5000,
        fraudScoreValue: 80,
        fraudRiskLevel: "low",
        confidenceLevel: "trusted",
        isFirstConcession: false,
        requestHistory: [
          {
            id: "r1",
            status: "decided",
            decision: "approved",
            approvedAmount: 3200,
            createdAt: "2026-01-01T00:00:00.000Z",
            decidedAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "r2",
            status: "decided",
            decision: "approved",
            approvedAmount: 3800,
            createdAt: "2026-02-01T00:00:00.000Z",
            decidedAt: "2026-02-02T00:00:00.000Z",
          },
        ],
      })

      assert.equal(result.riskLevel, "low")
      assert.equal(result.limitRecommendation.action, "maintain")
      assert.equal(result.eligibility.status, "eligible")
      assert.ok(result.alerts.length <= 6)
    },
  },
  {
    name: "evaluatePostCreditMonitoring freezes growth for first conservative concession",
    run: () => {
      const result = evaluatePostCreditMonitoring({
        transactions: stableTransactions,
        creditScoreValue: 690,
        creditDecision: "approved_reduced",
        suggestedLimit: 1500,
        approvedAmount: 1500,
        fraudScoreValue: 180,
        fraudRiskLevel: "low",
        confidenceLevel: "entry",
        isFirstConcession: true,
        requestHistory: [],
      })

      assert.equal(result.riskLevel, "moderate")
      assert.equal(result.limitRecommendation.action, "freeze_growth")
      assert.equal(result.eligibility.status, "frozen")
      assert.ok(
        result.alerts.some((alert) => alert.key === "initial_relationship"),
      )
    },
  },
  {
    name: "evaluatePostCreditMonitoring escalates high fraud and fragile flow",
    run: () => {
      const result = evaluatePostCreditMonitoring({
        transactions: fragileTransactions,
        creditScoreValue: 540,
        creditDecision: "further_review",
        suggestedLimit: 0,
        approvedAmount: 0,
        fraudScoreValue: 640,
        fraudRiskLevel: "high",
        confidenceLevel: "initial_confidence",
        isFirstConcession: false,
        requestHistory: [
          {
            id: "r1",
            status: "decided",
            decision: "further_review",
            approvedAmount: 0,
            createdAt: "2026-03-01T00:00:00.000Z",
            decidedAt: "2026-03-02T00:00:00.000Z",
          },
        ],
      })

      assert.ok(result.riskLevel === "high" || result.riskLevel === "critical")
      assert.ok(
        result.limitRecommendation.action === "reduce_future_exposure" ||
          result.limitRecommendation.action === "manual_review",
      )
      assert.ok(
        result.eligibility.status === "review_required" ||
          result.eligibility.status === "blocked",
      )
      assert.ok(
        result.alerts.some((alert) => alert.key === "high_fraud_watch"),
      )
    },
  },
]
