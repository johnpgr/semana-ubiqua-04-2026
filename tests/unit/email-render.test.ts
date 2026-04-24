import assert from "node:assert/strict"

import { evaluateProgressiveCreditState } from "../../lib/creditProgression"
import {
  buildEmailCommunicationBundle,
  type EmailCommunication,
  type EmailCommunicationType,
} from "../../lib/emailCommunication"
import { renderCommunicationHtml } from "../../lib/emailCommunication/renderHtml"
import { routeCommunicationRecipient } from "../../lib/emailCommunication/routing"
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

function buildSampleBundle() {
  const fraudScore = calculateFraudScore({
    transactions: suspiciousTransactions,
    deviceTrust: { userAgent: null, ipAddress: null },
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
  return buildEmailCommunicationBundle({
    requestId: "req-render-1",
    recipientName: "Ana",
    recipientEmail: "ana@example.com",
    requestedAmount: 4000,
    approvedAmount: 0,
    decision: "denied",
    scoreValue: 540,
    explainability,
    progressiveCredit: progression,
    fraudScore,
    monitoring,
  })
}

function stubCommunication(
  type: EmailCommunicationType,
  audience: EmailCommunication["audience"],
): EmailCommunication {
  return {
    id: `stub-${type}`,
    category: "decision",
    type,
    audience,
    status: "generated",
    subject: "Assunto de teste",
    preview: "Preview de teste",
    summary: "Resumo de teste",
    content: {
      greeting: "Ola, cliente.",
      intro: "Este e um corpo de teste para renderizacao.",
      highlights: ["Primeiro destaque", "Segundo destaque"],
      closing: "Encerramento de teste.",
    },
    audit: {
      templateKey: `stub-${type}-v1`,
      trigger: "decision",
      decision: "approved",
      decisionMode: "automatic",
      fraudRiskLevel: null,
      monitoringRiskLevel: null,
    },
  }
}

export const emailRenderTests: NamedTest[] = [
  {
    name: "renderCommunicationHtml produces html, text, and subject for every bundle communication",
    run: () => {
      const bundle = buildSampleBundle()

      assert.ok(bundle.communications.length >= 2)

      for (const communication of bundle.communications) {
        const rendered = renderCommunicationHtml(communication)

        assert.equal(rendered.subject, communication.subject)
        assert.ok(rendered.html.length > 0, "html should be non-empty")
        assert.ok(rendered.text.length > 0, "text should be non-empty")
        assert.ok(
          rendered.html.includes("<h1"),
          "html should contain an h1 header",
        )
        assert.ok(
          !rendered.html.includes("<script"),
          "html should not contain script tags",
        )
        assert.ok(
          rendered.text.includes(communication.content.greeting),
          "text fallback should include greeting",
        )
        for (const highlight of communication.content.highlights) {
          assert.ok(
            rendered.text.includes(highlight),
            `text should include highlight: ${highlight}`,
          )
        }
      }
    },
  },
  {
    name: "renderCommunicationHtml escapes HTML-dangerous content in subject and body",
    run: () => {
      const communication = stubCommunication("decision_approved", "user")
      communication.subject = '<script>alert("x")</script>'
      communication.content.greeting = '<script>alert("y")</script>'

      const rendered = renderCommunicationHtml(communication)
      assert.ok(
        !rendered.html.includes("<script>alert"),
        "dangerous script tags must be escaped",
      )
      assert.ok(
        rendered.html.includes("&lt;script&gt;"),
        "escaped output should contain entity references",
      )
    },
  },
  {
    name: "routeCommunicationRecipient routes user audiences to the user email",
    run: () => {
      const communication = stubCommunication("decision_approved", "user")
      assert.equal(
        routeCommunicationRecipient(communication, "user@example.com", null),
        "user@example.com",
      )
      assert.equal(
        routeCommunicationRecipient(communication, null, null),
        null,
      )
    },
  },
  {
    name: "routeCommunicationRecipient routes internal audiences to the operations inbox",
    run: () => {
      const communication = stubCommunication("operational_watch", "operations")
      assert.equal(
        routeCommunicationRecipient(
          communication,
          "user@example.com",
          "ops@example.com",
        ),
        "ops@example.com",
      )
      assert.equal(
        routeCommunicationRecipient(communication, "user@example.com", null),
        null,
      )
      assert.equal(
        routeCommunicationRecipient(communication, "user@example.com", ""),
        null,
      )
    },
  },
  {
    name: "explainability reasons use human-readable language without engine identifiers",
    run: () => {
      const progression = evaluateProgressiveCreditState({
        requestedAmount: 3000,
        score: 760,
        baseDecision: "approved_reduced",
        baseSuggestedLimit: 1500,
        requestHistory: [],
      })
      const fraudScore = calculateFraudScore({
        transactions: suspiciousTransactions,
        deviceTrust: { userAgent: null, ipAddress: null },
      })
      const cases = (
        ["approved", "approved_reduced", "further_review", "denied"] as const
      ).map((decision) =>
        buildDecisionExplainability({
          decision,
          scoreValue: 640,
          suggestedLimit: 1500,
          reasons: [],
          consentScopes: ["salary"],
          progressiveCredit: progression,
          fraudScore,
        }),
      )

      const forbiddenTokens = [
        "dataQuality",
        "data_quality",
        "scoreEngine",
        "creditProgression",
        "fraudScore",
        "postCreditMonitoring",
        "snake_case",
      ]

      for (const explainability of cases) {
        assert.ok(
          explainability.reasons.length > 0,
          "each decision should have at least one reason",
        )
        for (const reason of explainability.reasons) {
          assert.ok(
            reason.message.length >= 40,
            `reason ${reason.id} should have a message of at least 40 characters`,
          )
          for (const token of forbiddenTokens) {
            assert.ok(
              !reason.message.includes(token),
              `reason ${reason.id} should not include internal token "${token}"`,
            )
          }
        }
      }
    },
  },
]
