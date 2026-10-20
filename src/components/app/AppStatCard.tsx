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
  /** Card de destaque: fundo em gradiente da marca (azul/ciano). */
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
        "group card-hover relative overflow-hidden rounded-2xl border p-5",
        destaque
          ? "flex flex-col border-white/10 shadow-elegant destaque-gradient text-white"
          : "bg-card shadow-elegant",
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
      {!destaque && (
        <span
          className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full brand-gradient opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-20"
          aria-hidden
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <p
          className={cn(
            "font-sans font-medium leading-relaxed",
            destaque ? "text-white/85" : "text-muted-foreground",
          )}
        >
          {titulo}
        </p>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
            destaque
              ? "bg-white/15 text-white ring-1 ring-white/25"
              : "bg-primary-soft text-primary ring-1 ring-primary/10",
          )}
        >
          <Icone className="size-4.5" aria-hidden />
        </span>
      </div>
      <p
        className={cn(
          "font-sans relative font-bold tracking-tight lining-nums tabular-nums",
          destaque ? "mt-auto text-[2rem]" : "mt-3 text-[1.5rem]",
        )}
      >
        {typeof valorNumerico === "number" ? (
          <AnimarNumero valor={valorNumerico} formato={formato} />
        ) : (
          valor
        )}
      </p>
      <div className={cn("mt-2 flex items-center gap-2 text-sm", destaque && "text-white/85")}>
        {typeof variacao === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5",
              destaque
                ? "rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white ring-1 ring-white/25"
                : "font-medium",
              !destaque && (positiva ? "text-success" : "text-destructive"),
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
