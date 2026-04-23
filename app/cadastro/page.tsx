"use client";

import { useState, useEffect } from "react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CadastroPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Criar Conta</h1>
          <p className="text-muted-foreground">Selecione um perfil para a simulação.</p>
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left">Inicie sua Jornada</h1>
        <p className="text-muted-foreground text-center sm:text-left">
          Para esta demonstração, escolha um dos perfis pré-configurados abaixo.
        </p>
      </div>

      <EmptyState
        title="Nenhum perfil disponível"
        description="Não conseguimos carregar os perfis de demonstração. Tente atualizar a página."
        icon={AlertCircle}
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        }
      />
    </div>
  );
}
