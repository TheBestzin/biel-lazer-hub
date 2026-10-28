import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimarNumero } from "@/components/app/MotionUI";
import { staggerItemIndice, quieto } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatarPercentual } from "@/utils/formatadores";

interface AppStatCardProps {
  titulo: string;
  /** Valor formatado estático (usado sozinho ou como fallback SSR). */
  valor: string;
  /** Valor numérico: quando informado, o número transiciona com contagem incremental. */
  valorNumerico?: number;
  /** Formatador aplicado ao valor numérico animado (ex.: formatarMoeda). */
  formato?: (n: number) => string;
  icone: LucideIcon;
  descricao?: string;
  dica?: string;
  variacao?: number | null;
  aoClicar?: () => void;
  indice?: number;
  className?: string;
  /** Card principal: maior hierarquia tipográfica sobre a mesma superfície. */
  destaque?: boolean;
}

export function AppStatCard({
  titulo,
  valor,
  valorNumerico,
  formato,
  icone: Icone,
  descricao,
  dica,
  variacao,
  aoClicar,
  indice = 0,
  className,
  destaque = false,
}: AppStatCardProps) {
  const reduzir = useReducedMotion();
  const positiva = (variacao ?? 0) >= 0;
  const conteudo = (
    <motion.div
      custom={indice}
      variants={reduzir ? quieto.staggerItem : staggerItemIndice}
      initial="initial"
      animate="animate"
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card",
        destaque && "flex flex-col",
        aoClicar && "cursor-pointer hover:border-primary/40",
        className,
      )}
      onClick={aoClicar}
      role={aoClicar ? "button" : undefined}
      tabIndex={aoClicar ? 0 : undefined}
      onKeyDown={(evento) => {
        if (aoClicar && (evento.key === "Enter" || evento.key === " ")) aoClicar();
      }}
    >
      <div className="relative flex items-start justify-between gap-3">
        <p className={cn("font-sans font-medium leading-relaxed", "text-sm text-muted-foreground")}>
          {titulo}
        </p>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
            "bg-muted text-muted-foreground",
          )}
        >
          <Icone className="size-4.5" aria-hidden />
        </span>
      </div>
      <p
        className={cn(
          "font-sans relative font-semibold tracking-tight lining-nums tabular-nums",
          destaque ? "mt-8 text-4xl sm:mt-auto sm:text-[2.75rem]" : "mt-4 text-3xl",
        )}
      >
        {typeof valorNumerico === "number" ? (
          <AnimarNumero valor={valorNumerico} formato={formato} />
        ) : (
          valor
        )}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {typeof variacao === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5",
              "font-medium",
              positiva ? "text-success" : "text-destructive",
            )}
          >
            {positiva ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden />
            )}
            {formatarPercentual(Math.abs(variacao))}
          </span>
        )}
        {descricao && <span>{descricao}</span>}
      </div>
    </motion.div>
  );

  if (!dica) return conteudo;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{conteudo}</TooltipTrigger>
      <TooltipContent>{dica}</TooltipContent>
    </Tooltip>
  );
}
