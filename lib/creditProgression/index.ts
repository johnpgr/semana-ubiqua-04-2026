import type { CreditDecision } from "../scoreEngine/types"

export type ConfidenceLevel =
  | "entry"
  | "initial_confidence"
  | "trusted"
  | "premium"

export type PaymentCycleSignals = {
  completedCycles: number
  onTimeCycles: number
  lateCycles: number
  defaultedCycles: number
}

export type HistoricalRequestSnapshot = {
  id: string
  status: string
  decision: CreditDecision | null
  approvedAmount: number | null
  createdAt: string
  decidedAt: string | null
}

export type ProgressiveCreditInput = {
  requestedAmount: number
  score: number
  baseDecision: CreditDecision
  baseSuggestedLimit: number
  baseReasons?: string[]
  requestHistory: HistoricalRequestSnapshot[]
  paymentSignals?: Partial<PaymentCycleSignals>
}

export type ProgressiveCreditState = {
  level: ConfidenceLevel
  levelLabel: string
  levelDescription: string
  levelRank: number
  progressionSummary: string
  policyNotes: string[]
  futureSignals: string[]
  isFirstConcession: boolean
  isConservativeInitialOffer: boolean
  appliedCap: number
  stats: {
    previousRequests: number
    previousApprovedRequests: number
    completedCycles: number
    onTimeCycles: number
    lateCycles: number
    defaultedCycles: number
  }
}

export type ProgressiveCreditResult = ProgressiveCreditState & {
  decision: CreditDecision
  suggestedLimit: number
  reasons: string[]
}

type ApprovedDecision = Extract<
  CreditDecision,
  "approved" | "approved_reduced"
>

const APPROVED_DECISIONS = ["approved", "approved_reduced"] as const satisfies readonly ApprovedDecision[]

const APPROVED_DECISION_SET = new Set<CreditDecision>(APPROVED_DECISIONS)

const LEVEL_CONFIG = {
  entry: {
    label: "Entrada",
    rank: 1,
    maxSuggestedLimit: 1_500,
    description: "Primeira concessao com exposicao controlada.",
    summary:
      "Voce esta no nivel de entrada, com limite inicial conservador para iniciar a relacao de confianca.",
    futureSignals: [
      "Pagamentos em dia devem elevar seu nivel de confianca nas proximas ofertas.",
      "A evolucao do limite depende de comportamento observado depois desta primeira concessao.",
    ],
  },
  initial_confidence: {
    label: "Confianca inicial",
    rank: 2,
    maxSuggestedLimit: 3_500,
    description: "Primeiros sinais positivos ja permitem ampliar a concessao.",
    summary:
      "Seu historico ja sustenta um nivel inicial de confianca, com espaco para ampliacao gradual.",
    futureSignals: [
      "Mais ciclos positivos podem destravar aumentos moderados de limite.",
      "Oscilacoes relevantes ainda podem frear a progressao nesta etapa.",
    ],
  },
  trusted: {
    label: "Cliente confiavel",
    rank: 3,
    maxSuggestedLimit: 7_000,
    description: "Historico observado ja reduz a cautela inicial.",
    summary:
      "Seu relacionamento ja demonstra consistencia suficiente para uma concessao mais robusta.",
    futureSignals: [
      "A continuidade de bom comportamento pode levar ao nivel premium.",
      "Atrasos ou piora do fluxo podem congelar o crescimento do limite.",
    ],
  },
  premium: {
    label: "Cliente premium",
    rank: 4,
    maxSuggestedLimit: 12_000,
    description: "Confianca acumulada sustenta condicoes mais fortes.",
    summary:
      "Seu historico acumulado sustenta o nivel premium, com menor necessidade de cautela extrema.",
    futureSignals: [
      "O nivel premium continua sujeito a monitoramento de risco e consistencia.",
      "Mudancas negativas no comportamento podem reduzir o ritmo de evolucao futura.",
    ],
  },
} satisfies Record<
  ConfidenceLevel,
  {
    label: string
    rank: number
    maxSuggestedLimit: number
    description: string
    summary: string
    futureSignals: string[]
  }
>

export function evaluateProgressiveCreditState(
  input: ProgressiveCreditInput,
): ProgressiveCreditState {
  const paymentSignals = normalizePaymentSignals(input.paymentSignals)
  const previousRequests = input.requestHistory.length
  const previousApprovedRequests = input.requestHistory.filter(
    (request) =>
      request.decision !== null &&
      APPROVED_DECISION_SET.has(request.decision) &&
      (request.approvedAmount ?? 0) > 0,
  ).length
  const isFirstConcession =
    previousApprovedRequests === 0 && paymentSignals.completedCycles === 0
  const level = resolveConfidenceLevel({
    score: input.score,
    previousApprovedRequests,
    paymentSignals,
  })
  const config = LEVEL_CONFIG[level]
  const requestedCap =
    input.requestedAmount > 0 ? input.requestedAmount : config.maxSuggestedLimit
  const appliedCap = Math.min(requestedCap, config.maxSuggestedLimit)
  const isConservativeInitialOffer =
    isFirstConcession && APPROVED_DECISION_SET.has(input.baseDecision)

  return {
    level,
    levelLabel: config.label,
    levelDescription: config.description,
    levelRank: config.rank,
    progressionSummary: config.summary,
    policyNotes: buildPolicyNotes({
      level,
      isFirstConcession,
      previousApprovedRequests,
      paymentSignals,
    }),
    futureSignals: config.futureSignals,
    isFirstConcession,
    isConservativeInitialOffer,
    appliedCap,
    stats: {
      previousRequests,
      previousApprovedRequests,
      ...paymentSignals,
    },
  }
}

