"use client"

import { useActionState, useReducer } from "react"

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

type CreditRequestFormState = {
  digits: string
  isFocused: boolean
  isTouched: boolean
}

type CreditRequestFormAction =
  | React.ChangeEvent<HTMLInputElement>
  | React.FocusEvent<HTMLInputElement>
  | React.FormEvent<HTMLFormElement>

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

function creditRequestFormReducer(
  state: CreditRequestFormState,
  action: CreditRequestFormAction
): CreditRequestFormState {
  if (action.type === "submit") {
    return { ...state, isTouched: true }
  }

  const target = action.target
  if (!(target instanceof HTMLInputElement)) {
    return state
  }

  if (action.type === "change") {
    return {
      ...state,
      digits: target.value.replace(/\D/g, ""),
    }
  }

  if (action.type === "focus") {
    return {
      ...state,
      isFocused: true,
    }
  }

  if (action.type === "blur") {
    return {
      ...state,
      isFocused: false,
      isTouched: true,
    }
  }

  return state
}

export function CreditRequestForm() {
  const [state, formAction, isPending] = useActionState(
    createCreditRequest,
    CREATE_CREDIT_REQUEST_INITIAL_STATE
  )
  const [{ digits, isFocused, isTouched }, dispatch] = useReducer(
    creditRequestFormReducer,
    {
      digits: "",
      isFocused: false,
      isTouched: false,
    }
  )
  const validation = CreditRequest.safeParse({
    requested_amount: digits,
  })
  const clientError = validation.success
    ? undefined
    : validation.error.flatten().fieldErrors.requested_amount?.[0]
  const requestedAmountError =
    (isTouched ? clientError : undefined) ??
    state.fieldErrors?.requested_amount?.[0]

  return (
    <form
      action={formAction}
      onSubmit={dispatch}
      onChange={dispatch}
      onFocusCapture={dispatch}
      onBlurCapture={dispatch}
    >
      <input type="hidden" name="requested_amount" value={digits} />
      <CardContent className="space-y-4 pb-4">
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
