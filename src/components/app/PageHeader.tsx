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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </motion.header>
  );
}
