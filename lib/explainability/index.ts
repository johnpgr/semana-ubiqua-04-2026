import type { ProgressiveCreditState } from "../creditProgression"
import type { FraudScoreResult } from "../fraudScore"
import type { PostCreditMonitoringResult } from "../postCreditMonitoring"
import type { CreditDecision } from "../scoreEngine/types"

export type ExplainabilityReasonCategory =
  | "approval"
  | "limit_reduction"
  | "review"
  | "denial"
  | "sensitive_notice"

export type ExplainabilityFactorKey =
  | "income_consistency"
  | "flow_stability"
  | "history_quality"
  | "capacity_fit"
  | "initial_conservative_offer"
  | "progressive_confidence"
  | "review_required"
  | "fraud_caution"
  | "preventive_block"
  | "post_credit_watch"
  | "future_sensitive_signals"

export type ExplainabilityDecisionMode =
  | "automatic"
  | "review_additional"
  | "preventive_block"

export type ExplainabilityReason = {
  id: string
  category: ExplainabilityReasonCategory
  title: string
  message: string
}

export type ExplainabilityFactor = {
  key: ExplainabilityFactorKey
  label: string
  summary: string
  audience: "user" | "admin"
}

export type ExplainabilityNotice = {
  title: string
  message: string
}

export type ExplainabilityResult = {
  headline: string
  summary: string
  decisionMode: ExplainabilityDecisionMode
  decisionModeLabel: string
  decisionModeDescription: string
  reasons: ExplainabilityReason[]
  primaryFactors: ExplainabilityFactor[]
  sensitiveDataNotice: ExplainabilityNotice | null
  futureConsentNotice: ExplainabilityNotice | null
}

export type ExplainabilityInput = {
  decision: CreditDecision
  scoreValue: number
  suggestedLimit: number
  reasons?: string[]
  consentScopes?: string[] | null
  progressiveCredit?: ProgressiveCreditState | null
  fraudScore?: FraudScoreResult | null
  monitoring?: PostCreditMonitoringResult | null
}

export function buildDecisionExplainability(
  input: ExplainabilityInput,
): ExplainabilityResult {
  const decisionMode = resolveDecisionMode(input)
  const reasonCatalog = buildReasonCatalog(input, decisionMode)
  const primaryFactors = buildPrimaryFactors(input, decisionMode)
  const sensitiveDataNotice = buildSensitiveDataNotice(input)
  const futureConsentNotice = buildFutureConsentNotice(input)

  return {
    headline: getHeadline(input.decision, decisionMode),
    summary: getSummary(input, decisionMode),
    decisionMode,
    decisionModeLabel: getDecisionModeLabel(decisionMode),
    decisionModeDescription: getDecisionModeDescription(decisionMode),
    reasons: reasonCatalog,
    primaryFactors,
    sensitiveDataNotice,
    futureConsentNotice,
  }
}

function resolveDecisionMode(
  input: ExplainabilityInput,
): ExplainabilityDecisionMode {
  if (
    input.decision === "denied" &&
    (input.fraudScore?.riskLevel === "high" ||
      input.fraudScore?.riskLevel === "critical" ||
      input.monitoring?.riskLevel === "critical")
  ) {
    return "preventive_block"
  }

  if (
    (input.decision !== "denied" && input.decision === "further_review") ||
    input.fraudScore?.riskLevel === "high" ||
    (input.decision !== "denied" &&
      (input.monitoring?.riskLevel === "high" ||
        input.monitoring?.riskLevel === "critical"))
  ) {
    return "review_additional"
  }

  return "automatic"
}

