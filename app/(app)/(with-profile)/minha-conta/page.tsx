import Link from "next/link"
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireCurrentProfile, requireCurrentUser } from "@/lib/auth/profile"
import {
  getCreditDecisionLabel,
  getRequestStatusLabel,
} from "@/lib/credit-requests"
import { evaluateProgressiveCreditState } from "@/lib/creditProgression"
import { loadActiveLoanForUser } from "@/lib/loans"
import { buildPaymentSignals } from "@/lib/loans/buildPaymentSignals"
import { canRequestNewLoan } from "@/lib/loans/canRequestNewLoan"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { cn } from "@/lib/utils"
import { MOCK_PROFILE_LABELS } from "@/validation/auth"
import {
  BankConnectionActions,
  BankConnectionButton,
  BankConnectionPanel,
  BankConnectionSummary,
} from "./bank-connection-card"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

type RequestRow = Pick<
  Database["public"]["Tables"]["credit_requests"]["Row"],
  | "id"
  | "requested_amount"
  | "status"
  | "decision"
  | "approved_amount"
  | "created_at"
  | "decided_at"
>

type ScoreRow = Pick<
  Database["public"]["Tables"]["scores"]["Row"],
  "request_id" | "value" | "suggested_limit"
>

type ConsentRow = Pick<
  Database["public"]["Tables"]["consents"]["Row"],
  "request_id" | "granted_at"
>

type DashboardData = {
  requests: RequestRow[]
  scores: ScoreRow[]
  consents: ConsentRow[]
  hasLoadIssue: boolean
}

