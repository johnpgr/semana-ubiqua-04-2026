import Link from "next/link"
import { redirect } from "next/navigation"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/profile"

import { VerifyForm } from "./verify-form"

type VerifyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const user = await getCurrentUser()

  if (user) {
    const profile = await getCurrentProfile()
    redirect(profile ? "/minha-conta" : "/cadastro")
  }

  const { email } = await searchParams
  const normalizedEmail = Array.isArray(email) ? email[0] : email

  if (!normalizedEmail) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--primary)_14%,transparent),transparent_36%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--muted)_55%,var(--background)))] px-4 py-10">
      <Card className="w-full max-w-md border border-border/70 bg-background/95 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Verificação
          </div>
          <CardTitle className="text-2xl">Confirme o acesso</CardTitle>
          <CardDescription className="text-sm leading-6">
            O código tem 6 dígitos e expira rapidamente. Se necessário, volte e
            solicite um novo envio.
          </CardDescription>
        </CardHeader>
        <VerifyForm email={normalizedEmail} />
      </Card>
      <div className="sr-only">
        <Link href="/login">Voltar</Link>
      </div>
    </main>
  )
}
