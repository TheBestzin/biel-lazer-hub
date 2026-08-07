import type { ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";

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
  const busca = useRouterState({ select: (estado) => estado.location.searchStr });

  // Rota pública: qualquer pessoa pode consultar disponibilidade e reservar.
  if (rota.startsWith("/reservar")) return <>{children}</>;

  if (!configurado) return <TelaFirebasePendente />;
  if (carregando) return <TelaCarregamento />;
  if (precisaConfiguracaoInicial) return <TelaPrimeiroAcesso />;

  // Visitantes que abrem o site caem direto na página pública de datas.
  if (!admin && rota === "/" && !busca.includes("login")) {
    return <Navigate to="/reservar" replace />;
  }

  if (!admin) return <TelaLogin />;
  return <AppShell>{children}</AppShell>;
}

