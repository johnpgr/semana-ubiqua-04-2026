import { decideCredit } from "../scoreEngine/decision"
import type { CreditDecision, ScoreBreakdown } from "../scoreEngine/types"
import type { FraudRiskLevel, FraudScoreResult, FraudSignal } from "../fraudScore"

export type PartnerIndicatorType =
  | "performance_score"
  | "activity_regularity"
  | "activity_level"
  | "external_trust"
  | "operational_consistency"

export type PartnerIndicatorTimeWindow =
  | "last_30_days"
  | "last_60_days"
  | "last_90_days"
  | "last_180_days"

export type PartnerIndicatorUsageContext =
  | "credit_score"
  | "fraud_score"
  | "shared"

export type PartnerIndicator = {
  partnerId: string
  partnerName: string
  indicatorType: PartnerIndicatorType
  indicatorValue: number
  timeWindow: PartnerIndicatorTimeWindow
  confidenceLevel: number
  measuredAt: string
  usageContext: PartnerIndicatorUsageContext
  metadata: Record<string, string | number | boolean>
}

export type PartnerIndicatorProfile = {
  partnerId: string
  partnerName: string
  partnerCategory: "mobility" | "delivery" | "marketplace"
  summary: string
  indicators: PartnerIndicator[]
  impact: {
    creditScoreDelta: number
    suggestedLimitMultiplier: number
    fraudScoreDelta: number
    confidenceSignal: "reinforce" | "neutral" | "caution"
    summary: string
  }
}

export type PartnerCreditAdjustment = {
  partnerProfile: PartnerIndicatorProfile | null
  value: number
  suggestedLimit: number
  decision: CreditDecision
  reasons: string[]
  breakdown: ScoreBreakdown
  scoreDeltaApplied: number
  impactSummary: string
}

export type PartnerFraudAdjustment = {
  partnerProfile: PartnerIndicatorProfile | null
  fraudScore: FraudScoreResult
  impactSummary: string
}

