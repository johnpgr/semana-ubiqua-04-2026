import type {
  EmailCommunication,
  EmailCommunicationBundle,
} from "../emailCommunication"
import type { FraudScoreResult } from "../fraudScore"
import type { PostCreditMonitoringResult } from "../postCreditMonitoring"

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
  switch (fraudScore.riskLevel) {
    case "critical":
      return {
        title: "Verificacao de seguranca reforcada",
        summary:
          "A analise encontrou sinais relevantes que impedem uma liberacao automatica neste momento.",
        notes: [
          "O caso precisa de verificacao reforcada antes de qualquer concessao.",
          "Por seguranca, detalhes internos da deteccao nao sao expostos ao usuario.",
        ],
      }
    case "high":
      return {
        title: "Verificacao de seguranca adicional",
        summary:
          "Alguns sinais exigem revisao complementar antes de uma decisao totalmente automatica.",
        notes: [
          "A revisao protege o usuario e a plataforma contra uso indevido.",
          "Os criterios internos de deteccao permanecem restritos ao time operacional.",
        ],
      }
    case "moderate":
      return {
        title: "Cautela de seguranca",
        summary:
          "A analise identificou sinais que recomendam uma concessao mais cautelosa.",
        notes: [
          "Esses sinais podem reduzir limite ou manter acompanhamento reforcado.",
          "A explicacao ao usuario fica em nivel resumido para preservar a seguranca.",
        ],
      }
    case "low":
    default:
      return {
        title: "Seguranca sem alerta relevante",
        summary:
          "Nao foram identificados sinais fortes de uso indevido na analise atual.",
        notes: [
          "O fluxo segue com monitoramento padrao.",
          "Novos sinais podem ser avaliados em futuras revisoes do relacionamento.",
        ],
      }
  }
}

export function getUserSafePartnerSummary(signal: "reinforce" | "neutral" | "caution") {
  switch (signal) {
    case "reinforce":
      return "Indicadores externos agregados reforcaram a leitura de atividade e confianca, sem substituir o score interno."
    case "caution":
      return "Indicadores externos agregados adicionaram cautela a leitura final, sem expor dados brutos do parceiro."
    case "neutral":
    default:
      return "Indicadores externos agregados foram usados como complemento moderado da analise."
  }
}

export function getMonitoringPresentationCopy(
  monitoring: PostCreditMonitoringResult,
) {
  return {
    title: "Acompanhamento inicial de risco",
    summary:
      "Esta leitura e uma avaliacao inicial projetada a partir da concessao e dos dados disponiveis agora. Ciclos reais de pagamento ainda serao considerados em evolucoes futuras.",
    status: getMonitoringRiskSummary(monitoring.riskLevel),
  }
}

function getMonitoringRiskSummary(riskLevel: PostCreditMonitoringResult["riskLevel"]) {
  switch (riskLevel) {
    case "critical":
      return "Exige tratamento operacional reforcado."
    case "high":
      return "Recomenda revisao antes de ampliar exposicao."
    case "moderate":
      return "Mantem cautela ate haver comportamento observado."
    case "low":
    default:
      return "Permite acompanhamento padrao do relacionamento."
  }
}
