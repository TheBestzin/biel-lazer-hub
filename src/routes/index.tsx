import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  CalendarPlus,
  CircleAlert,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/app/PageHeader";
import { AppStatCard } from "@/components/app/AppStatCard";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { CardsSkeleton, ListaSkeleton } from "@/components/app/AppLoading";
import { BadgeStatusPagamento, BadgeStatusReserva } from "@/components/app/StatusBadges";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientes, useDespesas, useReservas } from "@/hooks/useDados";
import { formatarData, formatarMoeda, variacaoPercentual } from "@/utils/formatadores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Área de Lazer Biel" },
      {
        name: "description",
        content: "Indicadores de reservas, faturamento e ocupação da Área de Lazer Biel.",
      },
      { property: "og:title", content: "Dashboard — Área de Lazer Biel" },
      {
        property: "og:description",
        content: "Acompanhe reservas, faturamento e ocupação em tempo real.",
      },
    ],
  }),
  component: Dashboard,
});

function mesDe(data: string): string {
  return data.slice(0, 7);
}

function Dashboard() {
  const { data: reservas, isLoading } = useReservas();
  const { data: clientes } = useClientes();
  const { data: despesas } = useDespesas();
  const [novaReserva, setNovaReserva] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  const mesAnterior = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7);

  const resumo = useMemo(() => {
    const ativas = reservas.filter((r) => r.statusReserva !== "cancelada");
    const doMes = ativas.filter((r) => mesDe(r.data) === mesAtual);
    const doMesAnterior = ativas.filter((r) => mesDe(r.data) === mesAnterior);
    const receitaMes = doMes.reduce((total, r) => total + r.valorPago, 0);
    const receitaAnterior = doMesAnterior.reduce((total, r) => total + r.valorPago, 0);
    const despesasMes = despesas
      .filter((d) => mesDe(d.data) === mesAtual)
      .reduce((total, d) => total + d.valor, 0);
    const pendentes = ativas.filter((r) => r.statusPagamento !== "pago");
    const proximas = ativas
      .filter((r) => r.data >= hoje && r.statusReserva === "reservada")
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 5);
    const diasNoMes = new Date(
      Number(mesAtual.slice(0, 4)),
      Number(mesAtual.slice(5, 7)),
      0,
    ).getDate();

    return {
      reservasMes: doMes.length,
      receitaMes,
      despesasMes,
      lucroMes: receitaMes - despesasMes,
      variacaoReceita: variacaoPercentual(receitaMes, receitaAnterior),
      variacaoReservas: variacaoPercentual(doMes.length, doMesAnterior.length),
      ocupacao: Math.round((doMes.length / diasNoMes) * 100),
      pendentes,
      proximas,
      aReceber: pendentes.reduce((total, r) => total + (r.valor - r.valorPago), 0),
    };
  }, [reservas, despesas, mesAtual, mesAnterior, hoje]);

  const serie = useMemo(() => {
    const mapa = new Map<string, { mes: string; receita: number; despesa: number }>();
    for (let indice = 5; indice >= 0; indice -= 1) {
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
  }, [reservas, despesas]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Dashboard"
        descricao="Panorama das reservas e do desempenho financeiro do mês."
        acoes={
          <Button onClick={() => setNovaReserva(true)}>
            <CalendarPlus className="size-4" aria-hidden />
            Nova reserva
          </Button>
        }
      />

      {isLoading ? (
        <CardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AppStatCard
            indice={0}
            titulo="Reservas do mês"
            valor={String(resumo.reservasMes)}
            icone={CalendarCheck}
            variacao={resumo.variacaoReservas}
            descricao="vs. mês anterior"
          />
          <AppStatCard
            indice={1}
            titulo="Faturamento"
            valor={formatarMoeda(resumo.receitaMes)}
            icone={Wallet}
            variacao={resumo.variacaoReceita}
            descricao="recebido no mês"
          />
          <AppStatCard
            indice={2}
            titulo="Lucro estimado"
            valor={formatarMoeda(resumo.lucroMes)}
            icone={TrendingUp}
            descricao={`Despesas: ${formatarMoeda(resumo.despesasMes)}`}
          />
          <AppStatCard
            indice={3}
            titulo="Taxa de ocupação"
            valor={`${resumo.ocupacao}%`}
            icone={Users}
            descricao={`${clientes.length} clientes cadastrados`}
            dica="Reservas do mês dividido pelo total de dias."
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Receitas e despesas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="grad-receita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-despesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--card-foreground)",
                  }}
                  formatter={(valor: number) => formatarMoeda(valor)}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke="var(--primary)"
                  fill="url(#grad-receita)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="despesa"
                  name="Despesa"
                  stroke="var(--destructive)"
                  fill="url(#grad-despesa)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Próximas reservas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reservas">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListaSkeleton linhas={4} />
            ) : resumo.proximas.length === 0 ? (
              <AppEmptyState
                icone={CalendarPlus}
                titulo="Nenhuma reserva futura"
                descricao="Crie uma reserva para começar a preencher a agenda."
                acao={{ label: "Nova reserva", aoClicar: () => setNovaReserva(true) }}
              />
            ) : (
              <ul className="space-y-2">
                {resumo.proximas.map((reserva) => (
                  <li
                    key={reserva.id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{reserva.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarData(reserva.data)} · {reserva.entrada}–{reserva.saida}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatarMoeda(reserva.valor)}
                      </span>
                      <BadgeStatusPagamento status={reserva.statusPagamento} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleAlert className="size-4 text-warning" aria-hidden />
            Pagamentos pendentes
          </CardTitle>
          <span className="text-sm font-semibold text-warning">
            {formatarMoeda(resumo.aReceber)} a receber
          </span>
        </CardHeader>
        <CardContent>
          {resumo.pendentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma pendência financeira. Tudo em dia!
            </p>
          ) : (
            <ul className="divide-y">
              {resumo.pendentes.slice(0, 6).map((reserva) => (
                <li key={reserva.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{reserva.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">{formatarData(reserva.data)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <BadgeStatusReserva status={reserva.statusReserva} />
                    <span className="text-sm font-semibold tabular-nums text-warning">
                      {formatarMoeda(reserva.valor - reserva.valorPago)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ReservaFormDialog aberto={novaReserva} aoFechar={() => setNovaReserva(false)} />
    </div>
  );
}
