"use server"

import { revalidatePath } from "next/cache"

import {
  generateSyntheticTransactions,
  type MockProfile,
} from "@/lib/mockData/profiles"
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
      formError: "Solicitação inválida",
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
      formError: "Faça login para processar a análise",
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
      formError: "Não foi possível carregar a solicitação",
    }
  }

  if (!request) {
    return {
      ok: false,
      formError: "Solicitação não encontrada",
    }
  }

  const [{ data: profile, error: profileError }, { data: consent, error: consentError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, mock_profile")
        .eq("id", request.user_id)
        .maybeSingle(),
      supabase
        .from("consents")
        .select("id, scopes, granted_at")
        .eq("request_id", request.id)
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (profileError || !profile) {
    return {
      ok: false,
      formError: "Não foi possível carregar o perfil do usuário",
    }
  }

  if (consentError) {
    return {
      ok: false,
      formError: "Não foi possível verificar o consentimento",
    }
  }

  if (!consent) {
    return {
      ok: false,
      formError: "A análise exige consentimento salvo",
    }
  }

  if (request.status === "decided" && request.decision) {
    const { data: existingScore } = await supabase
      .from("scores")
      .select("value, suggested_limit")
      .eq("request_id", request.id)
      .maybeSingle()

    revalidatePath(`/resultado/${request.id}`)

    return {
      ok: true,
      data: {
        requestId: request.id,
        score: existingScore?.value ?? 0,
        decision: request.decision,
        suggestedLimit:
          existingScore?.suggested_limit ?? request.approved_amount ?? 0,
        redirectTo: `/resultado/${request.id}`,
      },
    }
  }

  const service = createServiceClient()
  const startedAt = new Date().toISOString()
  const transactions = generateSyntheticTransactions({
    profile: profile.mock_profile as MockProfile,
    requestId: request.id,
    seed: getStableSeed(request.id),
  })
  const score = calculateCreditScore({
    transactions,
    requestedAmount: request.requested_amount,
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
      },
    }),
    buildAuditLog({
      requestId: request.id,
      actor: user.id,
      action: "credit_request_decided",
      metadata: {
        decision: score.decision,
        approved_amount: score.suggestedLimit,
      },
    }),
  ]

  const { error: scoringStatusError } = await service
    .from("credit_requests")
    .update({ status: "scoring" })
    .eq("id", request.id)

  if (scoringStatusError) {
    return {
      ok: false,
      formError: "Não foi possível iniciar a análise",
    }
  }

  const { error: deleteTransactionsError } = await service
    .from("transactions")
    .delete()
    .eq("request_id", request.id)

  if (deleteTransactionsError) {
    return {
      ok: false,
      formError: "Não foi possível preparar as transações da análise",
    }
  }

  const { error: transactionsError } = await service
    .from("transactions")
    .insert(transactionRows)

  if (transactionsError) {
    return {
      ok: false,
      formError: "Não foi possível salvar as transações da análise",
    }
  }

  const { error: scoreError } = await service
    .from("scores")
    .upsert(scoreRow, { onConflict: "request_id" })

  if (scoreError) {
    return {
      ok: false,
      formError: "Não foi possível salvar o score da análise",
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
    return {
      ok: false,
      formError: "Não foi possível finalizar a solicitação",
    }
  }

  const { error: auditError } = await service.from("audit_logs").insert(auditRows)

  if (auditError) {
    return {
      ok: false,
      formError: "Análise concluída, mas a auditoria não pôde ser registrada",
    }
  }

  revalidatePath(`/resultado/${request.id}`)

  return {
    ok: true,
    data: {
      requestId: request.id,
      score: score.value,
      decision: score.decision,
      suggestedLimit: score.suggestedLimit,
      redirectTo: `/resultado/${request.id}`,
    },
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
