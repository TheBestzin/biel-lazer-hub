/**
 * Sistema de movimento — Área de Lazer Biel
 *
 * ════════════════════════════════════════════════════════════════
 * CURVA ÚNICA DO APP: cubic-bezier(0.2, 0.8, 0.2, 1)
 * ════════════════════════════════════════════════════════════════
 *
 * Por quê: arrancada rápida, chegada suave e sem overshoot. É a
 * assinatura de UIs "caras" (Apple, Linear, Stripe) porque o olho
 * lê o movimento como intencional, não como efeito. O app já usava
 * essa curva pontualmente (PageHeader, AppStatCard, `card-hover` no
 * styles.css); aqui ela se torna a ÚNICA do sistema — trocar a
 * curva aqui troca em todo o app.
 *
 * Regras do sistema (invioláveis):
 * 1. Animar APENAS transform e opacity (compositor, 60fps).
 *    width/height/top/left são proibidos — causam layout shift.
 * 2. Duração: 150ms (micro-interação) a 400ms (transição de tela).
 *    Nada mais lento; nada instantâneo (0ms).
 * 3. Spring APENAS para física real: drawer/sheet deslizando,
 *    sidebar colapsando. Em conteúdo, usar as durações com EASING.
 * 4. Exit sempre mais rápido que a entrada (~60–70% da duração).
 * 5. `prefers-reduced-motion` SEMPRE respeitado: consumidores devem
 *    ler `useReducedMotion()` do framer-motion e trocar variants
 *    pelos pares `quieto.*` exportados abaixo (fade puro, sem
 *    deslocamento).
 *
 * Uso:
 *   import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";
 *
 *   <motion.div variants={staggerContainer} initial="initial" animate="animate">
 *     <motion.div variants={staggerItem} />
 *   </motion.div>
 *
 *   Para rotas (AnimatePresence no layout): usar `pagina`.
 */
import type { Transition, Variants } from "framer-motion";

/**
 * A curva do app. Use SEMPRE esta referência; nunca declare
 * outro bezier inline em componente.
 */
export const EASING: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/** Durações padrão em segundos — a única escala permitida. */
export const duracao = {
  /** Hover, badges, troca de cor — micro-feedback. */
  micro: 0.15,
  /** Exit, elementos pequenos. */
  curta: 0.25,
  /** Entrada de cards, listas, modais. */
  media: 0.35,
  /** Transição de tela/rota. */
  tela: 0.4,
} as const;

/** Transições prontas nomeadas — use em `transition={{ ... }}`. */
export const transicao = {
  micro: { duration: duracao.micro, ease: EASING },
  curta: { duration: duracao.curta, ease: EASING },
  media: { duration: duracao.media, ease: EASING },
  tela: { duration: duracao.tela, ease: EASING },
} satisfies Record<string, Transition>;

/* ------------------------------------------------------------------ */
/* Entrada/saída genéricas                                             */
/* ------------------------------------------------------------------ */

/** Fade puro — overlay, backdrop, troca de tema. */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transicao.media },
  exit: { opacity: 0, transition: transicao.curta },
};

/** Entrada padrão de conteúdo subindo levemente. */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: transicao.media },
  exit: { opacity: 0, y: 8, transition: transicao.curta },
};

/** Entrada descendo — toasts, banners, headers. */
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -14 },
  animate: { opacity: 1, y: 0, transition: transicao.media },
  exit: { opacity: 0, y: -8, transition: transicao.curta },
};

/** Entrada com escala — modais, dialogs, popovers. */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: transicao.media },
  exit: { opacity: 0, scale: 0.98, transition: transicao.curta },
};

/**
 * Transição de página/rota — fade + slide sutil.
 * Usar como key={} do elemento animado por rota dentro de
 * <AnimatePresence mode="wait"> no layout raiz.
 */
export const pagina: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transicao.tela },
  exit: { opacity: 0, y: -6, transition: transicao.curta },
};

/* ------------------------------------------------------------------ */
/* Cascata (stagger)                                                   */
/* ------------------------------------------------------------------ */

/** Container: orquestra os filhos `staggerItem` em cascata. */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

/** Item de container stagger — usar sempre com staggerContainer. */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: transicao.media },
  exit: { opacity: 0, y: 8, transition: transicao.curta },
};

/**
 * Item com atraso incremental pelo índice — para cards soltos que
 * se auto-animam no mount, sem container pai (usar com custom={i}).
 * Mesma cadência do staggerContainer: 40ms + 50ms por item.
 */
export const staggerItemIndice: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: (indice: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...transicao.media, delay: 0.04 + indice * 0.05 },
  }),
  exit: { opacity: 0, y: 8, transition: transicao.curta },
};

/* ------------------------------------------------------------------ */
/* Slide horizontal — troca de mês do calendário, conteúdo lateral     */
/* ------------------------------------------------------------------ */

/** Direção do slide: "esquerda" entra pela esquerda (mês anterior). */
export const slideIn = (direcao: "esquerda" | "direita"): Variants => ({
  initial: { opacity: 0, x: direcao === "esquerda" ? -24 : 24 },
  animate: { opacity: 1, x: 0, transition: transicao.media },
  exit: {
    opacity: 0,
    x: direcao === "esquerda" ? 24 : -24,
    transition: transicao.curta,
  },
});

/* ------------------------------------------------------------------ */
/* Springs — APENAS física real (drawers, colapso), nunca conteúdo     */
/* ------------------------------------------------------------------ */

/** Drawer mobile / sheet deslizando. */
export const springFisica: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 1,
};

/** Colapso (sidebar web, accordions) — mais amortecido, menos salto. */
export const springColapso: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 1,
};

/* ------------------------------------------------------------------ */
/* prefers-reduced-motion                                              */
/* ------------------------------------------------------------------ */

/**
 * Pares "quietos": mesma intenção, sem deslocamento nem escala —
 * apenas fade. Consumidores trocam a variante quando
 * `useReducedMotion()` retorna true:
 *
 *   const reduzir = useReducedMotion();
 *   <motion.div variants={reduzir ? quieto.fadeInUp : fadeInUp} ... />
 */
export const quieto = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInDown: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scaleIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  pagina: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  staggerContainer: {
    initial: {},
    animate: { transition: { staggerChildren: 0 } },
  },
  staggerItem: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
} satisfies Record<string, Variants>;
