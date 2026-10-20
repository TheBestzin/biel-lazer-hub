import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock, MessageCircle, Sparkles, Waves, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EASING } from "@/lib/motion";
import { FOTOS_ESPACO } from "@/components/site/constantes";

interface HeroSiteProps {
  whatsapp: string;
  entrada: string;
  saida: string;
  valorDiaria: number;
}

const DESTAQUES = [
  { icone: Clock, rotulo: "Horário" },
  { icone: Waves, rotulo: "Estrutura", texto: "Piscina + Área gourmet" },
  { icone: Wallet, rotulo: "Investimento" },
] as const;

export function HeroSite({ whatsapp, entrada, saida, valorDiaria }: HeroSiteProps) {
  const reduzir = useReducedMotion();
  const [slide, setSlide] = useState(0);

  // Pré-carrega todas as fotos para o carrossel nunca aparecer vazio.
  useEffect(() => {
    FOTOS_ESPACO.forEach((foto) => {
      const img = new Image();
      img.src = foto.url;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((atual) => (atual + 1) % FOTOS_ESPACO.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const tel = whatsapp.replace(/\D/g, "");

  const destaques = [
    { ...DESTAQUES[0], texto: `${entrada} – ${saida}` },
    { ...DESTAQUES[1], texto: DESTAQUES[1].texto },
    {
      ...DESTAQUES[2],
      texto: valorDiaria > 0 ? `${formatarDiaria(valorDiaria)} / diária` : "R$ 300,00 / diária",
    },
  ];

  return (
    <section className="relative isolate" aria-label="Apresentação do espaço">
      <div
        className="absolute inset-0 overflow-hidden bg-slate-900 bg-cover bg-center"
        style={{ backgroundImage: `url(${FOTOS_ESPACO[0]!.url})` }}
        aria-hidden
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={FOTOS_ESPACO[slide]!.url}
            src={FOTOS_ESPACO[slide]!.url}
            alt=""
            width={FOTOS_ESPACO[slide]!.largura}
            height={FOTOS_ESPACO[slide]!.altura}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={
              reduzir
                ? { opacity: { duration: 0.3 }, scale: { duration: 0.3 } }
                : {
                    opacity: { duration: 1.6, ease: "easeInOut" },
                    scale: { duration: 7, ease: "linear" },
                  }
            }
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[64vh] max-w-6xl flex-col justify-end gap-6 px-4 pt-28 pb-12 sm:px-6 sm:pt-36 sm:pb-16">
        <motion.div
          initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduzir ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASING }}
          className="space-y-5"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-[0.7rem] font-semibold tracking-[0.15em] text-primary uppercase">
            <Sparkles className="size-3" aria-hidden />
            Reservas online
          </span>
          <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl lg:text-6xl">
            Área de Lazer Biel
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-foreground/80 sm:text-xl sm:leading-relaxed">
            Seu dia de descanso começa aqui.
          </p>
          <p className="text-sm font-semibold tracking-[0.12em] text-primary uppercase">
            Piscina • Área gourmet • Espaço exclusivo
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="xl" className="tap-press" asChild>
              <a href="#reservar">
                <CalendarDays className="size-4.5" aria-hidden />
                Ver datas disponíveis
              </a>
            </Button>
            {tel && (
              <Button size="xl" variant="outline" className="tap-press" asChild>
                <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4.5" aria-hidden />
                  Falar no WhatsApp
                </a>
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={reduzir ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASING }}
          className="grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-1 shadow-elegant sm:grid-cols-3"
        >
          {destaques.map((item) => (
            <div
              key={item.rotulo}
              className="flex items-center gap-4 px-5 py-4 sm:px-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <item.icone className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {item.rotulo}
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">{item.texto}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function formatarDiaria(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
