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

export type ConsentCategoryKey = "financial"

export type ConsentScopeDetail = {
  category: ConsentCategoryKey
  label: string
  dataUsage: string
}

export const ConsentScopeDetails: Record<ConsentScopeEnum, ConsentScopeDetail> = {
  salary: {
    category: "financial",
    label: "Salário e rendimentos",
    dataUsage:
      "Usado para estimar renda recorrente e regularidade de entradas na análise.",
  },
  investments: {
    category: "financial",
    label: "Investimentos e saldos",
    dataUsage:
      "Usado para leitura de folga financeira e estabilidade geral do perfil.",
  },
  cards: {
    category: "financial",
    label: "Cartões e compras",
    dataUsage:
      "Usado para leitura de comportamento de gasto e relação com o fluxo de entrada.",
  },
}

export type ConsentCategoryConfig = {
  title: string
  description: string
  scopes: readonly ConsentScopeEnum[]
}

export const ConsentCategoryConfigs: Record<
  ConsentCategoryKey,
  ConsentCategoryConfig
> = {
  financial: {
    title: "Dados financeiros autorizados",
    description:
      "Sinais financeiros consumidos pela análise de crédito desta solicitação.",
    scopes: CONSENT_SCOPES.filter(
      (scope) => ConsentScopeDetails[scope].category === "financial",
    ),
  },
}

export const CONSENT_CATEGORY_KEYS: readonly ConsentCategoryKey[] = [
  "financial",
]

export const Consent = z.object({
  scopes: z
    .array(z.enum(CONSENT_SCOPES))
    .min(1, "Selecione ao menos um dado para compartilhar"),
})

export type Consent = z.infer<typeof Consent>

export const ConsentSchema = Consent
