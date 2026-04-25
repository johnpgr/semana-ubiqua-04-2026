"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  LandmarkIcon,
  LinkIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SignalIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type BankConnectionStatus = "loading" | "disconnected" | "connecting" | "connected" | "error"

export type InitialBankConnection = {
  connected: boolean
  connectedAt: string | null
}

type StoredBankConnection = {
  version: 1
  status: "connected"
  connectedAt: string
  institution: string
  scopes: string[]
}

type BankConnectionState = {
  status: BankConnectionStatus
  connectedAt: string | null
  institution: string
  scopes: string[]
  message: string | null
}

type BankConnectionProps = {
  userId: string
  initialConnection: InitialBankConnection
}

const SIMULATED_INSTITUTION = "Banco Horizonte"
const SIMULATED_SCOPES = [
  "Entradas recorrentes",
  "Estabilidade financeira",
  "Comportamento da conta",
  "Dados autorizados por consentimento",
  "Sinais de risco",
]
const CONNECTION_CHANGE_EVENT = "opencred:bank-connection-change"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function getStorageKey(userId: string) {
  return `opencred:simulated-bank-connection:${userId}`
}

function buildInitialState(
  initialConnection: InitialBankConnection
): BankConnectionState {
  if (initialConnection.connected) {
    return {
      status: "connected",
      connectedAt: initialConnection.connectedAt,
      institution: SIMULATED_INSTITUTION,
      scopes: SIMULATED_SCOPES,
      message: "ConexÃ£o derivada do consentimento mais recente.",
    }
  }

  return {
    status: "disconnected",
    connectedAt: null,
    institution: SIMULATED_INSTITUTION,
    scopes: SIMULATED_SCOPES,
    message: null,
  }
}

