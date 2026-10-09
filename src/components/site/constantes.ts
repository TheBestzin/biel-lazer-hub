import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

/**
 * Conteúdo editorial da página pública (/reservar).
 * Centralizado aqui para que textos e fotos possam ser ajustados
 * sem tocar na estrutura das seções.
 */

/* ------------------------------------------------------------------ */
/* Fotos do espaço                                                     */
/* ------------------------------------------------------------------ */

export interface FotoEspaco {
  url: string;
  legenda: string;
  /** Dimensões intrínsecas — reservam o espaço antes do download (sem layout shift). */
  largura: number;
  altura: number;
}

/** A primeira foto é o destaque do hero (16:9); as demais alimentam a galeria. */
export const FOTOS_ESPACO: FotoEspaco[] = [
  {
    url: "/espaco/espaco-4.jpg",
    legenda: "Piscina com deck de madeira",
    largura: 1600,
    altura: 900,
  },
  { url: "/espaco/espaco-1.jpg", legenda: "Coqueiros e área gourmet", largura: 1600, altura: 1200 },
  {
    url: "/espaco/espaco-2.jpg",
    legenda: "Área coberta com rede de descanso",
    largura: 1600,
    altura: 1200,
  },
  {
    url: "/espaco/espaco-3.jpg",
    legenda: "Gramado e vista do espaço",
    largura: 1600,
    altura: 1200,
  },
];

/** Imagem usada em og:image e JSON-LD (mais representativa do espaço). */
export const URL_OG_IMAGE = FOTOS_ESPACO[0]!.url;

/* ------------------------------------------------------------------ */
/* Períodos de chegada                                                 */
/* ------------------------------------------------------------------ */

export const PERIODO_MANHA = { rotulo: "Manhã", de: "00:00", ate: "12:00", icone: Waves };
export const PERIODO_TARDE = { rotulo: "Tarde", de: "12:00", ate: "18:00", icone: UtensilsCrossed };
export const PERIODO_NOITE = { rotulo: "Noite", de: "18:00", ate: "23:59", icone: Sparkles };

export const ROTULOS_PERIODO = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
} as const;

export type ChavePeriodo = keyof typeof ROTULOS_PERIODO;

/* ------------------------------------------------------------------ */
/* Benefícios                                                          */
/* ------------------------------------------------------------------ */

export interface Beneficio {
  icone: LucideIcon;
  texto: string;
}

export const BENEFICIOS: Beneficio[] = [
  { icone: Waves, texto: "Piscina exclusiva" },
  { icone: UtensilsCrossed, texto: "Área gourmet completa" },
  { icone: ShieldCheck, texto: "Ambiente privativo" },
  { icone: MessageCircle, texto: "Reserva rápida pelo WhatsApp" },
];

/* ------------------------------------------------------------------ */
/* Como funciona                                                       */
/* ------------------------------------------------------------------ */

export interface PassoReserva {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
}

export const PASSOS_RESERVA: PassoReserva[] = [
  {
    titulo: "Escolha a data",
    descricao:
      "Veja no calendário quais dias estão livres e toque no seu preferido. Datas reservadas ou bloqueadas já aparecem indicadas.",
    icone: CalendarDays,
  },
  {
    titulo: "Confirme seus dados",
    descricao:
      "Nome e WhatsApp: usamos essas informações apenas para confirmar sua reserva e combinar os detalhes.",
    icone: ClipboardCheck,
  },
  {
    titulo: "Receba no WhatsApp",
    descricao:
      "Nossa equipe confirma sua reserva pelo WhatsApp e alinha o pagamento. Simples, rápido e sem cadastro.",
    icone: MessageCircle,
  },
];

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export interface ItemFaq {
  pergunta: string;
  resposta: string;
}

export const ITENS_FAQ: ItemFaq[] = [
  {
    pergunta: "Quais são os horários da locação?",
    resposta:
      "A reserva cobre o dia inteiro. Na prática, você chega no horário que preferir dentro do período de funcionamento — o período escolhido (manhã, tarde ou noite) é apenas uma referência de chegada.",
  },
  {
    pergunta: "Como funciona o pagamento?",
    resposta:
      "A confirmação da reserva é feita pelo WhatsApp e o pagamento é combinado diretamente com nossa equipe — pode ser na reserva ou no dia do evento.",
  },
  {
    pergunta: "Preciso pagar sinal para garantir a data?",
    resposta:
      "Para datas concorridas (feriados e fins de semana) costumamos pedir um sinal. Tudo é combinado pelo WhatsApp na hora da confirmação.",
  },
  {
    pergunta: "Posso cancelar ou mudar a data?",
    resposta:
      "Claro! Fale com a gente pelo WhatsApp com antecedência e remanejamos sua reserva sem custo, sujeito à disponibilidade do calendário.",
  },
  {
    pergunta: "Quantas pessoas o espaço comporta?",
    resposta:
      "O espaço é privativo e recebe confortavelmente grupos grandes de família ou amigos. Em caso de dúvida sobre o tamanho do seu grupo, chame no WhatsApp.",
  },
  {
    pergunta: "O que está incluído na diária?",
    resposta:
      "Piscina com deck, área gourmet completa com churrasqueira, área coberta com rede de descanso, banheiros e estacionamento.",
  },
  {
    pergunta: "Posso levar som e decoração?",
    resposta:
      "Pode! Som dentro do bom senso (respeitando os vizinhos) e decoração é liberada — combine os detalhes com a gente pelo WhatsApp.",
  },
  {
    pergunta: "E se chover no dia?",
    resposta:
      "Sem problema: a área coberta garante o churrasco em qualquer tempo. Se preferir, também remanejamos a reserva por clima.",
  },
];

/* ------------------------------------------------------------------ */
/* Depoimentos                                                         */
/* ------------------------------------------------------------------ */

/**
 * ⚠️ Conteúdo de exemplo — substitua pelos depoimentos reais dos
 * clientes conforme forem coletados (WhatsApp, Google, etc.).
 */
export interface Depoimento {
  texto: string;
  autor: string;
  ocasiao: string;
}

export const DEPOIMENTOS: Depoimento[] = [
  {
    texto:
      "Espaço impecável! A piscina é maravilhosa e a área gourmet tem tudo. Fizemos o aniversário da minha mãe e todos amaram.",
    autor: "Mariana S.",
    ocasiao: "Aniversário em família",
  },
  {
    texto:
      "Reservei pelo site em 2 minutos e fui atendido no WhatsApp na hora. Processo super fácil e sem enrolação.",
    autor: "Carlos H.",
    ocasiao: "Churrasco de família",
  },
  {
    texto:
      "A área coberta com a rede de descanso é o melhor lugar da casa. As crianças não saíam da piscina.",
    autor: "Fernanda L.",
    ocasiao: "Dia de lazer",
  },
  {
    texto:
      "Já é a terceira vez que reservamos. Sempre limpo, organizado e os anfitriões são muito atenciosos.",
    autor: "João Pedro P.",
    ocasiao: "Confraternização",
  },
  {
    texto:
      "Ótima estrutura para o churrasco da empresa. Espaço amplo, churrasqueira excelente e fácil de chegar.",
    autor: "Ana Beatriz M.",
    ocasiao: "Evento corporativo",
  },
  {
    texto:
      "Lugar tranquilo, privativo e bonito. As fotos do site são fiéis — na real, ao vivo é até melhor.",
    autor: "Rodrigo T.",
    ocasiao: "Aniversário",
  },
];
