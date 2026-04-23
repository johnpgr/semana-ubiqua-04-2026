import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col gap-12 py-8 md:py-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Crédito Inteligente e <span className="text-primary">Instantâneo</span>
        </h1>
        <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
          Análise de crédito baseada em dados reais e comportamento financeiro.
          Simples, justo e transparente.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/cadastro">
              Solicitar Crédito <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin">Acesso Admin</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-2 border-muted hover:border-primary/50 transition-all duration-300">
          <CardHeader>
            <div className="bg-primary/10 w-fit p-3 rounded-lg mb-2">
              <Zap className="size-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Resposta Rápida</CardTitle>
            <CardDescription className="text-base">
              Processamento em tempo real do seu score de crédito com resultados imediatos.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-2 border-muted hover:border-primary/50 transition-all duration-300">
          <CardHeader>
            <div className="bg-primary/10 w-fit p-3 rounded-lg mb-2">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Seguro</CardTitle>
            <CardDescription className="text-base">
              Seus dados protegidos e analisados seguindo as normas da LGPD.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-2 border-muted hover:border-primary/50 transition-all duration-300">
          <CardHeader>
            <div className="bg-primary/10 w-fit p-3 rounded-lg mb-2">
              <BarChart3 className="size-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Transparente</CardTitle>
            <CardDescription className="text-base">
              Entenda exatamente quais fatores influenciaram sua decisão de crédito.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
