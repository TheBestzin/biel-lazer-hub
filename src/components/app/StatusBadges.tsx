import { STATUS_CLIENTE, STATUS_PAGAMENTO, STATUS_RESERVA } from "@/constants";
import { AppBadge, type Tom } from "@/components/app/AppBadge";
import type { StatusCliente, StatusPagamento, StatusReserva, TipoNotificacao } from "@/types";

const TIPOS_NOTIFICACAO: Record<TipoNotificacao, { label: string; tom: Tom }> = {
  reserva: { label: "Reserva", tom: "info" },
  pagamento: { label: "Pagamento", tom: "success" },
  sistema: { label: "Sistema", tom: "neutro" },
  cliente: { label: "Cliente", tom: "warning" },
  administrador: { label: "Administrador", tom: "info" },
};

export function BadgeTipoNotificacao({ tipo }: { tipo: TipoNotificacao }) {
  const item = TIPOS_NOTIFICACAO[tipo];
  return <AppBadge tom={item.tom}>{item.label}</AppBadge>;
}

export function BadgeStatusCliente({ status }: { status: StatusCliente }) {
  const item = STATUS_CLIENTE[status];
  return <AppBadge tom={item.tom as Tom}>{item.label}</AppBadge>;
}

export function BadgeStatusPagamento({ status }: { status: StatusPagamento }) {
  const item = STATUS_PAGAMENTO[status];
  return <AppBadge tom={item.tom as Tom}>{item.label}</AppBadge>;
}

export function BadgeStatusReserva({ status }: { status: StatusReserva }) {
  const item = STATUS_RESERVA[status];
  return <AppBadge tom={item.tom as Tom}>{item.label}</AppBadge>;
}
