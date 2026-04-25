export type AssistantContext =
  | "home"
  | "account"
  | "request"
  | "analysis"
  | "result"
  | "loan"
  | "admin"
  | "global"

export type AssistantAnswer = {
  id: string
  question: string
  answer: string
  contexts: AssistantContext[]
  nextQuestions?: string[]
  keywords?: string[]
  phrases?: string[]
  followUpAnswer?: string
}

export type AssistantResolution = {
  answer: string
  matchedAnswer: AssistantAnswer | null
  suggestions: AssistantAnswer[]
  fallbackType?: AssistantFallbackType
  usedPreviousIntent?: boolean
}

type AssistantFallbackType =
  | "general"
  | "credit"
  | "payment"
  | "security"
  | "privacy"
  | "nonsense"

export const OPEN_CRED_AI_WELCOME =
  "Oi, eu sou o OpenCred AI. Posso te orientar sobre análise, limite, conta conectada, segurança e próximos passos."

export const OPEN_CRED_AI_FALLBACK =
  "Não consegui identificar exatamente sua dúvida. Posso te ajudar com: limite, score, conta conectada, solicitação, pagamento, segurança ou próxima oferta."

const FALLBACKS: Record<
  AssistantFallbackType,
  { answer: string; nextQuestions: string[] }
> = {
  general: {
    answer: OPEN_CRED_AI_FALLBACK,
    nextQuestions: ["limit", "score", "connected-account", "request-credit"],
  },
  credit: {
    answer:
      "Crédito no OpenCred envolve valor solicitado, análise financeira, decisão explicada e evolução do relacionamento. Se você quiser, posso detalhar limite, score, solicitação ou próxima oferta.",
    nextQuestions: ["limit", "score", "request-credit", "progressive-credit"],
  },
  payment: {
    answer:
      "O pagamento encerra o ciclo do empréstimo ativo. Quando ele é registrado, o histórico fica mais forte para novas análises, sem garantir aprovação automática.",
    nextQuestions: ["after-payment", "increase-limit", "progressive-credit"],
  },
  security: {
    answer:
      "A análise de segurança verifica consistência e sinais de risco para proteger usuário e operação. Eu explico o conceito geral, mas não exponho critérios internos sensíveis.",
    nextQuestions: ["security", "review", "decision"],
  },
  privacy: {
    answer:
      "O uso de dados depende de autorização. Eles ajudam na análise, na explicação da decisão e na comunicação do ciclo, sempre com foco em transparência.",
    nextQuestions: ["privacy", "consent", "connected-account"],
  },
  nonsense: {
    answer: OPEN_CRED_AI_FALLBACK,
    nextQuestions: ["score", "limit", "connected-account", "security"],
  },
}

