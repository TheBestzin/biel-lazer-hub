import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, MessageCircle, X } from "lucide-react";

import { AppLogo } from "@/components/app/AppLogo";
import { Button } from "@/components/ui/button";
import { fadeIn, fadeInDown, quieto } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface LinkSecao {
  rotulo: string;
  ancora: string;
}

const LINKS: LinkSecao[] = [
  { rotulo: "Como funciona", ancora: "#como-funciona" },
  { rotulo: "O espaço", ancora: "#o-espaco" },
  { rotulo: "Depoimentos", ancora: "#depoimentos" },
  { rotulo: "Dúvidas", ancora: "#faq" },
];

/**
 * Cabeçalho público fixo: fica translúcido no topo e ganha fundo +
 * sombra ao rolar. Em telas pequenas, vira menu suspenso.
 */
export function CabecalhoSite({ whatsapp }: { whatsapp: string }) {
  const reduzir = useReducedMotion();
  const [rolou, setRolou] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const tel = whatsapp.replace(/\D/g, "");

  return (
    <motion.header
      variants={reduzir ? quieto.fadeInDown : fadeInDown}
      initial="initial"
      animate="animate"
      className={cn(
        "glass-panel fixed inset-x-0 top-0 z-40 border-x-0 border-t-0 transition-shadow duration-300",
        rolou && "shadow-soft",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <a
          href="#inicio"
          className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Área de Lazer Biel — voltar ao topo"
        >
          <AppLogo tamanho={32} />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Área de Lazer Biel
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Seções da página">
          {LINKS.map((link) => (
            <a
              key={link.ancora}
              href={link.ancora}
              className="rounded-full px-3 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.rotulo}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {tel && (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">WhatsApp</span>
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <a href="/?login=1">Área do admin</a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full lg:hidden"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {menuAberto && (
          <motion.nav
            variants={reduzir ? quieto.fadeIn : fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="border-t border-border/60 bg-card px-4 pb-4 pt-2 lg:hidden"
            aria-label="Seções da página (mobile)"
          >
            {LINKS.map((link) => (
              <a
                key={link.ancora}
                href={link.ancora}
                onClick={() => setMenuAberto(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent"
              >
                {link.rotulo}
              </a>
            ))}
            <a
              href="/?login=1"
              onClick={() => setMenuAberto(false)}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent"
            >
              Área do admin
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
