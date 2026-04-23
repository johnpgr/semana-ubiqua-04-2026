"use client"

import { type ChangeEvent, useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CreditRequest } from "@/validation/credit-request"

import { createCreditRequest, type CreateCreditRequestState } from "./actions"

const CREATE_CREDIT_REQUEST_INITIAL_STATE: CreateCreditRequestState = {
  ok: false,
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

function formatEditableAmount(digits: string) {
  if (!digits) {
    return ""
  }

  return (Number(digits) / 100).toFixed(2).replace(".", ",")
}

function formatDisplayAmount(digits: string) {
  if (!digits) {
    return ""
  }

  return currencyFormatter.format(Number(digits) / 100)
}

export function CreditRequestForm() {
  const [state, formAction, isPending] = useActionState(
    createCreditRequest,
    CREATE_CREDIT_REQUEST_INITIAL_STATE
  )
  const [digits, setDigits] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const validation = CreditRequest.safeParse({
    requested_amount: digits,
  })
  const clientError = validation.success
    ? undefined
    : validation.error.flatten().fieldErrors.requested_amount?.[0]
  const requestedAmountError =
    (isTouched ? clientError : undefined) ??
    state.fieldErrors?.requested_amount?.[0]

  function handleSubmit() {
    setIsTouched(true)
  }

  function handleRequestedAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setDigits(event.target.value.replace(/\D/g, ""))
  }

  function handleRequestedAmountFocus() {
    setIsFocused(true)
  }

  function handleRequestedAmountBlur() {
    setIsFocused(false)
    setIsTouched(true)
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="requested_amount" value={digits} />
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="requested_amount_display"
          >
            Valor solicitado
          </label>
          <Input
            id="requested_amount_display"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={
              isFocused
                ? formatEditableAmount(digits)
                : formatDisplayAmount(digits)
            }
            onChange={handleRequestedAmountChange}
            onFocus={handleRequestedAmountFocus}
            onBlur={handleRequestedAmountBlur}
            aria-invalid={requestedAmountError ? true : undefined}
          />
          {requestedAmountError ? (
            <p className="text-sm text-destructive">{requestedAmountError}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            O valor é armazenado como número e segue para consentimento na etapa
            seguinte.
          </p>
        </div>
        {state.formError ? (
          <p className="text-sm text-destructive">{state.formError}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Criando solicitação..." : "Ir para consentimento"}
        </Button>
      </CardFooter>
    </form>
  )
}