export function getMockPartnerIndicatorProfile(
  mockProfile: string | null | undefined,
): PartnerIndicatorProfile | null {
  if (!mockProfile) {
    return null
  }

  const measuredAt = "2026-04-01T12:00:00.000Z"

  switch (mockProfile) {
    case "perfil_forte":
      return {
        partnerId: "urban-move",
        partnerName: "UrbanMove",
        partnerCategory: "mobility",
        summary:
          "Indicadores agregados mostram atividade forte, regularidade alta e boa confianca operacional.",
        indicators: [
          buildIndicator({
            partnerId: "urban-move",
            partnerName: "UrbanMove",
            indicatorType: "performance_score",
            indicatorValue: 92,
            timeWindow: "last_90_days",
            confidenceLevel: 0.9,
            measuredAt,
            usageContext: "credit_score",
            metadata: { label: "Desempenho operacional premium" },
          }),
          buildIndicator({
            partnerId: "urban-move",
            partnerName: "UrbanMove",
            indicatorType: "activity_regularity",
            indicatorValue: 88,
            timeWindow: "last_90_days",
            confidenceLevel: 0.88,
            measuredAt,
            usageContext: "shared",
            metadata: { label: "Regularidade muito alta" },
          }),
          buildIndicator({
            partnerId: "urban-move",
            partnerName: "UrbanMove",
            indicatorType: "external_trust",
            indicatorValue: 91,
            timeWindow: "last_180_days",
            confidenceLevel: 0.87,
            measuredAt,
            usageContext: "fraud_score",
            metadata: { label: "Confianca externa forte" },
          }),
        ],
        impact: {
          creditScoreDelta: 34,
          suggestedLimitMultiplier: 1.08,
          fraudScoreDelta: -40,
          confidenceSignal: "reinforce",
          summary:
            "Os indicadores externos reforcam estabilidade e autenticidade, sem substituir a leitura interna.",
        },
      }
    case "motorista_consistente":
      return {
        partnerId: "rota-flex",
        partnerName: "RotaFlex",
        partnerCategory: "mobility",
        summary:
          "O parceiro mostra boa frequencia de atividade, regularidade consistente e confianca externa favoravel.",
        indicators: [
          buildIndicator({
            partnerId: "rota-flex",
            partnerName: "RotaFlex",
            indicatorType: "activity_level",
            indicatorValue: 79,
            timeWindow: "last_90_days",
            confidenceLevel: 0.82,
            measuredAt,
            usageContext: "credit_score",
            metadata: { label: "Atividade alta" },
          }),
          buildIndicator({
            partnerId: "rota-flex",
            partnerName: "RotaFlex",
            indicatorType: "activity_regularity",
            indicatorValue: 77,
            timeWindow: "last_90_days",
            confidenceLevel: 0.84,
            measuredAt,
            usageContext: "shared",
            metadata: { label: "Regularidade consistente" },
          }),
          buildIndicator({
            partnerId: "rota-flex",
            partnerName: "RotaFlex",
            indicatorType: "operational_consistency",
            indicatorValue: 81,
            timeWindow: "last_90_days",
            confidenceLevel: 0.79,
            measuredAt,
            usageContext: "fraud_score",
            metadata: { label: "Consistencia operacional boa" },
          }),
        ],
        impact: {
          creditScoreDelta: 22,
          suggestedLimitMultiplier: 1.05,
          fraudScoreDelta: -24,
          confidenceSignal: "reinforce",
          summary:
            "Os indicadores externos ajudam a reduzir incerteza e reforcam atividade recorrente observada fora do app.",
        },
      }
    case "autonomo_irregular":
      return {
        partnerId: "freela-hub",
        partnerName: "FreelaHub",
        partnerCategory: "marketplace",
        summary:
          "Ha sinais mistos de atividade e desempenho, com reforco moderado de confianca, mas sem estabilidade plena.",
        indicators: [
          buildIndicator({
            partnerId: "freela-hub",
            partnerName: "FreelaHub",
            indicatorType: "performance_score",
            indicatorValue: 64,
            timeWindow: "last_90_days",
            confidenceLevel: 0.68,
            measuredAt,
            usageContext: "credit_score",
            metadata: { label: "Desempenho moderado" },
          }),
          buildIndicator({
            partnerId: "freela-hub",
            partnerName: "FreelaHub",
            indicatorType: "activity_regularity",
            indicatorValue: 49,
            timeWindow: "last_90_days",
            confidenceLevel: 0.62,
            measuredAt,
            usageContext: "shared",
            metadata: { label: "Regularidade irregular" },
          }),
          buildIndicator({
            partnerId: "freela-hub",
            partnerName: "FreelaHub",
            indicatorType: "external_trust",
            indicatorValue: 58,
            timeWindow: "last_180_days",
            confidenceLevel: 0.64,
            measuredAt,
            usageContext: "fraud_score",
            metadata: { label: "Confianca externa moderada" },
          }),
        ],
        impact: {
          creditScoreDelta: 8,
          suggestedLimitMultiplier: 1.02,
          fraudScoreDelta: -6,
          confidenceSignal: "neutral",
          summary:
            "Os indicadores externos ajudam um pouco, mas ainda mantem leitura cautelosa por causa da irregularidade.",
        },
      }
    case "fluxo_instavel":
      return {
        partnerId: "quickdrop",
        partnerName: "QuickDrop",
        partnerCategory: "delivery",
        summary:
          "O parceiro mostra oscilacao operacional, baixa regularidade e sinais que pedem cautela adicional.",
        indicators: [
          buildIndicator({
            partnerId: "quickdrop",
            partnerName: "QuickDrop",
            indicatorType: "activity_regularity",
            indicatorValue: 28,
            timeWindow: "last_60_days",
            confidenceLevel: 0.77,
            measuredAt,
            usageContext: "shared",
            metadata: { label: "Regularidade baixa" },
          }),
          buildIndicator({
            partnerId: "quickdrop",
            partnerName: "QuickDrop",
            indicatorType: "operational_consistency",
            indicatorValue: 33,
            timeWindow: "last_60_days",
            confidenceLevel: 0.74,
            measuredAt,
            usageContext: "fraud_score",
            metadata: { label: "Consistencia operacional fraca" },
          }),
          buildIndicator({
            partnerId: "quickdrop",
            partnerName: "QuickDrop",
            indicatorType: "external_trust",
            indicatorValue: 41,
            timeWindow: "last_90_days",
            confidenceLevel: 0.71,
            measuredAt,
            usageContext: "shared",
            metadata: { label: "Confianca externa baixa" },
          }),
        ],
        impact: {
          creditScoreDelta: -28,
          suggestedLimitMultiplier: 0.9,
          fraudScoreDelta: 65,
          confidenceSignal: "caution",
          summary:
            "Os indicadores externos reforcam cautela e ajudam a conter confianca quando o comportamento operacional externo e fraco.",
        },
      }
    case "historico_insuficiente":
      return {
        partnerId: "corrida-ja",
        partnerName: "CorridaJa",
        partnerCategory: "mobility",
        summary:
          "Existe atividade externa recente, mas em janela curta e com confianca ainda limitada para reduzir cautela por completo.",
        indicators: [
          buildIndicator({
            partnerId: "corrida-ja",
            partnerName: "CorridaJa",
            indicatorType: "activity_level",
            indicatorValue: 61,
            timeWindow: "last_30_days",
            confidenceLevel: 0.55,
            measuredAt,
            usageContext: "credit_score",
            metadata: { label: "Atividade recente" },
          }),
          buildIndicator({
            partnerId: "corrida-ja",
            partnerName: "CorridaJa",
            indicatorType: "external_trust",
            indicatorValue: 57,
            timeWindow: "last_30_days",
            confidenceLevel: 0.52,
            measuredAt,
            usageContext: "fraud_score",
            metadata: { label: "Confianca externa ainda curta" },
          }),
        ],
        impact: {
          creditScoreDelta: 10,
          suggestedLimitMultiplier: 1,
          fraudScoreDelta: -8,
          confidenceSignal: "neutral",
          summary:
            "Os indicadores externos ajudam a reduzir um pouco a incerteza, mas nao substituem a falta de historico local mais profundo.",
        },
      }
    default:
      return null
  }
}

