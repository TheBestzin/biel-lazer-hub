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