export const OPEN_CRED_AI_KNOWLEDGE: AssistantAnswer[] = [
  {
    id: "greeting",
    question: "Oi, o que você faz?",
    answer:
      "Oi. Eu ajudo você a entender o OpenCred, acompanhar sua jornada de crédito e tirar dúvidas sobre análise, limite, conta conectada, pagamento e segurança.",
    contexts: [
      "home",
      "account",
      "request",
      "analysis",
      "result",
      "loan",
      "admin",
      "global",
    ],
    nextQuestions: ["product-flow", "score", "limit"],
    keywords: [
      "oi",
      "ola",
      "olá",
      "bom dia",
      "boa tarde",
      "boa noite",
      "ajuda",
      "entendi",
      "usar",
      "app",
    ],
    phrases: [
      "oi",
      "ola",
      "olá",
      "bom dia",
      "boa tarde",
      "boa noite",
      "me ajuda",
      "nao entendi",
      "não entendi",
      "o que voce faz",
      "o que você faz",
      "como usar",
    ],
  },
  {
    id: "signup",
    question: "Como começo?",
    answer:
      "Para começar, acesse sua área do usuário, complete seu cadastro e conecte sua conta financeira. Depois disso, você pode solicitar crédito e autorizar a análise.",
    contexts: ["home", "account", "global"],
    nextQuestions: ["connected-account", "request-credit", "product-flow"],
    keywords: [
      "cadastro",
      "cadastrar",
      "começar",
      "comecar",
      "inicio",
      "início",
      "abrir",
      "criar",
      "conta",
    ],
    phrases: [
      "como abro uma conta",
      "abrir conta",
      "criar conta",
      "fazer cadastro",
      "me cadastrar",
      "como começo",
      "como comeco",
      "onde começo",
      "onde comeco",
    ],
    followUpAnswer:
      "O primeiro passo é entrar no OpenCred e completar o cadastro básico. Em seguida, sua área do usuário guia a conexão da conta financeira, a solicitação de crédito e o consentimento da análise.",
  },
  {
    id: "product-flow",
    question: "Como funciona o OpenCred?",
    answer:
      "O OpenCred organiza uma jornada de crédito: você cria perfil, conecta uma conta financeira, solicita valor, autoriza a análise, recebe uma decisão explicada e acompanha o ciclo.",
    contexts: ["home", "account", "request", "global"],
    nextQuestions: ["signup", "connected-account", "score"],
    keywords: [
      "opencred",
      "plataforma",
      "produto",
      "app",
      "funciona",
      "começo",
      "comeco",
      "proximo",
      "próximo",
    ],
    phrases: ["proximo passo", "próximo passo", "para que serve minha conta"],
  },
  {
    id: "connected-account",
    question: "Como funciona a conta conectada?",
    answer:
      "A conta conectada permite que o OpenCred use dados financeiros autorizados para entender entradas recorrentes, estabilidade e comportamento da conta. Isso melhora o contexto da análise, mas a decisão ainda considera outros fatores.",
    contexts: ["home", "account", "request", "analysis", "global"],
    nextQuestions: ["score", "consent", "privacy"],
    keywords: [
      "conta",
      "conectada",
      "conectar",
      "financeira",
      "banco",
      "bancarios",
      "bancários",
      "autorizacao",
      "autorização",
      "entradas",
    ],
    phrases: [
      "minha conta conectada serve pra que",
      "para que serve conectar",
      "dados bancarios",
      "dados bancários",
    ],
    followUpAnswer:
      "A conta conectada ajuda a dar contexto: frequência de entradas, estabilidade e sinais financeiros autorizados. Se ela não estiver conectada, você ainda pode seguir, mas a leitura tende a ficar menos completa.",
  },
  {
    id: "request-credit",
    question: "Como solicito crédito?",
    answer:
      "Você escolhe o valor desejado e segue para autorização da análise. O valor aprovado pode ser diferente do pedido, conforme score, estabilidade, segurança e histórico.",
    contexts: ["home", "request", "account", "global"],
    nextQuestions: ["limit", "consent", "score"],
    keywords: [
      "pedir",
      "solicitar",
      "emprestimo",
      "empréstimo",
      "credito",
      "crédito",
      "valor",
      "continuar",
    ],
    phrases: [
      "pedir credito",
      "pedir crédito",
      "solicitar emprestimo",
      "solicitar empréstimo",
      "valor desejado",
      "continuar analise",
    ],
  },
  {
    id: "score",
    question: "Como funciona meu score?",
    answer:
      "Seu score é uma leitura de risco e capacidade de pagamento. Ele combina sinais financeiros autorizados, estabilidade do fluxo, consistência do perfil e histórico, apoiando a decisão sem ser o único fator.",
    contexts: ["home", "account", "request", "analysis", "result", "admin", "global"],
    nextQuestions: ["limit", "security", "consent"],
    keywords: [
      "score",
      "pontuacao",
      "pontuação",
      "analise",
      "análise",
      "calcula",
      "calculo",
      "cálculo",
      "subir",
      "capacidade",
      "estabilidade",
    ],
    phrases: ["como calcula", "como subir score", "o que e score", "o que é score"],
    followUpAnswer:
      "Pense no score como um resumo dos sinais disponíveis no momento da análise. Ele ajuda a estimar risco, capacidade e consistência, mas não é uma promessa de aprovação nem revela uma fórmula fixa.",
  },
  {
    id: "consent",
    question: "Por que preciso autorizar a análise?",
    answer:
      "A autorização define quais dados podem ser usados naquela solicitação. Sem consentimento, a análise não avança porque o OpenCred prioriza transparência e controle do usuário.",
    contexts: ["request", "analysis", "account", "global"],
    nextQuestions: ["connected-account", "score", "privacy"],
    keywords: [
      "autorizar",
      "autorizacao",
      "autorização",
      "consentimento",
      "dados",
      "escopos",
      "permitir",
    ],
    phrases: ["por que preciso autorizar", "preciso autorizar", "autorizar analise"],
  },
  {
    id: "limit",
    question: "Por que meu limite pode ser menor?",
    answer:
      "Seu limite é o valor máximo que o OpenCred pode liberar naquele momento. Ele depende da análise financeira, do nível de confiança e do histórico de pagamentos. Na primeira concessão, pode ser menor para reduzir risco e evoluir conforme o relacionamento melhora.",
    contexts: ["home", "request", "analysis", "result", "account", "global"],
    nextQuestions: ["increase-limit", "progressive-credit", "score"],
    keywords: [
      "limite",
      "baixo",
      "menor",
      "menos",
      "valor",
      "aprovado",
      "solicitado",
      "reduzido",
      "veio",
    ],
    phrases: [
      "pq meu limite veio baixo",
      "porque aprovou menos",
      "aprovou menos",
      "limite veio baixo",
      "valor aprovado menor",
    ],
    followUpAnswer:
      "O limite olha para o momento atual do relacionamento. Se os sinais ainda são novos, o OpenCred pode começar com exposição menor; depois, pagamentos em dia e dados consistentes ajudam novas ofertas a ficarem mais fortes.",
  },
  {
    id: "progressive-credit",
    question: "O que é crédito progressivo?",
    answer:
      "Crédito progressivo é a evolução por ciclos. O relacionamento começa com exposição controlada e pode crescer conforme histórico, pagamento e risco permanecem saudáveis.",
    contexts: ["home", "account", "request", "result", "loan", "global"],
    nextQuestions: ["increase-limit", "after-payment", "limit"],
    keywords: [
      "progressivo",
      "credito",
      "crédito",
      "confianca",
      "confiança",
      "ciclo",
      "relacionamento",
      "nivel",
      "nível",
    ],
    phrases: [
      "credito progressivo",
      "crédito progressivo",
      "nivel de confianca",
      "nível de confiança",
      "proxima oferta",
      "próxima oferta",
    ],
  },
  {
    id: "increase-limit",
    question: "Como aumento meu limite?",
    answer:
      "Para aumentar seu limite, mantenha dados atualizados, conecte sua conta financeira, conclua ciclos em dia e solicite novo crédito quando estiver elegível. Toda nova oferta passa por análise.",
    contexts: ["account", "result", "loan", "home", "global"],
    nextQuestions: ["connected-account", "after-payment", "progressive-credit"],
    keywords: [
      "aumentar",
      "limite",
      "crescer",
      "evoluir",
      "melhorar",
      "subir",
      "confianca",
      "confiança",
    ],
    phrases: ["como aumento meu limite", "como subir limite", "quero limite maior"],
  },
  {
    id: "result-decision",
    question: "Por que recebi essa decisão?",
    answer:
      "A decisão considera score, capacidade, estabilidade, segurança e histórico. No resultado, os principais fatores aparecem em linguagem clara para você entender o motivo.",
    contexts: ["result", "admin", "global"],
    nextQuestions: ["explainability", "limit", "review"],
    keywords: [
      "aprovado",
      "negado",
      "decisao",
      "decisão",
      "resultado",
      "motivo",
      "fatores",
      "reasons",
      "porque",
      "pq",
    ],
    phrases: [
      "fui negado pq",
      "por que recebi essa decisao",
      "por que recebi essa decisão",
      "aprovado com limite menor",
    ],
  },
  {
    id: "security",
    question: "O que é análise de segurança?",
    answer:
      "A análise de segurança verifica consistência e risco antes da decisão. Ela protege o usuário e a operação, sem revelar critérios internos que poderiam comprometer a segurança.",
    contexts: ["analysis", "result", "admin", "home", "global"],
    nextQuestions: ["review", "decision", "privacy"],
    keywords: [
      "seguranca",
      "segurança",
      "fraude",
      "risco",
      "protecao",
      "proteção",
      "antifraude",
      "incomum",
      "seguro",
    ],
    phrases: [
      "isso e seguro",
      "isso é seguro",
      "tem fraude",
      "atividade incomum",
      "revisao por seguranca",
      "revisão por segurança",
    ],
    followUpAnswer:
      "Ela procura inconsistências e sinais de risco em alto nível. Quando algo precisa de cuidado, a solicitação pode ir para revisão, mas o OpenCred não mostra regras sensíveis que possam enfraquecer a proteção.",
  },
  {
    id: "review",
    question: "Por que pode ir para revisão?",
    answer:
      "A revisão acontece quando a solicitação precisa de leitura adicional, por exemplo por inconsistência, risco elevado ou informação insuficiente. Ela evita decisões precipitadas.",
    contexts: ["analysis", "result", "admin", "global"],
    nextQuestions: ["security", "decision", "explainability"],
    keywords: [
      "revisao",
      "revisão",
      "manual",
      "adicional",
      "pendente",
      "inconsistencia",
      "inconsistência",
      "analise",
      "análise",
    ],
    phrases: [
      "meu credito ta em analise",
      "meu crédito está em análise",
      "em revisao",
      "em revisão",
    ],
  },
  {
    id: "decision",
    question: "O que é decisão automática?",
    answer:
      "É uma decisão tomada quando os sinais disponíveis são suficientes para concluir a análise. Quando não são, o fluxo pode indicar revisão adicional.",
    contexts: ["analysis", "result", "admin", "global"],
    nextQuestions: ["review", "explainability", "security"],
    keywords: [
      "decisao",
      "decisão",
      "automatica",
      "automática",
      "aprovacao",
      "aprovação",
      "resultado",
    ],
    phrases: ["decisao automatica", "decisão automática"],
  },
  {
    id: "explainability",
    question: "Como leio a explicação da decisão?",
    answer:
      "A explicação resume os fatores principais da decisão em linguagem clara: capacidade, estabilidade, segurança, histórico e evolução possível do relacionamento.",
    contexts: ["result", "admin", "global"],
    nextQuestions: ["result-decision", "limit", "security"],
    keywords: [
      "explicacao",
      "explicação",
      "explicabilidade",
      "motivo",
      "razao",
      "razão",
      "fatores",
      "entender",
    ],
    phrases: ["nao entendi a decisao", "não entendi a decisão", "motivos da decisao"],
  },
  {
    id: "receive-credit",
    question: "Como recebo o crédito?",
    answer:
      "Quando há oferta disponível, você pode aceitar o recebimento e acompanhar o empréstimo ativo. Depois, a área da conta mostra o status e próximos passos.",
    contexts: ["result", "loan", "account", "global"],
    nextQuestions: ["after-payment", "payment", "increase-limit"],
    keywords: [
      "receber",
      "credito",
      "crédito",
      "liberar",
      "oferta",
      "emprestimo",
      "empréstimo",
      "ativo",
    ],
    phrases: ["receber credito", "receber crédito", "emprestimo ativo", "empréstimo ativo"],
  },
  {
    id: "payment",
    question: "Como pagar?",
    answer:
      "Para pagar, abra a tela do empréstimo ativo e use a ação de pagamento. Quando o pagamento é registrado, o ciclo é concluído e esse histórico pode apoiar futuras análises.",
    contexts: ["loan", "account", "global"],
    nextQuestions: ["after-payment", "increase-limit", "progressive-credit"],
    keywords: ["pagar", "pagamento", "quitar", "quitei", "paguei", "boleto"],
    phrases: ["como pagar", "quero quitar", "registrar pagamento"],
    followUpAnswer:
      "Depois do pagamento, a área da conta passa a refletir o ciclo concluído. Esse comportamento positivo pode fortalecer a próxima solicitação, mas cada nova oferta continua passando por análise.",
  },
  {
    id: "after-payment",
    question: "O que acontece depois do pagamento?",
    answer:
      "O ciclo é concluído, o histórico fica mais forte e o usuário pode iniciar uma nova solicitação quando estiver elegível. A próxima oferta continua sujeita à análise.",
    contexts: ["loan", "account", "home", "global"],
    nextQuestions: ["increase-limit", "progressive-credit", "request-credit"],
    keywords: [
      "pagamento",
      "pagar",
      "paguei",
      "depois",
      "ciclo",
      "novo",
      "emprestimo",
      "empréstimo",
    ],
    phrases: [
      "paguei e agora",
      "quero outro emprestimo",
      "quero outro empréstimo",
      "pedir novo credito",
      "pedir novo crédito",
    ],
  },
  {
    id: "privacy",
    question: "Como o OpenCred usa meus dados?",
    answer:
      "O uso de dados depende de autorização. Eles apoiam análise, explicação da decisão e comunicação do ciclo, sempre com foco em clareza para o usuário.",
    contexts: ["home", "account", "request", "analysis", "result", "global"],
    nextQuestions: ["consent", "connected-account", "security"],
    keywords: [
      "dados",
      "privacidade",
      "consentimento",
      "autorizacao",
      "autorização",
      "email",
      "comunicacao",
      "comunicação",
      "onde",
    ],
    phrases: ["meus dados ficam onde", "meus dados", "dados ficam onde", "privacidade", "email"],
  },
  {
    id: "admin-audit",
    question: "Como o admin acompanha o ciclo?",
    answer:
      "O admin reúne status da solicitação, decisão, oferta, empréstimo, pagamento, comunicação e auditoria. A visão ajuda a entender o ciclo sem expor regras sensíveis.",
    contexts: ["admin"],
    nextQuestions: ["security", "score", "result-decision"],
    keywords: [
      "admin",
      "auditoria",
      "operacao",
      "operação",
      "status",
      "acompanhar",
      "solicitacoes",
      "solicitações",
      "monitoramento",
      "indicadores",
    ],
    phrases: ["analise operacional", "análise operacional", "fraud score", "indicadores externos"],
  },
]