export function applyPartnerIndicatorsToCreditScore({
  partnerProfile,
  scoreValue,
  suggestedLimit,
  decision,
  reasons,
  requestedAmount,
  breakdown,
}: {
  partnerProfile: PartnerIndicatorProfile | null
  scoreValue: number
  suggestedLimit: number
  decision: CreditDecision
  reasons: string[]
  requestedAmount?: number
  breakdown: ScoreBreakdown
}): PartnerCreditAdjustment {
  if (!partnerProfile) {
    return {
      partnerProfile: null,
      value: scoreValue,
      suggestedLimit,
      decision,
      reasons,
      breakdown,
      scoreDeltaApplied: 0,
      impactSummary: "A analise seguiu sem enriquecimento externo de parceiros.",
    }
  }

  const adjustedBreakdown = applyPartnerCreditDeltaToBreakdown(
    breakdown,
    partnerProfile.impact.creditScoreDelta,
  )
  const adjustedScore = adjustedBreakdown.value
  const requestedCap =
    requestedAmount !== undefined && requestedAmount > 0 ? requestedAmount : suggestedLimit
  const adjustedLimit = roundCurrency(
    clamp(
      suggestedLimit * partnerProfile.impact.suggestedLimitMultiplier,
      0,
      Math.max(requestedCap, suggestedLimit),
    ),
  )
  const adjustedDecision =
    decision === "denied"
      ? decision
      : decideCredit({
          score: adjustedScore,
          requestedAmount,
          suggestedLimit: adjustedLimit,
          breakdown: adjustedBreakdown.breakdown,
        })

  return {
    partnerProfile,
    value: adjustedScore,
    suggestedLimit: adjustedDecision === "denied" ? 0 : adjustedLimit,
    decision: adjustedDecision,
    reasons: dedupe([
      ...buildPartnerCreditReasons(partnerProfile),
      ...reasons,
    ]).slice(0, 7),
    breakdown: adjustedBreakdown.breakdown,
    scoreDeltaApplied: adjustedScore - scoreValue,
    impactSummary: partnerProfile.impact.summary,
  }
}

