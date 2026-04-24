import type { ConfidenceLevel, HistoricalRequestSnapshot } from "../creditProgression"
import type { FraudRiskLevel } from "../fraudScore"
import type { CreditDecision, ScoreTransaction } from "../scoreEngine/types"

export type PostCreditRiskLevel = "low" | "moderate" | "high" | "critical"
export type PostCreditEligibility =
  | "eligible"
  | "watch"
  | "frozen"
  | "review_required"
  | "blocked"
export type PostCreditLimitAction =
  | "maintain"
  | "freeze_growth"
  | "reduce_future_exposure"
  | "manual_review"
  | "renegotiation_watch"

export type PostCreditAlert = {
  key: string
  level: PostCreditRiskLevel
  title: string
  detail: string
  audience: "user" | "admin" | "risk"
}

export type PostCreditMonitoringInput = {
  transactions: ScoreTransaction[]
  creditScoreValue: number
  creditDecision: CreditDecision
  suggestedLimit: number
  approvedAmount?: number | null
  fraudScoreValue?: number
  fraudRiskLevel?: FraudRiskLevel
  confidenceLevel?: ConfidenceLevel
  isFirstConcession?: boolean
  requestHistory?: HistoricalRequestSnapshot[]
}

export type PostCreditMonitoringResult = {
  riskLevel: PostCreditRiskLevel
  reasons: string[]
  alerts: PostCreditAlert[]
  operationalRecommendation: string
  monitoringSummary: string
  limitRecommendation: {
    action: PostCreditLimitAction
    summary: string
  }
  eligibility: {
    status: PostCreditEligibility
    summary: string
  }
  metrics: {
    totalIncome: number
    totalDebits: number
    retainedIncomeRatio: number
    fastOutflowRatio: number
    activeMonthCount: number
    previousApprovedRequests: number
    previousRiskEvents: number
    hasThinHistory: boolean
    isFirstConcession: boolean
    scoreValue: number
    fraudScoreValue: number
  }
}

type DatedTransaction = ScoreTransaction & {
  occurredAtDate: Date
}

