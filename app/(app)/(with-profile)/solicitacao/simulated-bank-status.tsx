"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  LandmarkIcon,
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
import { cn } from "@/lib/utils"

type SimulatedBankStatusProps = {
  userId: string
  initialConnected: boolean
  initialConnectedAt: string | null
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})
const CONNECTION_CHANGE_EVENT = "opencred:bank-connection-change"
const STORAGE_ERROR = "__storage_error__"

function getStorageKey(userId: string) {
  return `opencred:simulated-bank-connection:${userId}`
}

export function SimulatedBankStatus({
  userId,
  initialConnected,
  initialConnectedAt,
}: SimulatedBankStatusProps) {
  const storedSnapshot = useSyncExternalStore(
    subscribeToConnectionChanges,
    () => getStoredConnectionSnapshot(userId),
    () => null
  )
  const { connectedAt, status } = resolveConnectionState({
    initialConnected,
    initialConnectedAt,
    storedSnapshot,
  })

  if (status === "error") {
    return (
      <StatusCard
        badge="Atenção"
        description="Não foi possível ler a conexão salva neste navegador. Você ainda pode continuar para consentimento."
        icon={AlertCircleIcon}
        title="Conexão indisponível"
      />
    )
  }

  if (status === "connected") {
    return (
      <StatusCard
        badge="Conectada"
        description={
          connectedAt
            ? `Banco Horizonte conectado em ${dateFormatter.format(
                new Date(connectedAt)
              )}.`
            : "Banco Horizonte conectado."
        }
        icon={CheckCircle2Icon}
        title="Conta financeira pronta"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Sua conta financeira será usada como contexto visual para entradas
          recorrentes, estabilidade e comportamento financeiro autorizado.
        </p>
      </StatusCard>
    )
  }

  return (
    <StatusCard
      badge="Pendente"
      description="Conectar a conta financeira antes do pedido ajuda a deixar a análise mais clara."
      icon={LandmarkIcon}
      title="Conta financeira não conectada"
    >
      <Link
        href="/minha-conta"
        className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
      >
        Ir para minha conta
      </Link>
    </StatusCard>
  )
}

function subscribeToConnectionChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(CONNECTION_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(CONNECTION_CHANGE_EVENT, onStoreChange)
  }
}

function getStoredConnectionSnapshot(userId: string) {
  try {
    return window.localStorage.getItem(getStorageKey(userId))
  } catch {
    return STORAGE_ERROR
  }
}

function resolveConnectionState({
  initialConnected,
  initialConnectedAt,
  storedSnapshot,
}: {
  initialConnected: boolean
  initialConnectedAt: string | null
  storedSnapshot: string | null
}) {
  if (storedSnapshot === STORAGE_ERROR) {
    return {
      status: "error" as const,
      connectedAt: initialConnectedAt,
    }
  }

  if (storedSnapshot) {
    try {
      const storedConnection = JSON.parse(storedSnapshot) as {
        status?: string
        connectedAt?: string
      }

      if (
        storedConnection.status === "connected" &&
        storedConnection.connectedAt
      ) {
        return {
          status: "connected" as const,
          connectedAt: storedConnection.connectedAt,
        }
      }
    } catch {
      return {
        status: "error" as const,
        connectedAt: initialConnectedAt,
      }
    }
  }

  return {
    status: initialConnected ? ("connected" as const) : ("disconnected" as const),
    connectedAt: initialConnectedAt,
  }
}

function StatusCard({
  badge,
  children,
  description,
  icon: Icon,
  title,
}: {
  badge: string
  children?: React.ReactNode
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <Card className="border border-border/70 bg-background/85">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Icon data-icon="inline-start" />
          <Badge variant="secondary">{badge}</Badge>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children ? (
        <CardContent className="flex flex-col gap-3">{children}</CardContent>
      ) : null}
    </Card>
  )
}



