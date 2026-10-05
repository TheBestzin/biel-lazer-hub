import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  tamanho?: number;
}

export function AppLogo({ className, tamanho = 40 }: AppLogoProps) {
  return (
    <img
      src="/logo-biel.png"
      width={tamanho}
      height={tamanho}
      alt="Logotipo Área de Lazer Biel"
      decoding="async"
      className={cn("logo-entrada shrink-0 object-contain", className)}
      style={{ width: tamanho, height: tamanho }}
    />
  );
}

export function AppLogoCompleta({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <AppLogo tamanho={36} />
      {!compacto && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Área de Lazer Biel</p>
          <p className="text-[11px] text-muted-foreground">Gerenciamento de Reservas</p>
        </div>
      )}
    </div>
  );
}
