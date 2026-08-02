import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { chaves, useAcao, useLixeira } from "@/hooks/useDados";
import { LixeiraService } from "@/services/LixeiraService";
import { LogService } from "@/services/LogService";
import type { ItemLixeira } from "@/types";
import { formatarDataHora } from "@/utils/formatadores";

export const Route = createFileRoute("/lixeira")({
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
  const [paraExcluir, setParaExcluir] = useState<ItemLixeira | null>(null);

  const invalidarTudo = [
    chaves.lixeira,
    chaves.clientes,
    chaves.reservas,
    chaves.despesas,
    chaves.logs,
  ];

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
        descricao="Itens removidos ficam aqui até serem restaurados ou excluídos de vez."
      />

      {isLoading ? (
        <ListaSkeleton />
      ) : itens.length === 0 ? (
        <AppEmptyState
          icone={Trash2}
          titulo="Lixeira vazia"
          descricao="Nada foi removido do sistema até o momento."
        />
      ) : (
        <div className="space-y-2">
          {itens.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.colecao} · removido em {formatarDataHora(item.createdAt)}
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
          ))}
        </div>
      )}

      <AppConfirmDialog
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Excluir definitivamente"
        descricao="Esta ação não pode ser desfeita. O registro será apagado permanentemente."
        confirmarLabel="Excluir para sempre"
        destrutivo
        aoConfirmar={() => paraExcluir && excluir.mutate(paraExcluir)}
      />
    </div>
  );
}
