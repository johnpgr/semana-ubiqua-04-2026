import type { CreditDecision, ScoreTransaction } from "../scoreEngine/types"

export type FraudRiskLevel = "low" | "moderate" | "high" | "critical"
export type FraudSignalCategory =
  | "device_trust"
  | "external_partner"
  | "pattern_repetition"
  | "synthetic_income"

export type FraudSignal = {
  key: string
  category: FraudSignalCategory
  label: string
  severity: number
  detail: string
}

export type DeviceTrustContext = {
  userAgent?: string | null
  ipAddress?: string | null
}

export type FraudScoreInput = {
  transactions: ScoreTransaction[]
  deviceTrust?: DeviceTrustContext
}

export type FraudScoreResult = {
  value: number
  riskLevel: FraudRiskLevel
  signals: FraudSignal[]
  reasons: string[]
  operationalRecommendation: string
  breakdown: {
    syntheticIncome: number
    patternRepetition: number
    deviceTrust: number
  }
  metrics: {
    mirroredTransferCount: number
    fastOutflowRatio: number
    retainedIncomeRatio: number
    repeatedAmountRatio: number
    repeatedAmountCrossPatternCount: number
    hasUserAgent: boolean
    hasIpAddress: boolean
  }
}

export type FraudDecisionResult = {
  decision: CreditDecision
  suggestedLimit: number
  reasons: string[]
  impactSummary: string
}

type DatedTransaction = ScoreTransaction & {
  occurredAtDate: Date
}

const FRAUD_OPERATIONAL_RECOMMENDATIONS = {
  critical:
    "Bloquear concessao automatica e registrar trilha reforcada para revisao.",
  high: "Encaminhar para revisao manual antes de qualquer liberacao.",
  moderate: "Reduzir exposicao inicial e monitorar sinais de autenticidade.",
  low: "Seguir fluxo normal com monitoramento antifraude padrao.",
} as const satisfies Record<FraudRiskLevel, string>

const FRAUD_RISK_REASONS = {
  critical: ["Risco critico de fraude identificado na analise comportamental."],
  high: ["Risco alto de fraude exige revisao adicional antes da concessao."],
  moderate: ["Risco moderado de fraude recomenda cautela extra nesta concessao."],
  low: ["Nao identificamos sinais fortes de fraude na analise atual."],
} as const satisfies Record<FraudRiskLevel, readonly string[]>

export function calculateFraudScore({
  transactions,
  deviceTrust,
}: FraudScoreInput): FraudScoreResult {
  const datedTransactions = transactions
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

  const syntheticIncome = scoreSyntheticIncome(datedTransactions)
  const patternRepetition = scorePatternRepetition(datedTransactions)
  const deviceTrustScore = scoreDeviceTrust(deviceTrust)

  const rawValue =
    syntheticIncome.value * 0.52 +
    patternRepetition.value * 0.33 +
    deviceTrustScore.value * 0.15
  const value = clamp(Math.round(rawValue), 0, 1000)
  const riskLevel = getFraudRiskLevel(value)
  const signals = [
    ...syntheticIncome.signals,
    ...patternRepetition.signals,
    ...deviceTrustScore.signals,
    // Keep ES2017 compatibility for the shared pure module.
    // oxlint-disable-next-line unicorn/no-array-sort
  ].sort((first, second) => second.severity - first.severity)
  const reasons = dedupe([
    ...FRAUD_RISK_REASONS[riskLevel],
    ...signals.map((signal) => signal.detail),
  ]).slice(0, 6)

  return {
    value,
    riskLevel,
    signals,
    reasons,
    operationalRecommendation: FRAUD_OPERATIONAL_RECOMMENDATIONS[riskLevel],
    breakdown: {
      syntheticIncome: syntheticIncome.value,
      patternRepetition: patternRepetition.value,
      deviceTrust: deviceTrustScore.value,
    },
    metrics: {
      mirroredTransferCount: syntheticIncome.metrics.mirroredTransferCount,
      fastOutflowRatio: syntheticIncome.metrics.fastOutflowRatio,
      retainedIncomeRatio: syntheticIncome.metrics.retainedIncomeRatio,
      repeatedAmountRatio: patternRepetition.metrics.repeatedAmountRatio,
      repeatedAmountCrossPatternCount:
        patternRepetition.metrics.repeatedAmountCrossPatternCount,
      hasUserAgent: deviceTrustScore.metrics.hasUserAgent,
      hasIpAddress: deviceTrustScore.metrics.hasIpAddress,
    },
  }
}

