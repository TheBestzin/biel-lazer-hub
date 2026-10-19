import { motion } from "framer-motion";

import { Skeleton } from "@/components/ui/skeleton";
import { AppLogo } from "@/components/app/AppLogo";
import { fadeIn } from "@/lib/motion";

export function AppLoading({ mensagem = "Carregando..." }: { mensagem?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <AppLogo className="animate-pulse" tamanho={56} />
      <p className="text-sm text-muted-foreground">{mensagem}</p>
    </div>
  );
}

export function TelaCarregamento() {
  return (
    <div className="surface-gradient flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <AppLogo className="animate-pulse" tamanho={64} />
      <div className="text-center">
        <p className="text-base font-semibold tracking-tight">Área de Lazer Biel</p>
        <p className="text-sm text-muted-foreground">Preparando o sistema...</p>
      </div>
    </div>
  );
}

export function ListaSkeleton({ linhas = 6 }: { linhas?: number }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="space-y-2"
      aria-busy
    >
      {Array.from({ length: linhas }).map((_, indice) => (
        <div
          key={indice}
          className="flex items-center gap-3 rounded-xl border bg-card p-4"
          style={{ animationDelay: `${indice * 60}ms` }}
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function CardsSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: quantidade }).map((_, indice) => (
        <div
          key={indice}
          className="rounded-2xl border bg-card p-5 shadow-elegant"
          style={{ animationDelay: `${indice * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="size-10 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-8 w-2/3" />
          <Skeleton className="mt-3 h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton da tabela: cabeçalho + linhas no formato das colunas. */
export function TabelaSkeleton({ linhas = 6, colunas = 5 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="space-y-2" aria-busy>
      <div className="flex gap-3 border-b pb-2">
        {Array.from({ length: colunas }).map((_, indice) => (
          <Skeleton key={indice} className="h-3.5 flex-1 rounded-full" />
        ))}
      </div>
      {Array.from({ length: linhas }).map((_, indice) => (
        <div key={indice} className="flex items-center gap-3 rounded-xl p-2">
          {Array.from({ length: colunas }).map((__, coluna) => (
            <Skeleton
              key={coluna}
              className="h-4 flex-1"
              style={{ animationDelay: `${indice * 60}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
