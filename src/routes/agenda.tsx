import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, Ban, Clock, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/app/PageHeader";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { AppBadge } from "@/components/app/AppBadge";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOTIVOS_BLOQUEIO } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { chaves, useAcao, useBloqueios, useListaEspera, useReservas } from "@/hooks/useDados";
import { BloqueioService, ListaEsperaService } from "@/services/AgendaService";
import type { MotivoBloqueio } from "@/types";
import { formatarData, formatarMoeda } from "@/utils/formatadores";
import { mascararTelefone } from "@/utils/documentos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Área de Lazer Biel" },
      {
        name: "description",
        content: "Calendário de reservas, bloqueios de datas e lista de espera.",
      },
      { property: "og:title", content: "Agenda — Área de Lazer Biel" },
      { property: "og:description", content: "Visualize a ocupação e bloqueie datas indisponíveis." },
    ],
  }),
  component: PaginaAgenda,
});

function PaginaAgenda() {
  const { admin } = useAuth();
  const { data: reservas } = useReservas();
  const { data: bloqueios } = useBloqueios();
  const { data: listaEspera } = useListaEspera();
  const [referencia, setReferencia] = useState(() => new Date());
  const [novaReservaData, setNovaReservaData] = useState<string | null>(null);
  const [bloqueioAberto, setBloqueioAberto] = useState(false);
  const [dadosBloqueio, setDadosBloqueio] = useState<{
    data: string;
    motivo: MotivoBloqueio;
    descricao: string;
  }>({ data: "", motivo: "familia", descricao: "" });

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(referencia), { locale: ptBR });
    const fim = endOfWeek(endOfMonth(referencia), { locale: ptBR });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [referencia]);

  const mapaReservas = useMemo(() => {
    const mapa = new Map<string, (typeof reservas)[number]>();
    reservas
      .filter((reserva) => reserva.statusReserva !== "cancelada")
      .forEach((reserva) => mapa.set(reserva.data, reserva));
    return mapa;
  }, [reservas]);

  const mapaBloqueios = useMemo(
    () => new Map(bloqueios.map((bloqueio) => [bloqueio.data, bloqueio])),
    [bloqueios],
  );

  const criarBloqueio = useAcao(
    () => BloqueioService.criar(dadosBloqueio, admin?.uid ?? "sistema"),
    {
      sucesso: "Data bloqueada.",
      invalidar: [chaves.bloqueios],
      aoConcluir: () => setBloqueioAberto(false),
    },
  );

  const removerBloqueio = useAcao(
    (id: string) => BloqueioService.remover(id, admin?.uid ?? "sistema"),
    { sucesso: "Bloqueio removido.", invalidar: [chaves.bloqueios] },
  );

  const atenderEspera = useAcao(
    (id: string) => ListaEsperaService.marcarAtendido(id, admin?.uid ?? "sistema"),
    { sucesso: "Item marcado como atendido.", invalidar: [chaves.listaEspera] },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Agenda"
        descricao="Ocupação do mês, bloqueios e lista de espera."
        acoes={
          <>
            <Button variant="outline" onClick={() => setBloqueioAberto(true)}>
              <Ban className="size-4" aria-hidden />
              Bloquear data
            </Button>
            <Button onClick={() => setNovaReservaData("")}>
              <CalendarPlus className="size-4" aria-hidden />
              Nova reserva
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base capitalize">
            {format(referencia, "MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setReferencia(addMonths(referencia, -1))}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReferencia(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReferencia(addMonths(referencia, 1))}>
              Próximo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
              <div key={dia} className="py-2">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia) => {
              const chave = format(dia, "yyyy-MM-dd");
              const reserva = mapaReservas.get(chave);
              const bloqueio = mapaBloqueios.get(chave);
              const doMes = isSameMonth(dia, referencia);
              return (
                <button
                  key={chave}
                  type="button"
                  onClick={() => !bloqueio && !reserva && setNovaReservaData(chave)}
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1 rounded-xl border p-2 text-left transition-colors",
                    !doMes && "opacity-40",
                    reserva && "border-primary/40 bg-primary-soft",
                    bloqueio && "border-destructive/30 bg-destructive/10",
                    !reserva && !bloqueio && "hover:border-primary/40",
                  )}
                  aria-label={`Dia ${format(dia, "dd/MM/yyyy")}`}
                >
                  <span className="text-xs font-semibold tabular-nums">{format(dia, "d")}</span>
                  {reserva && (
                    <span className="line-clamp-2 text-[11px] leading-tight font-medium text-primary">
                      {reserva.clienteNome}
                    </span>
                  )}
                  {bloqueio && (
                    <span className="text-[11px] leading-tight font-medium text-destructive">
                      {MOTIVOS_BLOQUEIO[bloqueio.motivo]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datas bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            {bloqueios.length === 0 ? (
              <AppEmptyState
                icone={Ban}
                titulo="Nenhum bloqueio"
                descricao="Bloqueie datas de manutenção ou uso da família."
                acao={{ label: "Bloquear data", aoClicar: () => setBloqueioAberto(true) }}
              />
            ) : (
              <ul className="divide-y">
                {bloqueios.map((bloqueio) => (
                  <li key={bloqueio.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{formatarData(bloqueio.data)}</p>
                      <p className="text-xs text-muted-foreground">
                        {MOTIVOS_BLOQUEIO[bloqueio.motivo]}
                        {bloqueio.descricao ? ` · ${bloqueio.descricao}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover bloqueio"
                      onClick={() => removerBloqueio.mutate(bloqueio.id)}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista de espera</CardTitle>
          </CardHeader>
          <CardContent>
            {listaEspera.length === 0 ? (
              <AppEmptyState
                icone={Clock}
                titulo="Lista vazia"
                descricao="Clientes interessados em datas ocupadas aparecem aqui."
              />
            ) : (
              <ul className="divide-y">
                {listaEspera.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarData(item.dataDesejada)} · {mascararTelefone(item.telefone)}
                      </p>
                    </div>
                    {item.atendido ? (
                      <AppBadge tom="success">Atendido</AppBadge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => atenderEspera.mutate(item.id)}>
                        Marcar atendido
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" aria-hidden />
            Reservas do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {[...mapaReservas.values()]
              .filter((reserva) => reserva.data.startsWith(format(referencia, "yyyy-MM")))
              .sort((a, b) => a.data.localeCompare(b.data))
              .map((reserva) => (
                <li key={reserva.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{reserva.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(reserva.data)} · {reserva.entrada}–{reserva.saida}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatarMoeda(reserva.valor)}
                  </span>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      <ReservaFormDialog
        aberto={novaReservaData !== null}
        aoFechar={() => setNovaReservaData(null)}
        dataInicial={novaReservaData ?? undefined}
      />

      <Dialog open={bloqueioAberto} onOpenChange={(estado) => !estado && setBloqueioAberto(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bloqueio-data">Data</Label>
              <Input
                id="bloqueio-data"
                type="date"
                value={dadosBloqueio.data}
                onChange={(evento) =>
                  setDadosBloqueio({ ...dadosBloqueio, data: evento.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloqueio-motivo">Motivo</Label>
              <Select
                value={dadosBloqueio.motivo}
                onValueChange={(valor) =>
                  setDadosBloqueio({ ...dadosBloqueio, motivo: valor as MotivoBloqueio })
                }
              >
                <SelectTrigger id="bloqueio-motivo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOTIVOS_BLOQUEIO).map(([chave, label]) => (
                    <SelectItem key={chave} value={chave}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloqueio-descricao">Descrição</Label>
              <Textarea
                id="bloqueio-descricao"
                rows={2}
                value={dadosBloqueio.descricao}
                onChange={(evento) =>
                  setDadosBloqueio({ ...dadosBloqueio, descricao: evento.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBloqueioAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => criarBloqueio.mutate(undefined as never)}
              disabled={!dadosBloqueio.data || criarBloqueio.isPending}
            >
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
