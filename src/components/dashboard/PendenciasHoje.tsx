import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, CircleCheck, FileText, MessageCircle } from "lucide-react";

import { AppBadge } from "@/components/app/AppBadge";
import { Button } from "@/components/ui/button";
import { CartaoErro, CartaoSecao, EsqueletoBloco } from "@/components/dashboard/Estados";
import {
  linkWhatsApp,
  mensagemCobranca,
  mensagemLembrete,
  type PendenciasHoje as Pendencias,
} from "@/components/dashboard/modelos";
import type { Reserva } from "@/types";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

const LIMITE_POR_SECAO = 3;

interface PendenciasHojeProps {
  pendencias: Pendencias | null;
  carregando: boolean;
  erro: boolean;
  onTentar: () => void;
}

export function PendenciasHoje({ pendencias, carregando, erro, onTentar }: PendenciasHojeProps) {
  const total = pendencias
    ? pendencias.cobrar.length +
      pendencias.checkins.length +
      pendencias.amanha.length +
      pendencias.contratos.length
    : 0;

  return (
    <CartaoSecao
      titulo="Pendências de hoje"
      descricao="Ações rápidas para o dia"
      acoes={
        !carregando && !erro && total > 0 ? (
          <AppBadge tom="warning">{total} para resolver</AppBadge>
        ) : undefined
      }
      className="xl:col-span-5"
    >
      {carregando ? (
        <div className="space-y-3">
          <EsqueletoBloco className="h-12 w-full" />
          <EsqueletoBloco className="h-12 w-full" />
          <EsqueletoBloco className="h-12 w-full" />
        </div>
      ) : erro || !pendencias ? (
        <CartaoErro titulo="as pendências" onTentar={onTentar} />
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
            <CircleCheck className="size-6" aria-hidden />
          </span>
          <p className="font-semibold">Nada pendente hoje</p>
          <p className="text-sm text-muted-foreground">Tudo em dia por enquanto.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <Secao
            titulo="Cobrar pagamento"
            lista={pendencias.cobrar}
            renderAcao={(reserva) => (
              <BotaoWhatsApp
                reserva={reserva}
                texto={mensagemCobranca(reserva)}
                rotulo={`Cobrar ${reserva.clienteNome} no WhatsApp`}
                icone={MessageCircle}
              />
            )}
            detalhe={(reserva) =>
              `Falta ${formatarMoeda(reserva.valor - reserva.valorPago)} · ${formatarData(reserva.data)}`
            }
          />
          <Secao
            titulo="Check-in de hoje"
            lista={pendencias.checkins}
            renderAcao={(reserva) => <BotaoReserva reserva={reserva} icone={CalendarCheck} />}
            detalhe={(reserva) => `${reserva.entrada}–${reserva.saida}`}
          />
          <Secao
            titulo="Reservas de amanhã"
            lista={pendencias.amanha}
            renderAcao={(reserva) => (
              <BotaoWhatsApp
                reserva={reserva}
                texto={mensagemLembrete(reserva)}
                rotulo={`Enviar lembrete a ${reserva.clienteNome} no WhatsApp`}
                icone={MessageCircle}
              />
            )}
            detalhe={(reserva) => `${reserva.entrada}–${reserva.saida}`}
          />
          <Secao
            titulo="Contratos a conferir"
            lista={pendencias.contratos}
            renderAcao={(reserva) => <BotaoReserva reserva={reserva} icone={FileText} contrato />}
            detalhe={(reserva) =>
              `${formatarData(reserva.data)} · ${reserva.entrada}–${reserva.saida}`
            }
          />
        </div>
      )}
    </CartaoSecao>
  );
}

function Secao({
  titulo,
  lista,
  detalhe,
  renderAcao,
}: {
  titulo: string;
  lista: Reserva[];
  detalhe: (reserva: Reserva) => string;
  renderAcao: (reserva: Reserva) => ReactNode;
}) {
  if (lista.length === 0) return null;
  const visiveis = lista.slice(0, LIMITE_POR_SECAO);
  const restantes = lista.length - visiveis.length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {titulo}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">{lista.length}</span>
      </div>
      <ul className="divide-y divide-border/60">
        {visiveis.map((reserva) => (
          <li key={reserva.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{reserva.clienteNome}</p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {detalhe(reserva)}
              </p>
            </div>
            {renderAcao(reserva)}
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <Link
          to="/reservas"
          search={{ aba: "futuras" }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver mais {restantes}
        </Link>
      )}
    </div>
  );
}

function BotaoWhatsApp({
  reserva,
  texto,
  rotulo,
  icone: Icone,
}: {
  reserva: Reserva;
  texto: string;
  rotulo: string;
  icone: typeof MessageCircle;
}) {
  return (
    <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" asChild>
      <a
        href={linkWhatsApp(reserva.clienteTelefone, texto)}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={rotulo}
        title={rotulo}
      >
        <Icone className="size-4" aria-hidden />
      </a>
    </Button>
  );
}

function BotaoReserva({
  reserva,
  icone: Icone,
  contrato = false,
}: {
  reserva: Reserva;
  icone: typeof MessageCircle;
  contrato?: boolean;
}) {
  const rotulo = contrato
    ? `Conferir contrato de ${reserva.clienteNome}`
    : `Abrir reserva de ${reserva.clienteNome}`;
  return (
    <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" asChild>
      <Link to="/reservas" search={{ reserva: reserva.id }} aria-label={rotulo} title={rotulo}>
        <Icone className="size-4" aria-hidden />
      </Link>
    </Button>
  );
}
