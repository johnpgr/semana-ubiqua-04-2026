import assert from "node:assert/strict"

import {
  calculateCreditScore,
  type CreditDecision,
  type ScoreTransaction,
} from "../../lib/scoreEngine"
import {
  generateSyntheticTransactions,
  type MockProfile,
} from "../../lib/mockData/profiles"

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
  credit("2025-11-05T10:00:00.000Z", 6150),
  debit("2025-11-08T10:00:00.000Z", 2050, "aluguel"),
  debit("2025-11-12T10:00:00.000Z", 910, "alimentacao"),
  debit("2025-11-19T10:00:00.000Z", 480, "contas"),
  credit("2025-12-05T10:00:00.000Z", 6180),
  debit("2025-12-08T10:00:00.000Z", 2080, "aluguel"),
  debit("2025-12-12T10:00:00.000Z", 930, "alimentacao"),
  debit("2025-12-19T10:00:00.000Z", 490, "transporte"),
  credit("2026-01-05T10:00:00.000Z", 6200),
  debit("2026-01-08T10:00:00.000Z", 2100, "aluguel"),
  debit("2026-01-11T10:00:00.000Z", 900, "alimentacao"),
  debit("2026-01-18T10:00:00.000Z", 500, "transporte"),
  credit("2026-02-05T10:00:00.000Z", 6100),
  debit("2026-02-08T10:00:00.000Z", 2150, "aluguel"),
  debit("2026-02-12T10:00:00.000Z", 920, "alimentacao"),
  debit("2026-02-21T10:00:00.000Z", 450, "contas"),
  credit("2026-03-05T10:00:00.000Z", 6300),
  debit("2026-03-08T10:00:00.000Z", 2180, "aluguel"),
  debit("2026-03-12T10:00:00.000Z", 960, "alimentacao"),
  debit("2026-03-21T10:00:00.000Z", 520, "saude"),
  credit("2026-04-05T10:00:00.000Z", 6250),
  debit("2026-04-08T10:00:00.000Z", 2200, "aluguel"),
  debit("2026-04-12T10:00:00.000Z", 940, "alimentacao"),
  debit("2026-04-19T10:00:00.000Z", 520, "contas"),
]

const riskyTransactions: ScoreTransaction[] = [
  credit("2026-01-02T10:00:00.000Z", 900, "bico"),
  debit("2026-01-03T10:00:00.000Z", 1300, "contas"),
  debit("2026-01-05T10:00:00.000Z", 700, "lazer"),
  credit("2026-02-26T10:00:00.000Z", 650, "bico"),
  debit("2026-02-27T10:00:00.000Z", 1400, "contas"),
  debit("2026-02-28T10:00:00.000Z", 850, "lazer"),
]

type ProfileExpectation = {
  min: number
  max: number
  decision: CreditDecision
}

const profileExpectations: Record<MockProfile, ProfileExpectation> = {
  perfil_forte: {
    min: 800,
    max: 1000,
    decision: "approved",
  },
  motorista_consistente: {
    min: 700,
    max: 900,
    decision: "approved",
  },
  autonomo_irregular: {
    min: 450,
    max: 780,
    decision: "approved_reduced",
  },
  fluxo_instavel: {
    min: 0,
    max: 520,
    decision: "further_review",
  },
  historico_insuficiente: {
    min: 0,
    max: 450,
    decision: "denied",
  },
}

export const scoreEngineTests: NamedTest[] = [
  {
    name: "calculateCreditScore returns a complete approved result for stable transactions",
    run: () => {
      const result = calculateCreditScore({
        transactions: stableTransactions,
        requestedAmount: 4000,
      })

      assert.equal(result.decision, "approved")
      assert.ok(result.value >= 650)
      assert.ok(result.value <= 1000)
      assert.ok(result.suggestedLimit > 0)
      assert.ok(result.suggestedLimit <= 4000)
      assert.ok(result.reasons.length > 0)
      assert.ok(
        result.reasons.every(
          (reason) => typeof reason === "string" && reason.length > 0,
        ),
      )

      assert.deepEqual(Object.keys(result.breakdown).toSorted(), [
        "behavior",
        "capacity",
        "dataQuality",
        "regularity",
        "stability",
      ])

      assert.ok(result.metrics.totalIncome > result.metrics.totalDebits)
      assert.ok(result.metrics.hasEnoughIncomeGapHistory)
    },
  },
  {
    name: "calculateCreditScore returns denied with zero suggested limit for risky transactions",
    run: () => {
      const result = calculateCreditScore({
        transactions: riskyTransactions,
        requestedAmount: 3000,
      })

      assert.equal(result.decision, "denied")
      assert.equal(result.suggestedLimit, 0)
      assert.ok(result.value >= 0)
      assert.ok(result.value <= 1000)
      assert.ok(
        result.reasons.some((reason) => reason.toLowerCase().includes("risco")),
      )
    },
  },
  {
    name: "calculateCreditScore handles missing requestedAmount with conservative internal cap",
    run: () => {
      const result = calculateCreditScore({
        transactions: stableTransactions,
      })

      assert.ok(result.suggestedLimit >= 0)
      assert.ok(result.suggestedLimit <= 15000)
    },
  },
  ...Object.entries(profileExpectations).map(([profile, expectation]) => ({
    name: `mock profile ${profile} stays within the expected score band`,
    run: () => {
      const transactions = generateSyntheticTransactions({
        profile: profile as MockProfile,
        requestId: `request-${profile}`,
        referenceDate: new Date("2026-04-23T12:00:00.000Z"),
        seed: 42,
      })

      const result = calculateCreditScore({
        transactions,
        requestedAmount: 4000,
      })

      assert.ok(
        result.value >= expectation.min,
        `${profile} score below expected band`,
      )
      assert.ok(
        result.value <= expectation.max,
        `${profile} score above expected band`,
      )
      assert.equal(result.decision, expectation.decision)
      assert.ok(result.breakdown.dataQuality.value >= 0)
      assert.ok(result.reasons.length > 0)
    },
  })),
]
