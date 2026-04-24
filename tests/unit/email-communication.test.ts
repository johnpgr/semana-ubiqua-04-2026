import assert from "node:assert/strict"

import { evaluateProgressiveCreditState } from "../../lib/creditProgression"
import { buildEmailCommunicationBundle } from "../../lib/emailCommunication"
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

export const emailCommunicationTests: NamedTest[] = [
  {
    name: "buildEmailCommunicationBundle creates approval email and transparency companion",
    run: () => {
      const progression = evaluateProgressiveCreditState({
        requestedAmount: 3000,
        score: 760,
        baseDecision: "approved_reduced",
        baseSuggestedLimit: 1500,
        requestHistory: [],
      })
      const explainability = buildDecisionExplainability({
        decision: "approved_reduced",
        scoreValue: 760,
        suggestedLimit: 1500,
        reasons: ["Primeira concessao em faixa conservadora."],
        consentScopes: ["salary", "cards"],
        progressiveCredit: progression,
      })

      const bundle = buildEmailCommunicationBundle({
        requestId: "req-1",
        recipientName: "Camila",
        requestedAmount: 3000,
        approvedAmount: 1500,
        decision: "approved_reduced",
        scoreValue: 760,
        explainability,
        progressiveCredit: progression,
      })

      assert.equal(bundle.primary.category, "decision")
      assert.equal(bundle.primary.type, "decision_approved_reduced")
      assert.ok(bundle.primary.subject.includes("limite reduzido"))
      assert.ok(
        bundle.communications.some(
          (communication) => communication.category === "transparency",
        ),
      )
    },
  },
  {
    name: "buildEmailCommunicationBundle adds security and risk communications for suspicious case",
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
        reasons: ["Bloqueio por risco relevante."],
        consentScopes: ["salary"],
        progressiveCredit: progression,
        fraudScore,
        monitoring,
      })

      const bundle = buildEmailCommunicationBundle({
        requestId: "req-2",
        requestedAmount: 4000,
        approvedAmount: 0,
        decision: "denied",
        scoreValue: 540,
        explainability,
        progressiveCredit: progression,
        fraudScore,
        monitoring,
      })

      assert.equal(bundle.primary.type, "decision_denied")
      assert.ok(
        bundle.communications.some(
          (communication) => communication.category === "security",
        ),
      )
      assert.ok(
        bundle.communications.some(
          (communication) => communication.category === "risk",
        ),
      )
      assert.ok(
        bundle.communications.some(
          (communication) => communication.category === "operation",
        ),
      )
    },
  },
]
