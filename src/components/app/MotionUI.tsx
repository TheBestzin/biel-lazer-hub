/**
 * Primitivas de animação compartilhadas.
 *
 * Todas consomem os tokens de `src/lib/motion.ts` e respeitam
 * `prefers-reduced-motion`. Nenhum componente deve animar na mão
 * quando uma destas primitivas resolve o caso.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

import { EASING, fadeIn, quieto, staggerItemIndice } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Número que transiciona do valor anterior para o novo com contagem
 * incremental (350ms, curva do app). Usar em toda alteração de valor
 * exposto (moeda, contadores, percentuais). Sob reduced-motion, troca
 * direta sem contagem.
 *
 *   <AnimarNumero valor={receitaMes} formato={formatarMoeda} />
 */
export function AnimarNumero({
  valor,
  formato,
  className,
}: {
  valor: number;
  formato?: ((n: number) => string) | undefined;
  className?: string | undefined;
}) {
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef(0);
  const formatador = useRef(formato);

  useEffect(() => {
    formatador.current = formato;
  }, [formato]);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const renderizar = (n: number) =>
      (formatador.current ?? ((x: number) => Math.round(x).toLocaleString("pt-BR")))(n);

    if (reduzir) {
      nodo.textContent = renderizar(valor);
      anterior.current = valor;
      return;
    }

    const controlo = animate(anterior.current, valor, {
      duration: 0.35,
      ease: EASING,
      onUpdate: (atual) => {
        nodo.textContent = renderizar(atual);
      },
    });
    anterior.current = valor;
    return () => controlo.stop();
  }, [valor, reduzir]);

  const estatico = (formato ?? ((n: number) => Math.round(n).toLocaleString("pt-BR")))(valor);
  return (
    <span ref={ref} className={className}>
      {estatico}
    </span>
  );
}

/**
 * Transição entre estados de uma mesma região (loading → dados,
 * vazio → preenchido, erro → sucesso). Renderiza `conteudo` por
 * `estado` e refaz o fade de entrada a cada troca — nunca troca seca.
 *
 *   <TransicaoEstado estado={isLoading ? "carregando" : "pronto"}>
 *     {isLoading ? <ListaSkeleton /> : <MinhaLista />}
 *   </TransicaoEstado>
 */
export function TransicaoEstado({
  estado,
  children,
  className,
}: {
  estado: string;
  children: ReactNode;
  className?: string;
}) {
  const reduzir = useReducedMotion();
  return (
    <motion.div
      key={estado}
      variants={reduzir ? quieto.fadeIn : fadeIn}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item de lista com entrada escalonada pelo índice. Usar em cards e
 * linhas de listas renderizadas com .map (mesma cadência do
 * staggerContainer: 40ms + 50ms por item).
 *
 *   {itens.map((item, indice) => (
 *     <ItemLista key={item.id} indice={indice}>...</ItemLista>
 *   ))}
 */
export function ItemLista({
  indice,
  children,
  className,
  elemento = "div",
}: {
  indice: number;
  children: ReactNode;
  className?: string;
  /** Renderizar como `li` quando o item for filho direto de uma `<ul>`. */
  elemento?: "div" | "li";
}) {
  const reduzir = useReducedMotion();
  const Comp = elemento === "li" ? motion.li : motion.div;
  return (
    <Comp
      custom={indice}
      variants={reduzir ? quieto.staggerItem : staggerItemIndice}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </Comp>
  );
}

/**
 * Revela o conteúdo ao entrar na viewport (scroll), uma única vez.
 * Para seções abaixo da dobra — dá profundidade de leitura sem
 * animar o que já está visível.
 */
export function Revelar({
  children,
  className,
  atraso = 0,
}: {
  children: ReactNode;
  className?: string;
  atraso?: number;
}) {
  const reduzir = useReducedMotion();
  return (
    <motion.div
      initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={reduzir ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: atraso, ease: EASING }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
