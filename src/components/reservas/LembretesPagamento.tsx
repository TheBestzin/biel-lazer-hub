import { BellRing, MessageCircle } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReservas } from "@/hooks/useDados";
import { apenasDigitos } from "@/utils/documentos";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

const DIAS_AVISO = 7;

function diasAte(data: string): number {
  const hoje = new Date().toISOString().slice(0, 10);
  const ms = new Date(`${data}T00:00:00`).getTime() - new Date(`${hoje}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

export function LembretesPagamento() {
  const { data: reservas } = useReservas();

  const pendentes = useMemo(
    () =>
      reservas
        .filter(
          (r) =>
            !r.deleted &&
            r.statusReserva === "reservada" &&
            r.statusPagamento !== "pago" &&
            diasAte(r.data) >= 0 &&
            diasAte(r.data) <= DIAS_AVISO,
        )
        .sort((a, b) => a.data.localeCompare(b.data)),
    [reservas],
  );

  if (pendentes.length === 0) return null;

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4 text-warning" aria-hidden />
          Pagamentos pendentes próximos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendentes.map((reserva) => {
          const dias = diasAte(reserva.data);
          const restante = Math.max(reserva.valor - (reserva.valorPago || 0), 0);
          const telefone = apenasDigitos(reserva.clienteTelefone || "");
          const mensagem = encodeURIComponent(
            `Olá, ${reserva.clienteNome}! Tudo bem? Sobre sua reserva na Área de Lazer Biel em ${formatarData(
              reserva.data,
            )}, ainda consta um valor pendente de ${formatarMoeda(restante)}. Podemos combinar o pagamento?`,
          );
          return (
            <div
              key={reserva.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{reserva.clienteNome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatarData(reserva.data)} ·{" "}
                  {dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`} · falta{" "}
                  {formatarMoeda(restante)}
                </p>
              </div>
              {telefone ? (
                <Button size="sm" asChild>
                  <a
                    href={`https://wa.me/55${telefone}?text=${mensagem}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" aria-hidden /> Cobrar no WhatsApp
                  </a>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Sem telefone cadastrado</span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
