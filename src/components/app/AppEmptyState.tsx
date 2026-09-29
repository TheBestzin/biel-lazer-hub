import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { fadeInUp, quieto } from "@/lib/motion";

interface AppEmptyStateProps {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  acao?: { label: string; aoClicar: () => void };
  extra?: ReactNode;
}

export function AppEmptyState({
  icone: Icone,
  titulo,
  descricao,
  acao,
  extra,
}: AppEmptyStateProps) {
  const reduzir = useReducedMotion();
  return (
    <motion.div
      variants={reduzir ? quieto.fadeInUp : fadeInUp}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icone className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{descricao}</p>
      </div>
      {acao && (
        <Button className="mt-1" onClick={acao.aoClicar}>
          {acao.label}
        </Button>
      )}
      {extra}
    </motion.div>
  );
}
