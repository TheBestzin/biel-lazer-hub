import { useMemo, useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppEmptyState } from "@/components/app/AppEmptyState";
import { CartaoErro, CartaoSecao, EsqueletoBloco } from "@/components/dashboard/Estados";
import { aparandoMesesVazios, type PontoSerie } from "@/components/dashboard/modelos";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/utils/formatadores";

const PERIODOS = [3, 6, 12] as const;
type Periodo = (typeof PERIODOS)[number];

const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

interface GraficoReceitasProps {
  /** Últimos 12 meses; o seletor recorta o período exibido. */
  serie: PontoSerie[];
  carregando: boolean;
  erro: boolean;
  onTentar: () => void;
}

export function GraficoReceitas({ serie, carregando, erro, onTentar }: GraficoReceitasProps) {
  const [periodo, setPeriodo] = useState<Periodo>(6);
  const dados = useMemo(() => aparandoMesesVazios(serie.slice(-periodo)), [serie, periodo]);

  const totalReceita = dados.reduce((soma, ponto) => soma + ponto.receita, 0);
  const totalDespesa = dados.reduce((soma, ponto) => soma + ponto.despesa, 0);
  const resumoAcessivel = `Receitas de ${formatarMoeda(totalReceita)} e despesas de ${formatarMoeda(totalDespesa)} no período selecionado.`;

  const seletor = (
    <div
      role="group"
      aria-label="Período do gráfico"
      className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1"
    >
      {PERIODOS.map((valor) => (
        <button
          key={valor}
          type="button"
          aria-pressed={periodo === valor}
          onClick={() => setPeriodo(valor)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            periodo === valor
              ? "bg-background text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {valor} meses
        </button>
      ))}
    </div>
  );

  return (
    <CartaoSecao
      titulo="Receitas e despesas"
      descricao="Evolução mensal"
      acoes={seletor}
      className="xl:col-span-8"
    >
      {carregando ? (
        <EsqueletoBloco className="h-72 w-full" />
      ) : erro ? (
        <CartaoErro titulo="o gráfico de receitas" onTentar={onTentar} />
      ) : dados.length === 0 ? (
        <AppEmptyState
          icone={ChartNoAxesCombined}
          titulo="Sem movimentos neste período"
          descricao="Registre reservas ou despesas para acompanhar a evolução."
        />
      ) : (
        <div role="img" aria-label={resumoAcessivel} className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradienteReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="mes"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={84}
                tickFormatter={(valor: number) => moedaCompacta.format(valor)}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--card-foreground)",
                }}
                formatter={(valor) => formatarMoeda(Number(valor))}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                name="Receitas"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#gradienteReceita)"
                dot={false}
                activeDot={{ r: 5 }}
                animationDuration={600}
              />
              <Line
                type="monotone"
                dataKey="despesa"
                name="Despesas"
                stroke="var(--chart-3)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </CartaoSecao>
  );
}
