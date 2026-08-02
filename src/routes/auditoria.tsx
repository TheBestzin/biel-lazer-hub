import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppBadge } from "@/components/app/AppBadge";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogs } from "@/hooks/useDados";
import { formatarDataHora } from "@/utils/formatadores";

export const Route = createFileRoute("/auditoria")({
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

const TONS: Record<string, "success" | "info" | "warning" | "destructive" | "neutro"> = {
  criar: "success",
  atualizar: "info",
  excluir: "destructive",
  cancelar: "warning",
  restaurar: "info",
  login: "neutro",
  logout: "neutro",
};

function PaginaAuditoria() {
  const { data: logs, isLoading } = useLogs();
  const [busca, setBusca] = useState("");
  const [colecao, setColecao] = useState("todas");

  const colecoes = useMemo(
    () => Array.from(new Set(logs.map((log) => log.colecao))).sort(),
    [logs],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return logs
      .filter((log) => (colecao === "todas" ? true : log.colecao === colecao))
      .filter(
        (log) =>
          !termo ||
          log.descricao.toLowerCase().includes(termo) ||
          log.usuarioNome.toLowerCase().includes(termo),
      );
  }, [logs, busca, colecao]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Auditoria"
        descricao="Toda ação realizada no sistema fica registrada com autor e data."
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por ação ou usuário"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
        <Select value={colecao} onValueChange={setColecao}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os módulos</SelectItem>
            {colecoes.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListaSkeleton />
      ) : filtrados.length === 0 ? (
        <AppEmptyState
          icone={ClipboardList}
          titulo="Nenhum registro encontrado"
          descricao="As ações realizadas no sistema aparecerão nesta lista."
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AppBadge tom={TONS[log.acao] ?? "neutro"}>{log.acao}</AppBadge>
                    <span className="text-xs text-muted-foreground">{log.colecao}</span>
                  </div>
                  <p className="text-sm font-medium">{log.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.usuarioNome} · {formatarDataHora(log.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
