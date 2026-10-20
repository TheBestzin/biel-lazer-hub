import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Trash2, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { AppBadge } from "@/components/app/AppBadge";
import { ItemLista, TransicaoEstado } from "@/components/app/MotionUI";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rotuloColecao } from "@/constants/rotulos";
import { chaves, useAcao, useLixeira } from "@/hooks/useDados";
import { LixeiraService } from "@/services/LixeiraService";
import { LogService } from "@/services/LogService";
import type { ItemLixeira } from "@/types";
import { formatarDataHora } from "@/utils/formatadores";

/** Coleção selecionada na URL. */
const filtros = z.object({
  colecao: z.string().optional(),
});

export const Route = createFileRoute("/lixeira")({
  validateSearch: filtros,
  head: () => ({
    meta: [
      { title: "Lixeira — Área de Lazer Biel" },
      {
        name: "description",
        content: "Restaure clientes, reservas e despesas removidos ou exclua definitivamente.",
      },
      { property: "og:title", content: "Lixeira — Área de Lazer Biel" },
      { property: "og:description", content: "Itens removidos com opção de restauração." },
    ],
  }),
  component: PaginaLixeira,
});

function PaginaLixeira() {
  const { admin } = useAuth();
  const { data: itens, isLoading } = useLixeira();
  const search = Route.useSearch();
  const navegar = Route.useNavigate();

  const filtroColecao = search.colecao ?? "todas";
  const mudarColecao = (valor: string) =>
    void navegar({
      search: (anterior) => ({ ...anterior, colecao: valor }),
      replace: true,
    });

  const [paraExcluir, setParaExcluir] = useState<ItemLixeira | null>(null);
  const [esvaziarAberto, setEsvaziarAberto] = useState(false);

  const invalidarTudo = [
    chaves.lixeira,
    chaves.clientes,
    chaves.reservas,
    chaves.despesas,
    chaves.logs,
  ];

  const colecoes = useMemo(
    () => Array.from(new Set(itens.map((item) => item.colecao))).sort(),
    [itens],
  );

  const filtrados = useMemo(
    () =>
      itens
        .filter((item) => (filtroColecao === "todas" ? true : item.colecao === filtroColecao))
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [itens, filtroColecao],
  );

  const contagens = useMemo<Record<string, number>>(
    () => ({
      todas: itens.length,
      ...Object.fromEntries(
        colecoes.map((colecao) => [
          colecao,
          itens.filter((item) => item.colecao === colecao).length,
        ]),
      ),
    }),
    [itens, colecoes],
  );

  const restaurar = useAcao(
    async (item: ItemLixeira) => {
      const autor = admin?.uid ?? "sistema";
      await LixeiraService.restaurar(item, autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "restaurar",
        colecao: item.colecao,
        documento: item.documentoId,
        descricao: `Restaurou "${item.titulo}" da lixeira`,
      });
    },
    { sucesso: "Item restaurado.", invalidar: invalidarTudo },
  );

  /** Restaura todos os itens do filtro atual de uma vez. */
  const restaurarTudo = useAcao(
    async () => {
      const autor = admin?.uid ?? "sistema";
      await Promise.all(filtrados.map((item) => LixeiraService.restaurar(item, autor)));
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "restaurar",
        colecao: "lixeira",
        documento: "geral",
        descricao: `Restaurou ${filtrados.length} item(ns) da lixeira`,
      });
    },
    {
      sucesso: `${filtrados.length} item(ns) restaurado(s).`,
      invalidar: invalidarTudo,
    },
  );

  const excluir = useAcao(
    async (item: ItemLixeira) => {
      const autor = admin?.uid ?? "sistema";
      await LixeiraService.excluirDefinitivo(item);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "excluir",
        colecao: item.colecao,
        documento: item.documentoId,
        descricao: `Excluiu definitivamente "${item.titulo}"`,
      });
    },
    {
      sucesso: "Item excluído definitivamente.",
      invalidar: invalidarTudo,
      aoConcluir: () => setParaExcluir(null),
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Lixeira"
        descricao={
          itens.length === 0
            ? "Itens removidos ficam aqui até serem restaurados ou excluídos de vez."
            : `${filtrados.length} item(ns) no filtro atual`
        }
        acoes={
          filtrados.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => restaurarTudo.mutate()}
                disabled={restaurarTudo.isPending}
              >
                <RotateCcw className="size-4" aria-hidden />
                Restaurar tudo
              </Button>
              <Button variant="outline" onClick={() => setEsvaziarAberto(true)}>
                <Trash2 className="size-4" aria-hidden />
                Esvaziar seleção
              </Button>
            </div>
          ) : undefined
        }
      />

      {colecoes.length > 1 && (
        <Select value={filtroColecao} onValueChange={mudarColecao}>
          <SelectTrigger className="sm:w-52" aria-label="Filtrar por coleção">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {" "}
            <SelectItem value="todas">Tudo ({contagens["todas"]})</SelectItem>
            {colecoes.map((colecao) => (
              <SelectItem key={colecao} value={colecao}>
                {rotuloColecao(colecao)} ({contagens[colecao] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <TransicaoEstado
        estado={isLoading ? "carregando" : filtrados.length === 0 ? "vazio" : "pronto"}
      >
        {isLoading ? (
          <ListaSkeleton />
        ) : filtrados.length === 0 ? (
          <AppEmptyState
            icone={Trash2Icon}
            titulo="Lixeira vazia"
            descricao="Nada foi removido do sistema até o momento."
          />
        ) : (
          <div className="space-y-2">
            {filtrados.map((item, indice) => (
              <ItemLista key={item.id} indice={indice}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{item.titulo}</p>
                        <AppBadge tom="neutro">{rotuloColecao(item.colecao)}</AppBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        removido em {formatarDataHora(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => restaurar.mutate(item)}>
                        <RotateCcw className="size-4" aria-hidden /> Restaurar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setParaExcluir(item)}>
                        <Trash2 className="size-4" aria-hidden /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ItemLista>
            ))}
          </div>
        )}
      </TransicaoEstado>

      <AppConfirmDialog
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Excluir definitivamente"
        descricao="Esta ação não pode ser desfeita. O registro será apagado permanentemente."
        confirmarLabel="Excluir para sempre"
        destrutivo
        aoConfirmar={() => paraExcluir && excluir.mutate(paraExcluir)}
      />

      <AppConfirmDialog
        aberto={esvaziarAberto}
        aoFechar={() => setEsvaziarAberto(false)}
        titulo="Excluir todos os itens do filtro?"
        descricao={`Esta ação não pode ser desfeita. ${filtrados.length} item(ns) serão apagados permanentemente.`}
        confirmarLabel="Excluir para sempre"
        destrutivo
        aoConfirmar={async () => {
          const autor = admin?.uid ?? "sistema";
          await Promise.all(filtrados.map((item) => LixeiraService.excluirDefinitivo(item)));
          await LogService.registrar({
            usuario: autor,
            usuarioNome: admin?.nome ?? "Sistema",
            acao: "excluir",
            colecao: "lixeira",
            documento: "geral",
            descricao: `Excluiu definitivamente ${filtrados.length} item(ns) da lixeira`,
          });
          void navegar({ search: {}, replace: true });
        }}
      />
    </div>
  );
}
