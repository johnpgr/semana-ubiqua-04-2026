import { notFound, redirect } from "next/navigation"

import { requireCurrentProfile } from "@/lib/auth/profile"
import { loadLoanForRequest } from "@/lib/loans"
import { createServiceClient } from "@/lib/supabase/service"

import { LoanCard } from "./loan-card"

export default async function EmprestimoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await requireCurrentProfile()

  const service = createServiceClient()

  // Verify ownership
  const { data: request } = await service
    .from("credit_requests")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle()

  if (!request) {
    notFound()
  }

  if (request.user_id !== profile.id) {
    notFound()
  }

  const loan = await loadLoanForRequest(service, id)

  if (!loan) {
    redirect(`/resultado/${id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <LoanCard loan={loan} userId={profile.id} />
    </div>
  )
}
