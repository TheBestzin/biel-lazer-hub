import { Fragment, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";

import { AppEmptyState } from "@/components/app/AppEmptyState";
import { CartaoErro, CartaoSecao, EsqueletoBloco } from "@/components/dashboard/Estados";
import {
  HORAS_AGENDA,
  ORDEM_DIAS,
  ROTULO_DIA_CURTO,
  ROTULO_DIA_EXTENSO,
  ROTULO_NIVEL,
  type CelulaAgenda,
  type NivelOcupacao,
} from "@/components/dashboard/modelos";
import { cn } from "@/lib/utils";
import { formatarData } from "@/utils/formatadores";

/** Cor por nível: verde (livre), âmbar (parcial), vermelho (lotado). Nunca ciano — ciano é só marca. */
const COR_NIVEL: Record<NivelOcupacao, string> = {
  livre: "bg-success/20 hover:bg-success/30",
  parcial: "bg-warning/60 hover:bg-warning/70",
  lotado: "bg-destructive/70 hover:bg-destructive/80",
};

/** Mesmas cores sólidas usadas na legenda (sem variantes de hover). */
const COR_LEGENDA: Record<NivelOcupacao, string> = {
  livre: "bg-success/20",
  parcial: "bg-warning/60",
  lotado: "bg-destructive/70",
};

const LEGENDA: NivelOcupacao[] = ["livre", "parcial", "lotado"];

interface MapaCalorAgendaProps {
  celulas: CelulaAgenda[];
  carregando: boolean;
  erro: boolean;
  onTentar: () => void;
}

const chaveCelula = (diaSemana: number, hora: number) => `${diaSemana}-${hora}`;

const diaPorExtenso = (indice: number) => ROTULO_DIA_EXTENSO[indice] ?? "";
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function MapaCalorAgenda({ celulas, carregando, erro, onTentar }: MapaCalorAgendaProps) {
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const indice = useMemo(
    () => new Map(celulas.map((celula) => [chaveCelula(celula.diaSemana, celula.hora), celula])),
    [celulas],
  );

  const celulaSelecionada = selecionada ? indice.get(selecionada) : undefined;

  return (
    <CartaoSecao
      titulo="Mapa de calor da agenda"
      descricao="Ocupação por dia da semana e horário · próximos 28 dias"
      className="xl:col-span-7"
    >
      {carregando ? (
        <EsqueletoBloco className="h-80 w-full" />
      ) : erro ? (
        <CartaoErro titulo="a agenda" onTentar={onTentar} />
      ) : celulas.length === 0 ? (
        <AppEmptyState
          icone={CalendarClock}
          titulo="Agenda vazia"
          descricao="Nenhuma reserva ou bloqueio nos próximos 28 dias."
        />
      ) : (
        <div className="space-y-4">
          <div
            className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1"
            role="grid"
            aria-label="Ocupação por dia e horário"
          >
            <div role="presentation" />
            {ORDEM_DIAS.map((dia) => (
              <div
                key={dia}
                role="columnheader"
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {ROTULO_DIA_CURTO[dia]}
              </div>
            ))}

            {HORAS_AGENDA.map((hora) => (
              <Fragment key={hora}>
                <div
                  role="rowheader"
                  className="flex items-center text-[0.7rem] text-muted-foreground tabular-nums"
                >
                  {String(hora).padStart(2, "0")}:00
                </div>
                {ORDEM_DIAS.map((dia) => {
                  const chave = chaveCelula(dia, hora);
                  const celula = indice.get(chave);
                  const nivel: NivelOcupacao = celula?.nivel ?? "livre";
                  const ativa = selecionada === chave;
                  const rotulo = `${ROTULO_DIA_EXTENSO[dia]} às ${String(hora).padStart(2, "0")}:00: ${ROTULO_NIVEL[nivel]}${
                    celula && celula.reservas.length > 0
                      ? `, ${celula.reservas.length} reserva${celula.reservas.length === 1 ? "" : "s"}`
                      : ""
                  }`;
                  return (
                    <button
                      key={chave}
                      type="button"
                      role="gridcell"
                      aria-label={rotulo}
                      aria-pressed={ativa}
                      title={rotulo}
                      onClick={() => setSelecionada(ativa ? null : chave)}
                      className={cn(
                        "h-7 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        COR_NIVEL[nivel],
                        ativa && "ring-2 ring-foreground/70",
                      )}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          <ul
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
            aria-label="Legenda"
          >
            {LEGENDA.map((nivel) => (
              <li key={nivel} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-sm", COR_LEGENDA[nivel])} aria-hidden />
                {ROTULO_NIVEL[nivel].replace(/^./, (letra) => letra.toUpperCase())}
              </li>
            ))}
          </ul>

          <div aria-live="polite" className="rounded-xl border border-border/60 bg-muted/30 p-3">
            {!celulaSelecionada ? (
              <p className="text-sm text-muted-foreground">
                Toque em um horário para ver as reservas dessa faixa.
              </p>
            ) : celulaSelecionada.reservas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {capitalizar(diaPorExtenso(celulaSelecionada.diaSemana))} às{" "}
                {String(celulaSelecionada.hora).padStart(2, "0")}:00 — nenhuma reserva.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {celulaSelecionada.reservas.map(({ reserva, data }) => (
                  <li
                    key={`${reserva.id}-${data}`}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{reserva.clienteNome}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatarData(data)} · {reserva.entrada}–{reserva.saida}
                      </p>
                    </div>
                    <Link
                      to="/reservas"
                      search={{ reserva: reserva.id }}
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                      aria-label={`Abrir reserva de ${reserva.clienteNome} em ${formatarData(data)}`}
                    >
                      Abrir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </CartaoSecao>
  );
}