export function getAssistantContext(pathname: string): AssistantContext {
  if (pathname.startsWith("/admin")) {
    return "admin"
  }

  if (pathname.startsWith("/minha-conta")) {
    return "account"
  }

  if (pathname.startsWith("/solicitacao") || pathname.startsWith("/consentimento")) {
    return "request"
  }

  if (pathname.startsWith("/analise")) {
    return "analysis"
  }

  if (pathname.startsWith("/resultado")) {
    return "result"
  }

  if (pathname.startsWith("/emprestimo")) {
    return "loan"
  }

  return "home"
}

export function getContextualQuestions(context: AssistantContext) {
  const preferredIds = CONTEXT_PRIORITIES[context] ?? CONTEXT_PRIORITIES.global
  const preferredItems = preferredIds
    .map((id) => getAnswerById(id))
    .filter((item): item is AssistantAnswer => Boolean(item))
  const exactMatches = OPEN_CRED_AI_KNOWLEDGE.filter((item) =>
    item.contexts.includes(context)
  )
  const globalMatches = OPEN_CRED_AI_KNOWLEDGE.filter((item) =>
    item.contexts.includes("global")
  )
  const uniqueItems = [...preferredItems, ...exactMatches, ...globalMatches].filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.id === item.id) === index
  )

  return uniqueItems.slice(0, context === "admin" ? 8 : 7)
}

