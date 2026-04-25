import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { TriangleAlertIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardHeader,
} from "@/components/ui/card"
import { requireCurrentProfile } from "@/lib/auth/profile"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

import { AnalysisStageCard } from "./analysis-stage-card"

type AnalisePageProps = {
  params: Promise<{ id: string }>
}

type ConsentRow = Pick<
  Database["public"]["Tables"]["consents"]["Row"],
  "granted_at" | "scopes"
>

export default async function AnalisePage({ params }: AnalisePageProps) {
  const { id } = await params
  const profile = await requireCurrentProfile()
  const supabase = await createClient()

  const { data: request, error: requestError } = await supabase
    .from("credit_requests")
    .select("id, requested_amount, status, decision")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (requestError) {
    console.error("Failed to load credit request for analysis page", {
      error: requestError,
      requestId: id,
      userId: profile.id,
    })

    return (
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="gap-4">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Não foi possível carregar a análise</AlertTitle>
            <AlertDescription>
              Tente novamente em alguns instantes ou volte para sua conta.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/minha-conta"
            >
              Minha conta
            </Link>
            <Link className={buttonVariants()} href="/solicitacao">
              Nova solicitação
            </Link>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!request) {
    notFound()
  }

  if (request.status === "awaiting_consent") {
    redirect(`/consentimento/${request.id}`)
  }

  if (request.status === "decided" && request.decision) {
    redirect(`/resultado/${request.id}`)
  }

  const { data: consent, error: consentError } = await supabase
    .from("consents")
    .select("granted_at, scopes")
    .eq("request_id", request.id)
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (consentError) {
    console.error("Failed to load consent for analysis page", {
      error: consentError,
      requestId: request.id,
      userId: profile.id,
    })

    return (
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="gap-4">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Consentimento indisponível</AlertTitle>
            <AlertDescription>
              Não conseguimos confirmar os dados autorizados para esta análise.
            </AlertDescription>
          </Alert>
          <Link
            className={buttonVariants({ className: "w-fit" })}
            href={`/consentimento/${request.id}`}
          >
            Revisar consentimento
          </Link>
        </CardHeader>
      </Card>
    )
  }

  if (!consent) {
    redirect(`/consentimento/${request.id}`)
  }

  return (
    <AnalysisStageCard
      consentGrantedAt={(consent as ConsentRow).granted_at}
      requestId={request.id}
      requestedAmount={request.requested_amount}
    />
  )
}
