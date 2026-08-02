import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppBadge } from "@/components/app/AppBadge";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chaves, useAcao, useNotificacoes } from "@/hooks/useDados";
import { NotificacaoService } from "@/services/NotificacaoService";
import type { Notificacao } from "@/types";
import { formatarDataHora } from "@/utils/formatadores";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Área de Lazer Biel" },
      {
        name: "description",
        content: "Alertas de reservas, pagamentos pendentes e avisos do sistema em um só lugar.",
      },
      { property: "og:title", content: "Notificações — Área de Lazer Biel" },
      { property: "og:description", content: "Acompanhe alertas e avisos do sistema." },
    ],
  }),
  component: PaginaNotificacoes,
});

const TONS: Record<string, "info" | "success" | "warning" | "neutro"> = {
  reserva: "info",
  pagamento: "warning",
  cliente: "success",
  administrador: "neutro",
  sistema: "neutro",
};

function PaginaNotificacoes() {
  const { admin } = useAuth();
  const { data: notificacoes, isLoading } = useNotificacoes();
  const [aba, setAba] = useState("todas");

  const filtradas = useMemo(
    () =>
      notificacoes.filter((item) =>
        aba === "nao_lidas" ? !item.lida : aba === "lidas" ? item.lida : true,
      ),
    [notificacoes, aba],
  );

  const naoLidas = notificacoes.filter((item) => !item.lida).length;

  const marcarLida = useAcao(
    (notificacao: Notificacao) =>
      NotificacaoService.marcarLida(notificacao.id, admin?.uid ?? "sistema"),
    { sucesso: "Notificação marcada como lida.", invalidar: [chaves.notificacoes] },
  );

  const marcarTodas = useAcao(
    () => NotificacaoService.marcarTodasLidas(notificacoes, admin?.uid ?? "sistema"),
    { sucesso: "Todas as notificações foram lidas.", invalidar: [chaves.notificacoes] },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Notificações"
        descricao={
          naoLidas > 0 ? `${naoLidas} notificação(ões) não lida(s).` : "Nenhuma pendência no momento."
        }
        acoes={
          naoLidas > 0 ? (
            <Button variant="outline" onClick={() => marcarTodas.mutate(undefined as never)}>
              <CheckCheck className="size-4" aria-hidden /> Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="nao_lidas">Não lidas</TabsTrigger>
          <TabsTrigger value="lidas">Lidas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <ListaSkeleton />
      ) : filtradas.length === 0 ? (
        <AppEmptyState
          icone={Bell}
          titulo="Nenhuma notificação"
          descricao="Novos alertas de reservas, pagamentos e clientes aparecem aqui."
        />
      ) : (
        <div className="space-y-2">
          {filtradas.map((notificacao) => (
            <Card key={notificacao.id} className={notificacao.lida ? "opacity-70" : undefined}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <BellRing className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{notificacao.titulo}</p>
                      <AppBadge tom={TONS[notificacao.tipo] ?? "neutro"}>{notificacao.tipo}</AppBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notificacao.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarDataHora(notificacao.createdAt)}
                    </p>
                  </div>
                </div>
                {!notificacao.lida && (
                  <Button variant="ghost" size="sm" onClick={() => marcarLida.mutate(notificacao)}>
                    Marcar lida
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
