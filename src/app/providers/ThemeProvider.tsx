import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Tema } from "@/types";

interface EstadoTema {
  tema: Tema;
  definirTema: (tema: Tema) => void;
  escuroAtivo: boolean;
}

const ThemeContext = createContext<EstadoTema | null>(null);
const CHAVE = "biel:tema";

function aplicar(tema: Tema): boolean {
  const prefereEscuro =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const escuro = tema === "dark" || (tema === "system" && prefereEscuro);
  document.documentElement.classList.toggle("dark", escuro);
  return escuro;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("system");
  const [escuroAtivo, setEscuroAtivo] = useState(false);

  useEffect(() => {
    const salvo = (localStorage.getItem(CHAVE) as Tema | null) ?? "system";
    setTema(salvo);
    setEscuroAtivo(aplicar(salvo));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => {
      if (tema === "system") setEscuroAtivo(aplicar("system"));
    };
    media.addEventListener("change", aoMudar);
    return () => media.removeEventListener("change", aoMudar);
  }, [tema]);

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo);
    localStorage.setItem(CHAVE, novo);
    setEscuroAtivo(aplicar(novo));
  }, []);

  const valor = useMemo(() => ({ tema, definirTema, escuroAtivo }), [tema, definirTema, escuroAtivo]);
  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTema(): EstadoTema {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error("useTema deve ser usado dentro de ThemeProvider.");
  return contexto;
}
