"use server"

import { revalidatePath } from "next/cache"

import {
  MOCK_PROFILE_CONFIGS,
  generateSyntheticTransactions,
} from "@/lib/mockData/profiles"
import { applyProgressiveCreditPolicy } from "@/lib/creditProgression"
import { buildEmailCommunicationBundle } from "@/lib/emailCommunication"
import { buildDecisionExplainability } from "@/lib/explainability"
import {
  applyFraudDecisionPolicy,
  calculateFraudScore,
} from "@/lib/fraudScore"
import {
  applyPartnerIndicatorsToCreditScore,
  applyPartnerIndicatorsToFraudScore,
  getMockPartnerIndicatorProfile,
} from "@/lib/partnerIndicators"
import { evaluatePostCreditMonitoring } from "@/lib/postCreditMonitoring"
import { calculateCreditScore } from "@/lib/scoreEngine"
import type { Json, TablesInsert } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { RequestId } from "@/validation/score"

type ProcessCreditAnalysisSuccess = {
  ok: true
  data: {
    requestId: string
    score: number
    decision: "approved" | "approved_reduced" | "further_review" | "denied"
    suggestedLimit: number
    confidenceLevel: string
    confidenceLabel: string
    isConservativeInitialOffer: boolean
    fraudScoreValue: number
    fraudRiskLevel: string
    postCreditRiskLevel: string
    postCreditLimitAction: string
    redirectTo: string
  }
}

type ProcessCreditAnalysisFailure = {
  ok: false
  formError: string
}

export type ProcessCreditAnalysisResult =
  | ProcessCreditAnalysisSuccess
  | ProcessCreditAnalysisFailure

type AuditLogInsert = TablesInsert<"audit_logs">
type ScoreInsert = TablesInsert<"scores">
type TransactionInsert = TablesInsert<"transactions">