export function applyProgressiveCreditPolicy(
  input: ProgressiveCreditInput,
): ProgressiveCreditResult {
  const state = evaluateProgressiveCreditState(input)
  const cappedSuggestedLimit =
    input.baseDecision === "denied"
      ? 0
      : Math.max(0, Math.min(input.baseSuggestedLimit, state.appliedCap))

  let decision = input.baseDecision
  if (
    decision === "approved" &&
    (state.isConservativeInitialOffer ||
      cappedSuggestedLimit < input.baseSuggestedLimit)
  ) {
    decision = "approved_reduced"
  }

  const reasons = dedupeReasons([
    ...buildProgressiveReasons({
      state,
      baseSuggestedLimit: input.baseSuggestedLimit,
      adjustedSuggestedLimit: cappedSuggestedLimit,
    }),
    ...(input.baseReasons ?? []),
  ]).slice(0, 7)

  return {
    ...state,
    decision,
    suggestedLimit: cappedSuggestedLimit,
    reasons,
  }
}

function resolveConfidenceLevel({
  score,
  previousApprovedRequests,
  paymentSignals,
}: {
  score: number
  previousApprovedRequests: number
  paymentSignals: PaymentCycleSignals
}): ConfidenceLevel {
  const trustSignals = Math.max(
    previousApprovedRequests,
    paymentSignals.onTimeCycles,
  )
  const hasRelevantNegativeSignal =
    paymentSignals.defaultedCycles > 0 || paymentSignals.lateCycles > 1

  if (trustSignals === 0) {
    return "entry"
  }

  if (
    !hasRelevantNegativeSignal &&
    trustSignals >= 3 &&
    score >= 760 &&
    paymentSignals.lateCycles === 0
  ) {
    return "premium"
  }

  if (!hasRelevantNegativeSignal && trustSignals >= 2 && score >= 680) {
    return "trusted"
  }

  return "initial_confidence"
}

function normalizePaymentSignals(
  paymentSignals?: Partial<PaymentCycleSignals>,
): PaymentCycleSignals {
  return {
    completedCycles: paymentSignals?.completedCycles ?? 0,
    onTimeCycles: paymentSignals?.onTimeCycles ?? 0,
    lateCycles: paymentSignals?.lateCycles ?? 0,
    defaultedCycles: paymentSignals?.defaultedCycles ?? 0,
  }
}

function buildPolicyNotes({
  level,
  isFirstConcession,
  previousApprovedRequests,
  paymentSignals,
}: {
  level: ConfidenceLevel
  isFirstConcession: boolean
  previousApprovedRequests: number
  paymentSignals: PaymentCycleSignals
}) {
  const notes: string[] = []

  if (isFirstConcession) {
    notes.push(
      "Primeira concessao com exposicao controlada para validar comportamento real.",
    )
  } else if (previousApprovedRequests > 0) {
    notes.push(
      "Solicitacoes anteriores aprovadas ajudaram a elevar o nivel atual de confianca.",
    )
  }

  if (paymentSignals.onTimeCycles > 0) {
    notes.push(
      "Pagamentos em dia ja contam como sinal concreto para evolucao futura de limite.",
    )
  }

  if (paymentSignals.lateCycles > 0 || paymentSignals.defaultedCycles > 0) {
    notes.push(
      "Oscilacoes em ciclos anteriores reduzem a velocidade de progressao do limite.",
    )
  }

  if (level === "premium") {
    notes.push(
      "Mesmo no nivel premium, a confianca continua sujeita a monitoramento continuo.",
    )
  }

  return notes
}

function buildProgressiveReasons({
  state,
  baseSuggestedLimit,
  adjustedSuggestedLimit,
}: {
  state: ProgressiveCreditState
  baseSuggestedLimit: number
  adjustedSuggestedLimit: number
}) {
  const reasons: string[] = []

  if (state.isFirstConcession) {
    reasons.push(
      "Primeira concessao liberada com valor conservador para iniciar a relacao de confianca.",
    )
  } else {
    reasons.push(
      `Nivel atual de confianca: ${state.levelLabel.toLowerCase()}.`,
    )
  }

  if (adjustedSuggestedLimit < baseSuggestedLimit) {
    reasons.push(
      `O limite foi ajustado ao teto do nivel ${state.levelLabel.toLowerCase()} nesta etapa.`,
    )
  }

  reasons.push("Novos ciclos pagos em dia podem ampliar o limite futuro.")

  return reasons
}

function dedupeReasons(reasons: string[]) {
  return reasons.filter((reason, index) => reasons.indexOf(reason) === index)
}