export function getAnswerById(id: string) {
  return OPEN_CRED_AI_KNOWLEDGE.find((item) => item.id === id) ?? null
}

export function findAssistantAnswer(
  question: string,
  context: AssistantContext
) {
  return resolveAssistantResponse(question, context).matchedAnswer
}

export function resolveAssistantResponse(
  question: string,
  context: AssistantContext,
  previousIntentId?: string | null
): AssistantResolution {
  const tokens = tokenize(question)
  const normalizedQuestion = normalize(question)

  if (previousIntentId && isFollowUpQuestion(normalizedQuestion, tokens)) {
    const previousAnswer = getAnswerById(previousIntentId)

    if (previousAnswer) {
      return {
        answer: previousAnswer.followUpAnswer ?? previousAnswer.answer,
        matchedAnswer: previousAnswer,
        suggestions: getSuggestedAnswers(previousAnswer.nextQuestions),
        usedPreviousIntent: true,
      }
    }
  }

  if (isNonsense(question, tokens)) {
    return buildFallbackResolution("nonsense")
  }

  const directMatch = resolveDirectIntent(tokens, normalizedQuestion)

  if (directMatch) {
    return {
      answer: directMatch.answer,
      matchedAnswer: directMatch,
      suggestions: getSuggestedAnswers(directMatch.nextQuestions),
    }
  }

  const candidates = buildCandidatePool(context)
  const scoredCandidates = candidates
    .map((candidate) => ({
      candidate,
      score: scoreAnswer(candidate, tokens, question, context),
    }))
    .toSorted((a, b) => b.score - a.score)

  const bestMatch = scoredCandidates[0]

  if (bestMatch && bestMatch.score >= 4) {
    return {
      answer: bestMatch.candidate.answer,
      matchedAnswer: bestMatch.candidate,
      suggestions: getSuggestedAnswers(bestMatch.candidate.nextQuestions),
    }
  }

  return buildFallbackResolution(detectFallbackType(tokens))
}

