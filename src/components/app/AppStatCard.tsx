import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatarPercentual } from "@/utils/formatadores";

interface AppStatCardProps {
  titulo: string;
  valor: string;
  icone: LucideIcon;
  descricao?: string;
  dica?: string;
  variacao?: number | null;
  aoClicar?: () => void;
  indice?: number;
}

export function AppStatCard({
  titulo,
  valor,
  icone: Icone,
  descricao,
  dica,
  variacao,
  aoClicar,
  indice = 0,
}: AppStatCardProps) {
  const positiva = (variacao ?? 0) >= 0;
  const conteudo = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: indice * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "group card-hover relative overflow-hidden rounded-2xl border bg-card p-5 shadow-elegant",
        aoClicar && "cursor-pointer hover:border-primary/40",
      )}
      onClick={aoClicar}
      role={aoClicar ? "button" : undefined}
      tabIndex={aoClicar ? 0 : undefined}
      onKeyDown={(evento) => {
        if (aoClicar && (evento.key === "Enter" || evento.key === " ")) aoClicar();
      }}
    >
      <span
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full brand-gradient opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-20"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
          <Icone className="size-4.5" aria-hidden />
        </span>
      </div>
      <p className="font-display relative mt-3 text-[1.75rem] font-bold tracking-tight tabular-nums">
        {valor}
      </p>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {typeof variacao === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
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
