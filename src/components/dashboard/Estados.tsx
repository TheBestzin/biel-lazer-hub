import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Moldura de cada card do dashboard: título, descrição opcional e ações à direita. */
export function CartaoSecao({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: string;
  descricao?: string | undefined;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section
      aria-label={titulo}
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-elegant",
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
          {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
        </div>
        {acoes}
      </header>
      {children}
    </section>
  );
}

/** Bloco de carregamento: mesmo tamanho do conteúdo final para não haver salto de layout. */
export function EsqueletoBloco({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-xl", className)} aria-hidden />;
}

/** Erro isolado por card: o resto do painel continua funcionando. */
export function CartaoErro({ titulo, onTentar }: { titulo: string; onTentar: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="size-6 text-destructive" aria-hidden />
      <p className="text-sm font-medium">Não foi possível carregar {titulo}.</p>
      <Button variant="outline" size="sm" className="rounded-full" onClick={onTentar}>
        <RotateCcw className="size-4" aria-hidden />
        Tentar novamente
      </Button>
    </div>
  );
}
