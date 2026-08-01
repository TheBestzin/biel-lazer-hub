import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarPlus,
  CheckSquare,
  FileText,
  Pencil,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/app/PageHeader";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { BadgeStatusPagamento, BadgeStatusReserva } from "@/components/app/StatusBadges";
import { ChecklistDialog } from "@/components/reservas/ChecklistDialog";
import { ContratoDialog } from "@/components/reservas/ContratoDialog";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_PAGAMENTO } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { chaves, useAcao, useReservas } from "@/hooks/useDados";
import { LogService } from "@/services/LogService";
import { ReservaService } from "@/services/ReservaService";
import type { Reserva } from "@/types";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "Reservas — Área de Lazer Biel" },
      {
        name: "description",
        content: "Controle de locações, pagamentos, contratos e checklist de encerramento.",
      },
      { property: "og:title", content: "Reservas — Área de Lazer Biel" },
      { property: "og:description", content: "Gerencie locações, pagamentos e contratos." },
    ],
  }),
  component: PaginaReservas,
});

function PaginaReservas() {
  const { admin } = useAuth();
  const { data: reservas, isLoading } = useReservas();
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("todas");
  const [filtroPagamento, setFiltroPagamento] = useState("todos");
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Reserva | null>(null);
  const [contrato, setContrato] = useState<Reserva | null>(null);
  const [checklist, setChecklist] = useState<Reserva | null>(null);
  const [paraCancelar, setParaCancelar] = useState<Reserva | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Reserva | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const hoje = new Date().toISOString().slice(0, 10);
    return reservas
      .filter((reserva) => {
        if (aba === "futuras") return reserva.data >= hoje && reserva.statusReserva === "reservada";
        if (aba === "finalizadas") return reserva.statusReserva === "finalizada";
        if (aba === "canceladas") return reserva.statusReserva === "cancelada";
        return true;
      })
      .filter((reserva) =>
        filtroPagamento === "todos" ? true : reserva.statusPagamento === filtroPagamento,
      )
      .filter((reserva) => !termo || reserva.clienteNome.toLowerCase().includes(termo));
  }, [reservas, aba, filtroPagamento, busca]);

  const cancelar = useAcao(
    async (reserva: Reserva) => {
      const autor = admin?.uid ?? "sistema";
      await ReservaService.definirStatus(reserva.id, "cancelada", autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "cancelar",
        colecao: "reservas",
        documento: reserva.id,
        descricao: `Cancelou a reserva de ${reserva.clienteNome} em ${formatarData(reserva.data)}`,
      });
      await ReservaService.recalcularResumoCliente(reserva.clienteId, autor);
    },
    {
      sucesso: "Reserva cancelada.",
      invalidar: [chaves.reservas, chaves.clientes, chaves.logs],
      aoConcluir: () => setParaCancelar(null),
    },
  );

  const excluir = useAcao(
    async (reserva: Reserva) => {
      const autor = admin?.uid ?? "sistema";
      await ReservaService.moverParaLixeira(reserva, autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "excluir",
        colecao: "reservas",
        documento: reserva.id,
        descricao: `Moveu para a lixeira a reserva de ${reserva.clienteNome}`,
        antes: reserva,
      });
    },
    {
      sucesso: "Reserva movida para a lixeira.",
      invalidar: [chaves.reservas, chaves.lixeira, chaves.logs],
      aoConcluir: () => setParaExcluir(null),
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Reservas"
        descricao="Locações, pagamentos, contratos e encerramento com checklist."
        acoes={
          <Button
            onClick={() => {
              setEmEdicao(null);
              setFormAberto(true);
            }}
          >
            <CalendarPlus className="size-4" aria-hidden />
            Nova reserva
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs value={aba} onValueChange={setAba} className="lg:w-auto">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="futuras">Futuras</TabsTrigger>
            <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
            <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por cliente"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Buscar reservas"
          />
        </div>
        <Select value={filtroPagamento} onValueChange={setFiltroPagamento}>
          <SelectTrigger className="lg:w-52" aria-label="Filtrar por pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os pagamentos</SelectItem>
            {Object.entries(STATUS_PAGAMENTO).map(([chave, item]) => (
              <SelectItem key={chave} value={chave}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListaSkeleton />
      ) : filtradas.length === 0 ? (
        <AppEmptyState
          icone={CalendarPlus}
          titulo="Nenhuma reserva encontrada"
          descricao="Ajuste os filtros ou registre uma nova locação."
          acao={{
            label: "Nova reserva",
            aoClicar: () => {
              setEmEdicao(null);
              setFormAberto(true);
            },
          }}
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map((reserva) => (
            <Card key={reserva.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{reserva.clienteNome}</p>
                    <BadgeStatusReserva status={reserva.statusReserva} />
                    <BadgeStatusPagamento status={reserva.statusPagamento} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatarData(reserva.data)} · {reserva.entrada}–{reserva.saida} ·{" "}
                    {formatarMoeda(reserva.valor)} (pago {formatarMoeda(reserva.valorPago)})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setContrato(reserva)}>
                    <FileText className="size-3.5" aria-hidden />
                    Contrato
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setChecklist(reserva)}>
                    <CheckSquare className="size-3.5" aria-hidden />
                    Checklist
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmEdicao(reserva);
                      setFormAberto(true);
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Editar
                  </Button>
                  {reserva.statusReserva === "reservada" && (
                    <Button variant="ghost" size="sm" onClick={() => setParaCancelar(reserva)}>
                      <XCircle className="size-3.5" aria-hidden />
                      Cancelar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setParaExcluir(reserva)}
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

      <ReservaFormDialog
        aberto={formAberto}
        aoFechar={() => setFormAberto(false)}
        reserva={emEdicao}
      />
      <ContratoDialog aberto={Boolean(contrato)} aoFechar={() => setContrato(null)} reserva={contrato} />
      <ChecklistDialog
        aberto={Boolean(checklist)}
        aoFechar={() => setChecklist(null)}
        reserva={checklist}
      />
      <AppConfirmDialog
        aberto={Boolean(paraCancelar)}
        aoFechar={() => setParaCancelar(null)}
        titulo="Cancelar esta reserva?"
        descricao="A data volta a ficar disponível na agenda e o histórico do cliente é recalculado."
        confirmarLabel="Cancelar reserva"
        destrutivo
        aoConfirmar={() => paraCancelar && cancelar.mutate(paraCancelar)}
      />
      <AppConfirmDialog
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Mover reserva para a lixeira?"
        descricao="Você poderá restaurá-la depois pela página Lixeira."
        confirmarLabel="Mover para lixeira"
        destrutivo
        aoConfirmar={() => paraExcluir && excluir.mutate(paraExcluir)}
      />
    </div>
  );
}
