import { notFound, redirect } from "next/navigation"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireCurrentProfile } from "@/lib/auth/profile"
import { createClient } from "@/lib/supabase/server"

import { ConsentForm } from "./consent-form"

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
  const { data: request, error } = await supabase
    .from("credit_requests")
    .select("id, requested_amount, status, created_at")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!request) {
    notFound()
  }

  if (request.status !== "awaiting_consent") {
    redirect(`/resultado/${request.id}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
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

      <Card className="border border-border/70 bg-muted/40">
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
              Status atual: <strong>{request.status}</strong>
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
