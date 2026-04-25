import { notFound, redirect } from "next/navigation"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireCurrentProfile } from "@/lib/auth/profile"
import { getRequestStatusLabel } from "@/lib/credit-requests"
import { createClient } from "@/lib/supabase/server"

import { ConsentForm } from "./consent-form"
import { DocumentUploadForm } from "./document-upload-form"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

type ConsentimentoPageProps = {
  params: Promise<{ id: string }>
}

export default async function ConsentimentoPage({
  params,
}: ConsentimentoPageProps) {
  const { id } = await params
  const profile = await requireCurrentProfile()
  const supabase = await createClient()

  const requestLoadErrorMessage = "Não foi possível carregar a solicitação."
  const requestLoadErrorDescription =
    "Tente atualizar a página em alguns instantes."
  const documentsLoadErrorMessage = "Não foi possível carregar os documentos."
  const documentsLoadErrorDescription =
    "Você ainda pode seguir com o consentimento e tentar novamente mais tarde."

  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select("id, requested_amount, status, created_at")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    console.error("Failed to load credit request for consent page", {
      error: requestError,
      requestId: id,
      userId: profile.id,
    })

    return (
      <Card className="border border-border/70 bg-background/85">
        <CardHeader>
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{requestLoadErrorMessage}</AlertTitle>
            <AlertDescription>{requestLoadErrorDescription}</AlertDescription>
          </Alert>
        </CardHeader>
      </Card>
    )
  }

  if (!request) {
    notFound()
  }

  if (request.status !== "awaiting_consent") {
    redirect(`/resultado/${request.id}`)
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, uploaded_at")
    .eq("request_id", request.id)
    .order("uploaded_at", { ascending: false })

  if (documentsError) {
    console.error("Failed to load request documents for consent page", {
      error: documentsError,
      requestId: request.id,
      userId: profile.id,
    })
  }

  const documentsList = documents ?? []
  const hasDocuments = documentsList.length > 0
  const documentsSummaryLabel = documentsError
    ? "Indisponível no momento"
    : hasDocuments
      ? `${documentsList.length} anexo(s) enviado(s)`
      : "Nenhum anexo enviado ainda"

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <Card className="border border-border/70 bg-background/85">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">
              Anexe documentos complementares
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Anexe seu extrato ou comprovantes caso a coleta automática não
              tenha sido suficiente. Esta etapa é opcional e não substitui o
              consentimento.
            </CardDescription>
          </CardHeader>
          {documentsError ? (
            <CardHeader className="pt-0">
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{documentsLoadErrorMessage}</AlertTitle>
                <AlertDescription>
                  {documentsLoadErrorDescription}
                </AlertDescription>
              </Alert>
            </CardHeader>
          ) : null}
          <DocumentUploadForm
            initialDocuments={documentsList}
            requestId={request.id}
          />
        </Card>

        <Card className="border border-border/70 bg-background/85">
          <CardHeader className="space-y-2">
            <div className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Etapa 3 de 3
            </div>
            <CardTitle className="text-2xl">Autorize o uso dos dados</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Selecione os escopos que poderão alimentar a análise de crédito
              desta solicitação.
            </CardDescription>
          </CardHeader>
          <ConsentForm requestId={request.id} />
        </Card>
      </div>

      <Card className="self-start border border-border/70 bg-muted/40">
        <CardHeader className="space-y-3">
          <CardTitle>Resumo da solicitação</CardTitle>
          <CardDescription className="space-y-3 text-sm leading-6">
            <p>
              Valor pedido:{" "}
              <strong>
                {currencyFormatter.format(request.requested_amount)}
              </strong>
            </p>
            <p>
              Status atual:{" "}
              <strong>{getRequestStatusLabel(request.status)}</strong>
            </p>
            <p>
              Documentos complementares:{" "}
              <strong>{documentsSummaryLabel}</strong>
            </p>
            <p>
              Criada em:{" "}
              <strong>
                {new Date(request.created_at).toLocaleString("pt-BR")}
              </strong>
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
