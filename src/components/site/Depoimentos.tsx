import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TituloSecao } from "@/components/site/SecoesSite";
import { DEPOIMENTOS } from "@/components/site/constantes";
import { quieto, revelarContainer, revelarItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Carrossel de depoimentos de clientes (embla, com autoplay leve). */
export function Depoimentos() {
  const reduzir = useReducedMotion();
  const [referenciaEmbla, apiEmbla] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });
  const [indice, setIndice] = useState(0);

  const aoSelecionar = useCallback(() => {
    if (apiEmbla) setIndice(apiEmbla.selectedScrollSnap());
  }, [apiEmbla]);

  useEffect(() => {
    if (!apiEmbla) return;
    aoSelecionar();
    apiEmbla.on("select", aoSelecionar);
    return () => {
      apiEmbla.off("select", aoSelecionar);
    };
  }, [apiEmbla, aoSelecionar]);

  // Autoplay suave — pausa quando o usuário interage (drag/teclado).
  useEffect(() => {
    if (!apiEmbla) return;
    const id = window.setInterval(() => apiEmbla.scrollNext(), 6000);
    const pausar = () => window.clearInterval(id);
    apiEmbla.on("pointerDown", pausar);
    return () => {
      apiEmbla.off("pointerDown", pausar);
      window.clearInterval(id);
    };
  }, [apiEmbla]);

  return (
    <section id="depoimentos" className="scroll-mt-24 py-16 sm:py-20" aria-label="Depoimentos">
      <TituloSecao
        kicker="Quem já viveu"
        titulo="Experiências de quem reservou"
        descricao="Relatos reais de famílias e grupos que passaram um dia aqui."
      />

      <motion.div
        variants={reduzir ? quieto.revelarContainer : revelarContainer}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto mt-10 max-w-5xl sm:mt-12"
      >
        <motion.div variants={reduzir ? quieto.revelarItem : revelarItem} className="relative">
          <div ref={referenciaEmbla} className="overflow-hidden rounded-3xl">
            <div className="flex touch-pan-y">
              {DEPOIMENTOS.map((depoimento) => (
                <figure
                  key={depoimento.autor}
                  className="min-w-0 shrink-0 grow-0 basis-full pl-0.5 sm:basis-1/2"
                >
                  <div className="card-hover mx-2 flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 p-6 backdrop-blur sm:p-7">
                    <div className="flex items-center justify-between">
                      <span className="flex gap-0.5" aria-label="5 de 5 estrelas">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="size-4 fill-warning text-warning" aria-hidden />
                        ))}
                      </span>
                      <Quote className="size-6 text-primary/25" aria-hidden />
                    </div>
                    <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                      “{depoimento.texto}”
                    </blockquote>
                    <figcaption className="flex items-center gap-3 border-t border-border/60 pt-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                        {depoimento.autor.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {depoimento.autor}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {depoimento.ocasiao}
                        </span>
                      </span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Depoimento anterior"
              onClick={() => apiEmbla?.scrollPrev()}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <div className="flex gap-1.5" role="tablist" aria-label="Escolher depoimento">
              {DEPOIMENTOS.map((depoimento, i) => (
                <button
                  key={depoimento.autor}
                  type="button"
                  role="tab"
                  aria-selected={i === indice}
                  aria-label={`Depoimento ${i + 1}`}
                  onClick={() => apiEmbla?.scrollTo(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === indice
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Próximo depoimento"
              onClick={() => apiEmbla?.scrollNext()}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
