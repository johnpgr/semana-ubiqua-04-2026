"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { getCurrentProfile } from "@/lib/auth/profile"
import { getFieldErrors, type FormActionState } from "@/lib/form-action"
import { createClient } from "@/lib/supabase/server"
import { Email, Otp } from "@/validation/auth"

export type RequestOtpState = FormActionState<"email", { email: string }>

export type VerifyOtpState = FormActionState<"email" | "token">

const VerifyOtpPayload = z.object({
  email: Email,
  token: Otp,
})

export async function requestOtp(
  _prevState: RequestOtpState,
  formData: FormData
): Promise<RequestOtpState> {
  const parsedEmail = Email.safeParse(formData.get("email"))

  if (!parsedEmail.success) {
    return {
      ok: false,
      fieldErrors: getFieldErrors<"email">(parsedEmail.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsedEmail.data,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) {
    return {
      ok: false,
      formError: "Não foi possível enviar o código agora. Tente novamente.",
    }
  }

  redirect(`/login/verify?email=${encodeURIComponent(parsedEmail.data)}`)
}

export async function verifyOtp(
  _prevState: VerifyOtpState,
  formData: FormData
): Promise<VerifyOtpState> {
  const parsedPayload = VerifyOtpPayload.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  })

  if (!parsedPayload.success) {
    return {
      ok: false,
      fieldErrors: getFieldErrors<"email" | "token">(parsedPayload.error),
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsedPayload.data.email,
    token: parsedPayload.data.token,
    type: "email",
  })

  if (error || !data.user) {
    return {
      ok: false,
      formError: "Código inválido ou expirado",
    }
  }

  const profile = await getCurrentProfile()

  redirect(profile ? "/solicitacao" : "/cadastro")
}
