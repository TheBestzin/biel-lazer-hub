import { addDays, getDay } from "date-fns";

import type { Bloqueio, Despesa, Reserva } from "@/types";
import { chaveDia, formatarMoeda } from "@/utils/formatadores";

/* ------------------------------------------------------------------ */
/* Série mensal (receitas × despesas)                                  */
/* ------------------------------------------------------------------ */

export interface PontoSerie {
  mes: string;
  receita: number;
  despesa: number;
}

/**
 * Receita e despesa por mês, dos `meses` últimos meses (o atual incluso).
 * Mesma regra de cálculo que alimentava o gráfico e a meta antes da
 * redesenho — apenas extraída para uma função reutilizável.
 */
export function montarSerieMensal(
  reservas: Reserva[],
  despesas: Despesa[],
  meses: number,
): PontoSerie[] {
  const mesDe = (data: string) => data.slice(0, 7);
  const mapa = new Map<string, PontoSerie>();
  for (let indice = meses - 1; indice >= 0; indice -= 1) {
    const referencia = new Date();
    referencia.setMonth(referencia.getMonth() - indice);
    const chave = referencia.toISOString().slice(0, 7);
    mapa.set(chave, {
      mes: referencia.toLocaleDateString("pt-BR", { month: "short" }),
      receita: 0,
      despesa: 0,
    });
  }
  reservas
    .filter((r) => r.statusReserva !== "cancelada")
    .forEach((r) => {
      const item = mapa.get(mesDe(r.data));
      if (item) item.receita += r.valorPago;
    });
  despesas.forEach((d) => {
    const item = mapa.get(mesDe(d.data));
    if (item) item.despesa += d.valor;
  });
  return [...mapa.values()];
}

/** Remove apenas os meses iniciais sem nenhum movimento: meses zerados no fim seguem visíveis. */
export function aparandoMesesVazios(serie: PontoSerie[]): PontoSerie[] {
  const primeiro = serie.findIndex((ponto) => ponto.receita > 0 || ponto.despesa > 0);
  return primeiro === -1 ? [] : serie.slice(primeiro);
}

/* ------------------------------------------------------------------ */
/* Mapa de calor da agenda                                            */
/* ------------------------------------------------------------------ */

/** Horários de início exibidos (08:00 a 18:00). */
export const HORAS_AGENDA = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const;

/** Ordem das colunas: segunda a domingo (getDay: 0 = domingo). */
export const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0] as const;

export const ROTULO_DIA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
export const ROTULO_DIA_EXTENSO = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
] as const;

export type NivelOcupacao = "livre" | "parcial" | "lotado";

export const ROTULO_NIVEL: Record<NivelOcupacao, string> = {
  livre: "livre",
  parcial: "parcial",
  lotado: "lotado",
};

export interface CelulaAgenda {
  diaSemana: number;
  hora: number;
  nivel: NivelOcupacao;
  /** Quantas datas desse dia da semana estão ocupadas nesse horário. */
  ocupados: number;
  /** Total de datas desse dia da semana na janela analisada. */
  total: number;
  reservas: Array<{ reserva: Reserva; data: string }>;
}

/** Hora inteira de um horário "HH:mm" (ex.: "08:30" → 8). */
export function horaInteira(horario: string): number {
  return Number.parseInt(horario.split(":")[0] ?? "0", 10);
}

/** Livre se nunca ocupado; parcial abaixo de metade das datas; lotado a partir disso. */
export function nivelOcupacao(ocupados: number, total: number): NivelOcupacao {
  if (total === 0 || ocupados === 0) return "livre";
  return ocupados / total < 0.5 ? "parcial" : "lotado";
}

/**
 * Ocupação por dia da semana × horário nos próximos `dias` dias a partir de
 * `inicio`. Uma reserva ocupa os horários de entrada até a saída; um bloqueio
 * ocupa o dia inteiro. Canceladas não contam.
 */
