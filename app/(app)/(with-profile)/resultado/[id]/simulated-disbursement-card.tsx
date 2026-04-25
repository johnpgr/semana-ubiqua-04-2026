"use client"

import Link from "next/link"
import { useActionState } from "react"
import {
  BanknoteIcon,
  CheckCircle2Icon,
  LandmarkIcon,
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
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import {
  simulateCreditDisbursement,
  type SimulateDisbursementState,
} from "./actions"

type CreditDecision = "approved" | "approved_reduced" | "further_review" | "denied"

type DisbursementSnapshot = {
  approvedAmount: number
  destination: string
  disbursedAt: string
  status: "active"
}

type SimulatedDisbursementCardProps = {
  approvedAmount: number | null
  decision: CreditDecision | null
  initialDisbursement: DisbursementSnapshot | null
  requestId: string
  requestedAmount: number
}

const INITIAL_STATE: SimulateDisbursementState = {
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
  hour: "2-digit",
  minute: "2-digit",
})

export function SimulatedDisbursementCard({
  approvedAmount,
  decision,
  initialDisbursement,
  requestId,
  requestedAmount,
}: SimulatedDisbursementCardProps) {
  const [state, formAction, isPending] = useActionState(
    simulateCreditDisbursement,
    INITIAL_STATE
  )
  const isEligible = decision === "approved" || decision === "approved_reduced"
  const disbursement = state.ok ? state.data : initialDisbursement

  if (!isEligible || !approvedAmount) {
    return null
  }

  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={disbursement ? "default" : "secondary"}>
            {disbursement ? "Crédito liberado" : "Oferta disponível"}
          </Badge>
          <Badge variant="outline">Ativo</Badge>
        </div>
        <CardTitle>Recebimento de crédito</CardTitle>
        <CardDescription>
          Aceite a oferta para receber o crédito na conta financeira.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {state.formError ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Liberação não concluída</AlertTitle>
            <AlertDescription>{state.formError}</AlertDescription>
          </Alert>
        ) : null}

        {disbursement ? (
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Crédito liberado</AlertTitle>
            <AlertDescription>
              O valor foi marcado como recebido e agora aparece como empréstimo
              ativo na sua área do usuário.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <BanknoteIcon />
            <AlertTitle>Oferta pronta para recebimento</AlertTitle>
            <AlertDescription>
              Esta ação registra o recebimento do crédito no OpenCred.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 text-sm">
          <InfoRow
            label="Valor solicitado"
            value={currencyFormatter.format(requestedAmount)}
          />
          <Separator />
          <InfoRow
            label="Valor para receber"
            value={currencyFormatter.format(approvedAmount)}
          />
          <Separator />
          <InfoRow
            label="Destino"
            value={disbursement?.destination ?? "Banco Horizonte"}
          />
          {disbursement ? (
            <>
              <Separator />
              <InfoRow
                label="Status"
                value="Empréstimo ativo"
              />
              <Separator />
              <InfoRow
                label="Liberado em"
                value={dateFormatter.format(new Date(disbursement.disbursedAt))}
              />
            </>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {disbursement ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LandmarkIcon data-icon="inline-start" />
              Acompanhe o ciclo em Minha conta ou abra o empréstimo ativo.
            </div>
            <Link
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-center sm:w-auto"
              )}
              href={`/emprestimo/${requestId}`}
            >
              Abrir empréstimo ativo
            </Link>
          </>
        ) : (
          <form action={formAction} className="w-full sm:w-auto">
            <input name="request_id" type="hidden" value={requestId} />
            <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <BanknoteIcon data-icon="inline-start" />
              )}
              {isPending ? "Liberando..." : "Receber crédito"}
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
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



