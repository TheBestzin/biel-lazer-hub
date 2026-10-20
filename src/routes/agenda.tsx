import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, Ban, Clock, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/app/PageHeader";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { AppBadge } from "@/components/app/AppBadge";
import { CalendarioAgenda } from "@/components/agenda/CalendarioAgenda";
import { ItemLista } from "@/components/app/MotionUI";
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

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Área de Lazer Biel" },
      {
        name: "description",
        content: "Calendário de reservas, bloqueios de datas e lista de espera.",
      },
      { property: "og:title", content: "Agenda — Área de Lazer Biel" },
      {
        property: "og:description",
        content: "Visualize a ocupação e bloqueie datas indisponíveis.",
      },
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

  /** Reservas do mês exibido no calendário. */
  const reservasDoMes = useMemo(
    () =>
      [...mapaReservas.values()]
        .filter((reserva) => reserva.data.startsWith(format(referencia, "yyyy-MM")))
        .sort((a, b) => a.data.localeCompare(b.data) || a.entrada.localeCompare(b.entrada)),
    [mapaReservas, referencia],
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

      <CalendarioAgenda
        referencia={referencia}
        aoMudar={(proxima) => setReferencia(proxima)}
        mapaReservas={mapaReservas}
        mapaBloqueios={mapaBloqueios}
        aoNovoDia={setNovaReservaData}
      />

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
                {[...bloqueios]
                  .sort((a, b) => a.data.localeCompare(b.data))
                  .map((bloqueio, indice) => (
                    <ItemLista
                      key={bloqueio.id}
                      indice={indice}
                      elemento="li"
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatarData(bloqueio.data)}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {formatarData(bloqueio.data, "EEEE")}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {MOTIVOS_BLOQUEIO[bloqueio.motivo]}
                          {bloqueio.descricao ? ` · ${bloqueio.descricao}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover bloqueio de ${formatarData(bloqueio.data)}`}
                        onClick={() => removerBloqueio.mutate(bloqueio.id)}
                      >
                        <Trash2 className="size-4 text-destructive" aria-hidden />
                      </Button>
                    </ItemLista>
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
                {[...listaEspera]
                  .sort(
                    (a, b) =>
                      a.dataDesejada.localeCompare(b.dataDesejada) ||
                      a.clienteNome.localeCompare(b.clienteNome),
                  )
                  .map((item, indice) => (
                    <ItemLista
                      key={item.id}
                      indice={indice}
                      elemento="li"
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(item.dataDesejada)} · {mascararTelefone(item.telefone)}
                        </p>
                      </div>
                      {item.atendido ? (
                        <AppBadge tom="success">Atendido</AppBadge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => atenderEspera.mutate(item.id)}
                        >
                          Marcar atendido
                        </Button>
                      )}
                    </ItemLista>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden />
              Reservas do mês
            </span>
            <span className="text-xs font-normal tabular-nums text-muted-foreground">
              {reservasDoMes.length} reserva{reservasDoMes.length === 1 ? "" : "s"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservasDoMes.length === 0 ? (
            <AppEmptyState
              icone={CalendarDays}
              titulo="Mês livre"
              descricao="Nenhuma reserva agendada para o mês exibido. Os dias livres estão abertos na agenda."
            />
          ) : (
            <ul className="divide-y">
              {reservasDoMes.map((reserva, indice) => (
                <ItemLista
                  key={reserva.id}
                  indice={indice}
                  elemento="li"
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{reserva.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(reserva.data)} · {reserva.entrada}–{reserva.saida}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatarMoeda(reserva.valor)}
                  </span>
                </ItemLista>
              ))}
            </ul>
          )}
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
              onClick={() => criarBloqueio.mutate()}
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
