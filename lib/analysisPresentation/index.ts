import type {
  EmailCommunication,
  EmailCommunicationBundle,
} from "../emailCommunication"
import type { FraudScoreResult } from "../fraudScore"
import type { PostCreditMonitoringResult } from "../postCreditMonitoring"

type FraudRiskLevel = FraudScoreResult["riskLevel"]
type PartnerSignal = "reinforce" | "neutral" | "caution"
type MonitoringRiskLevel = PostCreditMonitoringResult["riskLevel"]

const USER_SAFE_FRAUD_SUMMARIES = {
  critical: {
    title: "Verificacao de seguranca reforcada",
    summary:
      "A analise encontrou sinais relevantes que impedem uma liberacao automatica neste momento.",
    notes: [
      "O caso precisa de verificacao reforcada antes de qualquer concessao.",
      "Por seguranca, detalhes internos da deteccao nao sao expostos ao usuario.",
    ],
  },
  high: {
    title: "Verificacao de seguranca adicional",
    summary:
      "Alguns sinais exigem revisao complementar antes de uma decisao totalmente automatica.",
    notes: [
      "A revisao protege o usuario e a plataforma contra uso indevido.",
      "Os criterios internos de deteccao permanecem restritos ao time operacional.",
    ],
  },
  moderate: {
    title: "Cautela de seguranca",
    summary:
      "A analise identificou sinais que recomendam uma concessao mais cautelosa.",
    notes: [
      "Esses sinais podem reduzir limite ou manter acompanhamento reforcado.",
      "A explicacao ao usuario fica em nivel resumido para preservar a seguranca.",
    ],
  },
  low: {
    title: "Seguranca sem alerta relevante",
    summary:
      "Nao foram identificados sinais fortes de uso indevido na analise atual.",
    notes: [
      "O fluxo segue com monitoramento padrao.",
      "Novos sinais podem ser avaliados em futuras revisoes do relacionamento.",
    ],
  },
} as const satisfies Record<
  FraudRiskLevel,
  { title: string; summary: string; notes: readonly string[] }
>

const USER_SAFE_PARTNER_SUMMARIES = {
  reinforce:
    "Indicadores externos agregados reforcaram a leitura de atividade e confianca, sem substituir o score interno.",
  caution:
    "Indicadores externos agregados adicionaram cautela a leitura final, sem expor dados brutos do parceiro.",
  neutral:
    "Indicadores externos agregados foram usados como complemento moderado da analise.",
} as const satisfies Record<PartnerSignal, string>

const MONITORING_RISK_SUMMARIES = {
  critical: "Exige tratamento operacional reforcado.",
  high: "Recomenda revisao antes de ampliar exposicao.",
  moderate: "Mantem cautela ate haver comportamento observado.",
  low: "Permite acompanhamento padrao do relacionamento.",
} as const satisfies Record<MonitoringRiskLevel, string>

export function getUserVisibleCommunications(
  bundle: EmailCommunicationBundle | null,
) {
  if (!bundle) {
    return {
      primary: null,
      communications: [] as EmailCommunication[],
    }
  }

  const communications = bundle.communications.filter(
    (communication) => communication.audience === "user",
  )

  return {
    primary: communications[0] ?? null,
    communications,
  }
}

export function getUserSafeFraudSummary(fraudScore: FraudScoreResult) {
  return USER_SAFE_FRAUD_SUMMARIES[fraudScore.riskLevel]
}

export function getUserSafePartnerSummary(signal: PartnerSignal) {
  return USER_SAFE_PARTNER_SUMMARIES[signal]
}

export function getMonitoringPresentationCopy(
  monitoring: PostCreditMonitoringResult,
) {
  return {
    title: "Acompanhamento inicial de risco",
    summary:
      "Esta leitura e uma avaliacao inicial projetada a partir da concessao e dos dados disponiveis agora. Ciclos reais de pagamento ainda serao considerados em evolucoes futuras.",
    status: MONITORING_RISK_SUMMARIES[monitoring.riskLevel],
  }
}
