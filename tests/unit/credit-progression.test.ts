import assert from "node:assert/strict"

import {
  applyProgressiveCreditPolicy,
  evaluateProgressiveCreditState,
  type HistoricalRequestSnapshot,
} from "../../lib/creditProgression"

type NamedTest = {
  name: string
  run: () => void
}

const approvedHistory: HistoricalRequestSnapshot[] = [
  {
    id: "req-1",
    status: "decided",
    decision: "approved_reduced",
    approvedAmount: 1500,
    createdAt: "2026-01-10T10:00:00.000Z",
    decidedAt: "2026-01-10T12:00:00.000Z",
  },
  {
    id: "req-2",
    status: "decided",
    decision: "approved",
    approvedAmount: 3200,
    createdAt: "2026-02-10T10:00:00.000Z",
    decidedAt: "2026-02-10T12:00:00.000Z",
  },
]

export const creditProgressionTests: NamedTest[] = [
  {
    name: "progressive credit keeps the first concession conservative",
    run: () => {
      const result = applyProgressiveCreditPolicy({
        requestedAmount: 5000,
        score: 820,
        baseDecision: "approved",
        baseSuggestedLimit: 4200,
        baseReasons: ["Score forte para aprovacao inicial."],
        requestHistory: [],
      })

      assert.equal(result.level, "entry")
      assert.equal(result.isFirstConcession, true)
      assert.equal(result.isConservativeInitialOffer, true)
      assert.equal(result.decision, "approved_reduced")
      assert.equal(result.suggestedLimit, 1500)
      assert.ok(
        result.reasons.some((reason) =>
          reason.toLowerCase().includes("primeira concessao"),
        ),
      )
    },
  },
  {
    name: "progressive credit promotes mature accounts to trusted levels",
    run: () => {
      const state = evaluateProgressiveCreditState({
        requestedAmount: 5000,
        score: 760,
        baseDecision: "approved",
        baseSuggestedLimit: 4200,
        requestHistory: approvedHistory,
        paymentSignals: {
          completedCycles: 2,
          onTimeCycles: 2,
        },
      })

      assert.equal(state.level, "trusted")
      assert.equal(state.isFirstConcession, false)
      assert.ok(state.stats.previousApprovedRequests >= 2)
      assert.ok(state.appliedCap >= 5000)
    },
  },
]
