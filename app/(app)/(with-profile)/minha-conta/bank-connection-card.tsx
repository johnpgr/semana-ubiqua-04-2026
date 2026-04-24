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

const SIMULATED_INSTITUTION = "Banco Horizonte Simulado"
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
      message: "Conexão derivada do consentimento mais recente.",
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
        <CardTitle className="text-base">Conta simulada</CardTitle>
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
        : "Conectar conta simulada"}
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
          <Badge variant="outline">Open Finance simulado</Badge>
        </div>
        <CardTitle>Conexão bancária simulada</CardTitle>
        <CardDescription>
          Autorize uma conta fictícia para demonstrar como dados financeiros
          ajudam a contextualizar a análise de crédito.
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
            label="Instituição"
            value={isConnected ? state.institution : "Nenhuma conta conectada"}
          />
          <InfoTile
            label="Última atualização"
            value={
              state.connectedAt
                ? dateFormatter.format(new Date(state.connectedAt))
                : "Aguardando conexão"
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            Dados usados na simulação
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
                Solicitar crédito
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Button type="button" variant="outline" onClick={disconnect}>
                Desconectar simulação
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
                : "Conectar conta simulada"}
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
  hasActiveLoan,
}: BankConnectionProps & {
  latestResultHref: string | null
  hasActiveLoan: boolean
}) {
  const { state, connect } = useBankConnection({ userId, initialConnection })
  const isConnected = state.status === "connected"

  return (
    <Card className="border-border/70 bg-muted/35">
      <CardHeader className="gap-2">
        <CardTitle>Ações principais</CardTitle>
        <CardDescription>
          Caminhos disponíveis para continuar a jornada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isConnected ? (
          <Link
            href="/solicitacao"
            className={cn(buttonVariants(), "justify-center")}
          >
            Solicitar crédito
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
              : "Conectar conta simulada"}
          </Button>
        )}
        <Link
          href="/solicitacao"
          className={cn(
            buttonVariants({ variant: isConnected ? "outline" : "secondary" }),
            "justify-center"
          )}
        >
          {isConnected ? "Nova solicitação" : "Solicitar mesmo assim"}
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
          <Button variant="outline" disabled>
            Pagar empréstimo
          </Button>
        ) : null}
        <Button variant="outline" disabled>
          Pedir novo crédito
        </Button>
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
          message: "Conexão salva neste navegador para fins de demonstração.",
        })
      } catch {
        setState({
          ...buildInitialState(initialConnection),
          status: "error",
          message: "Não foi possível carregar a conexão simulada.",
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
      message: "Validando instituição simulada e escopos autorizados.",
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
          message: "Conta simulada conectada com sucesso.",
        })
      } catch {
        setState((currentState) => ({
          ...currentState,
          status: "error",
          message: "Não foi possível salvar a conexão simulada neste navegador.",
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
        message: "Conta simulada desconectada neste navegador.",
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
      description: "Verificando conexão simulada salva.",
      alertTitle: "Verificando estado da conexão",
      alertDescription: "A área do usuário está carregando os dados da simulação.",
    }
  }

  if (state.status === "connecting") {
    return {
      icon: SignalIcon,
      label: "Conectando",
      badge: "Em análise",
      badgeVariant: "outline" as const,
      description: "Validando instituição e escopos simulados.",
      alertTitle: "Conectando conta simulada",
      alertDescription:
        "Estamos simulando autorização, escopos e leitura inicial de dados financeiros.",
    }
  }

  if (state.status === "connected") {
    return {
      icon: CheckCircle2Icon,
      label: "Conectada",
      badge: "Simulada",
      badgeVariant: "default" as const,
      description: state.connectedAt
        ? `${state.institution} · ${dateFormatter.format(new Date(state.connectedAt))}`
        : `${state.institution} · conexão ativa`,
      alertTitle: "Conta simulada conectada",
      alertDescription:
        state.message ??
        "A análise pode usar sinais financeiros simulados autorizados para a demo.",
    }
  }

  if (state.status === "error") {
    return {
      icon: AlertCircleIcon,
      label: "Erro",
      badge: "Atenção",
      badgeVariant: "destructive" as const,
      description: state.message ?? "Não foi possível conectar agora.",
      alertTitle: "Falha na conexão simulada",
      alertDescription:
        state.message ??
        "Tente novamente. Nenhuma integração externa foi acionada.",
    }
  }

  return {
    icon: LandmarkIcon,
    label: "Não conectada",
    badge: "Pendente",
    badgeVariant: "secondary" as const,
    description: "Conecte uma conta fictícia para enriquecer a simulação.",
    alertTitle: "Nenhuma conta simulada conectada",
    alertDescription:
      "O OpenCred usará apenas dados fictícios autorizados. Não há acesso a banco real ou Open Finance real.",
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
