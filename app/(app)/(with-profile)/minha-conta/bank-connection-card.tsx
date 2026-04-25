"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  Building2Icon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { Loan } from "@/lib/loans"
import type { NewLoanEligibility } from "@/lib/loans/canRequestNewLoan"
import {
  buildStoredOpenFinanceConnection,
  getOpenFinanceStorageKey,
  normalizeOpenFinanceConnection,
  OPEN_FINANCE_ANALYSIS_USAGE,
  OPEN_FINANCE_AUTHORIZED_SCOPES,
  OPEN_FINANCE_CONNECTION_CHANGE_EVENT,
  OPEN_FINANCE_FALLBACK_INSTITUTION,
  OPEN_FINANCE_INSTITUTIONS,
  sanitizeInstitutionName,
  type StoredOpenFinanceConnection,
} from "@/lib/open-finance-connection"
import { cn } from "@/lib/utils"

type BankConnectionStatus =
  | "loading"
  | "disconnected"
  | "authorizing"
  | "connected"
  | "error"

type ConnectionStep = "institution" | "review" | "confirm"

export type InitialBankConnection = {
  connected: boolean
  connectedAt: string | null
}

type BankConnectionState = {
  status: BankConnectionStatus
  connectedAt: string | null
  institutionName: string
  accountLast4: string
  authorizedScopes: string[]
  message: string | null
}

type BankConnectionProps = {
  userId: string
  initialConnection: InitialBankConnection
}

const DEFAULT_INSTITUTION = OPEN_FINANCE_INSTITUTIONS[0].name

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function buildInitialState(
  initialConnection: InitialBankConnection
): BankConnectionState {
  if (initialConnection.connected) {
    return {
      status: "connected",
      connectedAt: initialConnection.connectedAt,
      institutionName: OPEN_FINANCE_FALLBACK_INSTITUTION,
      accountLast4: "0000",
      authorizedScopes: OPEN_FINANCE_AUTHORIZED_SCOPES,
      message: "Conexão derivada do consentimento mais recente.",
    }
  }

  return {
    status: "disconnected",
    connectedAt: null,
    institutionName: DEFAULT_INSTITUTION,
    accountLast4: OPEN_FINANCE_INSTITUTIONS[0].accountLast4,
    authorizedScopes: OPEN_FINANCE_AUTHORIZED_SCOPES,
    message: null,
  }
}

export function BankConnectionSummary({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const connection = useBankConnection({ userId, initialConnection })
  const { state, openJourney } = connection
  const presentation = getConnectionPresentation(state)

  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <presentation.icon data-icon="inline-start" />
          <Badge variant={presentation.badgeVariant}>{presentation.badge}</Badge>
        </div>
        <CardTitle className="text-base">Open Finance</CardTitle>
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
            onClick={() => openJourney("institution")}
          >
            <LinkIcon data-icon="inline-start" />
            Conectar Open Finance
          </Button>
        ) : null}
      </CardContent>
      <OpenFinanceConnectionDialog connection={connection} />
    </Card>
  )
}

export function BankConnectionButton({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const connection = useBankConnection({ userId, initialConnection })
  const { state, openJourney } = connection

  if (state.status === "connected") {
    return (
      <>
        <Link
          href="/solicitacao"
          className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
        >
          Solicitar com Open Finance
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
        <OpenFinanceConnectionDialog connection={connection} />
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => openJourney("institution")}
        disabled={state.status === "loading" || state.status === "authorizing"}
      >
        {state.status === "authorizing" ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LandmarkIcon data-icon="inline-start" />
        )}
        {state.status === "authorizing"
          ? "Autorizando..."
          : "Conectar Open Finance"}
      </Button>
      <OpenFinanceConnectionDialog connection={connection} />
    </>
  )
}

