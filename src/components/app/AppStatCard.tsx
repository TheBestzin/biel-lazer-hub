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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: indice * 0.04 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-elegant transition-colors",
        aoClicar && "cursor-pointer hover:border-primary/40",
      )}
      onClick={aoClicar}
      role={aoClicar ? "button" : undefined}
      tabIndex={aoClicar ? 0 : undefined}
      onKeyDown={(evento) => {
        if (aoClicar && (evento.key === "Enter" || evento.key === " ")) aoClicar();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icone className="size-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{valor}</p>
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
