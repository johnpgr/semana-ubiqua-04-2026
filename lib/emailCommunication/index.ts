import type { ProgressiveCreditState } from "../creditProgression"
import type {
  ExplainabilityDecisionMode,
  ExplainabilityResult,
} from "../explainability"
import type { FraudScoreResult } from "../fraudScore"
import type { PostCreditMonitoringResult } from "../postCreditMonitoring"
import type { CreditDecision } from "../scoreEngine/types"

export type EmailCommunicationCategory =
  | "decision"
  | "transparency"
  | "risk"
  | "security"
  | "operation"

export type EmailCommunicationType =
  | "decision_approved"
  | "decision_approved_reduced"
  | "decision_further_review"
  | "decision_denied"
  | "transparency_explainability"
  | "risk_alert"
  | "security_review"
  | "operational_watch"

export type EmailCommunicationAudience =
  | "user"
  | "admin"
  | "risk"
  | "security"
  | "operations"

export type EmailCommunicationStatus =
  | "generated"
  | "previewed"
  | "queued"
  | "sent_mock"

export type EmailCommunication = {
  id: string
  category: EmailCommunicationCategory
  type: EmailCommunicationType
  audience: EmailCommunicationAudience
  status: EmailCommunicationStatus
  subject: string
  preview: string
  summary: string
  content: {
    greeting: string
    intro: string
    highlights: string[]
    closing: string
  }
  audit: {
    templateKey: string
    trigger: "decision" | "explainability" | "risk" | "security" | "operation"
    decision?: CreditDecision
    decisionMode?: ExplainabilityDecisionMode
    fraudRiskLevel?: FraudScoreResult["riskLevel"] | null
    monitoringRiskLevel?: PostCreditMonitoringResult["riskLevel"] | null
  }
}

export type EmailCommunicationBundle = {
  primary: EmailCommunication
  communications: EmailCommunication[]
  engineVersion: string
}

export const EMAIL_COMMUNICATION_ENGINE_VERSION = "1.0.0"

export type EmailCommunicationInput = {
  requestId: string
  recipientName?: string | null
  recipientEmail?: string | null
  requestedAmount: number
  approvedAmount?: number | null
  decision: CreditDecision
  scoreValue: number
  explainability: ExplainabilityResult
  progressiveCredit?: ProgressiveCreditState | null
  fraudScore?: FraudScoreResult | null
  monitoring?: PostCreditMonitoringResult | null
}

