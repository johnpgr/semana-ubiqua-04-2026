"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { requestOtp, type RequestOtpState } from "./actions"

const REQUEST_OTP_INITIAL_STATE: RequestOtpState = {
  ok: false,
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    requestOtp,
    REQUEST_OTP_INITIAL_STATE
  )

  const emailError = state.fieldErrors?.email?.[0]

  return (
    <form action={formAction}>
      <CardContent className="space-y-4 pb-4">
        <div className="space-y-4">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            aria-invalid={emailError ? true : undefined}
            required
          />
          {emailError ? (
            <p className="text-sm text-destructive">{emailError}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Enviaremos um código de 6 dígitos para continuar sua jornada.
          </p>
        </div>
        {state.formError ? (
          <p className="text-sm text-destructive">{state.formError}</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Enviando..." : "Receber código"}
        </Button>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Voltar para a apresentação
        </Link>
      </CardFooter>
    </form>
  )
}
