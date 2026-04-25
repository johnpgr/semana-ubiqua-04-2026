import Link from "next/link"
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CheckCircle2Icon,
  GaugeIcon,
  LandmarkIcon,
  MailCheckIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const flowSteps = [
  {
    title: "Conecte sua conta financeira",
    description: "O OpenCred realiza uma leitura financeira autorizada para apoiar a análise.",
  },
  {
    title: "Solicite crédito",
    description: "Escolha o valor e siga uma jornada clara, sem promessa opaca.",
  },
  {
    title: "Autorize a análise",
    description: "Consentimento explícito antes de usar dados financeiros.",
  },
  {
    title: "Receba decisão explicada",
    description: "Resultado com score, antifraude e justificativa compreensível.",
  },
  {
    title: "Evolua seu limite",
    description: "Pagamentos em dia alimentam confiança para novos ciclos.",
  },
]

const differentiators = [
  {
    icon: GaugeIcon,
    title: "Score financeiro",
    description: "Analisa estabilidade, capacidade e comportamento de fluxo.",
  },
  {
    icon: TrendingUpIcon,
    title: "Crédito progressivo",
    description: "Começa conservador e evolui conforme o relacionamento melhora.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Antifraude comportamental",
    description: "Sinais de risco reduzem decisões frágeis sem expor regras sensíveis.",
  },
  {
    icon: ScaleIcon,
    title: "Explicabilidade jurídica",
    description: "Motivos da decisão em linguagem clara e auditável.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Monitoramento inicial",
    description: "Acompanha o pós-crédito como leitura de risco, com acompanhamento inicial.",
  },
  {
    icon: MailCheckIcon,
    title: "Comunicação oficial",
    description: "Gera mensagens formais de decisão, transparência e segurança.",
  },
]

const audiences = [
  "Autônomos",
  "Trabalhadores de aplicativo",
  "Freelancers",
  "Renda real com histórico tradicional limitado",
]

