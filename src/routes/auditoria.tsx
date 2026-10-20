import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { z } from "zod";

import { AppBadge, type Tom } from "@/components/app/AppBadge";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { ItemLista, TransicaoEstado } from "@/components/app/MotionUI";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rotuloAcao, rotuloColecao } from "@/constants/rotulos";
import { useLogs } from "@/hooks/useDados";
import { formatarData, formatarDataHora, chaveDia } from "@/utils/formatadores";

/** Filtros da página na URL. */
const filtros = z.object({
  busca: z.string().optional(),
  colecao: z.string().optional(),
  /** Janela temporal: últimos 7 ou 30 dias. */
  periodo: z.enum(["d7", "d30"]).optional(),
});

export const Route = createFileRoute("/auditoria")({
  validateSearch: filtros,
  head: () => ({
    meta: [
      { title: "Auditoria — Área de Lazer Biel" },
      {
        name: "description",
        content: "Registro completo de ações realizadas no sistema, com autor, data e detalhes.",
      },
      { property: "og:title", content: "Auditoria — Área de Lazer Biel" },
      { property: "og:description", content: "Histórico de ações e alterações do sistema." },
    ],
  }),
  component: PaginaAuditoria,
});

const TONS: Record<string, Tom> = {
  criar: "success",
  atualizar: "info",
  excluir: "destructive",
  cancelar: "warning",
  restaurar: "info",
  login: "neutro",
  logout: "neutro",
};

const CORES_PONTO: Record<Tom, string> = {
  success: "bg-success",
  info: "bg-info",
  destructive: "bg-destructive",
  warning: "bg-warning",
  neutro: "bg-muted-foreground/50",
};

function tituloDia(diaISO: string): string {
  const hoje = chaveDia(new Date());
  const ontem = chaveDia(subDays(new Date(), 1));
  if (diaISO === hoje) return "Hoje";
  if (diaISO === ontem) return "Ontem";
  return formatarData(diaISO, "EEEE, d 'de' MMMM").replace(/^./, (letra) => letra.toUpperCase());
}

function PaginaAuditoria() {
  const { data: logs, isLoading } = useLogs();
  const search = Route.useSearch();
  const navegar = Route.useNavigate();

  const busca = search.busca ?? "";
  const colecao = search.colecao ?? "todas";
  const periodo: string = search.periodo ?? "todas";

  type PatchSearch = {
    busca?: string | undefined;
    colecao?: string | undefined;
    periodo?: "d7" | "d30" | undefined;
  };

  const mudarSearch = (patch: PatchSearch) =>
    void navegar({ search: (anterior) => ({ ...anterior, ...patch }), replace: true });

  const colecoes = useMemo(
    () => Array.from(new Set(logs.map((log) => log.colecao))).sort(),
    [logs],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const limite =
      periodo === "d7"
        ? chaveDia(subDays(new Date(), 7))
        : periodo === "d30"
          ? chaveDia(subDays(new Date(), 30))
          : null;
    return logs
      .filter((log) => (colecao === "todas" ? true : log.colecao === colecao))
      .filter((log) => (limite ? (log.createdAt ?? "").slice(0, 10) >= limite : true))
      .filter(
        (log) =>
          !termo ||
          log.descricao.toLowerCase().includes(termo) ||
          log.usuarioNome.toLowerCase().includes(termo),
      );
  }, [logs, busca, colecao, periodo]);

  /** Timeline: logs agrupados pelo dia (desc), mantendo a ordem dentro do dia. */
  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof filtrados>();
    filtrados.forEach((log) => {
      const dia = (log.createdAt ?? "").slice(0, 10);
      if (!dia) return;
      const lista = mapa.get(dia) ?? [];
      lista.push(log);
      mapa.set(dia, lista);
    });
    return Array.from(mapa.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtrados]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Auditoria"
        descricao={
          isLoading
            ? "Toda ação realizada no sistema fica registrada com autor e data."
            : `${filtrados.length} registro${filtrados.length === 1 ? "" : "s"} nos filtros atuais`
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Buscar por ação ou usuário"
            value={busca}
            onChange={(evento) => mudarSearch({ busca: evento.target.value || undefined })}
            aria-label="Buscar na auditoria"
          />
        </div>
        <Select
          value={periodo}
          onValueChange={(valor) => mudarSearch({ periodo: valor as "d7" | "d30" })}
        >
          <SelectTrigger className="sm:w-44" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todo o histórico</SelectItem>
            <SelectItem value="d7">Últimos 7 dias</SelectItem>
            <SelectItem value="d30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={colecao} onValueChange={(valor) => mudarSearch({ colecao: valor })}>
          <SelectTrigger className="sm:w-52" aria-label="Módulo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os módulos</SelectItem>
            {colecoes.map((item) => (
              <SelectItem key={item} value={item}>
                {rotuloColecao(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TransicaoEstado
        estado={isLoading ? "carregando" : filtrados.length === 0 ? "vazio" : "pronto"}
      >
        {isLoading ? (
          <ListaSkeleton />
        ) : filtrados.length === 0 ? (
          <AppEmptyState
            icone={ClipboardList}
            titulo="Nenhum registro encontrado"
            descricao="As ações realizadas no sistema aparecerão nesta lista."
          />
        ) : (
          <div className="space-y-6">
            {grupos.map(([dia, itens], indiceGrupo) => (
              <section key={dia} className="space-y-2" aria-label={tituloDia(dia)}>
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    {tituloDia(dia)}
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {itens.length} ação{itens.length === 1 ? "" : "es"}
                  </span>
                  <div className="h-px flex-1 bg-border" aria-hidden />
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ol className="px-4 sm:px-6">
                      {itens.map((log, indice) => (
                        <ItemLista
                          key={log.id}
                          indice={indice + indiceGrupo * itens.length}
                          elemento="li"
                          className="relative flex gap-3 py-3.5"
                        >
                          {/* Linha do tempo */}
                          <div className="relative flex w-2.5 flex-col items-center" aria-hidden>
                            <span
                              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                                CORES_PONTO[TONS[log.acao] ?? "neutro"]
                              }`}
                            />
                            {indice < itens.length - 1 && (
                              <span className="mt-1 w-px flex-1 bg-border" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{log.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.usuarioNome} · {rotuloColecao(log.colecao)} ·{" "}
                              {formatarDataHora(log.createdAt)}
                            </p>
                          </div>

                          <AppBadge tom={TONS[log.acao] ?? "neutro"}>
                            {rotuloAcao(log.acao)}
                          </AppBadge>
                        </ItemLista>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>
        )}
      </TransicaoEstado>
    </div>
  );
}