export function applyFraudDecisionPolicy({
  creditDecision,
  suggestedLimit,
  reasons,
  fraudScore,
}: {
  creditDecision: CreditDecision
  suggestedLimit: number
  reasons: string[]
  fraudScore: FraudScoreResult
}): FraudDecisionResult {
  if (fraudScore.riskLevel === "critical") {
    return {
      decision: "denied",
      suggestedLimit: 0,
      reasons: dedupe([
        ...fraudScore.reasons,
        ...reasons,
        "A concessao foi bloqueada por risco critico de fraude.",
      ]).slice(0, 7),
      impactSummary: "Fraude critica bloqueou a concessao automatica.",
    }
  }

  if (fraudScore.riskLevel === "high") {
    return {
      decision: "further_review",
      suggestedLimit: 0,
      reasons: dedupe([
        ...fraudScore.reasons,
        "Sinais relevantes de fraude exigem revisao adicional antes de liberar credito.",
        ...reasons,
      ]).slice(0, 7),
      impactSummary: "Fraude alta converteu a analise em revisao manual.",
    }
  }

  if (fraudScore.riskLevel === "moderate") {
    const reducedLimit = roundCurrency(Math.max(0, suggestedLimit * 0.65))

    return {
      decision:
        creditDecision === "denied" || creditDecision === "further_review"
          ? creditDecision
          : "approved_reduced",
      suggestedLimit:
        creditDecision === "denied" || creditDecision === "further_review"
          ? suggestedLimit
          : reducedLimit,
      reasons: dedupe([
        ...fraudScore.reasons,
        "Risco moderado de fraude reduziu a exposicao inicial desta concessao.",
        ...reasons,
      ]).slice(0, 7),
      impactSummary: "Fraude moderada reduziu o limite e reforcou cautela.",
    }
  }

  return {
    decision: creditDecision,
    suggestedLimit,
    reasons: dedupe([...fraudScore.reasons, ...reasons]).slice(0, 7),
    impactSummary: "Fraude baixa nao alterou a decisao financeira principal.",
  }
}

function scoreSyntheticIncome(transactions: DatedTransaction[]) {
  const credits = transactions.filter((transaction) => transaction.kind === "credit")
  const debits = transactions.filter((transaction) => transaction.kind === "debit")
  const totalIncome = sum(credits.map((transaction) => transaction.amount))
  const totalDebits = sum(debits.map((transaction) => transaction.amount))
  const retainedIncomeRatio =
    totalIncome > 0 ? clamp((totalIncome - totalDebits) / totalIncome, -1, 1) : 0
  const mirroredTransferCount = countMirroredTransfers(credits, debits)
  const fastOutflowRatio =
    totalIncome > 0 ? computeFastOutflowRatio(credits, debits) : 0

  let value = 0
  const signals: FraudSignal[] = []

  if (mirroredTransferCount >= 3) {
    value += 560
    signals.push({
      key: "mirrored_transfers",
      category: "synthetic_income",
      label: "Entradas e saidas espelhadas",
      severity: 0.92,
      detail:
        "Detectamos varias entradas seguidas de saidas muito parecidas em curto intervalo.",
    })
  } else if (mirroredTransferCount >= 1) {
    value += 240
    signals.push({
      key: "mirrored_transfers_mild",
      category: "synthetic_income",
      label: "Movimentacoes parecidas",
      severity: 0.58,
      detail:
        "Parte das entradas foi seguida por saidas parecidas em pouco tempo.",
    })
  }

  if (fastOutflowRatio >= 0.78) {
    value += 260
    signals.push({
      key: "fast_outflow",
      category: "synthetic_income",
      label: "Saida rapida apos entrada",
      severity: 0.76,
      detail:
        "Uma parcela relevante da renda saiu logo apos entrar, o que reduz a naturalidade do fluxo.",
    })
  } else if (fastOutflowRatio >= 0.55) {
    value += 120
    signals.push({
      key: "fast_outflow_mild",
      category: "synthetic_income",
      label: "Escoamento acelerado",
      severity: 0.44,
      detail:
        "Observamos escoamento acelerado de parte das entradas no periodo analisado.",
    })
  }

  if (totalIncome > 0 && retainedIncomeRatio <= 0.03) {
    value += 180
    signals.push({
      key: "low_retention",
      category: "synthetic_income",
      label: "Retencao muito baixa",
      severity: 0.5,
      detail:
        "A retencao de saldo ficou muito baixa em relacao ao volume de entradas observado.",
    })
  }

  return {
    value: clamp(Math.round(value), 0, 1000),
    signals,
    metrics: {
      mirroredTransferCount,
      fastOutflowRatio: roundMetric(fastOutflowRatio),
      retainedIncomeRatio: roundMetric(retainedIncomeRatio),
    },
  }
}