const journeySignals = [
  "Análise financeira autorizada",
  "Análise visual por etapas",
  "Score, antifraude e parceiros",
  "Oferta, empréstimo e pagamentos",
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklab,var(--muted)_70%,var(--background)),var(--background))]">
        <div className="mx-auto grid min-h-[92svh] w-full max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center lg:py-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">OpenCred</Badge>
              <Badge variant="outline">Pronto para operar</Badge>
            </div>

            <div className="flex max-w-4xl flex-col gap-4">
              <h1 className="text-4xl leading-tighter font-semibold text-balance sm:text-5xl lg:text-6xl">
                Crédito progressivo para autônomos, com análise inteligente e
                transparente.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                O OpenCred transforma dados financeiros autorizados em uma jornada
                completa: conta conectada, solicitação, análise explicada,
                oferta, empréstimo ativo e evolução de confiança.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/minha-conta"
                className={cn(buttonVariants({ size: "lg" }), "justify-center")}
              >
                Acessar minha conta
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <a
                href="#como-funciona"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "justify-center"
                )}
              >
                Conhecer funcionamento
              </a>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Metric value="7+" label="módulos de decisão" />
              <Metric value="0" label="fontes financeiras conectadas" />
              <Metric value="1" label="ciclo completo" />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card p-4 shadow-xl shadow-foreground/5">
              <div className="flex items-center justify-between gap-3 border-b pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Jornada OpenCred</span>
                  <span className="text-xs text-muted-foreground">
                    jornada de crédito explicável
                  </span>
                </div>
                <Badge variant="default">Em uso</Badge>
              </div>

              <div className="grid gap-3 py-4">
                <TimelineItem
                  icon={LandmarkIcon}
                  title="Conta conectada"
                  detail="Instituição financeira"
                  state="Pronto"
                />
                <TimelineItem
                  icon={GaugeIcon}
                  title="Score financeiro calculado"
                  detail="capacidade, estabilidade e comportamento"
                  state="Análise"
                />
                <TimelineItem
                  icon={ShieldCheckIcon}
                  title="Fraud Score aplicado"
                  detail="sinais comportamentais e consistência"
                  state="Risco baixo"
                />
                <TimelineItem
                  icon={BanknoteIcon}
                  title="Oferta liberada"
                  detail="empréstimo ativo com pagamento"
                  state="Ciclo"
                />
              </div>

              <Separator />

              <div className="grid gap-3 pt-4 sm:grid-cols-2">
                <PanelStat title="Limite sugerido" value="R$ 1.250" />
                <PanelStat title="Confiança" value="Em evolução" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6" id="como-funciona">
        <SectionHeader
          eyebrow="Como funciona"
          title="Uma jornada de crédito que o usuário entende."
          description="Do login ao ciclo pago, cada etapa mostra o que está acontecendo e por que a decisão foi tomada."
        />
        <div className="grid gap-3 md:grid-cols-5">
          {flowSteps.map((step, index) => (
            <Card className="border-border/70 bg-background/85" key={step.title}>
              <CardHeader className="gap-3">
                <Badge variant="outline">{String(index + 1).padStart(2, "0")}</Badge>
                <CardTitle className="text-base">{step.title}</CardTitle>
                <CardDescription className="leading-6">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/35">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6">
          <SectionHeader
            eyebrow="Diferenciais"
            title="Mais que uma aprovação: uma arquitetura de decisão."
            description="O OpenCred combina análise financeira, risco, transparência e comunicação em uma experiência única."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeader
          eyebrow="Público-alvo"
          title="Feito para quem tem renda real, mas pouca leitura no crédito tradicional."
          description="O OpenCred valoriza sinais de fluxo e comportamento para criar uma primeira concessão conservadora e evolutiva."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {audiences.map((audience) => (
            <div
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-medium"
              key={audience}
            >
              <BriefcaseBusinessIcon data-icon="inline-start" />
              {audience}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-8 rounded-2xl border bg-card p-5 sm:p-6 lg:grid-cols-[1fr_1fr] lg:p-8">
          <div className="flex flex-col gap-4">
            <Badge className="w-fit" variant="secondary">
              Operação transparente
            </Badge>
            <h2 className="text-2xl font-semibold text-balance sm:text-3xl">
              Arquitetura robusta, experiência clara.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              O OpenCred organiza a jornada de crédito com consentimento,
              análise, acompanhamento pós-concessão, governança e
              explicabilidade.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {journeySignals.map((signal) => (
              <div
                className="flex items-center gap-3 rounded-xl border bg-background/70 p-3 text-sm"
                key={signal}
              >
                <CheckCircle2Icon data-icon="inline-start" />
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/35">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex max-w-2xl flex-col gap-2">
            <Badge className="w-fit" variant="outline">
              Próximo passo
            </Badge>
            <h2 className="text-2xl font-semibold text-balance sm:text-3xl">
              Comece uma análise ou retome sua jornada.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              A jornada já cobre solicitação, análise visual, oferta, empréstimo
              ativo e pagamento.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/minha-conta"
              className={cn(buttonVariants({ size: "lg" }), "justify-center")}
            >
              Ir para minha conta
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "justify-center"
              )}
            >
              Começar análise
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/80 p-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}

function TimelineItem({
  detail,
  icon: Icon,
  state,
  title,
}: {
  detail: string
  icon: LucideIcon
  state: string
  title: string
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-background/70 p-3">
      <div className="flex size-8 items-center justify-center rounded-lg">
        <Icon data-icon="inline-start" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{detail}</div>
      </div>
      <Badge variant="outline">{state}</Badge>
    </div>
  )
}

function PanelStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}

function SectionHeader({
  description,
  eyebrow,
  title,
}: {
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Badge className="w-fit" variant="outline">
        {eyebrow}
      </Badge>
      <h2 className="text-2xl font-semibold text-balance sm:text-3xl">
        {title}
      </h2>
      <p className="text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  )
}

function FeatureCard({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg">
          <Icon data-icon="inline-start" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="leading-6">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}



