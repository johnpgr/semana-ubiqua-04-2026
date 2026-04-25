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
import {
  getOpenFinanceStorageKey,
  normalizeOpenFinanceConnection,
  OPEN_FINANCE_CONNECTION_CHANGE_EVENT,
  OPEN_FINANCE_FALLBACK_INSTITUTION,
} from "@/lib/open-finance-connection"
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
const STORAGE_ERROR = "__storage_error__"

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
  const connection = resolveConnectionState({
    initialConnected,
    initialConnectedAt,
    storedSnapshot,
  })

  if (connection.status === "error") {
    return (
      <StatusCard
        badge="Atenção"
        description="Não foi possível ler a autorização salva neste navegador. Você ainda pode continuar para consentimento."
        icon={AlertCircleIcon}
        title="Open Finance indisponível"
      />
    )
  }

  if (connection.status === "connected") {
    return (
      <StatusCard
        badge="Conectado"
        description={
          connection.connectedAt
            ? `${formatConnectionLabel(connection)} · autorizado em ${dateFormatter.format(
                new Date(connection.connectedAt)
              )}.`
            : `${formatConnectionLabel(connection)}.`
        }
        icon={CheckCircle2Icon}
        title="Open Finance conectado"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Seus dados financeiros autorizados serão usados para melhorar a
          análise, incluindo entradas, saídas, saldo médio e recorrência de
          renda.
        </p>
      </StatusCard>
    )
  }

  return (
    <StatusCard
      badge="Pendente"
      description="Autorizar Open Finance antes do pedido ajuda a deixar a análise mais completa."
      icon={LandmarkIcon}
      title="Open Finance não conectado"
    >
      <Link
        href="/minha-conta"
        className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
      >
        Conectar em Minha conta
      </Link>
    </StatusCard>
  )
}

function subscribeToConnectionChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(OPEN_FINANCE_CONNECTION_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(OPEN_FINANCE_CONNECTION_CHANGE_EVENT, onStoreChange)
  }
}

function getStoredConnectionSnapshot(userId: string) {
  try {
    return window.localStorage.getItem(getOpenFinanceStorageKey(userId))
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
      institutionName: OPEN_FINANCE_FALLBACK_INSTITUTION,
      accountLast4: "0000",
    }
  }

  if (storedSnapshot) {
    try {
      const storedConnection = normalizeOpenFinanceConnection(
        JSON.parse(storedSnapshot)
      )

      if (storedConnection) {
        return {
          status: "connected" as const,
          connectedAt: storedConnection.connectedAt,
          institutionName: storedConnection.institutionName,
          accountLast4: storedConnection.accountLast4,
        }
      }
    } catch {
      return {
        status: "error" as const,
        connectedAt: initialConnectedAt,
        institutionName: OPEN_FINANCE_FALLBACK_INSTITUTION,
        accountLast4: "0000",
      }
    }
  }

  return {
    status: initialConnected ? ("connected" as const) : ("disconnected" as const),
    connectedAt: initialConnectedAt,
    institutionName: OPEN_FINANCE_FALLBACK_INSTITUTION,
    accountLast4: "0000",
  }
}

function formatConnectionLabel({
  accountLast4,
  institutionName,
}: {
  accountLast4: string
  institutionName: string
}) {
  if (accountLast4 === "0000") {
    return institutionName
  }

  return `${institutionName} · Conta •••• ${accountLast4}`
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
