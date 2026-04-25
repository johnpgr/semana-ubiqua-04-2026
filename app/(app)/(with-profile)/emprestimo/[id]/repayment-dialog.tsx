"use client"

import {
  AlertTriangleIcon,
  BanknoteIcon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Loan } from "@/lib/loans"

type RepaymentDialogProps = {
  loan: Loan
  formAction: (payload: FormData) => void
  isPending: boolean
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

function TriggerButton() {
  return (
    <Button type="button">
      <BanknoteIcon data-icon="inline-start" />
      Simular pagamento
    </Button>
  )
}

const repaymentTrigger = <TriggerButton />

export function RepaymentDialog({
  loan,
  formAction,
  isPending,
}: RepaymentDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={repaymentTrigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangleIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Confirmar pagamento simulado</AlertDialogTitle>
          <AlertDialogDescription>
            Você vai simular o pagamento de{" "}
            <strong>{currencyFormatter.format(loan.amount)}</strong> referente
            ao empréstimo ativo. Esta ação não movimenta dinheiro real, boleto,
            Pix ou cartão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction} className="w-full sm:w-auto">
            <input name="request_id" type="hidden" value={loan.requestId} />
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <BanknoteIcon data-icon="inline-start" />
              )}
              {isPending ? "Processando..." : "Confirmar pagamento simulado"}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
