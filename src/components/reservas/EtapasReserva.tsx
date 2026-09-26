import { motion } from "framer-motion";
import { CalendarDays, Check, Clock, ClipboardCheck, User } from "lucide-react";

import { cn } from "@/lib/utils";

export const ETAPAS = [
  { id: "data", label: "Data", icone: CalendarDays },
  { id: "horario", label: "Horário", icone: Clock },
  { id: "dados", label: "Dados", icone: User },
  { id: "confirmacao", label: "Confirmação", icone: ClipboardCheck },
] as const;

export type EtapaId = (typeof ETAPAS)[number]["id"];

interface EtapasReservaProps {
  atual: number;
  aoIrPara: (etapa: number) => void;
}

export function EtapasReserva({ atual, aoIrPara }: EtapasReservaProps) {
  return (
    <nav className="relative grid grid-cols-4" aria-label="Progresso da reserva" role="group">
      <motion.div
        className="absolute top-[1.375rem] left-[12.5%] hidden h-0.5 w-[75%] bg-border sm:block"
        aria-hidden
      />
      <motion.div
        className="absolute top-[1.375rem] left-[12.5%] hidden h-0.5 w-[75%] origin-left bg-primary sm:block"
        initial={false}
        animate={{ scaleX: atual / (ETAPAS.length - 1) }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />

      {ETAPAS.map((etapa, indice) => {
        const completa = indice < atual;
        const atualItem = indice === atual;
        const clicavel = completa;

        return (
          <button
            key={etapa.id}
            type="button"
            onClick={() => clicavel && aoIrPara(indice)}
            disabled={!clicavel}
            aria-current={atualItem ? "step" : undefined}
            className={cn(
              "group relative z-10 flex cursor-pointer flex-col items-center gap-1.5 focus-visible:outline-none",
              !clicavel && "cursor-default",
            )}
          >
            <span className="relative grid place-items-center">
              <motion.span
                initial={false}
                animate={
                  atualItem
                    ? { scale: [1, 1.12, 1], transition: { duration: 0.35, ease: "easeOut" } }
                    : { scale: 1 }
                }
                className={cn(
                  "grid size-11 place-items-center rounded-full border-2 transition-all duration-300 sm:size-12",
                  completa && "border-primary bg-primary text-primary-foreground shadow-glow",
                  atualItem && "border-primary bg-background text-primary ring-4 ring-primary/15",
                  !completa && !atualItem && "border-border bg-background text-muted-foreground",
                )}
              >
                <AnimateTick mostrar={completa} />
                {!completa && (
                  <etapa.icone
                    className={cn("size-5 transition-colors", atualItem && "text-primary")}
                    aria-hidden
                  />
                )}
              </motion.span>
            </span>
            <span
              className={cn(
                "text-[0.7rem] font-semibold tracking-wide uppercase sm:text-xs",
                atualItem ? "text-primary" : completa ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {etapa.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function AnimateTick({ mostrar }: { mostrar: boolean }) {
  if (!mostrar) return null;
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
    >
      <Check className="size-5" strokeWidth={3} aria-hidden />
    </motion.span>
  );
}