export async function processCreditAnalysis(
  requestId: string,
): Promise<ProcessCreditAnalysisResult> {
  const parsedRequestId = RequestId.safeParse(requestId)

  if (!parsedRequestId.success) {
    return {
      ok: false,
      formError: "SolicitaÃ§Ã£o invÃ¡lida",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      ok: false,
      formError: "FaÃ§a login para processar a anÃ¡lise",
    }
  }

  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select("id, requested_amount, status, decision, approved_amount, user_id")
    .eq("id", parsedRequestId.data)
    .eq("user_id", user.id)
    .maybeSingle()

  if (requestError) {
    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel carregar a solicitaÃ§Ã£o",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "SolicitaÃ§Ã£o nÃ£o encontrada",
    }
  }

  const [
    { data: profile, error: profileError },
    { data: consent, error: consentError },
    { data: requestHistory, error: requestHistoryError },
  ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, mock_profile")
        .eq("id", request.user_id)
        .maybeSingle(),
      supabase
        .from("consents")
        .select("id, scopes, granted_at, user_agent, ip_address")
        .eq("request_id", request.id)
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("credit_requests")
        .select("id, status, decision, approved_amount, created_at, decided_at")
        .eq("user_id", user.id)
        .neq("id", request.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ])

  if (profileError || !profile) {
    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel carregar o perfil do usuÃ¡rio",
    }
  }

  if (consentError) {
    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel verificar o consentimento",
    }
  }

  if (!consent) {
    return {
      ok: false,
      formError: "A anÃ¡lise exige consentimento salvo",
    }
  }

  if (requestHistoryError) {
    return {
      ok: false,
      formError: "Não foi possível carregar o histórico de solicitações",
    }
  }

  if (request.status === "decided" && request.decision) {
    const { data: existingScore, error: existingScoreError } = await supabase
      .from("scores")
      .select("value, suggested_limit")
      .eq("request_id", request.id)
      .maybeSingle()

    if (existingScoreError) {
      return {
        ok: false,
        formError: "NÃ£o foi possÃ­vel recuperar o resultado da anÃ¡lise",
      }
    }

    if (!existingScore) {
      return {
        ok: false,
        formError: "Resultado da anÃ¡lise inconsistente. Tente novamente em instantes.",
      }
    }

    revalidatePath(`/resultado/${request.id}`)

    return {
      ok: true,
      data: {
        requestId: request.id,
        score: existingScore.value,
        decision: request.decision,
        suggestedLimit: existingScore.suggested_limit,
        confidenceLevel: "unknown",
        confidenceLabel: "Indisponivel",
        isConservativeInitialOffer: false,
        fraudScoreValue: 0,
        fraudRiskLevel: "unknown",
        postCreditRiskLevel: "unknown",
        postCreditLimitAction: "unknown",
        redirectTo: `/resultado/${request.id}`,
      },
    }
  }

  const service = createServiceClient()
  const startedAt = new Date().toISOString()
  const mockProfile = getMockProfile(profile.mock_profile)

  if (!mockProfile) {
    return {
      ok: false,
      formError: "Perfil mockado invÃ¡lido para anÃ¡lise",
    }
  }

  const transactions = generateSyntheticTransactions({
    profile: mockProfile,
    requestId: request.id,
    seed: getStableSeed(request.id),
  })
  const baseScore = calculateCreditScore({
    transactions,
    requestedAmount: request.requested_amount,
  })
  const partnerIndicators = getMockPartnerIndicatorProfile(profile.mock_profile)
  const partnerCredit = applyPartnerIndicatorsToCreditScore({
    partnerProfile: partnerIndicators,
    scoreValue: baseScore.value,
    suggestedLimit: baseScore.suggestedLimit,
    decision: baseScore.decision,
    reasons: baseScore.reasons,
    requestedAmount: request.requested_amount,
    breakdown: baseScore.breakdown,
  })
  const creditScore = {
    ...baseScore,
    value: partnerCredit.value,
    suggestedLimit: partnerCredit.suggestedLimit,
    decision: partnerCredit.decision,
    reasons: partnerCredit.reasons,
    breakdown: partnerCredit.breakdown,
  }
  const progressiveCredit = applyProgressiveCreditPolicy({
    requestedAmount: request.requested_amount,
    score: creditScore.value,
    baseDecision: creditScore.decision,
    baseSuggestedLimit: creditScore.suggestedLimit,
    baseReasons: creditScore.reasons,
    requestHistory: (requestHistory ?? []).map((historyRow) => ({
      id: historyRow.id,
      status: historyRow.status,
      decision: historyRow.decision,
      approvedAmount: historyRow.approved_amount,
      createdAt: historyRow.created_at,
      decidedAt: historyRow.decided_at,
    })),
  })
  const fraudScore = calculateFraudScore({
    transactions,
    deviceTrust: {
      userAgent: consent.user_agent,
      ipAddress: normalizeIpAddress(consent.ip_address),
    },
  })
  const partnerFraud = applyPartnerIndicatorsToFraudScore({
    partnerProfile: partnerIndicators,
    fraudScore,
  })
  const fraudDecision = applyFraudDecisionPolicy({
    creditDecision: progressiveCredit.decision,
    suggestedLimit: progressiveCredit.suggestedLimit,
    reasons: progressiveCredit.reasons,
    fraudScore: partnerFraud.fraudScore,
  })
  const monitoring = evaluatePostCreditMonitoring({
    transactions,
    creditScoreValue: creditScore.value,
    creditDecision: fraudDecision.decision,
    suggestedLimit: fraudDecision.suggestedLimit,
    approvedAmount: fraudDecision.suggestedLimit,
    fraudScoreValue: partnerFraud.fraudScore.value,
    fraudRiskLevel: partnerFraud.fraudScore.riskLevel,
    confidenceLevel: progressiveCredit.level,
    isFirstConcession: progressiveCredit.isFirstConcession,
    requestHistory: (requestHistory ?? []).map((historyRow) => ({
      id: historyRow.id,
      status: historyRow.status,
      decision: historyRow.decision,
      approvedAmount: historyRow.approved_amount,
      createdAt: historyRow.created_at,
      decidedAt: historyRow.decided_at,
    })),
  })
  const score = {
    ...creditScore,
    decision: fraudDecision.decision,
    suggestedLimit: fraudDecision.suggestedLimit,
    reasons: fraudDecision.reasons,
  }
  const explainability = buildDecisionExplainability({
    decision: score.decision,
    scoreValue: score.value,
    suggestedLimit: score.suggestedLimit,
    reasons: score.reasons,
    consentScopes: consent.scopes,
    progressiveCredit,
    fraudScore: partnerFraud.fraudScore,
    monitoring,
  })
  const emailCommunication = buildEmailCommunicationBundle({
    requestId: request.id,
    recipientName: profile.name,
    recipientEmail: user.email,
    requestedAmount: request.requested_amount,
    approvedAmount: score.suggestedLimit,
    decision: score.decision,
    scoreValue: score.value,
    explainability,
    progressiveCredit,
    fraudScore: partnerFraud.fraudScore,
    monitoring,
  })
  const transactionRows = mapTransactionsToRows(
    transactions,
    request.id,
    request.user_id,
  )
  const scoreRow = mapScoreToRow(score, request.id, request.user_id)
  const auditRows: AuditLogInsert[] = [
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "credit_analysis_started",
      metadata: {
        previous_status: request.status,
        consent_id: consent.id,
        consent_scopes: consent.scopes,
      },
      createdAt: startedAt,
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "mock_transactions_generated",
      metadata: {
        transaction_count: transactionRows.length,
        mock_profile: profile.mock_profile,
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "credit_score_calculated",
      metadata: {
        score: score.value,
        decision: score.decision,
        suggested_limit: score.suggestedLimit,
        base_score: baseScore.value,
        partner_credit_score: creditScore.value,
        partner_credit_score_delta_applied: partnerCredit.scoreDeltaApplied,
        confidence_level: progressiveCredit.level,
        confidence_label: progressiveCredit.levelLabel,
        is_first_concession: progressiveCredit.isFirstConcession,
        is_conservative_initial_offer:
          progressiveCredit.isConservativeInitialOffer,
        previous_approved_requests:
          progressiveCredit.stats.previousApprovedRequests,
        progressive_limit_cap: progressiveCredit.appliedCap,
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "partner_indicators_enriched",
      metadata: {
        partner_id: partnerIndicators?.partnerId ?? null,
        partner_name: partnerIndicators?.partnerName ?? null,
        partner_summary: partnerIndicators?.summary ?? null,
        indicator_count: partnerIndicators?.indicators.length ?? 0,
        credit_impact_summary: partnerCredit.impactSummary,
        fraud_impact_summary: partnerFraud.impactSummary,
        indicators:
          partnerIndicators?.indicators.map((indicator) => ({
            type: indicator.indicatorType,
            value: indicator.indicatorValue,
            time_window: indicator.timeWindow,
            confidence_level: indicator.confidenceLevel,
            usage_context: indicator.usageContext,
          })) ?? [],
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "fraud_score_calculated",
      metadata: {
        fraud_score: partnerFraud.fraudScore.value,
        fraud_risk_level: partnerFraud.fraudScore.riskLevel,
        raw_fraud_score: fraudScore.value,
        raw_fraud_risk_level: fraudScore.riskLevel,
        fraud_signals: partnerFraud.fraudScore.signals.map((signal) => ({
          key: signal.key,
          category: signal.category,
          label: signal.label,
          severity: signal.severity,
        })),
        fraud_breakdown: partnerFraud.fraudScore.breakdown,
        fraud_metrics: partnerFraud.fraudScore.metrics,
        operational_recommendation: partnerFraud.fraudScore.operationalRecommendation,
        impact_summary: fraudDecision.impactSummary,
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "post_credit_monitoring_evaluated",
      metadata: {
        post_credit_risk_level: monitoring.riskLevel,
        monitoring_summary: monitoring.monitoringSummary,
        eligibility_status: monitoring.eligibility.status,
        eligibility_summary: monitoring.eligibility.summary,
        limit_action: monitoring.limitRecommendation.action,
        limit_action_summary: monitoring.limitRecommendation.summary,
        alerts: monitoring.alerts.map((alert) => ({
          key: alert.key,
          level: alert.level,
          title: alert.title,
          audience: alert.audience,
        })),
        monitoring_metrics: monitoring.metrics,
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "credit_request_decided",
      metadata: {
        decision: score.decision,
        approved_amount: score.suggestedLimit,
        confidence_level: progressiveCredit.level,
        confidence_label: progressiveCredit.levelLabel,
        fraud_score: partnerFraud.fraudScore.value,
        fraud_risk_level: partnerFraud.fraudScore.riskLevel,
        fraud_impact_summary: fraudDecision.impactSummary,
        post_credit_risk_level: monitoring.riskLevel,
        post_credit_limit_action: monitoring.limitRecommendation.action,
        post_credit_eligibility: monitoring.eligibility.status,
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "decision_explainability_prepared",
      metadata: {
        decision_mode: explainability.decisionMode,
        primary_factors: explainability.primaryFactors.map((factor) => ({
          key: factor.key,
          label: factor.label,
        })),
        reason_titles: explainability.reasons.map((reason) => reason.title),
        has_sensitive_data_notice: Boolean(explainability.sensitiveDataNotice),
        has_future_consent_notice: Boolean(explainability.futureConsentNotice),
      },
    }),
    ...emailCommunication.communications.map((communication) =>
      buildAuditLog({
        requestId: request.id,
        actor: user.id,
        action: "email_communication_generated",
        metadata: {
          category: communication.category,
          type: communication.type,
          audience: communication.audience,
          status: communication.status,
          subject: communication.subject,
          preview: communication.preview,
          template_key: communication.audit.templateKey,
          trigger: communication.audit.trigger,
          decision_mode: communication.audit.decisionMode,
          decision: communication.audit.decision,
          fraud_risk_level: communication.audit.fraudRiskLevel,
          monitoring_risk_level: communication.audit.monitoringRiskLevel,
          recipient_email: user.email ?? null,
        },
      }),
    ),
  ]

  const { data: scoringRequest, error: scoringStatusError } = await service
    .from("credit_requests")
    .update({ status: "scoring" })
    .eq("id", request.id)
    .eq("status", "collecting_data")
    .select("id")
    .maybeSingle()

  if (scoringStatusError || !scoringRequest) {
    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel iniciar a anÃ¡lise",
    }
  }

  const { error: deleteTransactionsError } = await service
    .from("transactions")
    .delete()
    .eq("request_id", request.id)
    .eq("source", "open_finance_mock")

  if (deleteTransactionsError) {
    await restoreCollectingDataStatus(service, request.id)

    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel preparar as transaÃ§Ãµes da anÃ¡lise",
    }
  }

  const { error: transactionsError } = await service
    .from("transactions")
    .insert(transactionRows)

  if (transactionsError) {
    await restoreCollectingDataStatus(service, request.id)

    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel salvar as transaÃ§Ãµes da anÃ¡lise",
    }
  }

  const { error: scoreError } = await service
    .from("scores")
    .upsert(scoreRow, { onConflict: "request_id" })

  if (scoreError) {
    await restoreCollectingDataStatus(service, request.id)

    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel salvar o score da anÃ¡lise",
    }
  }

  const { error: requestUpdateError } = await service
    .from("credit_requests")
    .update({
      status: "decided",
      decision: score.decision,
      approved_amount: score.suggestedLimit,
      decided_at: new Date().toISOString(),
    })
    .eq("id", request.id)

  if (requestUpdateError) {
    await restoreCollectingDataStatus(service, request.id)

    return {
      ok: false,
      formError: "NÃ£o foi possÃ­vel finalizar a solicitaÃ§Ã£o",
    }
  }

  const { error: auditError } = await service.from("audit_logs").insert(auditRows)

  if (auditError) {
    console.error("Failed to persist audit logs for completed credit analysis", {
      requestId: request.id,
      error: auditError,
    })
  }

  revalidatePath(`/resultado/${request.id}`)

  return {
    ok: true,
    data: {
      requestId: request.id,
      score: score.value,
      decision: score.decision,
      suggestedLimit: score.suggestedLimit,
      confidenceLevel: progressiveCredit.level,
      confidenceLabel: progressiveCredit.levelLabel,
      isConservativeInitialOffer: progressiveCredit.isConservativeInitialOffer,
      fraudScoreValue: partnerFraud.fraudScore.value,
      fraudRiskLevel: partnerFraud.fraudScore.riskLevel,
      postCreditRiskLevel: monitoring.riskLevel,
      postCreditLimitAction: monitoring.limitRecommendation.action,
      redirectTo: `/resultado/${request.id}`,
    },
  }
}