type DecisionCommunicationConfig = {
  id: string
  type: EmailCommunicationType
  subject: string
  preview: string
  summary: string
  intro: string
  closing: string
  buildHighlights: (
    input: EmailCommunicationInput,
    limitText: string,
  ) => string[]
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const DECISION_COMMUNICATION_CONFIG = {
  approved: {
    id: "decision-approved",
    type: "decision_approved",
    subject: "OpenCred: sua solicitacao foi aprovada",
    preview:
      "Sua analise foi aprovada com base nos dados autorizados e no comportamento observado ate aqui.",
    summary:
      "Email principal de aprovacao com resultado, limite e resumo da decisao.",
    intro:
      "Sua solicitacao foi aprovada. A decisao considerou os dados autorizados e os sinais financeiros observados no momento da analise.",
    closing:
      "Consulte o OpenCred para ver os detalhes da sua analise e acompanhar a evolucao futura do relacionamento.",
    buildHighlights: (input, limitText) => [
      `Valor aprovado nesta etapa: ${limitText}.`,
      input.explainability.reasons[0]?.message ??
        "A aprovacao foi definida com base nos sinais favoraveis do caso.",
      input.explainability.primaryFactors[0]?.summary ??
        "O caso apresentou sinais suficientes para esta concessao.",
    ],
  },
  approved_reduced: {
    id: "decision-approved-reduced",
    type: "decision_approved_reduced",
    subject: "OpenCred: sua solicitacao foi aprovada com limite reduzido",
    preview:
      "A solicitacao foi aprovada com valor controlado, mantendo uma concessao inicial mais segura.",
    summary:
      "Email principal de aprovacao reduzida com reforco de cautela e evolucao futura.",
    intro:
      "Sua solicitacao foi aprovada, mas com limite reduzido. Nesta etapa, o OpenCred manteve uma liberacao mais controlada para combinar com o estagio atual do relacionamento.",
    closing:
      "Consulte o OpenCred para ver os fatores principais considerados e acompanhar sua evolucao de confianca.",
    buildHighlights: (input, limitText) => [
      `Valor aprovado nesta etapa: ${limitText}.`,
      input.explainability.reasons[0]?.message ??
        "A aprovacao ocorreu com cautela adicional.",
      input.progressiveCredit?.isConservativeInitialOffer
        ? "Como esta ainda e uma concessao inicial, a exposicao foi mantida em faixa conservadora."
        : "A evolucao de limite continua dependente do comportamento observado ao longo do tempo.",
    ],
  },
  further_review: {
    id: "decision-further-review",
    type: "decision_further_review",
    subject: "OpenCred: sua solicitacao esta em revisao adicional",
    preview:
      "A analise ainda depende de verificacao complementar antes de uma decisao final automatica.",
    summary:
      "Email principal de revisao adicional com status, cautela e orientacao de acompanhamento.",
    intro:
      "Sua solicitacao segue em revisao adicional. O caso ainda precisa de verificacao complementar antes de uma conclusao automatica.",
    closing:
      "Assim que houver atualizacao relevante, ela continuara registrada no OpenCred como canal oficial.",
    buildHighlights: (input) => [
      input.explainability.reasons[0]?.message ??
        "O caso exige uma analise mais cuidadosa neste momento.",
      input.explainability.primaryFactors[0]?.summary ??
        "Alguns fatores ainda precisam ser confirmados.",
      "Voce pode acompanhar a atualizacao do status diretamente no OpenCred.",
    ],
  },
  denied: {
    id: "decision-denied",
    type: "decision_denied",
    subject: "OpenCred: resultado da sua solicitacao de credito",
    preview:
      "Neste momento, a solicitacao nao pode seguir com concessao automatica dentro do fluxo atual.",
    summary:
      "Email principal de negativa com linguagem clara, sem expor logica interna sensivel.",
    intro:
      "Neste momento, nao foi possivel aprovar sua solicitacao dentro do fluxo automatico do OpenCred.",
    closing:
      "O OpenCred continuara usando o app como canal oficial para dar transparencia ao resultado e a futuras evolucoes do relacionamento.",
    buildHighlights: (input) => [
      input.explainability.reasons[0]?.message ??
        "Os sinais analisados ainda nao sustentam esta concessao.",
      input.explainability.decisionMode === "preventive_block"
        ? "O caso exige uma verificacao reforcada de seguranca antes de qualquer avanco."
        : "O historico atual ainda pede maior cautela para esta concessao.",
      "No aplicativo, voce pode consultar os fatores principais considerados na analise.",
    ],
  },
} as const satisfies Record<CreditDecision, DecisionCommunicationConfig>

const SUPPLEMENTARY_SECURITY_RISK_LEVELS = new Set<FraudScoreResult["riskLevel"]>([
  "moderate",
  "high",
  "critical",
])

const SUPPLEMENTARY_MONITORING_RISK_LEVELS = new Set<
  PostCreditMonitoringResult["riskLevel"]
>(["moderate", "high", "critical"])

const OPERATIONAL_WATCH_ACTIONS = new Set<
  PostCreditMonitoringResult["limitRecommendation"]["action"]
>([
  "freeze_growth",
  "reduce_future_exposure",
  "renegotiation_watch",
  "manual_review",
])

export function buildEmailCommunicationBundle(
  input: EmailCommunicationInput,
): EmailCommunicationBundle {
  const communications = [
    buildDecisionCommunication(input),
    buildTransparencyCommunication(input),
    ...buildSupplementaryCommunications(input),
  ]

  return {
    primary: communications[0],
    communications,
    engineVersion: EMAIL_COMMUNICATION_ENGINE_VERSION,
  }
}

function buildDecisionCommunication(
  input: EmailCommunicationInput,
): EmailCommunication {
  const greeting = buildGreeting(input.recipientName)
  const limitText =
    input.approvedAmount != null && input.approvedAmount > 0
      ? currencyFormatter.format(input.approvedAmount)
      : currencyFormatter.format(0)
  const config = DECISION_COMMUNICATION_CONFIG[input.decision]

  return {
    id: config.id,
    category: "decision",
    type: config.type,
    audience: "user",
    status: "generated",
    subject: config.subject,
    preview: config.preview,
    summary: config.summary,
    content: {
      greeting,
      intro: config.intro,
      highlights: config.buildHighlights(input, limitText),
      closing: config.closing,
    },
    audit: {
      templateKey: `${config.id}-v1`,
      trigger: "decision",
      decision: input.decision,
      decisionMode: input.explainability.decisionMode,
      fraudRiskLevel: input.fraudScore?.riskLevel ?? null,
      monitoringRiskLevel: input.monitoring?.riskLevel ?? null,
    },
  }
}

function buildTransparencyCommunication(
  input: EmailCommunicationInput,
): EmailCommunication {
  return {
    id: "transparency-explainability",
    category: "transparency",
    type: "transparency_explainability",
    audience: "user",
    status: "generated",
    subject: "OpenCred: detalhes da sua analise",
    preview:
      "Resumo formal dos fatores principais considerados e do modo como a decisao foi tratada.",
    summary:
      "Email de transparência e explicabilidade com fatores principais e modo da decisao.",
    content: {
      greeting: buildGreeting(input.recipientName),
      intro:
        "Esta mensagem resume os principais fatores considerados na sua analise e como o caso foi tratado no fluxo do OpenCred.",
      highlights: [
        `Modo da decisao: ${input.explainability.decisionModeLabel.toLowerCase()}.`,
        ...input.explainability.primaryFactors
          .slice(0, 3)
          .map((factor) => `${factor.label}: ${factor.summary}`),
        input.explainability.futureConsentNotice?.message ??
          "Novas categorias de sinais, quando existirem, devem continuar respeitando transparencia e consentimento adequado.",
      ],
      closing:
        "Se precisar revisar os detalhes do caso, consulte o OpenCred, que permanece como canal oficial para a sua analise.",
    },
    audit: {
      templateKey: "transparency-explainability-v1",
      trigger: "explainability",
      decision: input.decision,
      decisionMode: input.explainability.decisionMode,
      fraudRiskLevel: input.fraudScore?.riskLevel ?? null,
      monitoringRiskLevel: input.monitoring?.riskLevel ?? null,
    },
  }
}

function buildSupplementaryCommunications(
  input: EmailCommunicationInput,
): EmailCommunication[] {
  const communications: EmailCommunication[] = []

  if (
    input.fraudScore &&
    SUPPLEMENTARY_SECURITY_RISK_LEVELS.has(input.fraudScore.riskLevel)
  ) {
    communications.push({
      id: "security-review",
      category: "security",
      type: "security_review",
      audience: "user",
      status: "generated",
      subject: "OpenCred: verificacao adicional de seguranca",
      preview:
        "Alguns sinais do caso pedem cautela adicional e reforco de verificacao de seguranca.",
      summary:
        "Comunicacao de seguranca para casos com fraude moderada ou superior.",
      content: {
        greeting: buildGreeting(input.recipientName),
        intro:
          "Identificamos sinais que pedem cautela adicional de seguranca nesta analise.",
        highlights: [
          input.explainability.reasons.find(
            (reason) => reason.category === "sensitive_notice",
          )?.message ??
            "O caso exige uma verificacao mais cuidadosa antes de qualquer ampliacao automatica.",
          input.fraudScore.operationalRecommendation,
          "Por seguranca, os detalhes internos desse processo nao sao expostos integralmente nesta comunicacao.",
        ],
        closing:
          "O OpenCred continuara registrando atualizacoes relevantes no aplicativo como canal oficial.",
      },
      audit: {
        templateKey: "security-review-v1",
        trigger: "security",
        decision: input.decision,
        decisionMode: input.explainability.decisionMode,
        fraudRiskLevel: input.fraudScore.riskLevel,
        monitoringRiskLevel: input.monitoring?.riskLevel ?? null,
      },
    })
  }

  if (
    input.monitoring &&
    SUPPLEMENTARY_MONITORING_RISK_LEVELS.has(input.monitoring.riskLevel)
  ) {
    communications.push({
      id: "risk-alert",
      category: "risk",
      type: "risk_alert",
      audience: "user",
      status: "generated",
      subject: "OpenCred: acompanhamento reforcado do seu caso",
      preview:
        "O relacionamento segue com monitoramento reforcado e pode afetar a evolucao futura de limite.",
      summary:
        "Comunicacao de risco com foco em monitoramento, elegibilidade e limite futuro.",
      content: {
        greeting: buildGreeting(input.recipientName),
        intro:
          "Seu caso segue com monitoramento reforcado no OpenCred para orientar os proximos passos do relacionamento.",
        highlights: [
          input.monitoring.monitoringSummary,
          input.monitoring.limitRecommendation.summary,
          input.monitoring.eligibility.summary,
        ],
        closing:
          "Essas informacoes ajudam a dar previsibilidade sobre limite futuro, elegibilidade e eventuais revisoes operacionais.",
      },
      audit: {
        templateKey: "risk-alert-v1",
        trigger: "risk",
        decision: input.decision,
        decisionMode: input.explainability.decisionMode,
        fraudRiskLevel: input.fraudScore?.riskLevel ?? null,
        monitoringRiskLevel: input.monitoring.riskLevel,
      },
    })
  }

  if (
    input.monitoring &&
    OPERATIONAL_WATCH_ACTIONS.has(input.monitoring.limitRecommendation.action)
  ) {
    communications.push({
      id: "operational-watch",
      category: "operation",
      type: "operational_watch",
      audience: "operations",
      status: "generated",
      subject: "OpenCred: observacao operacional do relacionamento",
      preview:
        "Resumo operacional para acompanhamento de limite, elegibilidade e proximo tratamento do caso.",
      summary:
        "Comunicacao operacional interna, pronta para futura evolucao de orquestracao.",
      content: {
        greeting: "Time OpenCred,",
        intro:
          "Este caso gerou uma leitura operacional que deve orientar o acompanhamento do relacionamento apos a decisao.",
        highlights: [
          `Acao sobre limite: ${input.monitoring.limitRecommendation.summary}`,
          `Elegibilidade: ${input.monitoring.eligibility.summary}`,
          input.monitoring.operationalRecommendation,
        ],
        closing:
          "A trilha fica registrada como base para futuras integracoes com envio real e fluxos operacionais mais completos.",
      },
      audit: {
        templateKey: "operational-watch-v1",
        trigger: "operation",
        decision: input.decision,
        decisionMode: input.explainability.decisionMode,
        fraudRiskLevel: input.fraudScore?.riskLevel ?? null,
        monitoringRiskLevel: input.monitoring.riskLevel,
      },
    })
  }

  return communications
}

function buildGreeting(recipientName?: string | null) {
  if (recipientName && recipientName.trim().length > 0) {
    return `Ola, ${recipientName.trim()}.`
  }

  return "Ola."
}