function buildReasonCatalog(
  input: ExplainabilityInput,
  decisionMode: ExplainabilityDecisionMode,
): ExplainabilityReason[] {
  const reasons: ExplainabilityReason[] = []

  if (input.decision === "approved") {
    reasons.push({
      id: "approved_flow",
      category: "approval",
      title: "Aprovacao",
      message:
        "Sua solicitacao foi aprovada com base nos sinais financeiros observados ate aqui.",
    })

    if (input.progressiveCredit?.level === "trusted" || input.progressiveCredit?.level === "premium") {
      reasons.push({
        id: "approved_confidence",
        category: "approval",
        title: "Confianca observada",
        message:
          "Seu historico atual mostrou consistencia suficiente para sustentar esta concessao.",
      })
    }
  }

  if (input.decision === "approved_reduced") {
    reasons.push({
      id: "reduced_caution",
      category: "limit_reduction",
      title: "Limite reduzido",
      message:
        "Sua solicitacao foi aprovada, mas com valor controlado para manter uma concessao inicial mais segura.",
    })

    if (input.progressiveCredit?.isConservativeInitialOffer) {
      reasons.push({
        id: "reduced_first_offer",
        category: "limit_reduction",
        title: "Primeira concessao",
        message:
          "Como este relacionamento ainda esta em fase inicial, o limite foi mantido em faixa conservadora.",
      })
    } else if (input.fraudScore?.riskLevel === "moderate") {
      reasons.push({
        id: "reduced_extra_caution",
        category: "limit_reduction",
        title: "Cautela adicional",
        message:
          "Alguns sinais do caso pedem cautela extra, por isso a liberacao ficou em valor reduzido.",
      })
    }
  }

  if (input.decision === "further_review") {
    reasons.push({
      id: "review_needed",
      category: "review",
      title: "Analise complementar",
      message:
        "Sua solicitacao precisa de verificacao adicional antes de uma decisao final automatica.",
    })

    if (input.fraudScore?.riskLevel === "high") {
      reasons.push({
        id: "review_security",
        category: "review",
        title: "Seguranca",
        message:
          "Identificamos sinais que exigem uma avaliacao de seguranca mais cuidadosa neste momento.",
      })
    } else {
      reasons.push({
        id: "review_context",
        category: "review",
        title: "Contexto do caso",
        message:
          "O caso ainda exige confirmacao de alguns elementos antes de seguir para liberacao.",
      })
    }
  }

  if (input.decision === "denied") {
    reasons.push({
      id: "denied_current_fit",
      category: "denial",
      title: "Nao aprovado",
      message:
        "Neste momento, os elementos analisados nao sustentam a concessao automatica do credito solicitado.",
    })

    if (decisionMode === "preventive_block") {
      reasons.push({
        id: "denied_preventive_block",
        category: "denial",
        title: "Bloqueio preventivo",
        message:
          "A solicitacao foi interrompida preventivamente porque o caso pede verificacao reforcada de seguranca.",
      })
    } else if (input.scoreValue < 500) {
      reasons.push({
        id: "denied_history",
        category: "denial",
        title: "Historico atual",
        message:
          "O historico atual ainda nao apresentou estabilidade suficiente para esta concessao.",
      })
    }
  }

  if (input.fraudScore && input.fraudScore.riskLevel !== "low") {
    reasons.push({
      id: "sensitive_notice",
      category: "sensitive_notice",
      title: "Cautela de seguranca",
      message:
        "Sinais de seguranca e comportamento podem reforcar a analise sem expor detalhes tecnicos sensiveis ao usuario.",
    })
  }

  return dedupeReasons(reasons).slice(0, 4)
}

function buildPrimaryFactors(
  input: ExplainabilityInput,
  decisionMode: ExplainabilityDecisionMode,
): ExplainabilityFactor[] {
  const factors: ExplainabilityFactor[] = []

  if (input.scoreValue >= 700) {
    factors.push({
      key: "income_consistency",
      label: "Consistencia da renda",
      summary: "As entradas observadas sustentaram uma leitura financeira mais favoravel.",
      audience: "user",
    })
  } else if (input.scoreValue < 500) {
    factors.push({
      key: "flow_stability",
      label: "Estabilidade do fluxo",
      summary: "O fluxo financeiro atual ainda apresentou instabilidade para esta concessao.",
      audience: "user",
    })
  }

  if (input.progressiveCredit?.isConservativeInitialOffer) {
    factors.push({
      key: "initial_conservative_offer",
      label: "Concessao inicial conservadora",
      summary:
        "A primeira liberacao do relacionamento fica em faixa controlada, mesmo quando a analise e positiva.",
      audience: "user",
    })
  } else if (input.progressiveCredit) {
    factors.push({
      key: "progressive_confidence",
      label: "Nivel de confianca",
      summary: `O nivel atual de confianca do relacionamento e ${input.progressiveCredit.levelLabel.toLowerCase()}.`,
      audience: "user",
    })
  }

  if (
    input.monitoring &&
    (input.monitoring.riskLevel === "moderate" ||
      input.monitoring.riskLevel === "high" ||
      input.monitoring.riskLevel === "critical")
  ) {
    factors.push({
      key: "post_credit_watch",
      label: "Monitoramento reforcado",
      summary:
        "O relacionamento segue com observacao reforcada para evolucao futura de limite e elegibilidade.",
      audience: "user",
    })
  }

  if (decisionMode === "review_additional") {
    factors.push({
      key: "review_required",
      label: "Revisao adicional",
      summary:
        "O caso exige confirmacao complementar antes de seguir por fluxo totalmente automatico.",
      audience: "user",
    })
  }

  if (
    input.fraudScore &&
    (input.fraudScore.riskLevel === "moderate" ||
      input.fraudScore.riskLevel === "high" ||
      input.fraudScore.riskLevel === "critical")
  ) {
    factors.push({
      key:
        decisionMode === "preventive_block"
          ? "preventive_block"
          : "fraud_caution",
      label:
        decisionMode === "preventive_block"
          ? "Bloqueio preventivo"
          : "Cautela de seguranca",
      summary:
        decisionMode === "preventive_block"
          ? "A decisao automatica foi bloqueada por sinais relevantes que pedem verificacao reforcada."
          : "Alguns sinais do caso pedem mais cautela antes de ampliar a concessao.",
      audience: "user",
    })
  }

  if (
    input.reasons?.some((reason) =>
      reason.toLowerCase().includes("historico") ||
      reason.toLowerCase().includes("dados"),
    )
  ) {
    factors.push({
      key: "history_quality",
      label: "Qualidade do historico",
      summary:
        "A profundidade e a qualidade do historico observado ainda influenciam o nivel de confianca desta decisao.",
      audience: "user",
    })
  }

  return dedupeFactors(factors).slice(0, 4)
}

