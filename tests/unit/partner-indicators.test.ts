import assert from "node:assert/strict"

import {
  applyPartnerIndicatorsToCreditScore,
  applyPartnerIndicatorsToFraudScore,
  getMockPartnerIndicatorProfile,
} from "../../lib/partnerIndicators"
import { calculateFraudScore, type FraudScoreResult } from "../../lib/fraudScore"
import type { ScoreBreakdown, ScoreTransaction } from "../../lib/scoreEngine"

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

const breakdownStub: ScoreBreakdown = {
  regularity: { value: 720, reasons: [], metrics: {} },
  capacity: { value: 710, reasons: [], metrics: {} },
  stability: { value: 700, reasons: [], metrics: {} },
  behavior: { value: 680, reasons: [], metrics: {} },
  dataQuality: { value: 650, reasons: [], metrics: {} },
}

function aggregateBreakdownScore(breakdown: ScoreBreakdown) {
  return Math.round(
    breakdown.regularity.value * 0.22 +
      breakdown.capacity.value * 0.28 +
      breakdown.stability.value * 0.2 +
      breakdown.behavior.value * 0.18 +
      breakdown.dataQuality.value * 0.12,
  )
}

export const partnerIndicatorTests: NamedTest[] = [
  {
    name: "getMockPartnerIndicatorProfile returns a typed partner bundle for known profile",
    run: () => {
      const partner = getMockPartnerIndicatorProfile("motorista_consistente")

      assert.ok(partner)
      assert.equal(partner.partnerId, "rota-flex")
      assert.ok(partner.indicators.length >= 3)
    },
  },
  {
    name: "applyPartnerIndicatorsToCreditScore reinforces strong partner profile without dominating decision",
    run: () => {
      const partner = getMockPartnerIndicatorProfile("perfil_forte")

      assert.ok(partner)

      const result = applyPartnerIndicatorsToCreditScore({
        partnerProfile: partner,
        scoreValue: 720,
        suggestedLimit: 3000,
        decision: "approved",
        reasons: ["Score interno favoravel."],
        requestedAmount: 4000,
        breakdown: breakdownStub,
      })

      assert.ok(result.value > 720)
      assert.equal(result.value, aggregateBreakdownScore(result.breakdown))
      assert.ok(result.scoreDeltaApplied > 0)
      assert.ok(result.suggestedLimit >= 3000)
      assert.equal(result.decision, "approved")
      assert.ok(
        result.reasons.some((reason) =>
          reason.toLowerCase().includes("indicadores agregados"),
        ),
      )
    },
  },
  {
    name: "applyPartnerIndicatorsToFraudScore increases caution for unstable external partner profile",
    run: () => {
      const partner = getMockPartnerIndicatorProfile("fluxo_instavel")

      assert.ok(partner)

      const fraudScore = calculateFraudScore({
        transactions: suspiciousTransactions,
        deviceTrust: {
          userAgent: "Mozilla/5.0 Test Browser",
          ipAddress: "203.0.113.10",
        },
      })

      const result = applyPartnerIndicatorsToFraudScore({
        partnerProfile: partner,
        fraudScore,
      })

      assert.ok(result.fraudScore.value >= fraudScore.value)
      assert.ok(
        result.fraudScore.riskLevel === fraudScore.riskLevel ||
          result.fraudScore.riskLevel === "critical",
      )
      assert.ok(
        result.fraudScore.reasons.some((reason) =>
          reason.toLowerCase().includes("parceiro"),
        ),
      )
      assert.ok(
        result.fraudScore.signals.some(
          (signal) => signal.category === "external_partner",
        ),
      )
    },
  },
  {
    name: "applyPartnerIndicatorsToFraudScore keeps recommendation coherent when risk level changes",
    run: () => {
      const partner = getMockPartnerIndicatorProfile("fluxo_instavel")

      assert.ok(partner)

      const baseFraudScore: FraudScoreResult = {
        value: 500,
        riskLevel: "moderate",
        signals: [],
        reasons: ["Risco moderado inicial."],
        operationalRecommendation:
          "Reduzir exposicao inicial e monitorar sinais de autenticidade.",
        breakdown: {
          syntheticIncome: 300,
          patternRepetition: 200,
          deviceTrust: 100,
        },
        metrics: {
          mirroredTransferCount: 0,
          fastOutflowRatio: 0,
          retainedIncomeRatio: 0.4,
          repeatedAmountRatio: 0.1,
          repeatedAmountCrossPatternCount: 0,
          hasUserAgent: true,
          hasIpAddress: true,
        },
      }

      const result = applyPartnerIndicatorsToFraudScore({
        partnerProfile: partner,
        fraudScore: baseFraudScore,
      })

      assert.equal(result.fraudScore.riskLevel, "high")
      assert.equal(
        result.fraudScore.operationalRecommendation,
        "Encaminhar para revisao manual antes de qualquer liberacao.",
      )
      assert.ok(
        result.fraudScore.reasons.some((reason) =>
          reason.includes("moderado para alto"),
        ),
      )
    },
  },
]
