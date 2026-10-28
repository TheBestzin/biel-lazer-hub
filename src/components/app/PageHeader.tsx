import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { fadeInDown, quieto } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  variante?: "cartao" | "limpo";
}

export function PageHeader({ titulo, descricao, acoes, variante = "cartao" }: PageHeaderProps) {
  const reduzir = useReducedMotion();
  return (
    <motion.header
      variants={reduzir ? quieto.fadeInDown : fadeInDown}
      initial="initial"
      animate="animate"
      className={cn(
        "flex flex-wrap items-start justify-between gap-5 py-1",
        variante === "cartao" && "pb-3",
      )}
    >
      <div className="min-w-0 space-y-2">
        <h1 className="text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{descricao}</p>
        )}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </motion.header>
  );
}
