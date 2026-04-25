import Link from "next/link"
import {
  BanknoteIcon,
  LandmarkIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { loadActiveLoanForUser } from "@/lib/loans"
import { requireCurrentProfile } from "@/lib/auth/profile"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { cn } from "@/lib/utils"

import { CreditRequestForm } from "./credit-request-form"
import { SimulatedBankStatus } from "./simulated-bank-status"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export default async function SolicitacaoPage() {
  const profile = await requireCurrentProfile()
  const supabase = await createClient()
  const service = createServiceClient()

  const { data: latestConsent } = await supabase
    .from("consents")
    .select("granted_at")
    .eq("user_id", profile.id)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: userRequests } = await supabase
    .from("credit_requests")
    .select("id, requested_amount, approved_amount, decision, created_at, decided_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const requestIds = (userRequests ?? []).map((r) => r.id)
  const lastLoan = await loadActiveLoanForUser(service, requestIds)
  const previousRequest =
    lastLoan?.status === "paid"
      ? (userRequests ?? []).find((r) => r.id === lastLoan.requestId)
      : null

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Badge variant="outline" className="w-fit">
          Etapa 2 de 3
        </Badge>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Solicitação de crédito
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Perfil atual: <strong>{profile.name}</strong>. Escolha o valor
              desejado e siga para consentimento para liberar a análise
              financeira, antifraude, crédito progressivo e explicabilidade.
            </p>
          </div>
          <Link
            href="/minha-conta"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-center"
            )}
          >
            Ver minha conta
          </Link>
        </div>
      </section>

      {previousRequest && lastLoan ? (
        <section>
          <Card className="border border-border/70 bg-muted/35">
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Ciclo anterior concluído</Badge>
              </div>
              <CardTitle>Continuidade do ciclo</CardTitle>
              <CardDescription>
                Seu histórico anterior será considerado nesta nova análise.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="text-muted-foreground">Pedido anterior</div>
                  <div className="mt-1 font-semibold">
                    {currencyFormatter.format(previousRequest.approved_amount ?? previousRequest.requested_amount)} liberado
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Pago em {lastLoan.repaidAt ? dateFormatter.format(new Date(lastLoan.repaidAt)) : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="text-muted-foreground">Nova oportunidade</div>
                  <div className="mt-1 font-semibold">
                    Limite potencial pode crescer
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Ciclos pagos em dia ampliam confiança progressiva.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="flex flex-col gap-6">
        <Card className="border border-border/70 bg-background/85">
          <CardHeader className="gap-2">
            <CardTitle>Valor desejado</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Informe quanto você quer solicitar. O OpenCred pode aprovar um valor
              menor quando a primeira concessão precisar ser mais conservadora.
            </CardDescription>
          </CardHeader>
          <CreditRequestForm />
        </Card>

        <div className="flex flex-col gap-6">
          <SimulatedBankStatus
            initialConnected={Boolean(latestConsent)}
            initialConnectedAt={latestConsent?.granted_at ?? null}
            userId={profile.id}
          />

          <Card className="border border-border/70 bg-muted/35">
            <CardHeader className="gap-2">
              <CardTitle>Próximo passo: consentimento</CardTitle>
              <CardDescription>
                Ao continuar, você vai autorizar os dados usados nesta
                solicitação específica.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-6">
              <JourneyPoint
                icon={LandmarkIcon}
                text="A conta financeira ajuda a contextualizar entradas recorrentes, estabilidade e comportamento financeiro."
              />
              <JourneyPoint
                icon={ShieldCheckIcon}
                text="O consentimento define quais dados podem alimentar score financeiro, antifraude e explicabilidade."
              />
              <JourneyPoint
                icon={ScaleIcon}
                text="A decisão pode ser aprovada, reduzida, enviada para revisão ou negada de forma explicável."
              />
              <JourneyPoint
                icon={TrendingUpIcon}
                text="Crédito progressivo mantém a primeira oferta prudente e considera novos ciclos futuros."
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          icon={BanknoteIcon}
          title="Valor solicitado"
          text="Você escolhe o valor desejado; o limite aprovado pode ser menor conforme risco e histórico."
        />
        <InfoCard
          icon={ShieldCheckIcon}
          title="Consentimento obrigatório"
          text="A análise só avança depois que os escopos forem autorizados no passo seguinte."
        />
        <InfoCard
          icon={TrendingUpIcon}
          title="Evolução futura"
          text="Pagamentos futuros em dia poderão melhorar confiança e limite potencial em novas análises."
        />
      </section>
    </div>
  )
}

function JourneyPoint({
  icon: Icon,
  text,
}: {
  icon: LucideIcon
  text: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
      <Icon data-icon="inline-start" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  text,
  title,
}: {
  icon: LucideIcon
  text: string
  title: string
}) {
  return (
    <Card className="border border-border/70 bg-background/85">
      <CardHeader className="gap-3">
        <Icon data-icon="inline-start" />
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
    </Card>
  )
}
