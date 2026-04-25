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

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const repaymentTrigger = (
  <Button type="button">
    <BanknoteIcon data-icon="inline-start" />
    Registrar pagamento
  </Button>
)

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
          <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
          <AlertDialogDescription>
            Você vai registrar o pagamento de{" "}
            <strong>{currencyFormatter.format(loan.amount)}</strong> referente
            ao empréstimo ativo. Confira os dados antes de concluir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-muted-foreground">Valor a pagar</span>
            <strong>{currencyFormatter.format(loan.amount)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-muted-foreground">Vencimento</span>
            <strong>{fullDateFormatter.format(new Date(loan.dueAt))}</strong>
          </div>
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-muted-foreground">Conta financeira</span>
            <strong>{loan.destination}</strong>
          </div>
          <div className="py-1 text-muted-foreground">
            Ao confirmar, o pagamento será registrado, o empréstimo será concluído e seu relacionamento será atualizado para os próximos ciclos.
          </div>
        </div>
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
              {isPending ? "Processando..." : "Confirmar pagamento"}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


