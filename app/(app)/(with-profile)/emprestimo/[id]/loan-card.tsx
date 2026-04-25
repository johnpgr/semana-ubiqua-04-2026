"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  WalletIcon,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Loan, LoanStatus } from "@/lib/loans"
import { cn } from "@/lib/utils"

import {
  simulateLoanRepayment,
  type SimulateRepaymentState,
} from "./actions"
import { RepaymentDialog } from "./repayment-dialog"

type LoanCardProps = {
  loan: Loan
}

const INITIAL_STATE: SimulateRepaymentState = {
  ok: false,
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function LoanCard({ loan }: LoanCardProps) {
  const [state, formAction, isPending] = useActionState(
    simulateLoanRepayment,
    INITIAL_STATE
  )
  const [now] = useState(() => new Date())

  const isPaid = loan.status === "paid" || (state.ok && Boolean(state.data?.paidAt))
  const displayStatus: LoanStatus = isPaid ? "paid" : loan.status
  const effectivePaidAt =
    state.ok && state.data?.paidAt ? state.data.paidAt : loan.repaidAt
  const effectiveOnTime =
    state.ok && state.data ? state.data.onTime : loan.onTime
  const daysUntilDue = Math.ceil(
    (new Date(loan.dueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysOverdue = Math.abs(daysUntilDue)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[displayStatus]}>
              {STATUS_LABEL[displayStatus]}
            </Badge>
            <Badge variant="outline">Ativo</Badge>
          </div>
          <CardTitle className="text-2xl">
            {isPaid ? "Ciclo concluÃ­do" : "EmprÃ©stimo ativo"}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            {isPaid
              ? "O pagamento foi registrado. Sua confianÃ§a evoluiu para o prÃ³ximo ciclo."
              : "Acompanhe o valor, vencimento e monitoramento de risco desta simulaÃ§Ã£o."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {state.formError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Pagamento nÃ£o concluÃ­do</AlertTitle>
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          {isPaid ? (
            <Alert>
              <CheckCircle2Icon />
              <AlertTitle>Ciclo concluÃ­do â€” confianÃ§a evoluÃ­da</AlertTitle>
              <AlertDescription>
                O pagamento foi registrado e seu histÃ³rico foi atualizado.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <WalletIcon />
              <AlertTitle>CrÃ©dito em uso</AlertTitle>
              <AlertDescription>
                Acompanhe o contrato e use o botÃ£o abaixo para registrar o
                pagamento quando quiser.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">
                Valor liberado
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {currencyFormatter.format(loan.amount)}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">
                {isPaid ? "Pago em" : "Vencimento"}
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {isPaid && effectivePaidAt
                  ? dateFormatter.format(new Date(effectivePaidAt))
                  : dateFormatter.format(new Date(loan.dueAt))}
              </div>
            </div>
          </div>

          {!isPaid ? (
            <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {loan.status === "overdue"
                    ? `Vencido hÃ¡ ${daysOverdue} dia${daysOverdue > 1 ? "s" : ""}`
                    : `${daysUntilDue} dia${daysUntilDue !== 1 ? "s" : ""} atÃ© o vencimento`}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                O vencimento foi calculado como data de liberaÃ§Ã£o + 30 dias
                (regra operacional).
              </p>
            </div>
          ) : null}

          <div className="space-y-3 text-sm">
            <InfoRow
              label="Destino"
              value={loan.destination}
            />
            <Separator />
            <InfoRow
              label="Liberado em"
              value={fullDateFormatter.format(new Date(loan.disbursedAt))}
            />
            <Separator />
            <InfoRow
              label="Vencimento"
              value={fullDateFormatter.format(new Date(loan.dueAt))}
            />
            {isPaid && effectivePaidAt ? (
              <>
                <Separator />
                <InfoRow
                  label="Pagamento"
                  value={fullDateFormatter.format(new Date(effectivePaidAt))}
                />
                <Separator />
                <InfoRow
                  label="Em dia"
                  value={effectiveOnTime ? "Sim" : "NÃ£o"}
                />
              </>
            ) : null}
          </div>

          {!isPaid ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <RepaymentDialog
                loan={loan}
                formAction={formAction}
                isPending={isPending}
              />
              <Link
                href={`/resultado/${loan.requestId}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "justify-center"
                )}
              >
                Ver resultado da anÃ¡lise
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </div>
          ) : isPaid ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/solicitacao"
                className={cn(buttonVariants(), "justify-center")}
              >
                Pedir novo crÃ©dito
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href={`/resultado/${loan.requestId}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "justify-center"
                )}
              >
                Ver resultado da anÃ¡lise
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 self-start">
        <MonitoringStrip loan={loan} />

        <Card className="border-border/70 bg-muted/35">
          <CardHeader className="gap-2">
            <CardTitle>PrÃ³ximo passo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm leading-6">
            {isPaid ? (
              <>
                <JourneyPoint
                  icon={CheckCircle2Icon}
                  text="Ciclo concluÃ­do. Sua confianÃ§a foi atualizada e vocÃª pode solicitar novo crÃ©dito."
                />
                <JourneyPoint
                  icon={TrendingUpIcon}
                  text="Ciclos pagos em dia ampliam limite potencial nas prÃ³ximas anÃ¡lises."
                />
              </>
            ) : (
              <>
                <JourneyPoint
                  icon={WalletIcon}
                  text="Registre o pagamento quando quiser. O acompanhamento permanece registrado no OpenCred."
                />
                <JourneyPoint
                  icon={ShieldCheckIcon}
                  text="O monitoramento de risco continua como leitura, nÃ£o como cobranÃ§a."
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MonitoringStrip({ loan }: { loan: Loan }) {
  // For the product, monitoring is shown as a read-only strip based on loan state
  const riskLevel = loan.status === "overdue" ? "high" : loan.status === "paid" ? "low" : "moderate"
  const summary =
    loan.status === "paid"
      ? "Monitoramento enxerga ciclo concluÃ­do com comportamento positivo."
      : loan.status === "overdue"
        ? "Monitoramento aponta atraso identificado e recomenda atenÃ§Ã£o antes de nova concessÃ£o."
        : "Monitoramento mantÃ©m a relaÃ§Ã£o em observaÃ§Ã£o, sem liberar crescimento automÃ¡tico por enquanto."

  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={RISK_BADGE_VARIANT[riskLevel]}>
            {MONITORING_RISK_LABELS[riskLevel]}
          </Badge>
          <Badge variant="outline">Leitura de monitoramento</Badge>
        </div>
        <CardTitle>Monitoramento inicial de risco</CardTitle>
        <CardDescription className="text-sm leading-6">
          Leitura projetada no momento da concessÃ£o. Ã‰ uma leitura inicial de acompanhamento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="text-muted-foreground">Elegibilidade</div>
            <div className="mt-1 font-medium">
              {loan.status === "paid"
                ? "ElegÃ­vel para evoluÃ§Ã£o"
                : loan.status === "overdue"
                  ? "RevisÃ£o recomendada"
                  : "Congelada temporariamente"}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="text-muted-foreground">Limite futuro</div>
            <div className="mt-1 font-medium">
              {loan.status === "paid"
                ? "Manter e evoluir"
                : loan.status === "overdue"
                  ? "Reduzir exposiÃ§Ã£o"
                  : "Congelar crescimento"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JourneyPoint({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; "data-icon"?: string }>
  text: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
      <Icon data-icon="inline-start" className="shrink-0" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  )
}

const STATUS_BADGE_VARIANT: Record<LoanStatus, "default" | "secondary" | "destructive"> = {
  active: "secondary",
  paid: "default",
  overdue: "destructive",
}

const STATUS_LABEL: Record<LoanStatus, string> = {
  active: "Ativo",
  paid: "Pago",
  overdue: "Vencido",
}

const RISK_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  critical: "destructive",
  high: "destructive",
  moderate: "outline",
  low: "secondary",
}

const MONITORING_RISK_LABELS: Record<string, string> = {
  critical: "Risco crÃ­tico",
  high: "Risco alto",
  moderate: "Risco moderado",
  low: "Risco baixo",
}