export function mapaOcupacao({
  reservas,
  bloqueios,
  inicio,
  dias = 28,
}: {
  reservas: Reserva[];
  bloqueios: Bloqueio[];
  inicio: Date;
  dias?: number;
}): CelulaAgenda[] {
  const ativas = reservas.filter((r) => r.statusReserva !== "cancelada");
  const datasBloqueadas = new Set(bloqueios.map((b) => b.data));
  const celulas = new Map<string, CelulaAgenda>();

  for (let deslocamento = 0; deslocamento < dias; deslocamento += 1) {
    const dia = addDays(inicio, deslocamento);
    const data = chaveDia(dia);
    const diaSemana = getDay(dia);
    const doDia = ativas.filter((r) => r.data === data);
    const bloqueado = datasBloqueadas.has(data);

    for (const hora of HORAS_AGENDA) {
      const chave = `${diaSemana}-${hora}`;
      const celula: CelulaAgenda = celulas.get(chave) ?? {
        diaSemana,
        hora,
        nivel: "livre",
        ocupados: 0,
        total: 0,
        reservas: [],
      };
      celula.total += 1;
      const ocupantes = doDia.filter(
        (r) => horaInteira(r.entrada) <= hora && hora < horaInteira(r.saida),
      );
      ocupantes.forEach((reserva) => celula.reservas.push({ reserva, data }));
      if (bloqueado || ocupantes.length > 0) celula.ocupados += 1;
      celulas.set(chave, celula);
    }
  }

  return [...celulas.values()].map((celula) => ({
    ...celula,
    nivel: nivelOcupacao(celula.ocupados, celula.total),
  }));
}

/* ------------------------------------------------------------------ */
/* Pendências de hoje                                                 */
/* ------------------------------------------------------------------ */

export interface PendenciasHoje {
  /** Reservas futuras (a partir de hoje) com pagamento não concluído. */
  cobrar: Reserva[];
  /** Reservas confirmadas para hoje — conferir a chegada. */
  checkins: Reserva[];
  /** Reservas confirmadas para amanhã — lembrar o cliente. */
  amanha: Reserva[];
  /** Reservas confirmadas nos próximos dias — contrato a conferir antes da locação. */
  contratos: Reserva[];
}

const porDataEHorario = (a: Reserva, b: Reserva) =>
  a.data.localeCompare(b.data) || a.entrada.localeCompare(b.entrada);

/**
 * Monta as pendências a partir das datas locais. `hoje`, `amanha` e
 * `ateContratos` são chaves yyyy-MM-dd.
 */
export function pendenciasHoje({
  reservas,
  hoje,
  amanha,
  ateContratos,
}: {
  reservas: Reserva[];
  hoje: string;
  amanha: string;
  ateContratos: string;
}): PendenciasHoje {
  const confirmadas = reservas.filter((r) => r.statusReserva === "reservada");
  return {
    cobrar: confirmadas
      .filter((r) => r.data >= hoje && r.statusPagamento !== "pago")
      .sort(porDataEHorario),
    checkins: confirmadas.filter((r) => r.data === hoje).sort(porDataEHorario),
    amanha: confirmadas.filter((r) => r.data === amanha).sort(porDataEHorario),
    contratos: confirmadas
      .filter((r) => r.data >= hoje && r.data <= ateContratos)
      .sort(porDataEHorario),
  };
}

/** Link de WhatsApp no formato já usado no sistema (55 + telefone). */
export function linkWhatsApp(telefone: string, texto?: string): string {
  const base = `https://wa.me/55${telefone}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

export function mensagemCobranca(reserva: Reserva): string {
  return `Olá, ${reserva.clienteNome}! Lembrando do pagamento da sua reserva (${reserva.entrada}–${reserva.saida}). Valor em aberto: ${formatarMoeda(reserva.valor - reserva.valorPago)}.`;
}

export function mensagemLembrete(reserva: Reserva): string {
  return `Olá, ${reserva.clienteNome}! Lembrete: sua reserva na Área de Lazer é amanhã, das ${reserva.entrada} às ${reserva.saida}. Até lá!`;
}
