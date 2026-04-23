"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { LayoutDashboard, Bell, Activity } from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);

    const channel = supabase
      .channel("credit_requests_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "credit_requests" },
        (payload) => {
          toast.success("Nova solicitação de crédito!", {
            description: `Uma nova análise foi iniciada em tempo real.`,
            icon: <Bell className="size-4 text-green-500" />,
            duration: 5000,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "credit_requests" },
        (payload) => {
          toast.info("Solicitação Atualizada", {
            description: `Status alterado para: ${payload.new.status}`,
            icon: <Activity className="size-4 text-blue-500" />,
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Painel Admin</h1>
          <p className="text-muted-foreground">Sincronizando com a base de dados...</p>
        </div>
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground">
          Monitore as solicitações de crédito em tempo real.
        </p>
      </div>

      <EmptyState
        title="Aguardando solicitações"
        description="O sistema está pronto e ouvindo novos pedidos de crédito via Supabase Realtime."
        icon={LayoutDashboard}
      />
    </div>
  );
}
