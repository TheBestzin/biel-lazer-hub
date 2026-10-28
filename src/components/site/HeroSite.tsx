import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Clock, MessageCircle, Waves, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EASING } from "@/lib/motion";
import { FOTOS_ESPACO } from "@/components/site/constantes";

interface HeroSiteProps {
  whatsapp: string;
  entrada: string;
  saida: string;
  valorDiaria: number;
}

export function HeroSite({ whatsapp, entrada, saida, valorDiaria }: HeroSiteProps) {
  const reduzir = useReducedMotion();
  const tel = whatsapp.replace(/\D/g, "");
  const foto = FOTOS_ESPACO[0]!;
  const destaques = [
    { icone: Clock, rotulo: "O dia todo", texto: `${entrada} às ${saida}` },
    { icone: Waves, rotulo: "Só para vocês", texto: "Piscina e área gourmet" },
    {
      icone: Wallet,
      rotulo: "Diária do espaço",
      texto:
        valorDiaria > 0
          ? valorDiaria.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "R$ 300,00 / diária",
    },
  ];

  return (
    <section
      id="inicio"
      className="mx-auto max-w-6xl px-4 pt-28 pb-14 sm:px-6 sm:pt-36 sm:pb-20"
      aria-label="Apresentação do espaço"
    >
      <motion.div
        initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASING }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="text-sm font-semibold text-muted-foreground">Área de Lazer Biel</p>
        <h1 className="mt-4 text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.06] font-semibold tracking-[-0.045em] text-balance">
          Seu dia. Seu espaço.
          <span className="block text-muted-foreground">Sem pressa de ir embora.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-xl">
          Piscina, área gourmet e muito verde. Um espaço só seu para aproveitar com quem faz o dia
          valer a pena.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <a href="#reservar">
              <CalendarDays aria-hidden />
              Ver datas disponíveis
            </a>
          </Button>
          {tel && (
            <Button size="lg" variant="ghost" className="text-primary hover:text-primary" asChild>
              <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden />
                Falar no WhatsApp
                <ArrowUpRight aria-hidden />
              </a>
            </Button>
          )}
        </div>
      </motion.div>

      <motion.figure
        initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: EASING }}
        className="mt-12 overflow-hidden rounded-3xl bg-muted sm:mt-14 sm:rounded-4xl"
      >
        <img
          src={foto.url}
          alt={foto.legenda}
          width={foto.largura}
          height={foto.altura}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="aspect-[4/3] w-full object-cover sm:aspect-[21/9]"
        />
      </motion.figure>

      <div className="mt-6 grid divide-y divide-border/70 rounded-2xl bg-card px-6 py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:py-6">
        {destaques.map((item) => (
          <div
            key={item.rotulo}
            className="flex items-center gap-3.5 py-4 sm:justify-center sm:px-4 sm:py-0"
          >
            <item.icone className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.rotulo}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{item.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