export function BankConnectionPanel({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const connection = useBankConnection({ userId, initialConnection })
  const { state, openJourney, disconnect } = connection
  const presentation = getConnectionPresentation(state)
  const isConnected = state.status === "connected"

  return (
    <Card className="border-border/70 bg-background/85">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={presentation.badgeVariant}>{presentation.badge}</Badge>
          <Badge variant="outline">Autorização financeira</Badge>
        </div>
        <CardTitle>Conectar Open Finance</CardTitle>
        <CardDescription>
          Autorize uma instituição financeira para usar dados financeiros
          autorizados na análise do OpenCred.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <presentation.icon />
          <AlertTitle>{presentation.alertTitle}</AlertTitle>
          <AlertDescription>{presentation.alertDescription}</AlertDescription>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile
            label="Instituição conectada"
            value={isConnected ? state.institutionName : "Nenhuma instituição"}
          />
          <InfoTile
            label="Conta"
            value={
              isConnected
                ? formatMaskedAccount(state.accountLast4)
                : "Aguardando autorização"
            }
          />
          <InfoTile
            label="Autorização"
            value={
              state.connectedAt
                ? dateFormatter.format(new Date(state.connectedAt))
                : "Pendente"
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            Dados financeiros autorizados
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {state.authorizedScopes.map((scope) => (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => openJourney("review")}
              >
                Revisar autorização
              </Button>
              <Button type="button" variant="outline" onClick={disconnect}>
                Desconectar conta
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => openJourney("institution")}
              disabled={state.status === "loading" || state.status === "authorizing"}
            >
              {state.status === "authorizing" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <LinkIcon data-icon="inline-start" />
              )}
              {state.status === "authorizing"
                ? "Autorizando acesso..."
                : "Conectar Open Finance"}
            </Button>
          )}
        </div>
      </CardContent>
      <OpenFinanceConnectionDialog connection={connection} />
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
  activeLoan: Loan | null
  newLoanEligibility: NewLoanEligibility
}) {
  const connection = useBankConnection({ userId, initialConnection })
  const { state, openJourney } = connection
  const isConnected = state.status === "connected"
  const hasActiveLoan = activeLoan?.status === "active"
  const hasPaidLoan = activeLoan?.status === "paid"

  return (
    <Card className="border-border/70 bg-muted/35">
      <CardHeader className="gap-2">
        <CardTitle>Ações principais</CardTitle>
        <CardDescription>
          Caminhos disponíveis para continuar a jornada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hasActiveLoan ? (
          <Link
            href={`/emprestimo/${activeLoan.requestId}`}
            className={cn(buttonVariants(), "justify-center")}
          >
            Ver empréstimo ativo
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : hasPaidLoan && newLoanEligibility.allowed ? (
          <Link
            href="/solicitacao"
            className={cn(buttonVariants(), "justify-center")}
          >
            Solicitar novo crédito
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : isConnected ? (
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
            onClick={() => openJourney("institution")}
            disabled={state.status === "loading" || state.status === "authorizing"}
          >
            {state.status === "authorizing" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LandmarkIcon data-icon="inline-start" />
            )}
            {state.status === "authorizing"
              ? "Autorizando..."
              : "Conectar Open Finance"}
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
            {newLoanEligibility.label ?? "Solicitar novo crédito"}
          </Button>
        ) : null}
      </CardContent>
      <OpenFinanceConnectionDialog connection={connection} />
    </Card>
  )
}

