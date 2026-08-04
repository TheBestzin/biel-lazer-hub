import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Search, Star, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/app/PageHeader";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { BadgeStatusCliente } from "@/components/app/StatusBadges";
import { AppBadge } from "@/components/app/AppBadge";
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_CLIENTE } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { chaves, useAcao, useClientes } from "@/hooks/useDados";
import { ClienteService } from "@/services/ClienteService";
import { LogService } from "@/services/LogService";
import type { Cliente } from "@/types";
import { mascararCPF, mascararTelefone } from "@/utils/documentos";
import { formatarData, formatarMoeda } from "@/utils/formatadores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — Área de Lazer Biel" },
      {
        name: "description",
        content: "Cadastro de clientes com histórico de locações, status e observações.",
      },
      { property: "og:title", content: "Clientes — Área de Lazer Biel" },
      { property: "og:description", content: "Gerencie o cadastro e o histórico dos clientes." },
    ],
  }),
  component: PaginaClientes,
});

function PaginaClientes() {
  const { admin } = useAuth();
  const { data: clientes, isLoading } = useClientes();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Cliente | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Cliente | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientes
      .filter((cliente) => (filtroStatus === "todos" ? true : cliente.status === filtroStatus))
      .filter(
        (cliente) =>
          !termo ||
          cliente.nome.toLowerCase().includes(termo) ||
          (cliente.cpf ?? "").includes(termo.replace(/\D/g, "")) ||
          cliente.telefone.includes(termo.replace(/\D/g, "")),
      )
      .sort((a, b) => Number(b.favorito) - Number(a.favorito));
  }, [clientes, busca, filtroStatus]);

  const favoritar = useAcao(
    (cliente: Cliente) => ClienteService.alternarFavorito(cliente, admin?.uid ?? "sistema"),
    { sucesso: "Favorito atualizado.", invalidar: [chaves.clientes] },
  );

  const excluir = useAcao(
    async (cliente: Cliente) => {
      const autor = admin?.uid ?? "sistema";
      await ClienteService.moverParaLixeira(cliente, autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "excluir",
        colecao: "clientes",
        documento: cliente.id,
        descricao: `Moveu o cliente ${cliente.nome} para a lixeira`,
        antes: cliente,
      });
    },
    {
      sucesso: "Cliente movido para a lixeira.",
      invalidar: [chaves.clientes, chaves.lixeira, chaves.logs],
      aoConcluir: () => setParaExcluir(null),
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Clientes"
        descricao={`${clientes.length} cadastrados · histórico completo de locações`}
        acoes={
          <Button
            onClick={() => {
              setEmEdicao(null);
              setFormAberto(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Novo cliente
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, CPF ou telefone"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Buscar clientes"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="sm:w-56" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_CLIENTE).map(([chave, item]) => (
              <SelectItem key={chave} value={chave}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListaSkeleton />
      ) : filtrados.length === 0 ? (
        <AppEmptyState
          icone={UserPlus}
          titulo="Nenhum cliente encontrado"
          descricao="Ajuste os filtros ou cadastre um novo cliente para começar."
          acao={{
            label: "Cadastrar cliente",
            aoClicar: () => {
              setEmEdicao(null);
              setFormAberto(true);
            },
          }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((cliente) => (
            <Card key={cliente.id} className="transition-colors hover:border-primary/40">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/clientes/$clienteId"
                    params={{ clienteId: cliente.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-medium hover:text-primary">{cliente.nome}</p>
                    <p className="text-xs text-muted-foreground">{cliente.cpf ? mascararCPF(cliente.cpf) : mascararTelefone(cliente.telefone)}</p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={cliente.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                    onClick={() => favoritar.mutate(cliente)}
                  >
                    <Star
                      className={cn(
                        "size-4",
                        cliente.favorito ? "fill-warning text-warning" : "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <BadgeStatusCliente status={cliente.status} />
                  {cliente.tags?.map((tag) => (
                    <AppBadge key={tag} tom="info">
                      {tag}
                    </AppBadge>
                  ))}
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt>Telefone</dt>
                    <dd className="font-medium text-foreground">
                      {mascararTelefone(cliente.telefone)}
                    </dd>
                  </div>
                  <div>
                    <dt>Reservas</dt>
                    <dd className="font-medium text-foreground">{cliente.totalReservas ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Total gasto</dt>
                    <dd className="font-medium text-foreground">
                      {formatarMoeda(cliente.totalGasto ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt>Última reserva</dt>
                    <dd className="font-medium text-foreground">
                      {cliente.ultimaReserva ? formatarData(cliente.ultimaReserva) : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="flex justify-end gap-1 border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmEdicao(cliente);
                      setFormAberto(true);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setParaExcluir(cliente)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClienteFormDialog
        aberto={formAberto}
        aoFechar={() => setFormAberto(false)}
        cliente={emEdicao}
      />
      <AppConfirmDialog
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Mover cliente para a lixeira?"
        descricao={`${paraExcluir?.nome ?? ""} poderá ser restaurado pela Lixeira a qualquer momento.`}
        confirmarLabel="Mover para lixeira"
        destrutivo
        aoConfirmar={() => paraExcluir && excluir.mutate(paraExcluir)}
      />
    </div>
  );
}
