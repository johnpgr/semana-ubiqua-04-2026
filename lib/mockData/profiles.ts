import { Faker, base, pt_BR } from "@faker-js/faker"

export type MockProfile =
  | "motorista_consistente"
  | "perfil_forte"
  | "autonomo_irregular"
  | "fluxo_instavel"
  | "historico_insuficiente"

export type TransactionKind = "credit" | "debit"
export type TransactionSource = "open_finance_mock"
export type IncomeCategory =
  | "bico"
  | "bonus_app"
  | "corrida_app"
  | "emprestimo_recebido"
  | "freelance"
  | "primeiro_salario"
  | "prestacao_servico"
  | "rendimento_investimento"
  | "repasse_semanal"
  | "salario"
  | "venda_avulsa"
export type DebitCategory =
  | "alimentacao"
  | "aluguel"
  | "combustivel"
  | "contas"
  | "educacao"
  | "lazer"
  | "manutencao"
  | "saude"
  | "transporte"
export type TransactionCategory = IncomeCategory | DebitCategory

export type SyntheticTransaction = {
  requestId: string
  occurredAt: string
  amount: number
  kind: TransactionKind
  category: TransactionCategory
  description: string
  source: TransactionSource
}

export type VolatilityLevel = "low" | "medium" | "high" | "very_high"

export type ProfileConfig = {
  label: string
  historyDays: number
  incomeFrequencyDays: [number, number]
  incomeAmountRange: [number, number]
  debitRatioRange: [number, number]
  volatility: VolatilityLevel
  gapDays: number[]
  debitEventsPerIncome: [number, number]
  incomeCategories: IncomeCategory[]
  debitCategories: DebitCategory[]
}

export type GenerateTransactionsOptions = {
  profile: MockProfile
  requestId: string
  referenceDate?: Date
  seed?: number
}

type TransactionDraft = Omit<SyntheticTransaction, "requestId">

const VOLATILITY_FACTOR: Record<VolatilityLevel, number> = {
  low: 0.08,
  medium: 0.18,
  high: 0.35,
  very_high: 0.55,
}

const DEBIT_DESCRIPTIONS: Record<DebitCategory, string[]> = {
  alimentacao: ["Mercado bairro", "Padaria", "Restaurante simples"],
  aluguel: ["Aluguel residencial", "Condominio", "Moradia"],
  combustivel: ["Posto de combustivel", "Abastecimento app"],
  contas: ["Energia eletrica", "Internet", "Agua e saneamento"],
  educacao: ["Curso online", "Material escolar"],
  lazer: ["Streaming", "Cinema", "Assinatura digital"],
  manutencao: ["Manutencao veiculo", "Oficina mecanica", "Pneus e pecas"],
  saude: ["Farmacia", "Consulta medica", "Plano de saude"],
  transporte: ["Aplicativo transporte", "Bilhete transporte", "Estacionamento"],
}

