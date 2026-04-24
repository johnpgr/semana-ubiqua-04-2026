import { evaluateProgressiveCreditState } from "../creditProgression"
import { buildEmailCommunicationBundle } from "../emailCommunication"
import { buildDecisionExplainability } from "../explainability"
import { calculateFraudScore } from "../fraudScore"
import {
  applyPartnerIndicatorsToFraudScore,
  getMockPartnerIndicatorProfile,
} from "../partnerIndicators"
import { evaluatePostCreditMonitoring } from "../postCreditMonitoring"
import type { CreditDecision, ScoreTransaction } from "../scoreEngine"

const CREDIT_DECISIONS = [
  "approved",
  "approved_reduced",
  "further_review",
  "denied",
] as const satisfies readonly CreditDecision[]

const CREDIT_DECISION_SET = new Set<string>(CREDIT_DECISIONS)

type AnalysisRequestSnapshot = {
  id: string
  requested_amount: number
  decision: string | null
  approved_amount: number | null
}

type AnalysisScoreSnapshot = {
  value: number
  reasons: string[]
  suggested_limit: number
}

type AnalysisTransactionSnapshot = {
  occurred_at: string
  amount: number
  kind: string
  category: string
  description?: string | null
  source?: string | null
}

type AnalysisConsentSnapshot = {
  scopes?: string[] | null
  user_agent?: string | null
  ip_address?: unknown
} | null

type AnalysisHistorySnapshot = {
  id: string
  status: string
  decision: string | null
  approved_amount: number | null
  created_at: string
  decided_at: string | null
}

export function buildAnalysisView({
  request,
  consent,
  score,
  transactions,
  requestHistory,
  mockProfile,
  recipientName,
}: {
  request: AnalysisRequestSnapshot
  consent: AnalysisConsentSnapshot
  score: AnalysisScoreSnapshot | null
  transactions: AnalysisTransactionSnapshot[]
  requestHistory: AnalysisHistorySnapshot[]
  mockProfile?: string | null
  recipientName?: string | null
}) {
  if (!score || !request.decision || !CREDIT_DECISION_SET.has(request.decision)) {
    return null
  }

  const decision = request.decision as CreditDecision
  const history = requestHistory.map((historyRow) => ({
    id: historyRow.id,
    status: historyRow.status,
    decision:
      historyRow.decision && CREDIT_DECISION_SET.has(historyRow.decision)
        ? (historyRow.decision as CreditDecision)
        : null,
    approvedAmount: historyRow.approved_amount,
    createdAt: historyRow.created_at,
    decidedAt: historyRow.decided_at,
  }))
  const scoreTransactions = mapTransactions(transactions)
  const progressiveCredit = evaluateProgressiveCreditState({
    requestedAmount: request.requested_amount,
    score: score.value,
    baseDecision: decision,
    baseSuggestedLimit: score.suggested_limit,
    requestHistory: history,
  })
  const fraudScore =
    scoreTransactions.length > 0
      ? calculateFraudScore({
          transactions: scoreTransactions,
          deviceTrust: {
            userAgent: consent?.user_agent,
            ipAddress: normalizeIpAddress(consent?.ip_address),
          },
        })
      : null
  const partnerIndicators = getMockPartnerIndicatorProfile(mockProfile)
  const partnerFraud = fraudScore
    ? applyPartnerIndicatorsToFraudScore({
        partnerProfile: partnerIndicators,
        fraudScore,
      }).fraudScore
    : null
  const monitoring = evaluatePostCreditMonitoring({
    transactions: scoreTransactions,
    creditScoreValue: score.value,
    creditDecision: decision,
    suggestedLimit: score.suggested_limit,
    approvedAmount: request.approved_amount,
    fraudScoreValue: partnerFraud?.value,
    fraudRiskLevel: partnerFraud?.riskLevel,
    confidenceLevel: progressiveCredit.level,
    isFirstConcession: progressiveCredit.isFirstConcession,
    requestHistory: history,
  })
  const explainability = buildDecisionExplainability({
    decision,
    scoreValue: score.value,
    suggestedLimit: score.suggested_limit,
    reasons: score.reasons,
    consentScopes: consent?.scopes,
    progressiveCredit,
    fraudScore: partnerFraud,
    monitoring,
  })
  const emailCommunication = buildEmailCommunicationBundle({
    requestId: request.id,
    recipientName,
    requestedAmount: request.requested_amount,
    approvedAmount: request.approved_amount ?? score.suggested_limit,
    decision,
    scoreValue: score.value,
    explainability,
    progressiveCredit,
    fraudScore: partnerFraud,
    monitoring,
  })

  return {
    progressiveCredit,
    fraudScore,
    partnerFraud,
    monitoring,
    partnerIndicators,
    explainability,
    emailCommunication,
  }
}

function mapTransactions(
  transactions: AnalysisTransactionSnapshot[],
): ScoreTransaction[] {
  return transactions
    .filter(
      (transaction): transaction is AnalysisTransactionSnapshot & {
        kind: "credit" | "debit"
      } => transaction.kind === "credit" || transaction.kind === "debit",
    )
    .map((transaction) => ({
      occurredAt: transaction.occurred_at,
      amount: transaction.amount,
      kind: transaction.kind,
      category: transaction.category,
      description: transaction.description ?? undefined,
      source: transaction.source ?? undefined,
    }))
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
