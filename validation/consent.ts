import { z } from "zod"

import type { Database } from "@/lib/supabase/database.types"

type ConsentScopeEnum = Database["public"]["Enums"]["consent_scope"]

export const CONSENT_SCOPES = [
  "salary",
  "investments",
  "cards",
] as const satisfies readonly [ConsentScopeEnum, ...ConsentScopeEnum[]]

export const ConsentScopeLabels: Record<ConsentScopeEnum, string> = {
  salary: "Salário e rendimentos",
  investments: "Investimentos e saldos",
  cards: "Cartões e compras",
}

export const Consent = z.object({
  scopes: z
    .array(z.enum(CONSENT_SCOPES))
    .min(1, "Selecione ao menos um dado para compartilhar"),
})

export type Consent = z.infer<typeof Consent>

export const ConsentSchema = Consent