export function applyPartnerIndicatorsToFraudScore({
  partnerProfile,
  fraudScore,
}: {
  partnerProfile: PartnerIndicatorProfile | null
  fraudScore: FraudScoreResult
}): PartnerFraudAdjustment {
  if (!partnerProfile) {
    return {
      partnerProfile: null,
      fraudScore,
      impactSummary: "Nenhum parceiro externo reforcou ou alterou a leitura antifraude.",
    }
  }

  const adjustedValue = clamp(
    fraudScore.value + partnerProfile.impact.fraudScoreDelta,
    0,
    1000,
  )
  const adjustedRiskLevel = getFraudRiskLevelFromValue(adjustedValue)
  const partnerSignal = buildPartnerFraudSignal(partnerProfile)
  const signals = partnerSignal
    ? sortFraudSignals([partnerSignal, ...fraudScore.signals])
    : fraudScore.signals
  const adjustedFraudScore: FraudScoreResult = {
    ...fraudScore,
    value: adjustedValue,
    riskLevel: adjustedRiskLevel,
    signals,
    reasons: dedupe([
      ...buildPartnerFraudReasons(partnerProfile),
      ...buildPartnerAdjustedFraudRiskReasons(
        fraudScore.riskLevel,
        adjustedRiskLevel,
      ),
      ...fraudScore.reasons,
    ]).slice(0, 6),
    operationalRecommendation: getFraudOperationalRecommendation(adjustedRiskLevel),
  }

  return {
    partnerProfile,
    fraudScore: adjustedFraudScore,
    impactSummary: partnerProfile.impact.summary,
  }
}

const SCORE_WEIGHTS = {
  regularity: 0.22,
  stability: 0.2,
  behavior: 0.18,
  dataQuality: 0.12,
} satisfies Partial<Record<keyof ScoreBreakdown, number>>

function applyPartnerCreditDeltaToBreakdown(
  breakdown: ScoreBreakdown,
  targetDelta: number,
) {
  if (targetDelta === 0) {
    return {
      breakdown,
      value: aggregateBreakdownScore(breakdown),
    }
  }

  const totalWeight = Object.values(SCORE_WEIGHTS).reduce(
    (total, weight) => total + weight,
    0,
  )
  const dimensionShift = targetDelta / totalWeight
  const nextBreakdown: ScoreBreakdown = {
    ...breakdown,
    regularity: adjustDimension(
      breakdown.regularity,
      dimensionShift,
      "Indicadores externos agregados complementaram a leitura de regularidade.",
    ),
    stability: adjustDimension(
      breakdown.stability,
      dimensionShift,
      "Indicadores externos agregados complementaram a leitura de estabilidade.",
    ),
    behavior: adjustDimension(
      breakdown.behavior,
      dimensionShift,
      "Indicadores externos agregados complementaram a leitura de comportamento.",
    ),
    dataQuality: adjustDimension(
      breakdown.dataQuality,
      dimensionShift,
      "Indicadores externos agregados foram considerados como fonte complementar autorizada.",
    ),
  }

  return {
    breakdown: nextBreakdown,
    value: aggregateBreakdownScore(nextBreakdown),
  }
}

function adjustDimension(
  dimension: ScoreBreakdown[keyof ScoreBreakdown],
  delta: number,
  reason: string,
) {
  return {
    ...dimension,
    value: Math.round(clamp(dimension.value + delta, 0, 1000)),
    reasons: dedupe([reason, ...dimension.reasons]).slice(0, 4),
  }
}

