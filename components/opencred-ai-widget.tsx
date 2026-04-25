"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { usePathname } from "next/navigation"
import {
  BotIcon,
  MessageCircleIcon,
  Minimize2Icon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  getAnswerById,
  getAssistantContext,
  getContextualQuestions,
  OPEN_CRED_AI_FALLBACK,
  OPEN_CRED_AI_WELCOME,
  resolveAssistantResponse,
  type AssistantAnswer,
} from "@/lib/assistant/knowledge"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  author: "assistant" | "user"
  text: string
}

const MAX_MESSAGES = 8
const MIN_RESPONSE_DELAY_MS = 1_500
const RESPONSE_DELAY_VARIANCE_MS = 700

export function OpenCredAiWidget() {
  const pathname = usePathname()
  const context = getAssistantContext(pathname)
  const questions = getContextualQuestions(context)
  const [isOpen, setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [manualQuestion, setManualQuestion] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastIntentId, setLastIntentId] = useState<string | null>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<AssistantAnswer[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      author: "assistant",
      text: OPEN_CRED_AI_WELCOME,
    },
  ])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages, isTyping])

  const nextQuestions = selectedId
    ? getAnswerById(selectedId)?.nextQuestions
        ?.map((id) => getAnswerById(id))
        .filter((item): item is AssistantAnswer => Boolean(item)) ?? []
    : []
  const visibleQuestions =
    suggestedQuestions.length > 0
      ? suggestedQuestions
      : nextQuestions.length > 0
        ? nextQuestions
        : questions

  function handleQuestion(answer: AssistantAnswer) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setSelectedId(answer.id)
    setLastIntentId(answer.id)
    setSuggestedQuestions([])
    setIsTyping(true)
    setMessages((currentMessages) =>
      trimMessages([
        ...currentMessages,
        {
          id: `user-${answer.id}-${Date.now()}`,
          author: "user",
          text: answer.question,
        },
      ])
    )

    timeoutRef.current = setTimeout(() => {
      setMessages((currentMessages) =>
        trimMessages([
          ...currentMessages,
          {
            id: `assistant-${answer.id}-${Date.now()}`,
            author: "assistant",
            text: answer.answer,
          },
        ])
      )
      setIsTyping(false)
      setSuggestedQuestions(
        answer.nextQuestions
          ?.map((id) => getAnswerById(id))
          .filter((item): item is AssistantAnswer => Boolean(item))
          .slice(0, 4) ?? []
      )
    }, getResponseDelay())
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuestion = manualQuestion.trim()

    if (!trimmedQuestion || isTyping) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const resolution = resolveAssistantResponse(
      trimmedQuestion,
      context,
      lastIntentId
    )
    setManualQuestion("")
    setSelectedId(resolution.matchedAnswer?.id ?? null)
    if (resolution.matchedAnswer) {
      setLastIntentId(resolution.matchedAnswer.id)
    }
    setSuggestedQuestions([])
    setIsTyping(true)
    setMessages((currentMessages) =>
      trimMessages([
        ...currentMessages,
        {
          id: `user-manual-${Date.now()}`,
          author: "user",
          text: trimmedQuestion,
        },
      ])
    )

    timeoutRef.current = setTimeout(() => {
      setMessages((currentMessages) =>
        trimMessages([
          ...currentMessages,
          {
            id: `assistant-manual-${Date.now()}`,
            author: "assistant",
            text: resolution.answer,
          },
        ])
      )
      setIsTyping(false)
      setSuggestedQuestions(resolution.suggestions)
    }, getResponseDelay())
  }

  function handleFallback() {
    setIsTyping(true)
    timeoutRef.current = setTimeout(() => {
      setMessages((currentMessages) =>
        trimMessages([
          ...currentMessages,
          {
            id: `assistant-fallback-${Date.now()}`,
            author: "assistant",
            text: OPEN_CRED_AI_FALLBACK,
          },
        ])
      )
      setIsTyping(false)
    }, getResponseDelay())
  }

  return (
    <div className="fixed right-3 bottom-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:right-5 sm:bottom-5">
      {isOpen ? (
        <Card className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden border-border/80 bg-background/95 shadow-2xl shadow-foreground/10 backdrop-blur">
          <CardHeader className="gap-3 border-b bg-muted/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <BotIcon data-icon="inline-start" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    OpenCred AI
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" />
                    Online
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Minimizar OpenCred AI"
                onClick={() => setIsOpen(false)}
              >
                <Minimize2Icon data-icon="icon-only" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex max-h-[min(35rem,calc(100svh-8rem))] flex-col gap-4 p-4">
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isTyping ? <TypingBubble /> : null}
              <div ref={messagesEndRef} />
            </div>

            <Separator />

            <form onSubmit={handleManualSubmit}>
              <InputGroup>
                <InputGroupInput
                  name="opencred-ai-question"
                  value={manualQuestion}
                  onChange={(event) => setManualQuestion(event.target.value)}
                  placeholder="Digite sua pergunta"
                  autoComplete="off"
                  disabled={isTyping}
                  aria-label="Digite sua pergunta para o OpenCred AI"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="submit"
                    size="icon-xs"
                    aria-label="Enviar pergunta"
                    disabled={!manualQuestion.trim() || isTyping}
                  >
                    <SendIcon data-icon="icon-only" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="w-fit">
                  Perguntas rápidas
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFallback}
                  disabled={isTyping}
                >
                  <SparklesIcon data-icon="inline-start" />
                  Orientar
                </Button>
              </div>
              <div className="grid gap-2">
                {visibleQuestions.map((question) => (
                  <Button
                    key={question.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto justify-start whitespace-normal py-2 text-left"
                    disabled={isTyping}
                    onClick={() => handleQuestion(question)}
                  >
                    <SendIcon data-icon="inline-start" />
                    {question.question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        size="lg"
        className={cn(
          "h-12 rounded-full px-4 shadow-xl shadow-foreground/15",
          isOpen && "hidden"
        )}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir OpenCred AI"
      >
        <MessageCircleIcon data-icon="inline-start" />
        <span className="hidden sm:inline">OpenCred AI</span>
        <span className="sm:hidden">Ajuda</span>
        <span className="ml-1 size-2 rounded-full bg-primary-foreground/85" />
      </Button>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.author === "assistant"

  return (
    <div
      className={cn(
        "flex gap-2",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant ? (
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <BotIcon data-icon="inline-start" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6",
          isAssistant
            ? "rounded-tl-sm bg-muted text-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground"
        )}
      >
        {message.text}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex justify-start gap-2">
      <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <BotIcon data-icon="inline-start" />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Spinner data-icon="inline-start" />
        Digitando...
      </div>
    </div>
  )
}

function trimMessages(messages: ChatMessage[]) {
  return messages.slice(-MAX_MESSAGES)
}

function getResponseDelay() {
  return MIN_RESPONSE_DELAY_MS + Math.round(Math.random() * RESPONSE_DELAY_VARIANCE_MS)
}