function buildCandidatePool(context: AssistantContext) {
  return [
    ...getContextualQuestions(context),
    ...OPEN_CRED_AI_KNOWLEDGE,
  ].filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.id === item.id) === index
  )
}

function buildFallbackResolution(
  fallbackType: AssistantFallbackType
): AssistantResolution {
  const fallback = FALLBACKS[fallbackType]

  return {
    answer: fallback.answer,
    matchedAnswer: null,
    suggestions: getSuggestedAnswers(fallback.nextQuestions),
    fallbackType,
  }
}

function getSuggestedAnswers(ids: string[] | undefined) {
  return (ids ?? ["score", "limit", "connected-account"])
    .map((id) => getAnswerById(id))
    .filter((item): item is AssistantAnswer => Boolean(item))
    .slice(0, 4)
}

function resolveDirectIntent(tokens: string[], normalizedQuestion: string) {
  const directId =
    DIRECT_INTENT_PHRASES.find((item) => normalizedQuestion.includes(item.phrase))
      ?.id ?? (tokens.length <= 2 ? DIRECT_INTENT_BY_TOKEN[tokens[0]] : undefined)

  return directId ? getAnswerById(directId) : null
}

function scoreAnswer(
  answer: AssistantAnswer,
  tokens: string[],
  rawQuestion: string,
  context: AssistantContext
) {
  const searchableText = tokenize(
    [
      answer.id,
      answer.question,
      answer.answer,
      ...(answer.keywords ?? []),
      ...(answer.phrases ?? []),
    ].join(" ")
  )
  const searchableSet = new Set(searchableText)
  const normalizedQuestion = normalize(rawQuestion)
  const phraseScore = (answer.phrases ?? []).reduce(
    (score, phrase) =>
      normalizedQuestion.includes(normalize(phrase)) ? score + 5 : score,
    0
  )
  const tokenScore = tokens.reduce((score, token) => {
    if (searchableSet.has(token)) {
      return score + 2
    }

    const hasFuzzyMatch = searchableText.some((candidate) =>
      isCloseToken(token, candidate)
    )

    return hasFuzzyMatch ? score + 1 : score
  }, 0)
  const contextScore = answer.contexts.includes(context) ? 1 : 0

  return phraseScore + tokenScore + contextScore
}

