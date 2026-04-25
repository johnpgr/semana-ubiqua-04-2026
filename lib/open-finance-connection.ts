export type OpenFinanceInstitutionOption = {
  name: string
  accountLast4: string
  description: string
  custom?: boolean
}

export type StoredOpenFinanceConnection = {
  version: 3
  status: "connected"
  connectedAt: string
  institutionName: string
  accountLast4: string
  authorizedScopes: string[]
}

type LegacyOpenFinanceConnection = {
  status?: string
  connectedAt?: string
  institution?: string
  institutionName?: string
  accountLast4?: string
  scopes?: string[]
  authorizedScopes?: string[]
}

export const OPEN_FINANCE_CONNECTION_CHANGE_EVENT =
  "opencred:bank-connection-change"
export const OPEN_FINANCE_FALLBACK_INSTITUTION = "Instituição conectada"
export const OPEN_FINANCE_FALLBACK_DESTINATION = "Conta conectada"

export const OPEN_FINANCE_AUTHORIZED_SCOPES = [
  "Entradas financeiras",
  "Saídas financeiras",
  "Saldo médio",
  "Recorrência de renda",
  "Comportamento financeiro",
  "Histórico de relacionamento",
]

export const OPEN_FINANCE_ANALYSIS_USAGE = [
  "Score financeiro",
  "Análise de risco",
  "Crédito progressivo",
  "Explicabilidade da decisão",
]

export const OPEN_FINANCE_INSTITUTIONS: readonly OpenFinanceInstitutionOption[] = [
  {
    name: "Nubank",
    accountLast4: "4829",
    description: "Conta digital para recebimentos e pagamentos recorrentes.",
  },
  {
    name: "Inter",
    accountLast4: "1937",
    description: "Conta principal com movimentação financeira frequente.",
  },
  {
    name: "Itaú",
    accountLast4: "7402",
    description: "Conta corrente com histórico de relacionamento financeiro.",
  },
  {
    name: "Bradesco",
    accountLast4: "6158",
    description: "Conta usada para renda, saídas e saldo médio.",
  },
  {
    name: "Santander",
    accountLast4: "8841",
    description: "Conta com entradas recorrentes e pagamentos do mês.",
  },
  {
    name: "Banco do Brasil",
    accountLast4: "0264",
    description: "Conta de relacionamento financeiro consolidado.",
  },
  {
    name: "Caixa",
    accountLast4: "7710",
    description: "Conta vinculada a recebimentos e transações essenciais.",
  },
  {
    name: "PicPay",
    accountLast4: "3095",
    description: "Carteira financeira com movimentação digital recorrente.",
  },
  {
    name: "Mercado Pago",
    accountLast4: "5508",
    description: "Conta digital usada em pagamentos e recebimentos.",
  },
  {
    name: "C6 Bank",
    accountLast4: "9126",
    description: "Conta digital para organização financeira cotidiana.",
  },
  {
    name: "Outro banco",
    accountLast4: "0000",
    description: "Informe a instituição financeira que deseja autorizar.",
    custom: true,
  },
]

export function getOpenFinanceStorageKey(userId: string) {
  return `opencred:simulated-bank-connection:${userId}`
}

export function sanitizeInstitutionName(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function getInstitutionAccountLast4(institutionName: string) {
  const sanitizedName = sanitizeInstitutionName(institutionName)
  const knownInstitution = OPEN_FINANCE_INSTITUTIONS.find(
    (institution) => institution.name === sanitizedName && !institution.custom
  )

  if (knownInstitution) {
    return knownInstitution.accountLast4
  }

  return createDeterministicAccountLast4(sanitizedName)
}

export function normalizeOpenFinanceConnection(
  value: unknown
): StoredOpenFinanceConnection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const connection = value as LegacyOpenFinanceConnection

  if (connection.status !== "connected" || !connection.connectedAt) {
    return null
  }

  const institutionName = sanitizeInstitutionName(
    connection.institutionName ?? connection.institution ?? ""
  )
  const accountLast4 =
    typeof connection.accountLast4 === "string" &&
    /^\d{4}$/.test(connection.accountLast4)
      ? connection.accountLast4
      : getInstitutionAccountLast4(institutionName)

  return {
    version: 3,
    status: "connected",
    connectedAt: connection.connectedAt,
    institutionName: institutionName || OPEN_FINANCE_FALLBACK_INSTITUTION,
    accountLast4,
    authorizedScopes:
      connection.authorizedScopes ??
      connection.scopes ??
      OPEN_FINANCE_AUTHORIZED_SCOPES,
  }
}

export function buildOpenFinanceDestination(
  connection: StoredOpenFinanceConnection | null
) {
  if (!connection) {
    return OPEN_FINANCE_FALLBACK_DESTINATION
  }

  if (connection.accountLast4 === "0000") {
    return connection.institutionName
  }

  return `${connection.institutionName} · Conta •••• ${connection.accountLast4}`
}

export function buildStoredOpenFinanceConnection({
  connectedAt,
  institutionName,
}: {
  connectedAt: string
  institutionName: string
}): StoredOpenFinanceConnection {
  const sanitizedName = sanitizeInstitutionName(institutionName)
  const finalInstitution =
    sanitizedName || OPEN_FINANCE_FALLBACK_INSTITUTION

  return {
    version: 3,
    status: "connected",
    connectedAt,
    institutionName: finalInstitution,
    accountLast4: getInstitutionAccountLast4(finalInstitution),
    authorizedScopes: OPEN_FINANCE_AUTHORIZED_SCOPES,
  }
}

function createDeterministicAccountLast4(value: string) {
  if (!value) {
    return "0000"
  }

  let hash = 0

  for (const character of value.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) % 9000
  }

  return String(hash + 1000).padStart(4, "0").slice(-4)
}
