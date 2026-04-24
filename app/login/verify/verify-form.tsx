"use client"

import { useActionState, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

import { verifyOtp, type VerifyOtpState } from "../actions"

const VERIFY_OTP_INITIAL_STATE: VerifyOtpState = {
  ok: false,
}

type VerifyFormProps = {
  email: string
}

export function VerifyForm({ email }: VerifyFormProps) {
  const [token, setToken] = useState("")
  const [state, formAction, isPending] = useActionState(
    verifyOtp,
    VERIFY_OTP_INITIAL_STATE
  )
  const tokenError = state.fieldErrors?.token?.[0]
  const emailError = state.fieldErrors?.email?.[0]

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <CardContent className="space-y-4 pb-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Digite o código enviado para <strong>{email}</strong>.
          </p>
          <InputOTP
            maxLength={6}
            value={token}
            onChange={setToken}
            autoComplete="one-time-code"
            inputMode="numeric"
            containerClassName="justify-center"
            aria-invalid={tokenError ? true : undefined}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {tokenError ? (
            <p className="text-sm text-destructive">{tokenError}</p>
          ) : null}
        </div>
        {emailError ? (
          <p className="text-sm text-destructive">{emailError}</p>
        ) : null}
        {state.formError ? (
          <p className="text-sm text-destructive">{state.formError}</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          size="lg"
          disabled={isPending || token.length !== 6}
        >
          {isPending ? "Validando..." : "Confirmar código"}
        </Button>
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Trocar email
        </Link>
      </CardFooter>
    </form>
  )
}
