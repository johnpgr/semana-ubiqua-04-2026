import assert from "node:assert/strict"

import {
  applyFraudDecisionPolicy,
  calculateFraudScore,
  type DeviceTrustContext,
} from "../../lib/fraudScore"
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

const trustedDevice: DeviceTrustContext = {
  userAgent: "Mozilla/5.0 Test Browser",
  ipAddress: "203.0.113.10",
}

const healthyTransactions: ScoreTransaction[] = [
  credit("2026-01-05T10:00:00.000Z", 6200),
  debit("2026-01-08T10:00:00.000Z", 2200, "aluguel"),
  debit("2026-01-12T10:00:00.000Z", 900, "alimentacao"),
  debit("2026-01-18T10:00:00.000Z", 500, "transporte"),
  credit("2026-02-05T10:00:00.000Z", 6150),
  debit("2026-02-08T10:00:00.000Z", 2150, "aluguel"),
  debit("2026-02-12T10:00:00.000Z", 880, "alimentacao"),
  debit("2026-02-18T10:00:00.000Z", 450, "contas"),
]

const suspiciousTransactions: ScoreTransaction[] = [
  credit("2026-04-01T10:00:00.000Z", 3000, "freelance"),
  debit("2026-04-01T18:00:00.000Z", 2940, "contas"),
  credit("2026-04-03T10:00:00.000Z", 3000, "freelance"),
  debit("2026-04-03T18:00:00.000Z", 2950, "contas"),
  credit("2026-04-05T10:00:00.000Z", 3000, "freelance"),
  debit("2026-04-05T18:00:00.000Z", 2960, "contas"),
  credit("2026-04-07T10:00:00.000Z", 3000, "freelance"),
  debit("2026-04-07T18:00:00.000Z", 2945, "contas"),
]

export const fraudScoreTests: NamedTest[] = [
  {
    name: "calculateFraudScore keeps healthy flow in low fraud risk",
    run: () => {
      const result = calculateFraudScore({
        transactions: healthyTransactions,
        deviceTrust: trustedDevice,
      })

      assert.equal(result.riskLevel, "low")
      assert.ok(result.value < 260)
      assert.ok(result.breakdown.syntheticIncome < 260)
      assert.ok(result.reasons.length > 0)
    },
  },
  {
    name: "calculateFraudScore detects suspicious mirrored income pattern",
    run: () => {
      const result = calculateFraudScore({
        transactions: suspiciousTransactions,
        deviceTrust: {
          userAgent: null,
          ipAddress: null,
        },
      })

      assert.ok(result.value >= 520)
      assert.ok(result.riskLevel === "high" || result.riskLevel === "critical")
      assert.ok(
        result.signals.some(
          (signal) => signal.category === "synthetic_income",
        ),
      )
      assert.ok(result.metrics.mirroredTransferCount >= 3)
    },
  },
  {
    name: "applyFraudDecisionPolicy blocks or reviews high fraud risk even with good credit",
    run: () => {
      const fraudScore = calculateFraudScore({
        transactions: suspiciousTransactions,
        deviceTrust: {
          userAgent: null,
          ipAddress: null,
        },
      })

      const result = applyFraudDecisionPolicy({
        creditDecision: "approved",
        suggestedLimit: 3000,
        reasons: ["Score forte para aprovacao."],
        fraudScore,
      })

      assert.ok(result.decision === "further_review" || result.decision === "denied")
      assert.ok(result.suggestedLimit <= 3000)
      assert.ok(result.reasons.length > 0)
    },
  },
]