export function evaluatePostCreditMonitoring(
  input: PostCreditMonitoringInput,
): PostCreditMonitoringResult {
  const transactions = input.transactions
    .map((transaction) => ({
      ...transaction,
      occurredAtDate: new Date(transaction.occurredAt),
    }))
    // Keep ES2017 compatibility for the shared pure module.
    // oxlint-disable-next-line unicorn/no-array-sort
    .sort(
      (first, second) =>
        first.occurredAtDate.getTime() - second.occurredAtDate.getTime(),
    )

  const credits = transactions.filter((transaction) => transaction.kind === "credit")
  const debits = transactions.filter((transaction) => transaction.kind === "debit")
  const totalIncome = sum(credits.map((transaction) => transaction.amount))
  const totalDebits = sum(debits.map((transaction) => transaction.amount))
  const retainedIncomeRatio =
    totalIncome > 0 ? clamp((totalIncome - totalDebits) / totalIncome, -1, 1) : 0
  const fastOutflowRatio =
    totalIncome > 0 ? computeFastOutflowRatio(credits, debits) : 0
  const activeMonthCount = getActiveMonthCount(transactions)
  const previousApprovedRequests = (input.requestHistory ?? []).filter(
    (request) =>
      (request.decision === "approved" ||
        request.decision === "approved_reduced") &&
      (request.approvedAmount ?? 0) > 0,
  ).length
  const previousRiskEvents = (input.requestHistory ?? []).filter(
    (request) =>
      request.decision === "further_review" || request.decision === "denied",
  ).length
  const isFirstConcession = Boolean(
    input.isFirstConcession ?? previousApprovedRequests === 0,
  )
  const hasThinHistory = activeMonthCount <= 1 || previousApprovedRequests === 0

  let riskPoints = 0
  const alerts: PostCreditAlert[] = []

  if (input.creditDecision === "denied" || input.fraudRiskLevel === "critical") {
    riskPoints += 100
  } else if (
    input.creditDecision === "further_review" ||
    input.fraudRiskLevel === "high"
  ) {
    riskPoints += 70
  } else if (
    input.creditDecision === "approved_reduced" ||
    input.fraudRiskLevel === "moderate"
  ) {
    riskPoints += 26
  }

  if (input.creditScoreValue < 500) {
    riskPoints += 30
    alerts.push({
      key: "weak_score",
      level: "high",
      title: "Perfil financeiro fragilizado",
      detail:
        "O score financeiro atual ainda pede cautela para qualquer aumento de exposicao.",
      audience: "risk",
    })
  } else if (input.creditScoreValue < 650) {
    riskPoints += 14
  }

  if (retainedIncomeRatio <= 0.08) {
    riskPoints += 18
    alerts.push({
      key: "low_retention",
      level: "moderate",
      title: "Retencao de saldo muito baixa",
      detail:
        "O fluxo atual retem pouco saldo depois das entradas, o que aumenta o cuidado para proximas ofertas.",
      audience: "admin",
    })
  }

  if (fastOutflowRatio >= 0.72) {
    riskPoints += 18
    alerts.push({
      key: "fast_outflow",
      level: "moderate",
      title: "Escoamento rapido de recursos",
      detail:
        "Uma parcela relevante das entradas sai em pouco tempo, o que pede observacao operacional.",
      audience: "risk",
    })
  }

  if (isFirstConcession) {
    riskPoints += 12
    alerts.push({
      key: "initial_relationship",
      level: "moderate",
      title: "Relacionamento ainda inicial",
      detail:
        "Esta concessao ainda esta em fase de observacao e deve evoluir com cautela.",
      audience: "user",
    })
  }

  if (hasThinHistory) {
    riskPoints += 10
    alerts.push({
      key: "thin_history",
      level: "moderate",
      title: "Historico pos-concessao insuficiente",
      detail:
        "Ainda existe pouco historico acumulado para destravar crescimento automatico de limite.",
      audience: "admin",
    })
  }

  if (previousRiskEvents > 0) {
    riskPoints += 12
    alerts.push({
      key: "prior_risk_events",
      level: "moderate",
      title: "Relacionamento com oscilacao previa",
      detail:
        "O historico recente ja teve eventos de risco ou revisao, o que reduz a elegibilidade futura.",
      audience: "risk",
    })
  }

  if (input.fraudRiskLevel === "moderate") {
    alerts.push({
      key: "moderate_fraud_watch",
      level: "moderate",
      title: "Monitoramento antifraude reforcado",
      detail:
        "Os sinais atuais de fraude pedem cautela extra antes de ampliar a relacao.",
      audience: "admin",
    })
  } else if (
    input.fraudRiskLevel === "high" ||
    input.fraudRiskLevel === "critical"
  ) {
    alerts.push({
      key: "high_fraud_watch",
      level: input.fraudRiskLevel === "critical" ? "critical" : "high",
      title: "Fraude exige revisao reforcada",
      detail:
        "O relacionamento nao deve evoluir automaticamente enquanto o risco de fraude permanecer elevado.",
      audience: "risk",
    })
  }

  if (
    input.creditDecision === "approved_reduced" &&
    input.approvedAmount != null &&
    input.approvedAmount > 0
  ) {
    alerts.push({
      key: "growth_frozen",
      level: "moderate",
      title: "Elegibilidade para crescimento congelada",
      detail:
        "O limite atual foi mantido em faixa reduzida e ainda nao suporta aumento automatico.",
      audience: "user",
    })
  }

  const riskLevel = getRiskLevel(riskPoints)
  const reasons = dedupe([
    ...buildRiskReasons(riskLevel),
    ...alerts.map((alert) => alert.detail),
  ]).slice(0, 6)
  const limitRecommendation = buildLimitRecommendation({
    riskLevel,
    isFirstConcession,
    approvedAmount: input.approvedAmount ?? input.suggestedLimit,
  })
  const eligibility = buildEligibility({
    riskLevel,
    hasThinHistory,
    isFirstConcession,
  })

  return {
    riskLevel,
    reasons,
    alerts: alerts
      // Keep ES2017 compatibility for the shared pure module.
      // oxlint-disable-next-line unicorn/no-array-sort
      .sort((first, second) => getAlertSeverity(second.level) - getAlertSeverity(first.level))
      .slice(0, 6),
    operationalRecommendation: getOperationalRecommendation({
      riskLevel,
      limitAction: limitRecommendation.action,
    }),
    monitoringSummary: getMonitoringSummary({
      riskLevel,
      eligibilityStatus: eligibility.status,
      limitAction: limitRecommendation.action,
    }),
    limitRecommendation,
    eligibility,
    metrics: {
      totalIncome: roundMetric(totalIncome),
      totalDebits: roundMetric(totalDebits),
      retainedIncomeRatio: roundMetric(retainedIncomeRatio),
      fastOutflowRatio: roundMetric(fastOutflowRatio),
      activeMonthCount,
      previousApprovedRequests,
      previousRiskEvents,
      hasThinHistory,
      isFirstConcession,
      scoreValue: input.creditScoreValue,
      fraudScoreValue: input.fraudScoreValue ?? 0,
    },
  }
}

function getRiskLevel(value: number): PostCreditRiskLevel {
  if (value >= 90) {
    return "critical"
  }

  if (value >= 58) {
    return "high"
  }

  if (value >= 28) {
    return "moderate"
  }

  return "low"
}

function buildRiskReasons(riskLevel: PostCreditRiskLevel) {
  switch (riskLevel) {
    case "critical":
      return ["Relacionamento em risco critico e sem espaco para evolucao automatica."]
    case "high":
      return ["Relacionamento em risco alto e com necessidade de revisao reforcada."]
    case "moderate":
      return ["Relacionamento em observacao, com cautela extra para proximas ofertas."]
    case "low":
    default:
      return ["Relacionamento em risco baixo para o estagio atual do MVP."]
  }
}