function getMockProfile(value: string) {
  if (value in MOCK_PROFILE_CONFIGS) {
    return value as keyof typeof MOCK_PROFILE_CONFIGS
  }

  return null
}

async function restoreCollectingDataStatus(
  service: ReturnType<typeof createServiceClient>,
  requestId: string,
) {
  const { error } = await service
    .from("credit_requests")
    .update({ status: "collecting_data" })
    .eq("id", requestId)
    .eq("status", "scoring")

  if (error) {
    console.error("Failed to restore credit request status after scoring error", {
      requestId,
      error,
    })
  }
}

function buildAuditLog({
  requestId,
  actor,
  action,
  metadata,
  createdAt,
}: {
  requestId: string
  actor: string
  action: string
  metadata: Json
  createdAt?: string
}): AuditLogInsert {
  return {
    entity_type: "credit_request",
    entity_id: requestId,
    action,
    actor,
    metadata,
    created_at: createdAt,
  }
}

function getStableSeed(value: string) {
  return value
    .replaceAll("-", "")
    .slice(0, 8)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0)
}

function normalizeIpAddress(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (value == null) {
    return null
  }

  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

function mapScoreToRow(
  score: ReturnType<typeof calculateCreditScore>,
  requestId: string,
  userId: string,
): ScoreInsert {
  return {
    request_id: requestId,
    user_id: userId,
    value: score.value,
    regularity: score.breakdown.regularity.value,
    capacity: score.breakdown.capacity.value,
    stability: score.breakdown.stability.value,
    behavior: score.breakdown.behavior.value,
    data_quality: score.breakdown.dataQuality.value,
    reasons: score.reasons,
    suggested_limit: score.suggestedLimit,
  }
}

function mapTransactionsToRows(
  transactions: ReturnType<typeof generateSyntheticTransactions>,
  requestId: string,
  userId: string,
): TransactionInsert[] {
  return transactions.map((transaction) => ({
    request_id: requestId,
    user_id: userId,
    occurred_at: transaction.occurredAt,
    amount: transaction.amount,
    kind: transaction.kind,
    category: transaction.category,
    description: transaction.description,
    source: transaction.source,
  }))
}

