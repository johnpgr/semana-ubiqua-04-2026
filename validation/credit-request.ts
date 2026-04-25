import { z } from "zod"

function normalizeRequestedAmount(raw: unknown) {
  if (typeof raw === "number") {
    return raw
  }

  if (typeof raw !== "string") {
    return raw
  }

  const digits = raw.replace(/\D/g, "")

  if (!digits) {
    return Number.NaN
  }

  return Number(digits) / 100
}

export const CreditRequest = z.object({
  requested_amount: z.preprocess(
    normalizeRequestedAmount,
    z
      .number({
        error: "Informe o valor solicitado",
      })
      .finite("Informe um valor válido")
      .positive("Informe um valor maior que zero")
  ),
})

export type CreditRequest = z.infer<typeof CreditRequest>

export const CreditRequestSchema = CreditRequest
