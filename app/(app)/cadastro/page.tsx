import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { CadastroForm } from "./cadastro-form"

export default function CadastroPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
      <Card className="border border-border/70 bg-background/85">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Etapa 1 de 3
          </div>
          <CardTitle className="text-2xl">Crie seu perfil</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            Precisamos do básico para associar a solicitação à sua conta e ao
            cenário configurado que será usado no score nas próximas etapas do produto.
          </CardDescription>
        </CardHeader>
        <CadastroForm />
      </Card>

      <Card className="border border-border/70 bg-muted/40">
        <CardHeader className="space-y-3">
          <CardTitle>O que acontece depois</CardTitle>
          <CardDescription className="space-y-3 text-sm leading-6">
            <p>1. Você informa o valor desejado.</p>
            <p>2. Autoriza a leitura dos dados financeiros configurados.</p>
            <p>3. A análise entra em processamento até o score do passo 7.</p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

