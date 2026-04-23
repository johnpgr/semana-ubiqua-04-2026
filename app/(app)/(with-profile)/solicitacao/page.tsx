import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentProfile } from "@/lib/auth/profile"

import { CreditRequestForm } from "./credit-request-form"

export default async function SolicitacaoPage() {
  const profile = await getCurrentProfile()

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Etapa 2 de 3
          </div>
          <CardTitle className="text-2xl">Solicitação de crédito</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            Perfil atual: <strong>{profile?.name}</strong>. Defina o valor que
            deseja simular para gerar a solicitação inicial.
          </CardDescription>
        </CardHeader>
        <CreditRequestForm />
      </Card>

      <Card className="border border-border/70 bg-muted/40">
        <CardHeader className="space-y-3">
          <CardTitle>Status inicial</CardTitle>
          <CardDescription className="space-y-3 text-sm leading-6">
            <p>
              A solicitação nasce em <strong>awaiting_consent</strong>.
            </p>
            <p>
              Depois do aceite, o status muda para{" "}
              <strong>collecting_data</strong>.
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
