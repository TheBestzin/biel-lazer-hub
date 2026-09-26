import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chaveDia, formatarData } from "@/utils/formatadores";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarioReservaProps {
  mes: Date;
  aoMudarMes: (mes: Date) => void;
  hoje: Date;
  /** Datas (yyyy-MM-dd) indisponíveis */
  ocupadas: Set<string>;
  /** Data selecionada (yyyy-MM-dd) */
  selecionada: string | null;
  aoSelecionar: (chave: string) => void;
}

export function CalendarioReserva({
  mes,
  aoMudarMes,
  hoje,
  ocupadas,
  selecionada,
  aoSelecionar,
}: CalendarioReservaProps) {
  const dias = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(mes), { locale: ptBR }),
        end: endOfWeek(endOfMonth(mes), { locale: ptBR }),
      }).map((dia) => {
        const chave = chaveDia(dia);
        const foraDoMes = !isSameMonth(dia, mes);
        const passado = isBefore(dia, hoje);
        const ocupado = ocupadas.has(chave);
        return { dia, chave, foraDoMes, desabilitado: passado || ocupado, ocupado };
      }),
    [mes, hoje, ocupadas],
  );

  const diasRestantes = useMemo(() => dias.filter((item) => !item.desabilitado).length, [dias]);

  const temSelecionada = selecionada
    ? dias.some((item) => item.chave === selecionada && !item.desabilitado)
    : false;

  return (
    <div>
      {/* Cabeçalho de navegação */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Mês anterior"
          onClick={() => aoMudarMes(addMonths(mes, -1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <p className="text-center text-sm font-semibold first-letter:uppercase sm:text-base">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={format(mes, "yyyy-MM")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="inline-block"
            >
              {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
            </motion.span>
          </AnimatePresence>
        </p>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Próximo mês"
          onClick={() => aoMudarMes(addMonths(mes, 1))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {/* Dias da semana */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:text-xs">
        {DIAS.map((dia) => (
          <span key={dia} className="py-1">
            {dia}
          </span>
        ))}
      </div>

      {/* Grade de dias com animação de troca de mês */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(mes, "yyyy-MM")}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-7 gap-1 sm:gap-2"
          role="grid"
          aria-label={`Dias de ${format(mes, "MMMM 'de' yyyy", { locale: ptBR })}`}
        >
          {dias.map(({ dia, chave, foraDoMes, desabilitado, ocupado }) => {
            const isSelecionado = selecionada === chave;
            const isHoje = isSameDay(dia, hoje);
            return (
              <motion.button
                key={chave}
                type="button"
                disabled={desabilitado}
                onClick={() => aoSelecionar(chave)}
                {...(desabilitado
                  ? {}
                  : { whileHover: { scale: 1.06 }, whileTap: { scale: 0.92 } })}
                transition={{ type: "spring", stiffness: 480, damping: 26 }}
                aria-label={`${formatarData(chave)} — ${
                  ocupado ? "indisponível" : desabilitado ? "data passada" : "disponível"
                }${isSelecionado ? " (selecionada)" : ""}`}
                aria-pressed={isSelecionado}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-colors duration-200 sm:rounded-2xl",
                  foraDoMes && "opacity-30",
                  desabilitado
                    ? "cursor-not-allowed border-transparent bg-muted/50 text-muted-foreground/60 line-through decoration-1"
                    : "cursor-pointer border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary-soft",
                  !desabilitado && !isSelecionado && "focus-visible:ring-2 focus-visible:ring-ring",
                  isSelecionado &&
                    "border-transparent bg-primary text-primary-foreground shadow-glow",
                )}
              >
                {format(dia, "d")}
                {isHoje && !isSelecionado && (
                  <span
                    className="absolute bottom-1.5 size-1 rounded-full bg-primary"
                    aria-hidden
                  />
                )}
                {isSelecionado && (
                  <motion.span
                    layoutId="dia-selecionado"
                    className="absolute inset-0 rounded-[inherit] border border-primary-foreground/30"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    aria-hidden
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legenda */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full border border-primary/40 bg-primary-soft"
            aria-hidden
          />
          Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted" aria-hidden />
          Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" aria-hidden />
          Selecionado
        </span>
        <span className="ml-auto font-medium">
          {temSelecionada || diasRestantes > 0
            ? `${diasRestantes} data${diasRestantes === 1 ? "" : "s"} livre${
                diasRestantes === 1 ? "" : "s"
              } neste mês`
            : "Nenhuma data livre neste mês"}
        </span>
      </div>
    </div>
  );
}
