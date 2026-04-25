"use client"

import Link from "next/link"
import { useActionState } from "react"
import {
  ArrowRightIcon,
  BanknoteIcon,
  FileTextIcon,
  GaugeIcon,
  LandmarkIcon,
  LockKeyholeIcon,
  MailCheckIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { runAnalysis, type RunAnalysisState } from "./actions"

const INITIAL_STATE: RunAnalysisState = {
  ok: false,
}

const analysisSteps = [
  {
    title: "Coleta de dados bancÃ¡rios autorizados",
    description: "Entradas recorrentes, saldo e comportamento autorizado.",
    Icon: LandmarkIcon,
  },
  {
    title: "Score financeiro",
    description: "Capacidade de pagamento e estabilidade do perfil.",
    Icon: GaugeIcon,
  },
  {
    title: "Sinais de fraude",
    description: "ConsistÃªncia cadastral e alertas de risco.",
    Icon: ShieldCheckIcon,
  },
  {
    title: "CrÃ©dito progressivo",
    description: "Primeiro limite conservador e evoluÃ§Ã£o futura.",
    Icon: BanknoteIcon,
  },
  {
    title: "Indicadores de parceiros",
    description: "Sinais externos externos para enriquecer a decisÃ£o.",
    Icon: LockKeyholeIcon,
  },
  {
    title: "ExplicaÃ§Ã£o da decisÃ£o",
    description: "Motivos compreensÃ­veis para o resultado final.",
    Icon: FileTextIcon,
  },
  {
    title: "ComunicaÃ§Ã£o oficial",
    description: "Resumo pronto para registro e envio ao usuÃ¡rio.",
    Icon: MailCheckIcon,
  },
]

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

type AnalysisStageCardProps = {
  consentGrantedAt: string
  requestId: string
  requestedAmount: number
}

export function AnalysisStageCard({
  consentGrantedAt,
  requestId,
  requestedAmount,
}: AnalysisStageCardProps) {
  const [state, formAction, isPending] = useActionState(
    runAnalysis,
    INITIAL_STATE
  )
  const hasError = Boolean(state.formError)
  const progressValue = isPending ? 88 : hasError ? 35 : 18
  const statusLabel = isPending
    ? "AnÃ¡lise em andamento"
    : hasError
      ? "AÃ§Ã£o necessÃ¡ria"
      : "Pronto para analisar"

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
      <Card className="border border-border/70 bg-background/90">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasError ? "destructive" : "secondary"}>
              Etapa visual
            </Badge>
            <Badge variant="outline">{statusLabel}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">
              Estamos preparando sua anÃ¡lise
            </CardTitle>
            <CardDescription className="max-w-2xl leading-6">
              O OpenCred usa os dados autorizados para preparar uma decisÃ£o de
              crÃ©dito clara, progressiva e explicÃ¡vel antes de mostrar o
              resultado.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {hasError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>NÃ£o foi possÃ­vel concluir a anÃ¡lise</AlertTitle>
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          <Progress value={progressValue}>
            <ProgressLabel>
              {isPending ? "Processando decisÃ£o" : "SequÃªncia de anÃ¡lise"}
            </ProgressLabel>
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {progressValue}%
            </span>
          </Progress>

          <div className="grid gap-3">
            {analysisSteps.map(({ description, Icon, title }, index) => {
              const isActive = isPending
              const isFirstIdle = !isPending && !hasError && index === 0

              return (
                <div
                  className={cn(
                    "grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border p-3 transition-colors",
                    isActive || isFirstIdle
                      ? "border-primary/25 bg-primary/5"
                      : "border-border/70 bg-muted/25"
                  )}
                  key={title}
                >
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      isActive || isFirstIdle
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground ring-1 ring-border"
                    )}
                  >
                    {isPending ? (
                      <Spinner className="size-4" />
                    ) : hasError ? (
                      <Icon className="size-4" />
                    ) : index === 0 ? (
                      <ArrowRightIcon className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="font-medium leading-5">{title}</div>
                    <p className="text-sm leading-5 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <form action={formAction} className="contents">
            <input name="request_id" type="hidden" value={requestId} />
            <Button
              className="w-full sm:w-auto"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Spinner />
                  Processando
                </>
              ) : hasError ? (
                <>
                  <RotateCcwIcon />
                  Tentar novamente
                </>
              ) : (
                <>
                  <ArrowRightIcon />
                  Processar anÃ¡lise
                </>
              )}
            </Button>
          </form>
          <Link
            className={buttonVariants({
              className: "w-full sm:w-auto",
              variant: "outline",
            })}
            href="/minha-conta"
          >
            Minha conta
          </Link>
          <Link
            className={buttonVariants({
              className: "w-full sm:w-auto",
              variant: "ghost",
            })}
            href="/solicitacao"
          >
            Voltar para solicitaÃ§Ã£o
          </Link>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="border border-border/70 bg-muted/40">
          <CardHeader className="gap-2">
            <CardTitle>Resumo seguro</CardTitle>
            <CardDescription className="leading-6">
              Consentimento registrado em{" "}
              <strong>
                {new Date(consentGrantedAt).toLocaleString("pt-BR")}
              </strong>
              . A anÃ¡lise usa somente dados financeiros e autorizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Valor solicitado</span>
              <strong>{currencyFormatter.format(requestedAmount)}</strong>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ConexÃ£o bancÃ¡ria</span>
              <Badge variant="outline">Autorizada</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Resultado</span>
              <Badge variant="secondary">ApÃ³s anÃ¡lise</Badge>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <LockKeyholeIcon />
          <AlertTitle>IntegraÃ§Ã£o protegida</AlertTitle>
          <AlertDescription>
            Esta etapa organiza a leitura visual do processo. A decisÃ£o
            continua sendo executada pelos mÃ³dulos internos jÃ¡ existentes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}



