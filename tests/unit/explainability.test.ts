import assert from "node:assert/strict"

import { evaluateProgressiveCreditState } from "../../lib/creditProgression"
import { buildDecisionExplainability } from "../../lib/explainability"
import { calculateFraudScore } from "../../lib/fraudScore"
import { evaluatePostCreditMonitoring } from "../../lib/postCreditMonitoring"
import type { ScoreTransaction } from "../../lib/scoreEngine"

type NamedTest = {
  name: string
  run: () => void
}

function credit(occurredAt: string, amount: number): ScoreTransaction {
  return {
    occurredAt,
    amount,
    kind: "credit",
    category: "salario",
    description: "Recebimento",
  }
}

function debit(occurredAt: string, amount: number): ScoreTransaction {
  return {
    occurredAt,
    amount,
    kind: "debit",
    category: "contas",
    description: "Pagamento",
  }
}

const suspiciousTransactions: ScoreTransaction[] = [
  credit("2026-04-01T10:00:00.000Z", 3000),
  debit("2026-04-01T18:00:00.000Z", 2940),
  credit("2026-04-03T10:00:00.000Z", 3000),
  debit("2026-04-03T18:00:00.000Z", 2950),
  credit("2026-04-05T10:00:00.000Z", 3000),
  debit("2026-04-05T18:00:00.000Z", 2960),
]

export const explainabilityTests: NamedTest[] = [
  {
    name: "buildDecisionExplainability marks first conservative approval as automatic with clear factors",
    run: () => {
      const progression = evaluateProgressiveCreditState({
        requestedAmount: 5000,
        score: 760,
        baseDecision: "approved",
        baseSuggestedLimit: 3200,
        requestHistory: [],
      })

      const explainability = buildDecisionExplainability({
        decision: "approved_reduced",
        scoreValue: 760,
        suggestedLimit: 1500,
        reasons: ["Primeira concessao com valor controlado."],
        consentScopes: ["salary", "cards"],
        progressiveCredit: progression,
      })

      assert.equal(explainability.decisionMode, "automatic")
      assert.ok(
        explainability.reasons.some((reason) =>
          reason.message.includes("valor controlado"),
        ),
      )
      assert.ok(
        explainability.primaryFactors.some(
          (factor) => factor.key === "initial_conservative_offer",
        ),
      )
    },
  },
  {
    name: "buildDecisionExplainability marks further review as review additional",
    run: () => {
      const fraudScore = calculateFraudScore({
        transactions: suspiciousTransactions,
        deviceTrust: {
          userAgent: null,
          ipAddress: null,
        },
      })

      const explainability = buildDecisionExplainability({
        decision: "further_review",
        scoreValue: 610,
        suggestedLimit: 0,
        reasons: ["O caso exige verificacao adicional."],
        consentScopes: ["salary"],
        fraudScore,
      })

      assert.equal(explainability.decisionMode, "review_additional")
      assert.ok(
        explainability.reasons.some((reason) =>
          reason.message.includes("verificacao adicional"),
        ),
      )
      assert.ok(explainability.sensitiveDataNotice)
    },
  },
  {
    name: "buildDecisionExplainability marks denied high fraud as preventive block",
    run: () => {
      const fraudScore = calculateFraudScore({
        transactions: suspiciousTransactions,
        deviceTrust: {
          userAgent: null,
          ipAddress: null,
        },
      })
      const progression = evaluateProgressiveCreditState({
        requestedAmount: 4000,
        score: 540,
        baseDecision: "approved_reduced",
        baseSuggestedLimit: 1200,
        requestHistory: [],
      })
      const monitoring = evaluatePostCreditMonitoring({
        transactions: suspiciousTransactions,
        creditScoreValue: 540,
        creditDecision: "denied",
        suggestedLimit: 0,
        approvedAmount: 0,
        fraudScoreValue: fraudScore.value,
        fraudRiskLevel: fraudScore.riskLevel,
        confidenceLevel: progression.level,
        isFirstConcession: progression.isFirstConcession,
        requestHistory: [],
      })

      const explainability = buildDecisionExplainability({
        decision: "denied",
        scoreValue: 540,
        suggestedLimit: 0,
        reasons: ["Concessao bloqueada por risco relevante."],
        consentScopes: ["salary"],
        progressiveCredit: progression,
        fraudScore,
        monitoring,
      })

      assert.equal(explainability.decisionMode, "preventive_block")
      assert.ok(
        explainability.primaryFactors.some(
          (factor) => factor.key === "preventive_block",
        ),
      )
      assert.ok(explainability.futureConsentNotice)
    },
  },
]
