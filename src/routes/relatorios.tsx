import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarCheck, PiggyBank, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppStatCard } from "@/components/app/AppStatCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIAS_DESPESA } from "@/constants";
import { useClientes, useDespesas, useReservas } from "@/hooks/useDados";
import { formatarData, formatarMoeda, formatarNumero } from "@/utils/formatadores";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Área de Lazer Biel" },
      {
        name: "description",
        content: "Indicadores de faturamento, ocupação, despesas por categoria e melhores clientes.",
      },
      { property: "og:title", content: "Relatórios — Área de Lazer Biel" },
      { property: "og:description", content: "Indicadores e gráficos do desempenho do negócio." },
    ],
  }),
  component: PaginaRelatorios,
});

const CORES = [
  "var(--color-chart-1, hsl(200 90% 45%))",
  "var(--color-chart-2, hsl(150 60% 40%))",
  "var(--color-chart-3, hsl(35 90% 55%))",
  "var(--color-chart-4, hsl(280 60% 55%))",
  "var(--color-chart-5, hsl(0 70% 55%))",
  "hsl(190 40% 60%)",
  "hsl(220 20% 55%)",
];

function ultimosMeses(quantidade: number): string[] {
  const base = new Date();
  return Array.from({ length: quantidade }, (_, indice) => {
    const data = new Date(base.getFullYear(), base.getMonth() - (quantidade - 1 - indice), 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  });
}

function PaginaRelatorios() {
  const { data: reservas } = useReservas();
  const { data: despesas } = useDespesas();
  const { data: clientes } = useClientes();

  const validas = useMemo(
    () => reservas.filter((reserva) => reserva.statusReserva !== "cancelada"),
    [reservas],
  );

  const serieMensal = useMemo(() => {
    const meses = ultimosMeses(6);
    return meses.map((mes) => ({
      mes: formatarData(`${mes}-01`, "MMM/yy"),
      receita: validas
        .filter((r) => r.data.startsWith(mes))
        .reduce((total, r) => total + (r.valorPago || 0), 0),
      despesa: despesas
        .filter((d) => d.data.startsWith(mes))
        .reduce((total, d) => total + d.valor, 0),
      reservas: validas.filter((r) => r.data.startsWith(mes)).length,
    }));
  }, [validas, despesas]);

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    despesas.forEach((despesa) => {
      const label = CATEGORIAS_DESPESA[despesa.categoria] ?? "Outros";
      mapa.set(label, (mapa.get(label) ?? 0) + despesa.valor);
    });
    return Array.from(mapa, ([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  }, [despesas]);

  const melhoresClientes = useMemo(
    () => [...clientes].sort((a, b) => b.totalGasto - a.totalGasto).slice(0, 5),
    [clientes],
  );

  const faturamentoTotal = validas.reduce((total, r) => total + (r.valorPago || 0), 0);
  const despesaTotal = despesas.reduce((total, d) => total + d.valor, 0);
  const ticketMedio = validas.length ? faturamentoTotal / validas.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Relatórios"
        descricao="Indicadores consolidados de faturamento, ocupação e custos."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AppStatCard
          titulo="Faturamento total"
          valor={formatarMoeda(faturamentoTotal)}
          icone={TrendingUp}
          descricao="Valores efetivamente recebidos"
          indice={0}
        />
        <AppStatCard
          titulo="Lucro estimado"
          valor={formatarMoeda(faturamentoTotal - despesaTotal)}
          icone={PiggyBank}
          descricao="Receitas menos despesas"
          indice={1}
        />
        <AppStatCard
          titulo="Reservas realizadas"
          valor={formatarNumero(validas.length)}
          icone={CalendarCheck}
          descricao="Excluindo canceladas"
          indice={2}
        />
        <AppStatCard
          titulo="Ticket médio"
          valor={formatarMoeda(ticketMedio)}
          icone={BarChart3}
          descricao="Por reserva realizada"
          indice={3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas x despesas (6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serieMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} />
              <ChartTooltip formatter={(valor: number) => formatarMoeda(valor)} />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill={CORES[0]} radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill={CORES[4]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {porCategoria.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Nenhuma despesa registrada ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porCategoria} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={95}>
                    {porCategoria.map((item, indice) => (
                      <Cell key={item.nome} fill={CORES[indice % CORES.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(valor: number) => formatarMoeda(valor)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Melhores clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {melhoresClientes.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Cadastre clientes para ver o ranking.
              </p>
            ) : (
              melhoresClientes.map((cliente, indice) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card/60 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                      {indice + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{cliente.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {cliente.totalReservas} reserva(s)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatarMoeda(cliente.totalGasto)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
