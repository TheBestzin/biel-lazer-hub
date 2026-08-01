import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, MessageCircle, Pencil } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/app/PageHeader";
import { AppLoading } from "@/components/app/AppLoading";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { AppBadge } from "@/components/app/AppBadge";
import { BadgeStatusCliente, BadgeStatusPagamento, BadgeStatusReserva } from "@/components/app/StatusBadges";
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCliente, useReservasDoCliente } from "@/hooks/useDados";
import { mascararCPF, mascararTelefone } from "@/utils/documentos";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

export const Route = createFileRoute("/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Ficha do cliente — Área de Lazer Biel" },
      {
        name: "description",
        content: "Histórico de reservas, pagamentos e observações do cliente.",
      },
      { property: "og:title", content: "Ficha do cliente — Área de Lazer Biel" },
      { property: "og:description", content: "Histórico completo de locações do cliente." },
    ],
  }),
  component: FichaCliente,
});

function FichaCliente() {
  const { clienteId } = Route.useParams();
  const { data: cliente, isLoading } = useCliente(clienteId);
  const { data: reservas } = useReservasDoCliente(clienteId);
  const [editar, setEditar] = useState(false);
  const [novaReserva, setNovaReserva] = useState(false);

  if (isLoading) return <AppLoading mensagem="Carregando ficha do cliente..." />;
  if (!cliente) {
    return (
      <AppEmptyState
        icone={ArrowLeft}
        titulo="Cliente não encontrado"
        descricao="O registro pode ter sido removido ou movido para a lixeira."
      />
    );
  }

  const totalPago = reservas
    .filter((r) => r.statusReserva !== "cancelada")
    .reduce((total, r) => total + r.valorPago, 0);
  const emAberto = reservas
    .filter((r) => r.statusReserva !== "cancelada")
    .reduce((total, r) => total + (r.valor - r.valorPago), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to="/clientes">
          <ArrowLeft className="size-4" aria-hidden />
          Voltar para clientes
        </Link>
      </Button>

      <PageHeader
        titulo={cliente.nome}
        descricao={`${mascararCPF(cliente.cpf)} · ${mascararTelefone(cliente.telefone)}`}
        acoes={
          <>
            <Button variant="outline" asChild>
              <a
                href={`https://wa.me/55${cliente.telefone}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" onClick={() => setEditar(true)}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </Button>
            <Button onClick={() => setNovaReserva(true)}>
              <CalendarPlus className="size-4" aria-hidden />
              Nova reserva
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeStatusCliente status={cliente.status} />
              {cliente.favorito && <AppBadge tom="warning">Favorito</AppBadge>}
              {cliente.tags?.map((tag) => (
                <AppBadge key={tag} tom="info">
                  {tag}
                </AppBadge>
              ))}
            </div>
            <Separator />
            <p className="text-muted-foreground">
              {cliente.observacoes?.trim() || "Nenhuma observação registrada."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reservas realizadas</span>
              <span className="font-semibold">{reservas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total pago</span>
              <span className="font-semibold text-success">{formatarMoeda(totalPago)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Em aberto</span>
              <span className="font-semibold text-warning">{formatarMoeda(emAberto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última reserva</span>
              <span className="font-semibold">
                {cliente.ultimaReserva ? formatarData(cliente.ultimaReserva) : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em</span>
              <span className="font-semibold">{formatarData(cliente.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atualizado em</span>
              <span className="font-semibold">{formatarData(cliente.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {reservas.length === 0 ? (
            <AppEmptyState
              icone={CalendarPlus}
              titulo="Nenhuma reserva ainda"
              descricao="Crie a primeira reserva deste cliente."
              acao={{ label: "Nova reserva", aoClicar: () => setNovaReserva(true) }}
            />
          ) : (
            <ul className="divide-y">
              {reservas.map((reserva) => (
                <li key={reserva.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{formatarData(reserva.data)}</p>
                    <p className="text-xs text-muted-foreground">
                      {reserva.entrada}–{reserva.saida}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeStatusReserva status={reserva.statusReserva} />
                    <BadgeStatusPagamento status={reserva.statusPagamento} />
                    <span className="text-sm font-semibold tabular-nums">
                      {formatarMoeda(reserva.valor)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ClienteFormDialog aberto={editar} aoFechar={() => setEditar(false)} cliente={cliente} />
      <ReservaFormDialog aberto={novaReserva} aoFechar={() => setNovaReserva(false)} />
    </div>
  );
}