function buildLimitRecommendation({
  riskLevel,
  isFirstConcession,
  approvedAmount,
}: {
  riskLevel: PostCreditRiskLevel
  isFirstConcession: boolean
  approvedAmount: number
}) {
  if (riskLevel === "critical") {
    return {
      action: "manual_review" as const,
      summary:
        "Bloquear evolucao automatica e manter trilha de revisao manual para qualquer novo movimento.",
    }
  }

  if (riskLevel === "high") {
    return {
      action: approvedAmount > 0 ? ("reduce_future_exposure" as const) : ("manual_review" as const),
      summary:
        "Reduzir exposicao futura e impedir qualquer aumento ate nova reavaliacao positiva.",
    }
  }

  if (riskLevel === "moderate") {
    return {
      action: isFirstConcession ? ("freeze_growth" as const) : ("renegotiation_watch" as const),
      summary:
        isFirstConcession
          ? "Congelar crescimento automatico ate acumular mais observacao do relacionamento."
          : "Manter exposicao controlada e observar eventual necessidade de renegociacao futura.",
    }
  }

  return {
    action: "maintain" as const,
    summary: "Manter limite atual e permitir evolucao gradual quando novos sinais forem positivos.",
  }
}

function buildEligibility({
  riskLevel,
  hasThinHistory,
  isFirstConcession,
}: {
  riskLevel: PostCreditRiskLevel
  hasThinHistory: boolean
  isFirstConcession: boolean
}) {
  if (riskLevel === "critical") {
    return {
      status: "blocked" as const,
      summary: "Elegibilidade bloqueada ate revisao operacional reforcada.",
    }
  }

  if (riskLevel === "high") {
    return {
      status: "review_required" as const,
      summary: "Elegibilidade futura depende de revisao manual antes de qualquer nova oferta.",
    }
  }

  if (riskLevel === "moderate" || hasThinHistory || isFirstConcession) {
    return {
      status: "frozen" as const,
      summary: "Elegibilidade congelada temporariamente enquanto o relacionamento acumula confianca.",
    }
  }

  return {
    status: "eligible" as const,
    summary: "Relacionamento elegivel para evolucao gradual se os proximos sinais seguirem positivos.",
  }
}

function getOperationalRecommendation({
  riskLevel,
  limitAction,
}: {
  riskLevel: PostCreditRiskLevel
  limitAction: PostCreditLimitAction
}) {
  if (riskLevel === "critical") {
    return "Abrir revisao manual e impedir qualquer ampliacao de exposicao ate nova validacao."
  }

  if (riskLevel === "high") {
    return "Manter monitoramento reforcado, congelar crescimento e tratar o relacionamento em trilha de revisao."
  }

  if (riskLevel === "moderate" && limitAction === "renegotiation_watch") {
    return "Seguir com observacao operacional e preparar possivel renegociacao se houver nova deterioracao."
  }

  if (riskLevel === "moderate") {
    return "Manter relacionamento sob cautela e evitar aumento automatico de limite neste momento."
  }

  return "Monitorar normalmente e permitir evolucao gradual conforme novos sinais positivos."
}

function getMonitoringSummary({
  riskLevel,
  eligibilityStatus,
  limitAction,
}: {
  riskLevel: PostCreditRiskLevel
  eligibilityStatus: PostCreditEligibility
  limitAction: PostCreditLimitAction
}) {
  if (riskLevel === "critical") {
    return "Monitoramento critica o relacionamento atual e recomenda contencao total de evolucao."
  }

  if (riskLevel === "high") {
    return "Monitoramento aponta risco alto e recomenda revisao antes de qualquer nova concessao."
  }

  if (eligibilityStatus === "frozen" || limitAction === "freeze_growth") {
    return "Monitoramento mantem a relacao em observacao, sem liberar crescimento automatico por enquanto."
  }

  return "Monitoramento enxerga espaco para evolucao gradual, ainda sujeito a observacao continua."
}

function getActiveMonthCount(transactions: DatedTransaction[]) {
  return new Set(
    transactions.map(
      (transaction) =>
        `${transaction.occurredAtDate.getFullYear()}-${transaction.occurredAtDate.getMonth()}`,
    ),
  ).size
}

function computeFastOutflowRatio(
  credits: DatedTransaction[],
  debits: DatedTransaction[],
) {
  const totalIncome = sum(credits.map((credit) => credit.amount))

  if (totalIncome <= 0) {
    return 0
  }

  let suspiciousOutflow = 0

  for (const credit of credits) {
    const debitsAfterCredit = debits.filter((debit) => {
      const hoursApart =
        (debit.occurredAtDate.getTime() - credit.occurredAtDate.getTime()) /
        (1000 * 60 * 60)

      return hoursApart >= 0 && hoursApart <= 72
    })

    suspiciousOutflow += sum(debitsAfterCredit.map((debit) => debit.amount))
  }

  return clamp(suspiciousOutflow / totalIncome, 0, 1.4)
}

function getAlertSeverity(riskLevel: PostCreditRiskLevel) {
  switch (riskLevel) {
    case "critical":
      return 4
    case "high":
      return 3
    case "moderate":
      return 2
    case "low":
    default:
      return 1
  }
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundMetric(value: number) {
  return Math.round(value * 1000) / 1000
}

function dedupe(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index)
}