export const MOCK_PROFILE_CONFIGS: Record<MockProfile, ProfileConfig> = {
  motorista_consistente: {
    label: "Motorista consistente",
    historyDays: 120,
    incomeFrequencyDays: [2, 4],
    incomeAmountRange: [180, 420],
    debitRatioRange: [0.52, 0.68],
    volatility: "low",
    gapDays: [28, 63],
    debitEventsPerIncome: [2, 4],
    incomeCategories: ["corrida_app", "bonus_app", "repasse_semanal"],
    debitCategories: ["combustivel", "manutencao", "alimentacao", "contas"],
  },
  perfil_forte: {
    label: "Perfil forte",
    historyDays: 180,
    incomeFrequencyDays: [14, 16],
    incomeAmountRange: [5200, 7800],
    debitRatioRange: [0.36, 0.52],
    volatility: "low",
    gapDays: [],
    debitEventsPerIncome: [5, 8],
    incomeCategories: ["salario", "rendimento_investimento", "freelance"],
    debitCategories: ["aluguel", "contas", "alimentacao", "educacao", "saude"],
  },
  autonomo_irregular: {
    label: "Autonomo irregular",
    historyDays: 150,
    incomeFrequencyDays: [5, 18],
    incomeAmountRange: [350, 3200],
    debitRatioRange: [0.58, 0.86],
    volatility: "high",
    gapDays: [22, 23, 24, 72, 73, 116],
    debitEventsPerIncome: [3, 6],
    incomeCategories: ["freelance", "prestacao_servico", "venda_avulsa"],
    debitCategories: ["alimentacao", "contas", "transporte", "saude", "lazer"],
  },
  fluxo_instavel: {
    label: "Fluxo instavel",
    historyDays: 120,
    incomeFrequencyDays: [7, 30],
    incomeAmountRange: [500, 4500],
    debitRatioRange: [0.82, 1.16],
    volatility: "very_high",
    gapDays: [15, 16, 17, 47, 48, 89, 90, 91],
    debitEventsPerIncome: [4, 9],
    incomeCategories: ["bico", "emprestimo_recebido", "venda_avulsa"],
    debitCategories: ["alimentacao", "contas", "lazer", "transporte", "saude"],
  },
  historico_insuficiente: {
    label: "Historico insuficiente",
    historyDays: 24,
    incomeFrequencyDays: [9, 14],
    incomeAmountRange: [450, 1800],
    debitRatioRange: [0.48, 0.78],
    volatility: "medium",
    gapDays: [5, 6, 17],
    debitEventsPerIncome: [1, 3],
    incomeCategories: ["primeiro_salario", "freelance"],
    debitCategories: ["alimentacao", "contas", "transporte"],
  },
}

export function generateSyntheticTransactions({
  profile,
  requestId,
  referenceDate = new Date(),
  seed,
}: GenerateTransactionsOptions): SyntheticTransaction[] {
  const config = MOCK_PROFILE_CONFIGS[profile]
  const faker = createFaker(seed)
  const startDate = shiftDays(referenceDate, -config.historyDays)
  const drafts = generateTransactionDrafts(config, startDate, referenceDate, faker)

  return [...drafts]
    .toSorted((first, second) => first.occurredAt.localeCompare(second.occurredAt))
    .map((transaction) => ({
      requestId,
      occurredAt: transaction.occurredAt,
      amount: transaction.amount,
      kind: transaction.kind,
      category: transaction.category,
      description: transaction.description,
      source: transaction.source,
    }))
}

export function getMockProfileConfig(profile: MockProfile): ProfileConfig {
  return MOCK_PROFILE_CONFIGS[profile]
}

function generateTransactionDrafts(
  config: ProfileConfig,
  startDate: Date,
  referenceDate: Date,
  faker: Faker,
) {
  const transactions: TransactionDraft[] = []
  const incomeDates = buildIncomeDates(config, startDate, referenceDate, faker)

  for (const incomeDate of incomeDates) {
    const incomeAmount = roundCurrency(
      applyVolatility(
        faker.number.float({
          min: config.incomeAmountRange[0],
          max: config.incomeAmountRange[1],
        }),
        config.volatility,
        faker,
      ),
    )

    const incomeCategory = faker.helpers.arrayElement(config.incomeCategories)

    transactions.push({
      occurredAt: withBusinessHour(incomeDate, faker).toISOString(),
      amount: incomeAmount,
      kind: "credit",
      category: incomeCategory,
      description: buildIncomeDescription(incomeCategory, faker),
      source: "open_finance_mock",
    })

    transactions.push(...buildDebitTransactions(config, incomeDate, incomeAmount, faker))
  }

  return transactions.filter((transaction) => {
    const occurredAt = new Date(transaction.occurredAt)

    return occurredAt >= startDate && occurredAt <= referenceDate
  })
}

