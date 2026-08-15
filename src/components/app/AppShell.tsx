import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

import { AppLogoCompleta } from "@/components/app/AppLogo";
import { NAVEGACAO } from "@/constants/navegacao";
import { CARGOS } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTema } from "@/app/providers/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { iniciais } from "@/utils/formatadores";

function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });
  return (
    <nav className="space-y-1" aria-label="Navegação principal">
      {NAVEGACAO.map((item) => {
        const ativo = item.para === "/" ? caminho === "/" : caminho.startsWith(item.para);
        return (
          <Link
            key={item.para}
            to={item.para}
            onClick={aoNavegar}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              ativo
                ? "bg-primary-soft text-primary shadow-soft"
                : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full brand-gradient transition-opacity",
                ativo ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
            <item.icone
              className={cn(
                "size-4.5 shrink-0 transition-transform duration-200",
                !ativo && "group-hover:scale-110",
              )}
              aria-hidden
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>

  );
}

function PerfilRodape() {
  const { admin, encerrarSessao } = useAuth();
  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center gap-3 px-1">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
            {iniciais(admin?.nome ?? "Biel")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{admin?.nome}</p>
          <p className="truncate text-xs text-muted-foreground">
            {admin ? CARGOS[admin.cargo] : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sair do sistema"
          onClick={() => void encerrarSessao()}
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { tema, definirTema, escuroAtivo } = useTema();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card p-4 lg:flex">
        <AppLogoCompleta />
        <ScrollArea className="-mx-1 mt-6 flex-1 px-1">
          <Navegacao />
        </ScrollArea>
        <PerfilRodape />
      </aside>

      <AnimatePresence>
        {menuAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
            onClick={() => setMenuAberto(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="flex h-full w-72 flex-col border-r bg-card p-4"
              onClick={(evento) => evento.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <AppLogoCompleta />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Fechar menu"
                  onClick={() => setMenuAberto(false)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
              <ScrollArea className="-mx-1 mt-6 flex-1 px-1">
                <Navegacao aoNavegar={() => setMenuAberto(false)} />
              </ScrollArea>
              <PerfilRodape />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <div className="lg:hidden">
            <AppLogoCompleta compacto />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={escuroAtivo ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={() => definirTema(tema === "dark" ? "light" : "dark")}
            >
              {escuroAtivo ? <Sun className="size-4.5" aria-hidden /> : <Moon className="size-4.5" aria-hidden />}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
