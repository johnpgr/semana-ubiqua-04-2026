import assert from "node:assert/strict"

import { resolveAssistantResponse } from "../../lib/assistant/knowledge"

type NamedTest = {
  name: string
  run: () => void
}

export const openCredAiTests: NamedTest[] = [
  {
    name: "OpenCred AI recognizes informal low-limit questions",
    run: () => {
      const response = resolveAssistantResponse(
        "pq meu limite veio baixo?",
        "result"
      )

      assert.equal(response.matchedAnswer?.id, "limit")
      assert.ok(response.suggestions.length > 0)
    },
  },
  {
    name: "OpenCred AI recognizes payment questions",
    run: () => {
      const response = resolveAssistantResponse("como pagar", "loan")

      assert.equal(response.matchedAnswer?.id, "payment")
      assert.ok(response.suggestions.some((item) => item.id === "after-payment"))
    },
  },
  {
    name: "OpenCred AI recognizes privacy questions",
    run: () => {
      const response = resolveAssistantResponse(
        "meus dados ficam onde",
        "account"
      )

      assert.equal(response.matchedAnswer?.id, "privacy")
      assert.ok(response.answer.includes("autorização"))
    },
  },
  {
    name: "OpenCred AI answers security questions without sensitive details",
    run: () => {
      const response = resolveAssistantResponse("tem fraude?", "result")

      assert.equal(response.matchedAnswer?.id, "security")
      assert.ok(!response.answer.toLowerCase().includes("burlar"))
    },
  },
  {
    name: "OpenCred AI treats random text as nonsense",
    run: () => {
      const response = resolveAssistantResponse("asdfgh", "home")

      assert.equal(response.matchedAnswer, null)
      assert.equal(response.fallbackType, "nonsense")
    },
  },
  {
    name: "OpenCred AI treats test-only text as out of scope",
    run: () => {
      const response = resolveAssistantResponse("teste", "home")

      assert.equal(response.matchedAnswer, null)
      assert.equal(response.fallbackType, "nonsense")
    },
  },
  {
    name: "OpenCred AI recognizes typos and abbreviations",
    run: () => {
      const response = resolveAssistantResponse("quero outro emprestimo", "loan")

      assert.equal(response.matchedAnswer?.id, "after-payment")
    },
  },
  {
    name: "OpenCred AI maps account opening to signup",
    run: () => {
      const response = resolveAssistantResponse("como abro uma conta", "home")

      assert.equal(response.matchedAnswer?.id, "signup")
      assert.equal(response.fallbackType, undefined)
      assert.ok(response.answer.includes("complete seu cadastro"))
    },
  },
  {
    name: "OpenCred AI answers short limit intent directly",
    run: () => {
      const response = resolveAssistantResponse("limite", "account")

      assert.equal(response.matchedAnswer?.id, "limit")
      assert.equal(response.fallbackType, undefined)
      assert.ok(response.answer.includes("valor máximo"))
    },
  },
  {
    name: "OpenCred AI uses previous limit intent for vague follow-up",
    run: () => {
      const response = resolveAssistantResponse("me explique", "account", "limit")

      assert.equal(response.matchedAnswer?.id, "limit")
      assert.equal(response.usedPreviousIntent, true)
      assert.ok(response.answer.includes("exposição menor"))
    },
  },
  {
    name: "OpenCred AI uses previous score intent for vague follow-up",
    run: () => {
      const response = resolveAssistantResponse("como assim", "result", "score")

      assert.equal(response.matchedAnswer?.id, "score")
      assert.equal(response.usedPreviousIntent, true)
      assert.ok(response.answer.includes("resumo dos sinais"))
    },
  },
  {
    name: "OpenCred AI answers short payment intent directly",
    run: () => {
      const response = resolveAssistantResponse("pagamento", "loan")

      assert.equal(response.matchedAnswer?.id, "payment")
      assert.equal(response.fallbackType, undefined)
      assert.ok(response.answer.includes("empréstimo ativo"))
    },
  },
]
