import { Link } from "@tanstack/react-router";
import { CalendarPlus, ExternalLink, MessageCircle, Search } from "lucide-react";

import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ItemLista } from "@/components/app/MotionUI";
import { BadgeStatusPagamento, BadgeStatusReserva } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { CartaoErro, CartaoSecao, EsqueletoBloco } from "@/components/dashboard/Estados";
import { linkWhatsApp } from "@/components/dashboard/modelos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Reserva } from "@/types";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

export type FiltroPagamento = "todos" | "pendente" | "pago";

const FILTROS: Array<[FiltroPagamento, string]> = [
  ["todos", "Todos"],
  ["pendente", "Pendentes"],
  ["pago", "Pagos"],
];

interface TabelaProximasReservasProps {
  reservas: Reserva[];
  /** Reservas futuras sem filtro — diferencia "nenhum resultado" de "agenda vazia". */
  totalFuturas: number;
  filtro: FiltroPagamento;
  aoMudarFiltro: (filtro: FiltroPagamento) => void;
  aoNovaReserva: () => void;
  carregando: boolean;
  erro: boolean;
  onTentar: () => void;
}

export function TabelaProximasReservas({
  reservas,
  totalFuturas,
  filtro,
  aoMudarFiltro,
  aoNovaReserva,
  carregando,
  erro,
  onTentar,
}: TabelaProximasReservasProps) {
  const seletor = (
    <div
      role="group"
      aria-label="Filtrar por pagamento"
      className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1"
    >
      {FILTROS.map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          aria-pressed={filtro === valor}
          onClick={() => aoMudarFiltro(valor)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            filtro === valor
              ? "bg-background text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );

  const descricao =
    carregando || erro
      ? undefined
      : `${reservas.length} ${reservas.length === 1 ? "reserva" : "reservas"} ${
          filtro === "todos" ? "futuras" : filtro === "pago" ? "pagas" : "com pagamento pendente"
        }`;

  return (
    <CartaoSecao
      titulo="Próximas reservas"
      descricao={descricao}
      acoes={
        <div className="flex flex-wrap items-center gap-2">
          {seletor}
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link to="/reservas" search={{ aba: "futuras" }}>
              Ver todas
            </Link>
          </Button>
        </div>
      }
    >
      {carregando ? (
        <div className="space-y-2">
          <EsqueletoBloco className="h-10 w-full" />
          <EsqueletoBloco className="h-14 w-full" />
          <EsqueletoBloco className="h-14 w-full" />
          <EsqueletoBloco className="h-14 w-full" />
        </div>
      ) : erro ? (
        <CartaoErro titulo="as próximas reservas" onTentar={onTentar} />
      ) : reservas.length === 0 ? (
        totalFuturas > 0 ? (
          <AppEmptyState
            icone={Search}
            titulo="Nenhum resultado"
            descricao="Nenhuma reserva futura corresponde a este filtro."
            acao={{ label: "Mostrar todas", aoClicar: () => aoMudarFiltro("todos") }}
          />
        ) : (
          <AppEmptyState
            icone={CalendarPlus}
            titulo="Nenhuma reserva futura"
            descricao="Crie uma reserva para começar a preencher a agenda."
            acao={{ label: "Nova reserva", aoClicar: aoNovaReserva }}
          />
        )
      ) : (
        <>
          {/* Desktop: tabela com colunas fixas; nomes longos são truncados. */}
          <div className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-36">Data</TableHead>
                  <TableHead className="w-32 text-right">Valor</TableHead>
                  <TableHead className="w-44">Status</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.map((reserva, indice) => (
                  <ItemLista
                    key={reserva.id}
                    indice={indice}
                    elemento="tr"
                    className="border-b transition-colors duration-150 hover:bg-primary-soft/40"
                  >
                    <TableCell className="truncate font-mono text-xs text-muted-foreground">
                      #{reserva.id.slice(0, 5).toUpperCase()}
                    </TableCell>
                    <TableCell className="truncate font-medium" title={reserva.clienteNome}>
                      {reserva.clienteNome}
                    </TableCell>
                    <TableCell className="truncate tabular-nums">
                      {formatarData(reserva.data)}
                      <span className="block text-xs text-muted-foreground">
                        {reserva.entrada}–{reserva.saida}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatarMoeda(reserva.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <BadgeStatusReserva status={reserva.statusReserva} />
                        <BadgeStatusPagamento status={reserva.statusPagamento} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AcoesReserva reserva={reserva} />
                    </TableCell>
                  </ItemLista>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Celular: cartões empilhados, sem colunas apertadas. */}
          <ul className="space-y-2 md:hidden">
            {reservas.map((reserva, indice) => (
              <ItemLista key={reserva.id} indice={indice} elemento="li">
                <div className="flex items-center gap-3 rounded-xl border bg-background/40 p-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{reserva.clienteNome}</p>
                      <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                        #{reserva.id.slice(0, 5).toUpperCase()}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground tabular-nums">
                      {formatarData(reserva.data)} · {reserva.entrada}–{reserva.saida} ·{" "}
                      <span className="font-semibold text-foreground">
                        {formatarMoeda(reserva.valor)}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <BadgeStatusReserva status={reserva.statusReserva} />
                      <BadgeStatusPagamento status={reserva.statusPagamento} />
                    </div>
                  </div>
                  <AcoesReserva reserva={reserva} />
                </div>
              </ItemLista>
            ))}
          </ul>
        </>
      )}
    </CartaoSecao>
  );
}

function AcoesReserva({ reserva }: { reserva: Reserva }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
        <a
          href={linkWhatsApp(reserva.clienteTelefone)}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Falar com ${reserva.clienteNome} no WhatsApp`}
          title="WhatsApp"
        >
          <MessageCircle className="size-4" aria-hidden />
        </a>
      </Button>
      <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
        <Link
          to="/reservas"
          search={{ reserva: reserva.id }}
          aria-label={`Abrir reserva de ${reserva.clienteNome}`}
          title="Abrir reserva"
        >
          <ExternalLink className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
