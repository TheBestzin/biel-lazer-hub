import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(valor) ? valor : 0,
  );
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor)}%`;
}

function paraData(valor: string | Date | undefined): Date | null {
  if (!valor) return null;
  const data = typeof valor === "string" ? parseISO(valor) : valor;
  return isValid(data) ? data : null;
}

export function formatarData(valor: string | Date | undefined, padrao = "dd/MM/yyyy"): string {
  const data = paraData(valor);
  return data ? format(data, padrao, { locale: ptBR }) : "—";
}

export function formatarDataHora(valor: string | Date | undefined): string {
  return formatarData(valor, "dd/MM/yyyy 'às' HH:mm");
}

export function formatarDataExtenso(valor: string | Date | undefined): string {
  return formatarData(valor, "EEEE, dd 'de' MMMM 'de' yyyy");
}

export function chaveDia(data: Date): string {
  return format(data, "yyyy-MM-dd");
}

export function parseDia(valor: string): Date {
  return parseISO(`${valor}T12:00:00`);
}

export function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

/**
 * Data relativa em PT-BR: "agora", "há 5 min", "há 3 h",
 * "ontem", "há 4 dias" — acima de 7 dias cai para dd/MM/yyyy.
 */
export function formatarDataRelativa(valor: string | Date | undefined): string {
  const data = paraData(valor);
  if (!data) return "—";

  const agora = new Date();
  const diferencaMs = agora.getTime() - data.getTime();
  const minutos = Math.floor(diferencaMs / 60_000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias <= 7) return `há ${dias} dias`;

  return formatarData(data);
}