function buildSensitiveDataNotice(
  input: ExplainabilityInput,
): ExplainabilityNotice | null {
  if (!input.fraudScore || input.fraudScore.riskLevel === "low") {
    return null
  }

  return {
    title: "Uso prudente de sinais de seguranca",
    message:
      "Quando sinais de seguranca e comportamento ajudam a analise, a comunicacao publica permanece resumida para proteger o processo e evitar exposicao excessiva de detalhes sensiveis.",
  }
}

function buildFutureConsentNotice(
  input: ExplainabilityInput,
): ExplainabilityNotice | null {
  const scopes = new Set(input.consentScopes ?? [])
  const alreadyHasFinancialConsent = scopes.size > 0

  if (!input.fraudScore && !input.monitoring) {
    return null
  }

  if (!alreadyHasFinancialConsent) {
    return {
      title: "Consentimento necessario",
      message:
        "Analises futuras com sinais adicionais dependem de consentimento claro e transparência sobre as categorias de dado utilizadas.",
    }
  }

  return {
    title: "Evolucao com transparencia",
    message:
      "Se o produto usar sinais mais sensiveis no futuro, a comunicacao e o consentimento devem deixar clara a categoria de dado considerada, sem expor logica interna demais.",
  }
}

function getHeadline(
  decision: CreditDecision,
  decisionMode: ExplainabilityDecisionMode,
) {
  if (decisionMode === "preventive_block") {
    return "Sua solicitacao foi interrompida preventivamente."
  }

  switch (decision) {
    case "approved":
      return "Sua solicitacao foi aprovada."
    case "approved_reduced":
      return "Sua solicitacao foi aprovada com limite reduzido."
    case "further_review":
      return "Sua solicitacao segue em revisao adicional."
    case "denied":
    default:
      return "Sua solicitacao nao foi aprovada neste momento."
  }
}

function getSummary(
  input: ExplainabilityInput,
  decisionMode: ExplainabilityDecisionMode,
) {
  if (decisionMode === "preventive_block") {
    return "A concessao automatica foi bloqueada por cautela de seguranca e o caso precisa de tratamento reforcado."
  }

  if (decisionMode === "review_additional") {
    return "A analise identificou elementos que ainda precisam de verificacao complementar antes de seguir automaticamente."
  }

  switch (input.decision) {
    case "approved":
      return "A decisao foi tomada com base nos dados autorizados e nos sinais financeiros observados ate aqui."
    case "approved_reduced":
      return "O pedido foi aceito, mas com exposicao controlada para manter a concessao coerente com o estagio atual do relacionamento."
    case "denied":
      return "Os sinais analisados ainda nao sustentam uma concessao automatica segura neste momento."
    case "further_review":
    default:
      return "O caso precisa de verificacao adicional antes da conclusao."
  }
}

function getDecisionModeLabel(mode: ExplainabilityDecisionMode) {
  switch (mode) {
    case "review_additional":
      return "Revisao adicional"
    case "preventive_block":
      return "Bloqueio preventivo"
    case "automatic":
    default:
      return "Decisao automatica"
  }
}

function getDecisionModeDescription(mode: ExplainabilityDecisionMode) {
  switch (mode) {
    case "review_additional":
      return "O caso ainda depende de analise complementar antes de uma liberacao automatica."
    case "preventive_block":
      return "A decisao automatica foi interrompida por risco relevante que exige verificacao reforcada."
    case "automatic":
    default:
      return "A decisao foi produzida dentro do fluxo normal do sistema, com base nos dados autorizados."
  }
}

function dedupeReasons(reasons: ExplainabilityReason[]) {
  return reasons.filter(
    (reason, index) =>
      reasons.findIndex((currentReason) => currentReason.id === reason.id) ===
      index,
  )
}

function dedupeFactors(factors: ExplainabilityFactor[]) {
  return factors.filter(
    (factor, index) =>
      factors.findIndex((currentFactor) => currentFactor.key === factor.key) ===
      index,
  )
}
