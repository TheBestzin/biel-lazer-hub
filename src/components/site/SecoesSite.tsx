import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Revelar } from "@/components/app/MotionUI";
import { BENEFICIOS, FOTOS_ESPACO, PASSOS_RESERVA } from "@/components/site/constantes";
import { quieto, revelarContainer, revelarItem } from "@/lib/motion";

/** Título padrão das seções públicas (kicker + heading + descrição). */
export function TituloSecao({
  kicker,
  titulo,
  descricao,
}: {
  kicker: string;
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[0.65rem] font-bold tracking-[0.22em] text-primary uppercase">
        <Sparkles className="size-3" aria-hidden />
        {kicker}
      </span>
      <h2 className="section-titulo text-3xl font-bold sm:text-4xl">{titulo}</h2>
      {descricao && <p className="text-pretty text-muted-foreground">{descricao}</p>}
    </div>
  );
}

/** Três passos numerados — como reservar, em 30 segundos de leitura. */
export function ComoFunciona() {
  const reduzir = useReducedMotion();
  return (
    <section id="como-funciona" className="scroll-mt-24 py-16 sm:py-20" aria-label="Como funciona">
      <TituloSecao
        kicker="Simples assim"
        titulo="Reserve em 3 passos"
        descricao="Sem cadastro, sem burocracia. Do calendário à confirmação em poucos minutos."
      />
      <motion.ol
        variants={reduzir ? quieto.revelarContainer : revelarContainer}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto mt-10 grid max-w-5xl gap-4 sm:mt-12 sm:grid-cols-3"
      >
        {PASSOS_RESERVA.map((passo, indice) => (
          <motion.li
            key={passo.titulo}
            variants={reduzir ? quieto.revelarItem : revelarItem}
            className="card-hover relative rounded-3xl border border-border/70 bg-card/70 p-6 backdrop-blur"
          >
            <span
              className="font-display absolute -top-4 right-5 text-6xl font-bold text-primary/12 select-none"
              aria-hidden
            >
              {indice + 1}
            </span>
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <passo.icone className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-bold">{passo.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {passo.descricao}
            </p>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}

/** Galeria com legendas — fotos reais do espaço, sem dependências externas. */
export function GaleriaEspaco() {
  const reduzir = useReducedMotion();
  return (
    <section id="o-espaco" className="scroll-mt-24 py-16 sm:py-20" aria-label="Fotos do espaço">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[0.65rem] font-bold tracking-[0.22em] text-primary uppercase">
            O espaço
          </span>
          <h2 className="section-titulo text-3xl font-bold sm:text-4xl">Conheça de perto</h2>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Fotos reais da nossa área de lazer
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FOTOS_ESPACO.map((foto, indice) => (
          <Revelar key={foto.url} atraso={indice * 0.05}>
            <figure className="group card-hover relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/60">
              <img
                src={foto.url}
                alt={foto.legenda}
                width={foto.largura}
                height={foto.altura}
                loading={indice === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 text-xs font-medium text-foreground">
                {foto.legenda}
              </figcaption>
            </figure>
          </Revelar>
        ))}
      </div>

      <motion.ul
        variants={reduzir ? quieto.revelarContainer : revelarContainer}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-40px" }}
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Benefícios"
      >
        {BENEFICIOS.map((item) => (
          <motion.li
            key={item.texto}
            variants={reduzir ? quieto.revelarItem : revelarItem}
            className="card-hover flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
              <item.icone className="size-4.5" aria-hidden />
            </span>
            <p className="min-w-0 text-sm font-semibold">{item.texto}</p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
