import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { fadeInDown, quieto } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  /**
   * `cartao` (padrão): cabeçalho emoldurado, com fundo e borda.
   * `limpo`: título e subtítulo direto sobre o fundo da página — dá mais
   * respiro vertical para o conteúdo abaixo (usado no dashboard).
   */
  variante?: "cartao" | "limpo";
}

export function PageHeader({ titulo, descricao, acoes, variante = "cartao" }: PageHeaderProps) {
  const reduzir = useReducedMotion();
  const limpo = variante === "limpo";
  return (
    <motion.header
      variants={reduzir ? quieto.fadeInDown : fadeInDown}
      initial="initial"
      animate="animate"
      className={cn(
        "relative",
        limpo
          ? "py-1"
          : "overflow-hidden rounded-3xl border bg-card/70 p-5 shadow-elegant backdrop-blur sm:p-6",
      )}
    >
      {!limpo && (
        <div
          className="pointer-events-none absolute inset-0 mesh-gradient opacity-70"
          aria-hidden
        />
      )}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            {!limpo && (
              <span className="h-6 w-1.5 shrink-0 rounded-full brand-gradient" aria-hidden />
            )}
            <h1
              className={cn(
                "font-sans truncate font-bold tracking-tight",
                limpo ? "text-[2rem] sm:text-[2.25rem]" : "text-3xl sm:text-[2.5rem]",
              )}
            >
              {titulo}
            </h1>
          </div>
          {descricao && (
            <p className={cn("text-sm text-muted-foreground", !limpo && "sm:pl-4")}>{descricao}</p>
          )}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </motion.header>
  );
}