function aggregateBreakdownScore(breakdown: ScoreBreakdown) {
  const weightedScore =
    breakdown.regularity.value * 0.22 +
    breakdown.capacity.value * 0.28 +
    breakdown.stability.value * 0.2 +
    breakdown.behavior.value * 0.18 +
    breakdown.dataQuality.value * 0.12

  return Math.round(clamp(weightedScore, 0, 1000))
}

function buildIndicator(input: PartnerIndicator): PartnerIndicator {
  return {
    ...input,
    confidenceLevel: roundMetric(input.confidenceLevel),
  }
}

function buildPartnerCreditReasons(partnerProfile: PartnerIndicatorProfile) {
  if (partnerProfile.impact.confidenceSignal === "caution") {
    return [
      `Indicadores agregados do parceiro ${partnerProfile.partnerName} reforcaram cautela adicional na leitura de credito.`,
    ]
  }

  if (partnerProfile.impact.confidenceSignal === "reinforce") {
    return [
      `Indicadores agregados do parceiro ${partnerProfile.partnerName} reforcaram atividade e confianca operacional.`,
    ]
  }

  return [
    `Indicadores agregados do parceiro ${partnerProfile.partnerName} foram usados como complemento moderado da analise.`,
  ]
}

function buildPartnerFraudReasons(partnerProfile: PartnerIndicatorProfile) {
  if (partnerProfile.impact.confidenceSignal === "caution") {
    return [
      `Sinais externos do parceiro ${partnerProfile.partnerName} aumentaram a cautela de autenticidade deste caso.`,
    ]
  }

  if (partnerProfile.impact.confidenceSignal === "reinforce") {
    return [
      `Sinais externos do parceiro ${partnerProfile.partnerName} ajudaram a reforcar autenticidade operacional.`,
    ]
  }

  return [
    `Sinais externos do parceiro ${partnerProfile.partnerName} foram tratados como apoio moderado na leitura antifraude.`,
  ]
}

function buildPartnerAdjustedFraudRiskReasons(
  previousRisk: FraudRiskLevel,
  adjustedRisk: FraudRiskLevel,
) {
  if (previousRisk === adjustedRisk) {
    return []
  }

  return [
    `Indicadores externos ajustaram a classificacao antifraude de ${getFraudRiskLabel(previousRisk)} para ${getFraudRiskLabel(adjustedRisk)}.`,
  ]
}

function buildPartnerFraudSignal(
  partnerProfile: PartnerIndicatorProfile,
): FraudSignal | null {
  if (partnerProfile.impact.fraudScoreDelta === 0) {
    return null
  }

  return {
    key: `partner_${partnerProfile.partnerId}_external_authenticity`,
    category: "external_partner",
    label: "Indicador externo agregado",
    severity: partnerProfile.impact.confidenceSignal === "caution" ? 0.42 : 0.24,
    detail:
      partnerProfile.impact.confidenceSignal === "caution"
        ? "Indicadores agregados de parceiro reforcaram cautela operacional neste caso."
        : "Indicadores agregados de parceiro reforcaram autenticidade operacional neste caso.",
  }
}

function sortFraudSignals(signals: FraudSignal[]) {
  // Keep ES2017 compatibility for the shared pure module.
  // oxlint-disable-next-line unicorn/no-array-sort
  return signals.sort((first, second) => second.severity - first.severity)
}

function getFraudOperationalRecommendation(riskLevel: FraudRiskLevel) {
  switch (riskLevel) {
    case "critical":
      return "Bloquear concessao automatica e registrar trilha reforcada para revisao."
    case "high":
      return "Encaminhar para revisao manual antes de qualquer liberacao."
    case "moderate":
      return "Reduzir exposicao inicial e monitorar sinais de autenticidade."
    case "low":
    default:
      return "Seguir fluxo normal com monitoramento antifraude padrao."
  }
}

function getFraudRiskLabel(riskLevel: FraudRiskLevel) {
  switch (riskLevel) {
    case "critical":
      return "critico"
    case "high":
      return "alto"
    case "moderate":
      return "moderado"
    case "low":
    default:
      return "baixo"
  }
}

function getFraudRiskLevelFromValue(value: number): FraudRiskLevel {
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