function detectFallbackType(tokens: string[]): AssistantFallbackType {
  if (
    hasAnyToken(tokens, [
      "credito",
      "crédito",
      "limite",
      "score",
      "analise",
      "análise",
      "negado",
      "aprovado",
    ])
  ) {
    return "credit"
  }

  if (hasAnyToken(tokens, ["pagar", "pagamento", "paguei", "quitar", "emprestimo", "empréstimo"])) {
    return "payment"
  }

  if (hasAnyToken(tokens, ["seguranca", "segurança", "fraude", "risco", "seguro"])) {
    return "security"
  }

  if (hasAnyToken(tokens, ["dados", "privacidade", "consentimento", "email", "autorizacao", "autorização"])) {
    return "privacy"
  }

  return "general"
}

function hasAnyToken(tokens: string[], values: string[]) {
  const valueSet = new Set(values.map(normalize))

  return tokens.some((token) => valueSet.has(token))
}

function isFollowUpQuestion(normalizedQuestion: string, tokens: string[]) {
  return (
    FOLLOW_UP_PHRASES.some((phrase) => normalizedQuestion.includes(phrase)) ||
    tokens.length === 0
  )
}

function isNonsense(value: string, tokens: string[]) {
  const normalizedValue = normalize(value)

  if (!normalizedValue || /^[?!.]+$/.test(value.trim())) {
    return true
  }

  if (tokens.length === 0) {
    return false
  }

  if (tokens.length === 1 && NONSENSE_SHORTCUTS.has(tokens[0])) {
    return true
  }

  return tokens.length === 1 && /^[a-z]{6,}$/.test(tokens[0]) && !KNOWN_SHORTCUTS.has(tokens[0])
}

