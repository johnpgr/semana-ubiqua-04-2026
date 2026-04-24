import assert from "node:assert/strict"

import {
  getUserSafeFraudSummary,
  getUserVisibleCommunications,
} from "../../lib/analysisPresentation"
import type { EmailCommunicationBundle } from "../../lib/emailCommunication"
import type { FraudScoreResult } from "../../lib/fraudScore"

type NamedTest = {
  name: string
  run: () => void
}

const communicationBundle: EmailCommunicationBundle = {
  primary: {
    id: "decision",
    category: "decision",
    type: "decision_approved",
    audience: "user",
    status: "generated",
    subject: "OpenCred: aprovado",
    preview: "Resultado aprovado.",
    summary: "Resumo",
    content: {
      greeting: "Ola.",
      intro: "Intro",
      highlights: [],
      closing: "Fechamento",
    },
    audit: {
      templateKey: "decision-approved-v1",
      trigger: "decision",
    },
  },
  communications: [
    {
      id: "decision",
      category: "decision",
      type: "decision_approved",
      audience: "user",
      status: "generated",
      subject: "OpenCred: aprovado",
      preview: "Resultado aprovado.",
      summary: "Resumo",
      content: {
        greeting: "Ola.",
        intro: "Intro",
        highlights: [],
        closing: "Fechamento",
      },
      audit: {
        templateKey: "decision-approved-v1",
        trigger: "decision",
      },
    },
    {
      id: "operation",
      category: "operation",
      type: "operational_watch",
      audience: "operations",
      status: "generated",
      subject: "OpenCred: acompanhamento interno",
      preview: "Resumo operacional interno.",
      summary: "Interno",
      content: {
        greeting: "Equipe.",
        intro: "Operacional",
        highlights: [],
        closing: "Fechamento",
      },
      audit: {
        templateKey: "operational-watch-v1",
        trigger: "operation",
      },
    },
  ],
}

const highFraudScore: FraudScoreResult = {
  value: 620,
  riskLevel: "high",
  signals: [
    {
      key: "mirrored_transfers",
      category: "synthetic_income",
      label: "Entradas e saidas espelhadas",
      severity: 0.9,
      detail: "Detalhe interno sensivel sobre a regra de deteccao.",
    },
  ],
  reasons: ["Risco alto de fraude exige revisao adicional."],
  operationalRecommendation: "Encaminhar para revisao manual antes de liberar.",
  breakdown: {
    syntheticIncome: 600,
    patternRepetition: 200,
    deviceTrust: 100,
  },
  metrics: {
    mirroredTransferCount: 3,
    fastOutflowRatio: 0.8,
    retainedIncomeRatio: 0.02,
    repeatedAmountRatio: 0.4,
    repeatedAmountCrossPatternCount: 2,
    hasUserAgent: true,
    hasIpAddress: true,
  },
}

export const analysisPresentationTests: NamedTest[] = [
  {
    name: "getUserVisibleCommunications hides non-user communications",
    run: () => {
      const result = getUserVisibleCommunications(communicationBundle)

      assert.equal(result.communications.length, 1)
      assert.equal(result.primary?.audience, "user")
      assert.ok(
        result.communications.every(
          (communication) => communication.audience === "user",
        ),
      )
    },
  },
  {
    name: "getUserSafeFraudSummary avoids sensitive fraud detection details",
    run: () => {
      const result = getUserSafeFraudSummary(highFraudScore)
      const joinedText = [result.summary, ...result.notes].join(" ").toLowerCase()

      assert.ok(joinedText.includes("criterios internos"))
      assert.ok(!joinedText.includes("espelhadas"))
      assert.ok(!joinedText.includes("curto intervalo"))
      assert.ok(!joinedText.includes("regra de deteccao"))
    },
  },
]
