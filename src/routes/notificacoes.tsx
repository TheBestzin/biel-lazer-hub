import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  Info,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { subDays } from "date-fns";
import { z } from "zod";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppBadge } from "@/components/app/AppBadge";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { ItemLista, TransicaoEstado } from "@/components/app/MotionUI";
import { BadgeTipoNotificacao } from "@/components/app/StatusBadges";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chaves, useAcao, useNotificacoes } from "@/hooks/useDados";
import { NotificacaoService } from "@/services/NotificacaoService";
import type { Notificacao, TipoNotificacao } from "@/types";
import { chaveDia, formatarDataHora, formatarData } from "@/utils/formatadores";
import { cn } from "@/lib/utils";

/** Aba ativa na URL — voltar/compartilhar preserva a visão. */
const filtros = z.object({
  aba: z.enum(["todas", "nao_lidas", "lidas"]).optional(),
});

export const Route = createFileRoute("/notificacoes")({
  validateSearch: filtros,
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

type Abas = NonNullable<z.infer<typeof filtros>["aba"]>;

const ABAS: Array<{ valor: Abas; label: string }> = [
  { valor: "todas", label: "Todas" },
  { valor: "nao_lidas", label: "Não lidas" },
  { valor: "lidas", label: "Lidas" },
];

/** Ícone e cor por tipo de notificação. */
const ICONES_TIPO: Record<TipoNotificacao, { icone: LucideIcon; classe: string }> = {
  reserva: { icone: CalendarCheck, classe: "text-info bg-info/10" },
  pagamento: { icone: Wallet, classe: "text-warning bg-warning/10" },
  cliente: { icone: Users, classe: "text-success bg-success/10" },
  administrador: { icone: ShieldCheck, classe: "text-info bg-info/10" },
  sistema: { icone: Info, classe: "text-muted-foreground bg-muted" },
};

function tituloDia(diaISO: string): string {
  const hoje = chaveDia(new Date());
  const ontem = chaveDia(subDays(new Date(), 1));
  if (diaISO === hoje) return "Hoje";
  if (diaISO === ontem) return "Ontem";
  return formatarData(diaISO, "EEEE, d 'de' MMMM").replace(/^./, (letra) => letra.toUpperCase());
}

function PaginaNotificacoes() {
  const { admin } = useAuth();
  const { data: notificacoes, isLoading } = useNotificacoes();
  const search = Route.useSearch();
  const navegar = Route.useNavigate();

  const aba: Abas = search.aba ?? "todas";
  const mudarAbas = (valor: string) =>
    void navegar({ search: (anterior) => ({ ...anterior, aba: valor as Abas }), replace: true });

  const ordenadas = useMemo(
    () => [...notificacoes].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [notificacoes],
  );

  const filtradas = useMemo(
    () =>
      ordenadas.filter((item) =>
        aba === "nao_lidas" ? !item.lida : aba === "lidas" ? item.lida : true,
      ),
    [ordenadas, aba],
  );

  const naoLidas = notificacoes.filter((item) => !item.lida).length;

  const contagens = useMemo(
    () => ({
      todas: notificacoes.length,
      nao_lidas: naoLidas,
      lidas: notificacoes.length - naoLidas,
    }),
    [notificacoes, naoLidas],
  );

  /** Grupos por dia, mantendo a ordenação desc. */
  const grupos = useMemo(() => {
    const mapa = new Map<string, Notificacao[]>();
    filtradas.forEach((item) => {
      const dia = (item.createdAt ?? "").slice(0, 10);
      if (!dia) return;
      const lista = mapa.get(dia) ?? [];
      lista.push(item);
      mapa.set(dia, lista);
    });
    return Array.from(mapa.entries());
  }, [filtradas]);

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
          naoLidas > 0
            ? `${naoLidas} notificação${naoLidas === 1 ? "" : "es"} não lida${naoLidas === 1 ? "" : "s"}.`
            : "Nenhuma pendência no momento."
        }
        acoes={
          naoLidas > 0 ? (
            <Button variant="outline" onClick={() => marcarTodas.mutate()}>
              <CheckCheck className="size-4" aria-hidden /> Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      <Tabs value={aba} onValueChange={mudarAbas}>
        <TabsList>
          {ABAS.map((item) => (
            <TabsTrigger key={item.valor} value={item.valor}>
              {item.label}
              <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                {contagens[item.valor]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <TransicaoEstado
        estado={isLoading ? "carregando" : filtradas.length === 0 ? "vazio" : "pronto"}
      >
        {isLoading ? (
          <ListaSkeleton />
        ) : filtradas.length === 0 ? (
          <AppEmptyState
            icone={Bell}
            titulo="Nenhuma notificação"
            descricao="Novos alertas de reservas, pagamentos e clientes aparecem aqui."
          />
        ) : (
          <div className="space-y-6">
            {grupos.map(([dia, itens], indiceGrupo) => (
              <section key={dia} className="space-y-2" aria-label={tituloDia(dia)}>
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    {tituloDia(dia)}
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">{itens.length}</span>
                  <div className="h-px flex-1 bg-border" aria-hidden />
                </div>

                <div className="space-y-2">
                  {itens.map((notificacao, indice) => (
                    <ItemLista key={notificacao.id} indice={indice + indiceGrupo * itens.length}>
                      <Card
                        className={cn(
                          notificacao.lida && "opacity-70",
                          !notificacao.lida && "border-primary/30",
                        )}
                      >
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div className="flex min-w-0 gap-3">
                            <span
                              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                ICONES_TIPO[notificacao.tipo].classe
                              }`}
                              aria-hidden
                            >
                              {(() => {
                                const Icone = ICONES_TIPO[notificacao.tipo].icone;
                                return <Icone className="size-4" aria-hidden />;
                              })()}
                            </span>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {!notificacao.lida && (
                                  <span
                                    className="size-2 rounded-full bg-primary"
                                    aria-label="Não lida"
                                  />
                                )}
                                <p className="text-sm font-medium">{notificacao.titulo}</p>
                                <BadgeTipoNotificacao tipo={notificacao.tipo} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notificacao.descricao}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatarDataHora(notificacao.createdAt)}
                              </p>
                            </div>
                          </div>
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => marcarLida.mutate(notificacao)}
                            >
                              Marcar lida
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </ItemLista>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </TransicaoEstado>
    </div>
  );
}
