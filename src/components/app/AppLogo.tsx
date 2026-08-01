import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  tamanho?: number;
}

export function AppLogo({ className, tamanho = 40 }: AppLogoProps) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Logotipo Área de Lazer Biel"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="biel-agua" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--nature)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#biel-agua)" />
      <path
        d="M14 17c0-3.3 2.7-6 6-6s6 2.7 6 6v11"
        stroke="var(--primary-foreground)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M26 17c0-3.3 2.7-6 6-6"
        stroke="var(--primary-foreground)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M9 32c2.6 0 2.6 2 5.2 2s2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 5-2"
        stroke="var(--primary-foreground)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M9 38c2.6 0 2.6 2 5.2 2s2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 5-2"
        stroke="var(--primary-foreground)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
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
