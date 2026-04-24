"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import type { FormActionState } from "@/lib/form-action"

import { processCreditAnalysis } from "../../score-actions"

export type RunAnalysisState = FormActionState<"request_id">

const RequestPayload = z.object({
  request_id: z.uuid("Solicitação inválida."),
})

export async function runAnalysis(
  _prevState: RunAnalysisState,
  formData: FormData
): Promise<RunAnalysisState> {
  const parsed = RequestPayload.safeParse({
    request_id: formData.get("request_id"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      formError: "Não foi possível identificar a solicitação.",
      fieldErrors: {
        request_id: ["Solicitação inválida."],
      },
    }
  }

  const requestId = parsed.data.request_id
  const analysis = await processCreditAnalysis(requestId)

  if (!analysis.ok) {
    return {
      ok: false,
      formError:
        analysis.formError ??
        "Não foi possível concluir a análise neste momento.",
    }
  }

  revalidatePath(`/resultado/${requestId}`)
  redirect(analysis.data.redirectTo)
}
