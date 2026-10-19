import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { fadeIn, pagina, quieto, springFisica } from "@/lib/motion";

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
import { SinoNotificacoes } from "@/components/app/SinoNotificacoes";
import { PaletaComandos } from "@/components/app/PaletaComandos";
import { GRUPOS_NAVEGACAO, NAVEGACAO } from "@/constants/navegacao";
import { CARGOS } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTema } from "@/app/providers/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { iniciais } from "@/utils/formatadores";

/** Rota atual — único lugar onde decidimos "item ativo". */
function usarItemAtivo(para: string, caminho: string): boolean {
  return para === "/" ? caminho === "/" : caminho.startsWith(para);
}

/* ------------------------------------------------------------------ */
/* Rail de ícones (desktop): estreito, só ícones, ativo destacado.     */
/* ------------------------------------------------------------------ */

function RotaLateral() {
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });
  return (
    <nav className="flex flex-col items-center gap-1.5" aria-label="Navegação principal">
      {NAVEGACAO.map((item) => {
        const ativo = usarItemAtivo(item.para, caminho);
        return (
          <Tooltip key={item.para}>
            <TooltipTrigger asChild>
              <Link
                to={item.para}
                aria-label={item.label}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "group relative grid size-11 place-items-center rounded-2xl transition-all duration-200",
                  ativo
                    ? "bg-primary-soft text-primary shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !ativo && "hover:scale-105",
                )}
              >
                <item.icone
                  className={cn(
                    "size-[1.15rem] transition-transform duration-200",
                    !ativo && "group-hover:scale-110",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "absolute -top-1 left-1/2 h-4 w-1 -translate-x-1/2 rounded-full brand-gradient transition-opacity",
                    ativo ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Navegação agrupada — mantida para a gaveta do celular.              */
/* ------------------------------------------------------------------ */

function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });
  return (
    <nav className="space-y-5" aria-label="Navegação do menu">
      {GRUPOS_NAVEGACAO.map((grupo) => (
        <div key={grupo.rotulo} className="space-y-1">
          <p className="px-3 pb-1 text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground/70 uppercase">
            {grupo.rotulo}
          </p>
          {grupo.itens.map((item) => {
            const ativo = usarItemAtivo(item.para, caminho);
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
                <item.icone className="size-4.5 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Pílulas da topbar (desktop): seções principais + menu "Mais".      */
/* ------------------------------------------------------------------ */

const PILULAS = NAVEGACAO.filter((item) =>
  ["/", "/reservas", "/agenda", "/clientes", "/financeiro"].includes(item.para),
) as (typeof NAVEGACAO)[number][];

const MAIS = NAVEGACAO.filter((item) => !PILULAS.includes(item));

function PilastraNavegacao() {
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });
  const maisAtivo = MAIS.some((item) => usarItemAtivo(item.para, caminho));
  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 self-center rounded-full border border-border/60 bg-card/50 p-1 backdrop-blur lg:flex"
      aria-label="Seções principais"
    >
      {PILULAS.map((item) => {
        const ativo = usarItemAtivo(item.para, caminho);
        return (
          <Link
            key={item.para}
            to={item.para}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              ativo
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={ativo ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors duration-200",
            maisAtivo
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label="Mais seções"
        >
          Mais
          <ChevronDown className="size-3.5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-44">
          {MAIS.map((item) => (
            <DropdownMenuItem key={item.para} className="gap-2.5 text-sm" asChild>
              <Link to={item.para}>
                <item.icone className="size-4 text-muted-foreground" aria-hidden />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar do administrador (canto direito da topbar).                  */
/* ------------------------------------------------------------------ */

function AvatarAdmin() {
  const { admin, encerrarSessao } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none ring-primary/40 transition-transform duration-200 hover:scale-105 focus-visible:ring-2"
        aria-label="Menu do administrador"
      >
        <Avatar className="size-9 ring-2 ring-primary/25">
          <AvatarFallback className="brand-gradient text-xs font-bold text-primary-foreground">
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
          <p className="text-sm font-medium break-words" title={admin?.nome}>
            {admin?.nome}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {admin ? CARGOS[admin.cargo] : ""}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair do sistema"
              onClick={() => void encerrarSessao()}
            >
              <LogOut className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sair</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { tema, definirTema, escuroAtivo } = useTema();
  const reduzirMovimento = useReducedMotion();
  const caminho = useRouterState({ select: (estado) => estado.location.pathname });

  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-0 mesh-gradient opacity-60 dark:opacity-40"
        aria-hidden
      />

      {/* Rail de ícones — desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden flex-col items-center gap-4 border-r border-border/60 bg-sidebar/85 py-4 backdrop-blur-xl lg:flex lg:w-[4.5rem]">
        <Link to="/" aria-label="Início — área de lazer Biel" className="rounded-2xl">
          <AppLogo tamanho={36} className="rounded-xl shadow-soft" />
        </Link>
        <div className="h-px w-8 bg-border/70" aria-hidden />
        <ScrollArea className="flex-1">
          <RotaLateral />
        </ScrollArea>
      </aside>

      {/* Gaveta — celular/tablet */}
      <AnimatePresence>
        {menuAberto && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
            onClick={() => setMenuAberto(false)}
          >
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={reduzirMovimento ? { duration: 0 } : springFisica}
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

      <div className="relative flex min-w-0 flex-1 flex-col lg:pl-[4.5rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:px-5 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <div className="shrink-0 lg:hidden">
            <AppLogoCompleta compacto />
          </div>

          {/* Pílulas centrais (desktop) */}
          <PilastraNavegacao />
          {/* Fecha pílulas: desktop usa flex-1; mobile ocupa o resto */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
            <PaletaComandos />
            <SinoNotificacoes />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label={escuroAtivo ? "Ativar tema claro" : "Ativar tema escuro"}
                  onClick={() => definirTema(tema === "dark" ? "light" : "dark")}
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
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {/* Transição de rota: fade + slide sutil, saída mais rápida que a
              entrada (ver src/lib/motion.ts). Nunca corte seco. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={caminho}
              variants={reduzirMovimento ? quieto.pagina : pagina}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