export function BankConnectionSummary({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const { state, connect } = useBankConnection({ userId, initialConnection })
  const presentation = getConnectionPresentation(state)

  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <presentation.icon data-icon="inline-start" />
          <Badge variant={presentation.badgeVariant}>{presentation.badge}</Badge>
        </div>
        <CardTitle className="text-base">Conta financeira</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-2xl font-semibold tracking-tight">
          {presentation.label}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {presentation.description}
        </p>
        {state.status === "disconnected" || state.status === "error" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={connect}
          >
            <LinkIcon data-icon="inline-start" />
            Conectar conta
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function BankConnectionButton({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const { state, connect } = useBankConnection({ userId, initialConnection })

  if (state.status === "connected") {
    return (
      <Link
        href="/solicitacao"
        className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
      >
        Solicitar com conta conectada
        <ArrowRightIcon data-icon="inline-end" />
      </Link>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={connect}
      disabled={state.status === "loading" || state.status === "connecting"}
    >
      {state.status === "connecting" ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <LandmarkIcon data-icon="inline-start" />
      )}
      {state.status === "connecting"
        ? "Conectando..."
        : "Conectar conta financeira"}
    </Button>
  )
}

export function BankConnectionPanel({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const { state, connect, disconnect } = useBankConnection({
    userId,
    initialConnection,
  })
  const presentation = getConnectionPresentation(state)
  const isConnected = state.status === "connected"

  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={presentation.badgeVariant}>{presentation.badge}</Badge>
          <Badge variant="outline">Análise financeira autorizada</Badge>
        </div>
        <CardTitle>ConexÃ£o bancÃ¡ria autorizada</CardTitle>
        <CardDescription>
          Autorize uma conta financeira para mostrar como dados financeiros
          ajudam a contextualizar a anÃ¡lise de crÃ©dito.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <presentation.icon />
          <AlertTitle>{presentation.alertTitle}</AlertTitle>
          <AlertDescription>{presentation.alertDescription}</AlertDescription>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile
            label="InstituiÃ§Ã£o"
            value={isConnected ? state.institution : "Nenhuma conta conectada"}
          />
          <InfoTile
            label="Ãšltima atualizaÃ§Ã£o"
            value={
              state.connectedAt
                ? dateFormatter.format(new Date(state.connectedAt))
                : "Aguardando conexÃ£o"
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            Dados usados na anÃ¡lise
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {SIMULATED_SCOPES.map((scope) => (
              <div
                key={scope}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm"
              >
                <ShieldCheckIcon data-icon="inline-start" />
                {scope}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row">
          {isConnected ? (
            <>
              <Link
                href="/solicitacao"
                className={cn(buttonVariants(), "justify-center")}
              >
                Solicitar crÃ©dito
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Button type="button" variant="outline" onClick={disconnect}>
                Desconectar simulaÃ§Ã£o
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={connect}
              disabled={state.status === "loading" || state.status === "connecting"}
            >
              {state.status === "connecting" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <LinkIcon data-icon="inline-start" />
              )}
              {state.status === "connecting"
                ? "Conectando conta..."
                : "Conectar conta financeira"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function BankConnectionActions({
  userId,
  initialConnection,
  latestResultHref,
  activeLoan,
  newLoanEligibility,
}: BankConnectionProps & {
  latestResultHref: string | null
  activeLoan: import("@/lib/loans").Loan | null
  newLoanEligibility: import("@/lib/loans/canRequestNewLoan").NewLoanEligibility
}) {
  const { state, connect } = useBankConnection({ userId, initialConnection })
  const isConnected = state.status === "connected"
  const hasActiveLoan = activeLoan?.status === "active"
  const hasPaidLoan = activeLoan?.status === "paid"

  return (
    <Card className="border-border/70 bg-muted/35">
      <CardHeader className="gap-2">
        <CardTitle>AÃ§Ãµes principais</CardTitle>
        <CardDescription>
          Caminhos disponÃ­veis para continuar a jornada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hasActiveLoan ? (
          <Link
            href={`/emprestimo/${activeLoan.requestId}`}
            className={cn(buttonVariants(), "justify-center")}
          >
            Ver emprÃ©stimo ativo
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : hasPaidLoan && newLoanEligibility.allowed ? (
          <Link
            href="/solicitacao"
            className={cn(buttonVariants(), "justify-center")}
          >
            Pedir novo crÃ©dito
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : isConnected ? (
          <Link
            href="/solicitacao"
            className={cn(buttonVariants(), "justify-center")}
          >
            Solicitar crÃ©dito
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={connect}
            disabled={state.status === "loading" || state.status === "connecting"}
          >
            {state.status === "connecting" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LandmarkIcon data-icon="inline-start" />
            )}
            {state.status === "connecting"
              ? "Conectando..."
              : "Conectar conta financeira"}
          </Button>
        )}
        <Link
          href="/solicitacao"
          className={cn(
            buttonVariants({ variant: isConnected ? "outline" : "secondary" }),
            "justify-center"
          )}
        >
          {isConnected ? "Nova solicitaÃ§Ã£o" : "Solicitar mesmo assim"}
        </Link>
        <Link
          href={latestResultHref ?? "#"}
          aria-disabled={!latestResultHref}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "justify-center",
            !latestResultHref && "pointer-events-none opacity-50"
          )}
        >
          Ver resultado mais recente
        </Link>
        {hasActiveLoan ? (
          <Link
            href={`/emprestimo/${activeLoan.requestId}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-center"
            )}
          >
            Registrar pagamento
          </Link>
        ) : null}
        {hasPaidLoan && !newLoanEligibility.allowed ? (
          <Button variant="outline" disabled>
            {newLoanEligibility.label ?? "Pedir novo crÃ©dito"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function useBankConnection({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const storageKey = getStorageKey(userId)
  const [state, setState] = useState<BankConnectionState>({
    ...buildInitialState(initialConnection),
    status: "loading",
  })

  useEffect(() => {
    function loadConnection() {
      try {
        const storedValue = window.localStorage.getItem(storageKey)

        if (!storedValue) {
          setState(buildInitialState(initialConnection))
          return
        }

        const storedConnection = JSON.parse(storedValue) as StoredBankConnection
        if (
          storedConnection.version !== 1 ||
          storedConnection.status !== "connected"
        ) {
          setState(buildInitialState(initialConnection))
          return
        }

        setState({
          status: "connected",
          connectedAt: storedConnection.connectedAt,
          institution: storedConnection.institution,
          scopes: storedConnection.scopes,
          message: "ConexÃ£o salva neste navegador.",
        })
      } catch {
        setState({
          ...buildInitialState(initialConnection),
          status: "error",
          message: "NÃ£o foi possÃ­vel carregar a conexÃ£o autorizada.",
        })
      }
    }

    loadConnection()
    window.addEventListener(CONNECTION_CHANGE_EVENT, loadConnection)

    return () => {
      window.removeEventListener(CONNECTION_CHANGE_EVENT, loadConnection)
    }
  }, [initialConnection, storageKey])

  function connect() {
    setState((currentState) => ({
      ...currentState,
      status: "connecting",
      message: "Validando instituiÃ§Ã£o autorizada e escopos autorizados.",
    }))

    window.setTimeout(() => {
      const connectedAt = new Date().toISOString()
      const nextConnection: StoredBankConnection = {
        version: 1,
        status: "connected",
        connectedAt,
        institution: SIMULATED_INSTITUTION,
        scopes: SIMULATED_SCOPES,
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextConnection))
        window.dispatchEvent(new Event(CONNECTION_CHANGE_EVENT))
        setState({
          status: "connected",
          connectedAt,
          institution: SIMULATED_INSTITUTION,
          scopes: SIMULATED_SCOPES,
          message: "Conta conectada com sucesso.",
        })
      } catch {
        setState((currentState) => ({
          ...currentState,
          status: "error",
          message: "NÃ£o foi possÃ­vel salvar a conexÃ£o autorizada neste navegador.",
        }))
      }
    }, 900)
  }

  function disconnect() {
    try {
      window.localStorage.removeItem(storageKey)
      window.dispatchEvent(new Event(CONNECTION_CHANGE_EVENT))
    } finally {
      setState({
        status: "disconnected",
        connectedAt: null,
        institution: SIMULATED_INSTITUTION,
        scopes: SIMULATED_SCOPES,
        message: "Conta financeira desconectada neste navegador.",
      })
    }
  }

  return { state, connect, disconnect }
}

function getConnectionPresentation(state: BankConnectionState) {
  if (state.status === "loading") {
    return {
      icon: RefreshCwIcon,
      label: "Carregando",
      badge: "Verificando",
      badgeVariant: "secondary" as const,
      description: "Verificando conexÃ£o autorizada salva.",
      alertTitle: "Verificando estado da conexÃ£o",
      alertDescription: "A Ã¡rea do usuÃ¡rio estÃ¡ carregando os dados da simulaÃ§Ã£o.",
    }
  }

  if (state.status === "connecting") {
    return {
      icon: SignalIcon,
      label: "Conectando",
      badge: "Em anÃ¡lise",
      badgeVariant: "outline" as const,
      description: "Validando instituiÃ§Ã£o e escopos registrados.",
      alertTitle: "Conectando conta financeira",
      alertDescription:
        "Estamos simulando autorizaÃ§Ã£o, escopos e leitura inicial de dados financeiros.",
    }
  }

  if (state.status === "connected") {
    return {
      icon: CheckCircle2Icon,
      label: "Conectada",
      badge: "Autorizada",
      badgeVariant: "default" as const,
      description: state.connectedAt
        ? `${state.institution} Â· ${dateFormatter.format(new Date(state.connectedAt))}`
        : `${state.institution} Â· conexÃ£o ativa`,
      alertTitle: "Conta conectada",
      alertDescription:
        state.message ??
        "A anÃ¡lise pode usar sinais financeiros autorizados na jornada.",
    }
  }

  if (state.status === "error") {
    return {
      icon: AlertCircleIcon,
      label: "Erro",
      badge: "AtenÃ§Ã£o",
      badgeVariant: "destructive" as const,
      description: state.message ?? "NÃ£o foi possÃ­vel conectar agora.",
      alertTitle: "Falha na conexÃ£o autorizada",
      alertDescription:
        state.message ??
        "Tente novamente. A conexÃ£o permaneceu protegida.",
    }
  }

  return {
    icon: LandmarkIcon,
    label: "NÃ£o conectada",
    badge: "Pendente",
    badgeVariant: "secondary" as const,
    description: "Conecte uma conta fictÃ­cia para enriquecer a simulaÃ§Ã£o.",
    alertTitle: "Nenhuma conta financeira conectada",
    alertDescription:
      "O OpenCred usa dados financeiros autorizados conforme os escopos escolhidos.",
  }
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}



