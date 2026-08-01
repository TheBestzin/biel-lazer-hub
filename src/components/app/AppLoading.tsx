import { Skeleton } from "@/components/ui/skeleton";
import { AppLogo } from "@/components/app/AppLogo";

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
    <div className="space-y-2" aria-busy>
      {Array.from({ length: linhas }).map((_, indice) => (
        <Skeleton key={indice} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CardsSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: quantidade }).map((_, indice) => (
        <Skeleton key={indice} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