function OpenFinanceConnectionDialog({
  connection,
}: {
  connection: ReturnType<typeof useBankConnection>
}) {
  const {
    authorize,
    closeJourney,
    customInstitutionName,
    open,
    selectedInstitution,
    setCustomInstitutionName,
    setSelectedInstitution,
    setStep,
    state,
    step,
  } = connection

  const selectedInstitutionData =
    OPEN_FINANCE_INSTITUTIONS.find(
      (institution) => institution.name === selectedInstitution
    ) ?? OPEN_FINANCE_INSTITUTIONS[0]
  const isCustomInstitution = Boolean(selectedInstitutionData.custom)
  const customInstitutionValue = sanitizeInstitutionName(customInstitutionName)
  const displayInstitutionName = isCustomInstitution
    ? customInstitutionValue || "Outro banco"
    : selectedInstitutionData.name
  const displayConnection = buildStoredOpenFinanceConnection({
    connectedAt: new Date(0).toISOString(),
    institutionName: displayInstitutionName,
  })
  const canContinueFromInstitution =
    !isCustomInstitution || customInstitutionValue.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeJourney()
        }
      }}
    >
      <DialogContent className="max-h-[min(42rem,calc(100svh-2rem))] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Conectar Open Finance</DialogTitle>
          <DialogDescription>
            Autorize uma instituição para compartilhar dados financeiros com o
            OpenCred nesta jornada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <StepIndicator step={step} />

          {step === "institution" ? (
            <div className="grid gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">
                  Escolha a instituição financeira
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecione a conta que será usada para autorizar a leitura
                  financeira.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {OPEN_FINANCE_INSTITUTIONS.map((institution) => {
                  const isSelected = selectedInstitution === institution.name

                  return (
                    <button
                      key={institution.name}
                      type="button"
                      className={cn(
                        "flex min-h-24 flex-col gap-2 rounded-lg border border-border/70 bg-background p-3 text-left transition-colors hover:bg-muted/50",
                        isSelected && "border-primary bg-primary/5"
                      )}
                      onClick={() => setSelectedInstitution(institution.name)}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-medium">
                          <Building2Icon data-icon="inline-start" />
                          {institution.name}
                        </span>
                        {isSelected ? (
                          <CheckCircle2Icon data-icon="inline-end" />
                        ) : null}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {institution.custom
                          ? "Informar instituição"
                          : `Conta •••• ${institution.accountLast4}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {institution.description}
                      </span>
                    </button>
                  )
                })}
              </div>
              {isCustomInstitution ? (
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="custom-institution"
                  >
                    Nome da instituição
                  </label>
                  <Input
                    id="custom-institution"
                    maxLength={60}
                    onChange={(event) =>
                      setCustomInstitutionName(event.target.value)
                    }
                    placeholder="Ex.: Banco XPTO"
                    value={customInstitutionName}
                  />
                  <p className="text-sm text-muted-foreground">
                    Informe o nome para manter a jornada vinculada à mesma
                    instituição.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "review" ? (
            <div className="grid gap-4">
              <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground">
                  Instituição conectada
                </div>
                <div className="mt-1 font-semibold">
                  {displayInstitutionName} · Conta ••••{" "}
                  {displayConnection.accountLast4}
                </div>
              </div>
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold">
                  Dados financeiros autorizados
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {OPEN_FINANCE_AUTHORIZED_SCOPES.map((scope) => (
                    <div
                      key={scope}
                      className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                    >
                      <ShieldCheckIcon data-icon="inline-start" />
                      {scope}
                    </div>
                  ))}
                </div>
              </div>
              <Alert>
                <ShieldCheckIcon />
                <AlertTitle>Uso na análise do OpenCred</AlertTitle>
                <AlertDescription>
                  Esses dados apoiam {OPEN_FINANCE_ANALYSIS_USAGE.join(", ")}.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="grid gap-4">
              <Alert>
                <LandmarkIcon />
                <AlertTitle>Confirmar autorização financeira</AlertTitle>
                <AlertDescription>
                  Você está autorizando o uso dos dados financeiros selecionados
                  para análise de crédito no OpenCred.
                </AlertDescription>
              </Alert>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Instituição" value={displayInstitutionName} />
                <InfoTile
                  label="Conta"
                  value={`•••• ${displayConnection.accountLast4}`}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeJourney}>
            Cancelar
          </Button>
          {step === "institution" ? (
            <Button
              type="button"
              onClick={() => setStep("review")}
              disabled={!canContinueFromInstitution}
            >
              Continuar
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : null}
          {step === "review" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("institution")}
              >
                Trocar instituição
              </Button>
              <Button type="button" onClick={() => setStep("confirm")}>
                Revisar autorização
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </>
          ) : null}
          {step === "confirm" ? (
            <Button
              type="button"
              onClick={() => authorize(displayInstitutionName)}
              disabled={state.status === "authorizing"}
            >
              {state.status === "authorizing" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <ShieldCheckIcon data-icon="inline-start" />
              )}
              {state.status === "authorizing"
                ? "Autorizando..."
                : "Confirmar autorização"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StepIndicator({ step }: { step: ConnectionStep }) {
  const steps: Array<{ value: ConnectionStep; label: string }> = [
    { value: "institution", label: "Instituição" },
    { value: "review", label: "Dados" },
    { value: "confirm", label: "Autorização" },
  ]
  const currentIndex = steps.findIndex((item) => item.value === step)

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((item, index) => (
        <div
          key={item.value}
          className={cn(
            "rounded-lg border border-border/70 px-3 py-2 text-center text-xs font-medium text-muted-foreground",
            index <= currentIndex && "border-primary bg-primary/5 text-foreground"
          )}
        >
          {index + 1}. {item.label}
        </div>
      ))}
    </div>
  )
}

function useBankConnection({
  userId,
  initialConnection,
}: BankConnectionProps) {
  const storageKey = getOpenFinanceStorageKey(userId)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ConnectionStep>("institution")
  const [selectedInstitution, setSelectedInstitution] =
    useState<string>(DEFAULT_INSTITUTION)
  const [customInstitutionName, setCustomInstitutionName] = useState("")
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

        const storedConnection = normalizeOpenFinanceConnection(
          JSON.parse(storedValue)
        )

        if (!storedConnection) {
          setState(buildInitialState(initialConnection))
          return
        }

        const knownInstitution = OPEN_FINANCE_INSTITUTIONS.find(
          (institution) =>
            institution.name === storedConnection.institutionName &&
            !institution.custom
        )

        setSelectedInstitution(
          knownInstitution ? knownInstitution.name : "Outro banco"
        )
        setCustomInstitutionName(knownInstitution ? "" : storedConnection.institutionName)
        setState(toConnectedState(storedConnection))
      } catch {
        setState({
          ...buildInitialState(initialConnection),
          status: "error",
          message: "Não foi possível carregar a autorização financeira.",
        })
      }
    }

    loadConnection()
    window.addEventListener(OPEN_FINANCE_CONNECTION_CHANGE_EVENT, loadConnection)

    return () => {
      window.removeEventListener(
        OPEN_FINANCE_CONNECTION_CHANGE_EVENT,
        loadConnection
      )
    }
  }, [initialConnection, storageKey])

  function openJourney(nextStep: ConnectionStep) {
    setStep(nextStep)
    setOpen(true)
  }

  function closeJourney() {
    if (state.status === "authorizing") {
      return
    }

    setOpen(false)
  }

  function authorize(institutionName: string) {
    const nextConnection = buildStoredOpenFinanceConnection({
      connectedAt: new Date().toISOString(),
      institutionName,
    })

    setState((currentState) => ({
      ...currentState,
      status: "authorizing",
      institutionName: nextConnection.institutionName,
      accountLast4: nextConnection.accountLast4,
      authorizedScopes: nextConnection.authorizedScopes,
      message: "Validando autorização financeira.",
    }))

    window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextConnection))
        window.dispatchEvent(new Event(OPEN_FINANCE_CONNECTION_CHANGE_EVENT))
        setState(toConnectedState(nextConnection))
        setOpen(false)
        setStep("institution")
      } catch {
        setState((currentState) => ({
          ...currentState,
          status: "error",
          message:
            "Não foi possível salvar a autorização financeira neste navegador.",
        }))
      }
    }, 900)
  }

  function disconnect() {
    try {
      window.localStorage.removeItem(storageKey)
      window.dispatchEvent(new Event(OPEN_FINANCE_CONNECTION_CHANGE_EVENT))
    } finally {
      setState({
        status: "disconnected",
        connectedAt: null,
        institutionName: DEFAULT_INSTITUTION,
        accountLast4: OPEN_FINANCE_INSTITUTIONS[0].accountLast4,
        authorizedScopes: OPEN_FINANCE_AUTHORIZED_SCOPES,
        message: "Conta desconectada neste navegador.",
      })
      setSelectedInstitution(DEFAULT_INSTITUTION)
      setCustomInstitutionName("")
    }
  }

  return {
    authorize,
    closeJourney,
    customInstitutionName,
    disconnect,
    open,
    openJourney,
    selectedInstitution,
    setCustomInstitutionName,
    setSelectedInstitution,
    setStep,
    state,
    step,
  }
}

function toConnectedState(
  connection: StoredOpenFinanceConnection
): BankConnectionState {
  return {
    status: "connected",
    connectedAt: connection.connectedAt,
    institutionName: connection.institutionName,
    accountLast4: connection.accountLast4,
    authorizedScopes: connection.authorizedScopes,
    message: "Open Finance autorizado com sucesso.",
  }
}

function getConnectionPresentation(state: BankConnectionState) {
  if (state.status === "loading") {
    return {
      icon: RefreshCwIcon,
      label: "Carregando",
      badge: "Verificando",
      badgeVariant: "secondary" as const,
      description: "Verificando autorização financeira salva.",
      alertTitle: "Verificando Open Finance",
      alertDescription: "A área do usuário está carregando os dados da conta.",
    }
  }

  if (state.status === "authorizing") {
    return {
      icon: SignalIcon,
      label: "Em autorização",
      badge: "Autorizando",
      badgeVariant: "outline" as const,
      description: "Validando instituição e dados autorizados.",
      alertTitle: "Autorizando Open Finance",
      alertDescription:
        "Estamos registrando instituição, conta e escopos financeiros autorizados.",
    }
  }

  if (state.status === "connected") {
    return {
      icon: CheckCircle2Icon,
      label: "Conectada",
      badge: "Conectado",
      badgeVariant: "default" as const,
      description: state.connectedAt
        ? `${formatConnectedAccount(state)} · ${dateFormatter.format(new Date(state.connectedAt))}`
        : formatConnectedAccount(state),
      alertTitle: "Open Finance conectado",
      alertDescription:
        state.message ??
        "Os dados financeiros autorizados podem apoiar a análise de crédito.",
    }
  }

  if (state.status === "error") {
    return {
      icon: AlertCircleIcon,
      label: "Erro",
      badge: "Atenção",
      badgeVariant: "destructive" as const,
      description: state.message ?? "Não foi possível conectar agora.",
      alertTitle: "Falha na autorização financeira",
      alertDescription:
        state.message ?? "Tente novamente. Nenhum dado novo foi autorizado.",
    }
  }

  return {
    icon: LandmarkIcon,
    label: "Não conectada",
    badge: "Pendente",
    badgeVariant: "secondary" as const,
    description: "Autorize Open Finance para enriquecer a análise.",
    alertTitle: "Nenhuma instituição conectada",
    alertDescription:
      "O OpenCred usa dados financeiros autorizados conforme os escopos escolhidos.",
  }
}

function formatConnectedAccount(state: BankConnectionState) {
  if (state.accountLast4 === "0000") {
    return state.institutionName
  }

  return `${state.institutionName} · ${formatMaskedAccount(state.accountLast4)}`
}

function formatMaskedAccount(accountLast4: string) {
  return accountLast4 === "0000" ? "Conta conectada" : `•••• ${accountLast4}`
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}
