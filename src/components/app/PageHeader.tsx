import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}

export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative overflow-hidden rounded-3xl border bg-card/70 p-5 shadow-elegant backdrop-blur sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-70" aria-hidden />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1.5 shrink-0 rounded-full brand-gradient" aria-hidden />
            <h1 className="font-display truncate text-2xl font-bold sm:text-[1.75rem]">{titulo}</h1>
          </div>
          {descricao && (
            <p className="text-sm text-muted-foreground sm:pl-4">{descricao}</p>
          )}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </motion.header>
  );
}