function buildIncomeDates(
  config: ProfileConfig,
  startDate: Date,
  referenceDate: Date,
  faker: Faker,
) {
  const dates: Date[] = []
  let current = new Date(startDate)

  while (current <= referenceDate) {
    const nextGap = faker.number.int({
      min: config.incomeFrequencyDays[0],
      max: config.incomeFrequencyDays[1],
    })
    current = shiftDays(current, nextGap)

    const daysFromStart = differenceInDays(startDate, current)

    if (current <= referenceDate && !config.gapDays.includes(daysFromStart)) {
      dates.push(new Date(current))
    }
  }

  return dates
}

function buildDebitTransactions(
  config: ProfileConfig,
  incomeDate: Date,
  incomeAmount: number,
  faker: Faker,
) {
  const transactions: TransactionDraft[] = []
  const debitCount = faker.number.int({
    min: config.debitEventsPerIncome[0],
    max: config.debitEventsPerIncome[1],
  })
  const targetDebitTotal = incomeAmount * randomInRange(config.debitRatioRange, faker)
  const averageDebit = targetDebitTotal / debitCount

  for (let index = 0; index < debitCount; index += 1) {
    const category = faker.helpers.arrayElement(config.debitCategories)
    const occurredAt = shiftDays(incomeDate, faker.number.int({ min: 0, max: 12 }))

    transactions.push({
      occurredAt: withBusinessHour(occurredAt, faker).toISOString(),
      amount: roundCurrency(
        Math.max(18, applyVolatility(averageDebit, config.volatility, faker)),
      ),
      kind: "debit",
      category,
      description: buildDebitDescription(category, faker),
      source: "open_finance_mock",
    })
  }

  return transactions
}

function buildIncomeDescription(category: IncomeCategory, faker: Faker) {
  const descriptions: Record<IncomeCategory, string[]> = {
    bico: ["Servico eventual recebido", "Pagamento de diaria"],
    bonus_app: ["Bonus por metas no app", "Incentivo semanal do app"],
    corrida_app: ["Repasse de corridas", "Recebimento aplicativo motorista"],
    emprestimo_recebido: ["Transferencia recebida", "Apoio financeiro familiar"],
    freelance: ["Projeto freelance", "Servico autonomo recebido"],
    primeiro_salario: ["Primeiro salario", "Pagamento inicial de trabalho"],
    prestacao_servico: ["Prestacao de servico", "Contrato autonomo"],
    rendimento_investimento: ["Rendimento de investimento", "Resgate com rendimento"],
    repasse_semanal: ["Repasse semanal plataforma", "Fechamento semanal app"],
    salario: ["Salario mensal", "Pagamento empregador"],
    venda_avulsa: ["Venda avulsa recebida", "Recebimento por venda"],
  }

  return faker.helpers.arrayElement(descriptions[category])
}

function buildDebitDescription(category: DebitCategory, faker: Faker) {
  return faker.helpers.arrayElement(DEBIT_DESCRIPTIONS[category])
}

function applyVolatility(amount: number, volatility: VolatilityLevel, faker: Faker) {
  const factor = VOLATILITY_FACTOR[volatility]
  const variation = faker.number.float({ min: -factor, max: factor })

  return amount * (1 + variation)
}

function createFaker(seed: number | undefined) {
  const faker = new Faker({ locale: [pt_BR, base] })

  if (seed !== undefined) {
    faker.seed(seed)
  }

  return faker
}

function differenceInDays(startDate: Date, endDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsPerDay)
}

function randomInRange(range: [number, number], faker: Faker) {
  return faker.number.float({ min: range[0], max: range[1] })
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100
}

function shiftDays(date: Date, days: number) {
  const shifted = new Date(date)
  shifted.setDate(shifted.getDate() + days)

  return shifted
}

function withBusinessHour(date: Date, faker: Faker) {
  const dated = new Date(date)
  dated.setHours(
    faker.number.int({ min: 7, max: 21 }),
    faker.number.int({ min: 0, max: 59 }),
    faker.number.int({ min: 0, max: 59 }),
    0,
  )

  return dated
}
