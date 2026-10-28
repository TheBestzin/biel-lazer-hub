import { useReducedMotion } from "framer-motion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { TituloSecao } from "@/components/site/SecoesSite";
import { ITENS_FAQ } from "@/components/site/constantes";
import { quieto, revelarItem } from "@/lib/motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Dúvidas frequentes em acordeão (Radix) — reduz atrito antes do WhatsApp. */
export function Faq() {
  const reduzir = useReducedMotion();
  return (
    <section
      id="faq"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
      aria-label="Perguntas frequentes"
    >
      <TituloSecao
        kicker="Dúvidas frequentes"
        titulo="Tudo que você precisa saber"
        descricao="As respostas mais procuradas antes de reservar. Ficou alguma dúvida? Chame no WhatsApp."
      />

      <motion.div
        variants={reduzir ? quieto.revelarItem : revelarItem}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto mt-10 max-w-3xl sm:mt-12"
      >
        <AccordionPrimitive.Root
          type="single"
          collapsible
          className="divide-y divide-border/70 border-y border-border/70"
        >
          {ITENS_FAQ.map((item, indice) => (
            <AccordionPrimitive.Item
              key={item.pergunta}
              value={`faq-${indice}`}
              className="overflow-hidden"
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger
                  className={cn(
                    "group flex w-full items-center justify-between gap-4 px-1 py-6 text-left",
                    "text-sm font-semibold transition-colors hover:text-primary sm:text-base",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  {item.pergunta}
                  <ChevronDown
                    className="size-4.5 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
                    aria-hidden
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-acc-up data-[state=open]:animate-acc-down">
                <p className="px-1 pb-6 text-base leading-relaxed text-muted-foreground">
                  {item.resposta}
                </p>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </motion.div>
    </section>
  );
}
