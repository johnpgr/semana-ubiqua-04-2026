"use client";

import { useState, useEffect } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { ClipboardList, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SolicitacaoPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação</h1>
          <p className="text-muted-foreground">Carregando dados do seu perfil...</p>
        </div>
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">Análise de Crédito</h1>
        <p className="text-muted-foreground text-center sm:text-left">
          Preencha as informações abaixo para processarmos seu pedido.
        </p>
      </div>

      <EmptyState
        title="Dados incompletos"
        description="Você precisa completar seu perfil em 'Cadastro' antes de solicitar crédito."
        icon={ClipboardList}
        action={
          <Button variant="default" asChild>
            <a href="/cadastro">Ir para Cadastro</a>
          </Button>
        }
      />
    </div>
  );
}
