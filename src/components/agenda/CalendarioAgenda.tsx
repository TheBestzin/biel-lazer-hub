import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOTIVOS_BLOQUEIO } from "@/constants";
import type { Bloqueio, Reserva } from "@/types";
import { chaveDia } from "@/utils/formatadores";
import { quieto, slideIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface CalendarioAgendaProps {
  referencia: Date;
  aoMudar: (proxima: Date, direcao: "esquerda" | "direita") => void;
  mapaReservas: Map<string, Reserva>;
  mapaBloqueios: Map<string, Bloqueio>;
  /** Dias livres: chamado ao clicar para pré-preencher a nova reserva. */
  aoNovoDia: (dataISO: string) => void;
}

/** Calendário mensal com reservas, bloqueios, navegação e legenda. */
export function CalendarioAgenda({
  referencia,
  aoMudar,
  mapaReservas,
  mapaBloqueios,
  aoNovoDia,
}: CalendarioAgendaProps) {
  const reduzir = useReducedMotion();
  const [direcao, setDirecao] = useState<"esquerda" | "direita">("direita");

  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(referencia), { locale: ptBR }),
    end: endOfWeek(endOfMonth(referencia), { locale: ptBR }),
  });
  const hoje = chaveDia(new Date());

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base capitalize">
          {format(referencia, "MMMM 'de' yyyy", { locale: ptBR })}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => {
              setDirecao("esquerda");
              aoMudar(addMonths(referencia, -1), "esquerda");
            }}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDirecao("direita");
              aoMudar(new Date(), "direita");
            }}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => {
              setDirecao("direita");
              aoMudar(addMonths(referencia, 1), "direita");
            }}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" aria-hidden />
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
        {/* Troca de mês: slide horizontal contínuo — o mês anterior
            sai na direção oposta à do mês que entra (motion.ts: slideIn). */}
        <AnimatePresence mode="wait" initial={false} custom={direcao}>
          <motion.div
            key={format(referencia, "yyyy-MM")}
            custom={direcao}
            variants={reduzir ? quieto.slideIn : slideIn(direcao)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid grid-cols-7 gap-1"
          >
            {dias.map((dia) => {
              const chave = format(dia, "yyyy-MM-dd");
              const reserva = mapaReservas.get(chave);
              const bloqueio = mapaBloqueios.get(chave);
              const doMes = isSameMonth(dia, referencia);
              const eHoje = chave === hoje;
              return (
                <button
                  key={chave}
                  type="button"
                  onClick={() => !bloqueio && !reserva && aoNovoDia(chave)}
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1 rounded-xl border p-2 text-left transition-colors",
                    !doMes && "opacity-40",
                    reserva && "border-primary/40 bg-primary-soft",
                    bloqueio && "border-destructive/30 bg-destructive/10",
                    !reserva && !bloqueio && "hover:border-primary/40",
                    eHoje && "ring-2 ring-primary/50",
                  )}
                  aria-label={`Dia ${format(dia, "dd/MM/yyyy")}`}
                  aria-current={eHoje ? "date" : undefined}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      eHoje &&
                        "flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground",
                    )}
                  >
                    {format(dia, "d")}
                  </span>
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
          </motion.div>
        </AnimatePresence>

        {/* Legenda */}
        <div
          className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-hidden
        >
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" /> Reservado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive" /> Bloqueado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-2 ring-primary/50" /> Hoje
          </span>
          <span className="ml-auto hidden sm:block">Clique num dia livre para reservar</span>
        </div>
      </CardContent>
    </Card>
  );
}