function tokenize(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .trim()
}

function isCloseToken(token: string, candidate: string) {
  if (token.length < 4 || candidate.length < 4) {
    return false
  }

  if (candidate.includes(token) || token.includes(candidate)) {
    return true
  }

  return levenshteinDistance(token, candidate) <= 1
}

function levenshteinDistance(left: string, right: string) {
  const distances = Array.from({ length: left.length + 1 }, (_, index) => index)

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previousDiagonal = distances[0]
    distances[0] = rightIndex

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const previousDistance = distances[leftIndex]
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      distances[leftIndex] = Math.min(
        distances[leftIndex] + 1,
        distances[leftIndex - 1] + 1,
        previousDiagonal + cost
      )
      previousDiagonal = previousDistance
    }
  }

  return distances[left.length]
}

const CONTEXT_PRIORITIES: Record<AssistantContext, string[]> = {
  home: ["signup", "product-flow", "connected-account", "score", "limit"],
  account: ["increase-limit", "connected-account", "after-payment", "progressive-credit"],
  request: ["request-credit", "consent", "limit", "score"],
  analysis: ["score", "security", "review", "decision"],
  result: ["result-decision", "explainability", "limit", "receive-credit"],
  loan: ["payment", "after-payment", "increase-limit", "progressive-credit"],
  admin: ["admin-audit", "security", "score", "result-decision"],
  global: ["signup", "product-flow", "score", "limit", "connected-account"],
}

const DIRECT_INTENT_BY_TOKEN: Record<string, string> = {
  limite: "limit",
  score: "score",
  conta: "connected-account",
  cadastro: "signup",
  pagamento: "payment",
  pagar: "payment",
  emprestimo: "receive-credit",
  empréstimo: "receive-credit",
  seguranca: "security",
  segurança: "security",
  fraude: "security",
  revisao: "review",
  revisão: "review",
  resultado: "result-decision",
}

const DIRECT_INTENT_PHRASES = [
  { phrase: "como abro uma conta", id: "signup" },
  { phrase: "abrir conta", id: "signup" },
  { phrase: "criar conta", id: "signup" },
  { phrase: "fazer cadastro", id: "signup" },
  { phrase: "me cadastrar", id: "signup" },
  { phrase: "como comeco", id: "signup" },
  { phrase: "como começo", id: "signup" },
  { phrase: "onde comeco", id: "signup" },
  { phrase: "onde começo", id: "signup" },
]

const FOLLOW_UP_PHRASES = [
  "me explique",
  "me explica",
  "explica",
  "como assim",
  "nao entendi",
  "não entendi",
  "fala mais",
  "detalha",
  "e agora",
  "oq isso quer dizer",
  "o que isso quer dizer",
]

const KNOWN_SHORTCUTS = new Set([
  "score",
  "limite",
  "credito",
  "crédito",
  "paguei",
  "pagar",
  "fraude",
  "dados",
  "conta",
  "cadastro",
  "pagamento",
  "emprestimo",
  "empréstimo",
  "seguranca",
  "segurança",
  "revisao",
  "revisão",
  "resultado",
])

const NONSENSE_SHORTCUTS = new Set(["teste"])

const STOP_WORDS = new Set([
  "como",
  "com",
  "que",
  "para",
  "por",
  "porque",
  "minha",
  "meu",
  "uma",
  "uns",
  "das",
  "dos",
  "depois",
  "isso",
  "esse",
  "essa",
  "sobre",
  "qual",
  "onde",
  "pra",
  "pro",
  "esta",
  "está",
  "voce",
  "você",
])
