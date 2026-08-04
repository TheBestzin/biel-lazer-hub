import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppShell } from "@/components/app/AppShell";
import { TelaCarregamento } from "@/components/app/AppLoading";
import {
  TelaFirebasePendente,
  TelaLogin,
  TelaPrimeiroAcesso,
} from "@/components/app/TelasAcesso";

export function AuthGate({ children }: { children: ReactNode }) {
  const { carregando, configurado, admin, precisaConfiguracaoInicial } = useAuth();
  const rota = useRouterState({ select: (estado) => estado.location.pathname });

  // Rota pública: qualquer pessoa pode consultar disponibilidade e reservar.
  if (rota.startsWith("/reservar")) return <>{children}</>;

  if (!configurado) return <TelaFirebasePendente />;
  if (carregando) return <TelaCarregamento />;
  if (precisaConfiguracaoInicial) return <TelaPrimeiroAcesso />;
  if (!admin) return <TelaLogin />;
  return <AppShell>{children}</AppShell>;
}
