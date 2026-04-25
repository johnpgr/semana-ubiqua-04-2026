import { redirect } from "next/navigation"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/profile"

import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    const profile = await getCurrentProfile()
    redirect(profile ? "/minha-conta" : "/cadastro")
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--primary)_16%,transparent),transparent_38%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--muted)_45%,var(--background)))] px-4 py-10">
      <Card className="w-full max-w-md border border-border/70 bg-background/95 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            OpenCred
          </div>
          <CardTitle className="text-2xl">Entrar no OpenCred</CardTitle>
          <CardDescription className="text-sm leading-6">
            Autentique com OTP por email para criar seu perfil e iniciar a
            solicitação de crédito.
          </CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </main>
  )
}
