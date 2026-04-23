import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Page() {
  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom_right,_color-mix(in_oklab,var(--accent-foreground)_10%,transparent),transparent_32%),linear-gradient(180deg,color-mix(in_oklab,var(--muted)_45%,var(--background)),var(--background)_40%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:gap-14">
        <section className="max-w-3xl space-y-7">
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
              OpenCred — crédito justo com seus dados
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Uma jornada simples para mostrar onboarding, consentimento e
              análise em processamento usando autenticação por email e Open
              Finance mockado.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "justify-center")}
            >
              Começar simulação
            </Link>
            <a
              href="#como-funciona"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "justify-center"
              )}
            >
              Ver o fluxo
            </a>
          </div>
        </section>

        <section className="grid w-full max-w-xl gap-4" id="como-funciona">
          <article className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-lg shadow-black/5 backdrop-blur">
            <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              01
            </div>
            <h2 className="mt-2 text-xl font-semibold">Autenticação por OTP</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              O usuário entra por email, valida o código de 6 dígitos e segue
              autenticado sem redirect URL externo.
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-lg shadow-black/5 backdrop-blur">
            <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              02
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              Cadastro e solicitação
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Perfil mockado, CPF fictício e valor solicitado criam as linhas em
              `profiles` e `credit_requests`.
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-lg shadow-black/5 backdrop-blur">
            <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              03
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              Consentimento registrado
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Os escopos selecionados vão para `consents` e a solicitação passa
              a `collecting_data`, pronta para o score posterior.
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}
