import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FiltroBarProps {
  /** Valor controlado da busca. Omitir esconde o campo de busca. */
  busca?: string;
  aoMudarBusca?: (valor: string) => void;
  placeholderBusca?: string;
  /** Selects, tabs e outros controles entre a busca e as ações. */
  children?: ReactNode;
  /** Ações à direita (botões "Novo", contagem etc.). */
  acoes?: ReactNode;
  className?: string;
}

/**
 * Barra de filtros no padrão do app: campo de busca fluido à esquerda,
 * controles no meio, ações à direita — quebra em coluna no celular.
 *
 *   <FiltroBar busca={busca} aoMudarBusca={setBusca}>
 *     <Select ...>...</Select>
 *   </FiltroBar>
 */
export function FiltroBar({
  busca,
  aoMudarBusca,
  placeholderBusca,
  children,
  acoes,
  className,
}: FiltroBarProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      {busca !== undefined && (
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder={placeholderBusca ?? "Buscar..."}
            value={busca}
            onChange={(evento) => aoMudarBusca?.(evento.target.value)}
            aria-label={placeholderBusca ?? "Buscar"}
          />
        </div>
      )}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      {acoes && <div className="flex items-center gap-2 sm:ml-auto">{acoes}</div>}
    </div>
  );
}