export default async function MinhaContaPage() {
  const [user, profile] = await Promise.all([
    requireCurrentUser(),
    requireCurrentProfile(),
  ])
  const supabase = await createClient()
  const service = createServiceClient()
  const { requests, scores, consents, hasLoadIssue } =
    await loadDashboardData(supabase, profile.id)

  const scoreByRequestId = new Map(
    scores.map((score) => [score.request_id, score])
  )
  const latestRequest = requests[0] ?? null
  const latestScore = latestRequest ? scoreByRequestId.get(latestRequest.id) : null
  const latestDecision = latestRequest?.decision ?? null
  const latestAnalysis =
    latestRequest && latestScore && latestDecision
      ? {
          request: latestRequest,
          score: latestScore,
          decision: latestDecision,
        }
      : null
  const initialBankConnection = buildInitialBankConnection(consents)

  const requestIds = requests.map((r) => r.id)
  const [paymentSignals, activeLoan, newLoanEligibility] = await Promise.all([
    buildPaymentSignals(service, requestIds),
    loadActiveLoanForUser(service, requestIds),
    canRequestNewLoan(service, profile.id, requestIds),
  ])

  const confidence = buildConfidenceState({
    latestRequest,
    latestScore,
    requests,
    paymentSignals,
  })

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Ãrea do usuÃ¡rio
          </Badge>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                OlÃ¡, {profile.name.split(" ")[0] ?? profile.name}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Acompanhe seu perfil, conexÃ£o autorizada, histÃ³rico de crÃ©dito e
                prÃ³ximo passo da jornada OpenCred.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {activeLoan && activeLoan.status === "active" ? (
                <Link
                  href={`/emprestimo/${activeLoan.requestId}`}
                  className={cn(buttonVariants(), "justify-center")}
                >
                  Ver emprÃ©stimo ativo
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              ) : activeLoan && activeLoan.status === "paid" && newLoanEligibility.allowed ? (
                <Link
                  href="/solicitacao"
                  className={cn(buttonVariants(), "justify-center")}
                >
                  Pedir novo crÃ©dito
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              ) : (
                <Link
                  href="/solicitacao"
                  className={cn(buttonVariants(), "justify-center")}
                >
                  Solicitar crÃ©dito
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              )}
              <BankConnectionButton
                initialConnection={initialBankConnection}
                userId={profile.id}
              />
            </div>
          </div>
        </div>
        {hasLoadIssue ? (
          <Alert variant="destructive">
            <ShieldCheckIcon />
            <AlertTitle>Dados parcialmente indisponÃ­veis</AlertTitle>
            <AlertDescription>
              Algumas informaÃ§Ãµes auxiliares nÃ£o carregaram agora. O perfil
              continua acessÃ­vel e vocÃª pode tentar atualizar a pÃ¡gina.
            </AlertDescription>
          </Alert>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={BadgeCheckIcon}
          title="Perfil"
          value="Completo"
          description={`${user.email ?? "Email indisponÃ­vel"} Â· ${maskCpf(profile.cpf)} Â· ${MOCK_PROFILE_LABELS[profile.mock_profile]}`}
          badge="Pronto"
        />
        <BankConnectionSummary
          initialConnection={initialBankConnection}
          userId={profile.id}
        />
        <SummaryCard
          icon={WalletCardsIcon}
          title="Limite"
          value={
            latestAnalysis
              ? currencyFormatter.format(latestAnalysis.score.suggested_limit)
              : "Sem anÃ¡lise"
          }
          description={
            latestAnalysis
              ? "Estimativa da anÃ¡lise mais recente."
              : "Solicite crÃ©dito para gerar o primeiro limite estimado."
          }
          badge={latestAnalysis ? "Estimado" : "Inicial"}
        />
        <SummaryCard
          icon={SparklesIcon}
          title="ConfianÃ§a"
          value={confidence.label}
          description={confidence.description}
          badge={confidence.badge}
        />
      </section>

      <BankConnectionPanel
        initialConnection={initialBankConnection}
        userId={profile.id}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="border-border/70 bg-background/85">
          <CardHeader className="gap-2">
            <CardTitle>Ãšltimo resultado de anÃ¡lise</CardTitle>
            <CardDescription>
              A leitura mais recente do seu pedido, score e valor aprovado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestAnalysis ? (
              <div className="flex flex-col gap-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricTile
                    label="DecisÃ£o"
                    value={getCreditDecisionLabel(latestAnalysis.decision)}
                  />
                  <MetricTile
                    label="Valor aprovado"
                    value={formatNullableCurrency(
                      latestAnalysis.request.approved_amount
                    )}
                  />
                  <MetricTile
                    label="Score"
                    value={String(latestAnalysis.score.value)}
                  />
                </div>
                <Separator />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      Pedido de{" "}
                      {currencyFormatter.format(
                        latestAnalysis.request.requested_amount
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Criado em{" "}
                      {dateFormatter.format(
                        new Date(latestAnalysis.request.created_at)
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/resultado/${latestAnalysis.request.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "justify-center"
                    )}
                  >
                    Ver resultado
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </div>
              </div>
            ) : (
              <Empty className="border border-border/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CreditCardIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma anÃ¡lise concluÃ­da</EmptyTitle>
                  <EmptyDescription>
                    Quando vocÃª concluir consentimento e anÃ¡lise, o resultado
                    mais recente aparece aqui.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link
                    href="/solicitacao"
                    className={cn(buttonVariants(), "justify-center")}
                  >
                    ComeÃ§ar solicitaÃ§Ã£o
                  </Link>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-border/70 bg-background/85">
            <CardHeader className="gap-2">
              <CardTitle>NÃ­vel de confianÃ§a</CardTitle>
              <CardDescription>
                Uma leitura do crÃ©dito progressivo com base no histÃ³rico
                disponÃ­vel.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {confidence.changed && confidence.before ? (
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Antes</span>
                      <span className="font-medium">{confidence.before.label}</span>
                    </div>
                    <Progress value={confidence.before.progress}>
                      <ProgressLabel className="sr-only">{confidence.before.label}</ProgressLabel>
                    </Progress>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Depois</span>
                      <span className="font-medium">{confidence.after.label}</span>
                    </div>
                    <Progress value={confidence.after.progress}>
                      <ProgressLabel className="sr-only">{confidence.after.label}</ProgressLabel>
                    </Progress>
                  </div>
                  <Badge variant="default" className="w-fit">
                    ConfianÃ§a evoluiu â€” {confidence.before.label} â†’ {confidence.after.label}
                  </Badge>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="text-sm text-muted-foreground">Limite potencial estimado</div>
                    <div className="mt-1 text-lg font-semibold">
                      {currencyFormatter.format(confidence.appliedCap)}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Progress value={confidence.progress}>
                    <ProgressLabel>{confidence.label}</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {confidence.progress}%
                    </span>
                  </Progress>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {confidence.summary}
                  </p>
                </>
              )}
              {confidence.futureSignals.length > 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  <strong>PrÃ³ximo passo:</strong> {confidence.futureSignals[0]}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/85">
            <CardHeader className="gap-2">
              <CardTitle>EmprÃ©stimo ativo</CardTitle>
              <CardDescription>
                Acompanhe o emprÃ©stimo liberado e a aÃ§Ã£o de pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeLoan ? (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricTile
                      label="Valor liberado"
                      value={currencyFormatter.format(activeLoan.amount)}
                    />
                    <MetricTile
                      label="Status"
                      value={
                        activeLoan.status === "paid"
                          ? "Pago"
                          : activeLoan.status === "overdue"
                            ? "Vencido"
                            : "Ativo"
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2 text-sm leading-6">
                    <p>
                      Destino: <strong>{activeLoan.destination}</strong>
                    </p>
                    <p>
                      Liberado em:{" "}
                      <strong>
                        {dateFormatter.format(new Date(activeLoan.disbursedAt))}
                      </strong>
                    </p>
                    {activeLoan.status !== "paid" ? (
                      <p>
                        Vencimento:{" "}
                        <strong>
                          {dateFormatter.format(new Date(activeLoan.dueAt))}
                        </strong>
                      </p>
                    ) : activeLoan.repaidAt ? (
                      <p>
                        Pago em:{" "}
                        <strong>
                          {dateFormatter.format(new Date(activeLoan.repaidAt))}
                        </strong>
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/emprestimo/${activeLoan.requestId}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "justify-center"
                    )}
                  >
                    {activeLoan.status === "paid"
                      ? "Ver ciclo concluÃ­do"
                      : "Ver emprÃ©stimo ativo"}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </div>
              ) : (
                <Empty className="border border-border/70">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BanknoteIcon />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum emprÃ©stimo ativo</EmptyTitle>
                    <EmptyDescription>
                      Quando houver crÃ©dito liberado, ele aparecerÃ¡
                      nesta Ã¡rea com vencimento e aÃ§Ã£o de pagamento.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/70 bg-background/85">
          <CardHeader className="gap-2">
            <CardTitle>HistÃ³rico resumido</CardTitle>
            <CardDescription>
              Ãšltimas solicitaÃ§Ãµes feitas com sua conta OpenCred.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DecisÃ£o</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">AÃ§Ã£o</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.slice(0, 6).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {dateFormatter.format(new Date(request.created_at))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRequestStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.decision ? (
                          getCreditDecisionLabel(request.decision)
                        ) : (
                          <span className="text-muted-foreground">
                            Aguardando
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(request.requested_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={
                            request.status === "awaiting_consent"
                              ? `/consentimento/${request.id}`
                              : `/resultado/${request.id}`
                          }
                          className={cn(
                            buttonVariants({ size: "sm", variant: "ghost" }),
                            "justify-center"
                          )}
                        >
                          Abrir
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="border border-border/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <WalletCardsIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sem solicitaÃ§Ãµes ainda</EmptyTitle>
                  <EmptyDescription>
                    O histÃ³rico serÃ¡ preenchido depois da primeira solicitaÃ§Ã£o
                    de crÃ©dito.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <BankConnectionActions
          initialConnection={initialBankConnection}
          userId={profile.id}
          latestResultHref={
            latestAnalysis ? `/resultado/${latestAnalysis.request.id}` : null
          }
          activeLoan={activeLoan}
          newLoanEligibility={newLoanEligibility}
        />
      </section>
    </div>
  )
}

async function loadDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<DashboardData> {
  const requestsPromise = supabase
    .from("credit_requests")
    .select(
      "id, requested_amount, status, decision, approved_amount, created_at, decided_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  const consentsPromise = supabase
    .from("consents")
    .select("request_id, granted_at")
    .eq("user_id", userId)
    .order("granted_at", { ascending: false })
    .limit(20)

  const [requestsResult, consentsResult] = await Promise.all([
    requestsPromise,
    consentsPromise,
  ])

  const requests = (requestsResult.data ?? []) as RequestRow[]
  const requestIds = requests.map((request) => request.id)

  const scoresResult =
    requestIds.length > 0
      ? await supabase
          .from("scores")
          .select("request_id, value, suggested_limit")
          .in("request_id", requestIds)
      : { data: [], error: null }

  return {
    requests,
    scores: (scoresResult.data ?? []) as ScoreRow[],
    consents: (consentsResult.data ?? []) as ConsentRow[],
    hasLoadIssue: Boolean(
      requestsResult.error || consentsResult.error || scoresResult.error
    ),
  }
}

function buildInitialBankConnection(consents: ConsentRow[]) {
  return {
    connected: consents.length > 0,
    connectedAt: consents[0]?.granted_at ?? null,
  }
}

function buildConfidenceState({
  latestRequest,
  latestScore,
  requests,
  paymentSignals,
}: {
  latestRequest: RequestRow | null
  latestScore: ScoreRow | undefined | null
  requests: RequestRow[]
  paymentSignals: { completedCycles: number; onTimeCycles: number; lateCycles: number; defaultedCycles: number }
}) {
  if (!latestRequest || !latestScore || !latestRequest.decision) {
    return {
      label: "Entrada",
      badge: "Inicial",
      description: "Sem anÃ¡lise concluÃ­da ainda.",
      summary:
        "Seu nÃ­vel comeÃ§a em entrada. A primeira anÃ¡lise e ciclos futuros ajudam a formar confianÃ§a.",
      progress: 25,
      before: null,
      after: null,
      changed: false,
      appliedCap: 0,
      futureSignals: [
        "Pagamentos em dia devem elevar seu nÃ­vel de confianÃ§a nas prÃ³ximas ofertas.",
      ] as string[],
    }
  }

  const history = requests
    .filter((request) => request.id !== latestRequest.id)
    .map((request) => ({
      id: request.id,
      status: request.status,
      decision: request.decision,
      approvedAmount: request.approved_amount,
      createdAt: request.created_at,
      decidedAt: request.decided_at,
    }))

  const before = paymentSignals.completedCycles > 0
    ? evaluateProgressiveCreditState({
        requestedAmount: latestRequest.requested_amount,
        score: latestScore.value,
        baseDecision: latestRequest.decision,
        baseSuggestedLimit: latestScore.suggested_limit,
        requestHistory: history,
        paymentSignals: {
          completedCycles: Math.max(0, paymentSignals.completedCycles - 1),
          onTimeCycles: Math.max(0, paymentSignals.onTimeCycles - (paymentSignals.onTimeCycles > 0 ? 1 : 0)),
          lateCycles: paymentSignals.lateCycles,
          defaultedCycles: paymentSignals.defaultedCycles,
        },
      })
    : null

  const after = evaluateProgressiveCreditState({
    requestedAmount: latestRequest.requested_amount,
    score: latestScore.value,
    baseDecision: latestRequest.decision,
    baseSuggestedLimit: latestScore.suggested_limit,
    requestHistory: history,
    paymentSignals,
  })

  const changed = before !== null && (
    before.level !== after.level || before.appliedCap !== after.appliedCap
  )

  return {
    label: after.levelLabel,
    badge: after.isFirstConcession ? "Primeiro ciclo" : "Em evoluÃ§Ã£o",
    description: after.levelDescription,
    summary: after.progressionSummary,
    progress: after.levelRank * 25,
    before: before
      ? {
          label: before.levelLabel,
          progress: before.levelRank * 25,
          appliedCap: before.appliedCap,
        }
      : null,
    after: {
      label: after.levelLabel,
      progress: after.levelRank * 25,
      appliedCap: after.appliedCap,
    },
    changed,
    appliedCap: after.appliedCap,
    futureSignals: after.futureSignals,
  }
}

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "")

  if (digits.length !== 11) {
    return "CPF cadastrado"
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`
}

function formatNullableCurrency(value: number | null) {
  return value === null ? "NÃ£o definido" : currencyFormatter.format(value)
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
  badge,
}: {
  icon: LucideIcon
  title: string
  value: string
  description: string
  badge: string
}) {
  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Icon data-icon="inline-start" />
          <Badge variant="secondary">{badge}</Badge>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/35 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}


