import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import { pagina, quieto } from "@/lib/motion";
import { AppLogo, AppLogoCompleta } from "@/components/app/AppLogo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SinoNotificacoes } from "@/components/app/SinoNotificacoes";
import { PaletaComandos } from "@/components/app/PaletaComandos";
import { GRUPOS_NAVEGACAO, NAVEGACAO } from "@/constants/navegacao";
import { CARGOS } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTema } from "@/app/providers/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { iniciais } from "@/utils/formatadores";

function itemAtivo(para: string, caminho: string): boolean {
  return para === "/" ? caminho === "/" : caminho.startsWith(para);
}

function Navegacao({
  aoNavegar,
  compactavel = false,
}: {
  aoNavegar?: () => void;
  compactavel?: boolean;
}) {
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });
  return (
    <nav className="space-y-6" aria-label="Navegação principal">
      {GRUPOS_NAVEGACAO.map((grupo) => (
        <div key={grupo.rotulo} className="space-y-1">
          <p
            className={cn(
              "px-3 pb-1 text-xs font-medium text-muted-foreground",
              compactavel && "lg:sr-only xl:not-sr-only xl:px-3 xl:pb-1",
            )}
          >
            {grupo.rotulo}
          </p>
          {grupo.itens.map((item) => {
            const ativo = itemAtivo(item.para, caminho);
            return (
              <Tooltip key={item.para}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.para}
                    onClick={aoNavegar}
                    aria-label={item.label}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      compactavel && "lg:justify-center lg:px-0 xl:justify-start xl:px-3",
                      ativo
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    <item.icone
                      className={cn("size-5 shrink-0", ativo && "text-primary")}
                      aria-hidden
                    />
                    <span className={cn("truncate", compactavel && "lg:hidden xl:inline")}>
                      {item.label}
                    </span>
                  </Link>
                </TooltipTrigger>
                {compactavel && (
                  <TooltipContent side="right" className="xl:hidden">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function AvatarAdmin() {
  const { admin, encerrarSessao } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-11 place-items-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Menu do administrador"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
            {iniciais(admin?.nome ?? "Biel")}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold">{admin?.nome ?? "Administrador"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {admin ? CARGOS[admin.cargo] : ""}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2.5 text-destructive focus:text-destructive"
          onSelect={() => void encerrarSessao()}
        >
          <LogOut className="size-4" aria-hidden />
          Encerrar sessão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { definirTema, escuroAtivo } = useTema();
  const reduzirMovimento = useReducedMotion();
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });
  const secao = NAVEGACAO.find((item) => itemAtivo(item.para, caminho));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="glass-panel fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-y-0 border-l-0 lg:flex xl:w-60">
        <Link
          to="/"
          aria-label="Início — Área de Lazer Biel"
          className="mx-3 my-5 flex min-h-11 items-center justify-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:justify-start xl:px-2"
        >
          <AppLogo tamanho={36} className="shrink-0" />
          <span className="hidden text-sm font-semibold tracking-tight xl:inline">
            Área de Lazer Biel
          </span>
        </Link>
        <ScrollArea className="min-h-0 flex-1 px-3 pb-6">
          <Navegacao compactavel />
        </ScrollArea>
      </aside>

      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetContent
          side="left"
          className="flex w-72 flex-col rounded-r-3xl p-5 lg:hidden"
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <div className="flex items-center justify-between pr-7">
            <AppLogoCompleta compacto />
          </div>
          <ScrollArea className="mt-6 min-h-0 flex-1">
            <Navegacao aoNavegar={() => setMenuAberto(false)} />
          </ScrollArea>
          <Button variant="ghost" className="justify-start" onClick={() => setMenuAberto(false)}>
            <X className="size-4" aria-hidden /> Fechar menu
          </Button>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-20 xl:pl-60">
        <header className="glass-panel sticky top-0 z-30 flex min-h-16 items-center gap-2 border-x-0 border-t-0 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <span className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:inline">
            {secao?.label ?? "Administração"}
          </span>
          <div className="ml-auto min-w-0 sm:w-64">
            <PaletaComandos />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <SinoNotificacoes />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={escuroAtivo ? "Ativar tema claro" : "Ativar tema escuro"}
                  onClick={() => definirTema(escuroAtivo ? "light" : "dark")}
                >
                  {escuroAtivo ? (
                    <Sun className="size-4.5" aria-hidden />
                  ) : (
                    <Moon className="size-4.5" aria-hidden />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{escuroAtivo ? "Tema claro" : "Tema escuro"}</TooltipContent>
            </Tooltip>
            <AvatarAdmin />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={caminho}
              variants={reduzirMovimento ? quieto.pagina : pagina}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-7"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
