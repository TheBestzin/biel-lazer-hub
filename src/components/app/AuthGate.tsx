import type { ReactNode } from "react";

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

  if (!configurado) return <TelaFirebasePendente />;
  if (carregando) return <TelaCarregamento />;
  if (precisaConfiguracaoInicial) return <TelaPrimeiroAcesso />;
  if (!admin) return <TelaLogin />;
  return <AppShell>{children}</AppShell>;
}