function scorePatternRepetition(transactions: DatedTransaction[]) {
  if (transactions.length === 0) {
    return {
      value: 0,
      signals: [] as FraudSignal[],
      metrics: {
        repeatedAmountRatio: 0,
        repeatedAmountCrossPatternCount: 0,
      },
    }
  }

  const amountCounts = new Map<string, number>()
  const creditAmounts = new Set<string>()
  const debitAmounts = new Set<string>()

  for (const transaction of transactions) {
    const amountKey = transaction.amount.toFixed(2)
    amountCounts.set(amountKey, (amountCounts.get(amountKey) ?? 0) + 1)

    if (transaction.kind === "credit") {
      creditAmounts.add(amountKey)
    } else {
      debitAmounts.add(amountKey)
    }
  }

  const repeatedAmountRatio =
    Math.max(...Array.from(amountCounts.values()), 0) / transactions.length
  const repeatedAmountCrossPatternCount = Array.from(creditAmounts).filter((amount) =>
    debitAmounts.has(amount),
  ).length

  let value = 0
  const signals: FraudSignal[] = []

  if (repeatedAmountRatio >= 0.42 && transactions.length >= 8) {
    value += 260
    signals.push({
      key: "repeated_amounts",
      category: "pattern_repetition",
      label: "Repeticao excessiva de valores",
      severity: 0.54,
      detail:
        "O fluxo mostra repeticao excessiva de valores, reduzindo a naturalidade do comportamento financeiro.",
    })
  } else if (repeatedAmountRatio >= 0.28 && transactions.length >= 8) {
    value += 120
    signals.push({
      key: "repeated_amounts_mild",
      category: "pattern_repetition",
      label: "Padrao financeiro repetitivo",
      severity: 0.34,
      detail:
        "Parte relevante do fluxo repete valores de forma pouco natural para o periodo analisado.",
    })
  }

  if (repeatedAmountCrossPatternCount >= 3) {
    value += 220
    signals.push({
      key: "cross_pattern_amounts",
      category: "pattern_repetition",
      label: "Mesmos valores em entradas e saidas",
      severity: 0.61,
      detail:
        "Ha repeticao dos mesmos valores em entradas e saidas, o que pode indicar padrao artificial.",
    })
  }

  return {
    value: clamp(Math.round(value), 0, 1000),
    signals,
    metrics: {
      repeatedAmountRatio: roundMetric(repeatedAmountRatio),
      repeatedAmountCrossPatternCount,
    },
  }
}

function scoreDeviceTrust(deviceTrust?: DeviceTrustContext) {
  const hasUserAgent = Boolean(deviceTrust?.userAgent)
  const hasIpAddress = Boolean(deviceTrust?.ipAddress)
  let value = 0
  const signals: FraudSignal[] = []

  if (!hasUserAgent && !hasIpAddress) {
    value += 180
    signals.push({
      key: "device_context_missing",
      category: "device_trust",
      label: "Contexto tecnico insuficiente",
      severity: 0.3,
      detail:
        "O contexto tecnico disponivel para esta analise ainda e insuficiente para reforcar confianca de origem.",
    })
  } else if (!hasIpAddress) {
    value += 60
    signals.push({
      key: "missing_ip_context",
      category: "device_trust",
      label: "Origem parcialmente conhecida",
      severity: 0.18,
      detail:
        "A analise contou com contexto tecnico parcial e deixa espaco para sinais mais robustos no futuro.",
    })
  }

  return {
    value: clamp(Math.round(value), 0, 1000),
    signals,
    metrics: {
      hasUserAgent,
      hasIpAddress,
    },
  }
}

function countMirroredTransfers(
  credits: DatedTransaction[],
  debits: DatedTransaction[],
) {
  let count = 0

  for (const credit of credits) {
    const matchedDebit = debits.find((debit) => {
      const timeDiffMs =
        debit.occurredAtDate.getTime() - credit.occurredAtDate.getTime()
      const hoursApart = timeDiffMs / (1000 * 60 * 60)
      const amountDiffRatio = Math.abs(debit.amount - credit.amount) / credit.amount

      return hoursApart >= 0 && hoursApart <= 48 && amountDiffRatio <= 0.12
    })

    if (matchedDebit) {
      count += 1
    }
  }

  return count
}

function computeFastOutflowRatio(
  credits: DatedTransaction[],
  debits: DatedTransaction[],
) {
  let suspiciousOutflow = 0
  const totalIncome = sum(credits.map((credit) => credit.amount))

  if (totalIncome <= 0) {
    return 0
  }

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

function getFraudRiskLevel(value: number): FraudRiskLevel {
  if (value >= 760) {
    return "critical"
  }

  if (value >= 520) {
    return "high"
  }

  if (value >= 260) {
    return "moderate"
  }

  return "low"
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

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function dedupe(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index)
}
