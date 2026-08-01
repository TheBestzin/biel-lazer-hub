import { STATUS_CLIENTE, STATUS_PAGAMENTO, STATUS_RESERVA } from "@/constants";
import { AppBadge, type Tom } from "@/components/app/AppBadge";
import type { StatusCliente, StatusPagamento, StatusReserva } from "@/types";

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
