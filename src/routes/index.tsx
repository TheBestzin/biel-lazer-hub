import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  CalendarPlus,
  CircleAlert,
  ExternalLink,
  MessageCircle,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Reserva } from "@/types";

import { PageHeader } from "@/components/app/PageHeader";
import { AppStatCard } from "@/components/app/AppStatCard";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { CardsSkeleton, TabelaSkeleton } from "@/components/app/AppLoading";
import {
  AnimarNumero,
  BarraProgresso,
  ItemLista,
  TransicaoEstado,
} from "@/components/app/MotionUI";
import { BadgeStatusPagamento, BadgeStatusReserva } from "@/components/app/StatusBadges";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useClientes, useDespesas, useReservas } from "@/hooks/useDados";
import {
  formatarData,
  formatarMoeda,
  formatarPercentual,
  variacaoPercentual,
} from "@/utils/formatadores";

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

function diasNoMes(mes: string): number {
  return new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate();
}

/** Saudação dinâmica pelo horário (Bom dia / Boa tarde / Boa noite). */
function saudacaoDoDia(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

type FiltroPagamento = "todos" | "pendente" | "pago";

function Dashboard() {
  const { admin } = useAuth();
  const { data: reservas, isLoading } = useReservas();
  const { data: clientes } = useClientes();
  const { data: despesas } = useDespesas();
  const [novaReserva, setNovaReserva] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroPagamento>("todos");

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
      .sort((a, b) => a.data.localeCompare(b.data));
    const diasDoMes = diasNoMes(mesAtual);

    return {
      reservasHoje: ativas.filter((r) => r.data === hoje).length,
      reservasMes: doMes.length,
      receitaMes,
      despesasMes,
      lucroMes: receitaMes - despesasMes,
      variacaoReceita: variacaoPercentual(receitaMes, receitaAnterior),
      variacaoReservas: variacaoPercentual(doMes.length, doMesAnterior.length),
      ocupacao: Math.round((doMes.length / diasDoMes) * 100),
      clientesAtivos: clientes.filter((c) => c.totalReservas > 0).length,
      pendentes,
      proximas,
      aReceber: pendentes.reduce((total, r) => total + (r.valor - r.valorPago), 0),
    };
  }, [reservas, clientes, despesas, mesAtual, mesAnterior, hoje]);

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

  /** Meta de faturamento = média de receita dos meses anteriores. */
  const meta = useMemo(() => {
    const anteriores = serie.slice(0, 5).map((item) => item.receita);
    const total = anteriores.reduce((soma, valor) => soma + valor, 0);
    return total > 0 ? Math.round(total / anteriores.length) : 0;
  }, [serie]);
  const progressoMeta = meta > 0 ? (resumo.receitaMes / meta) * 100 : 0;
  /** Barra limitada a 100% só visualmente; o texto mostra o percentual real. */
  const barraMeta = Math.min(100, Math.max(0, progressoMeta));
  const metaSuperada = meta > 0 && resumo.receitaMes >= meta;

  /** Tabela de próximas reservas: busca local por cliente/código + filtro. */
  const linhasTabela = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return resumo.proximas
      .filter((r) => {
        const corresponde =
          termo.length === 0 ||
          r.clienteNome.toLowerCase().includes(termo) ||
          r.id.toLowerCase().includes(termo);
        const passaFiltro =
          filtro === "todos" ||
          (filtro === "pago" ? r.statusPagamento === "pago" : r.statusPagamento !== "pago");
        return corresponde && passaFiltro;
      })
      .slice(0, 8);
  }, [resumo.proximas, busca, filtro]);

  return (
    <div className="space-y-5">
      <PageHeader
        variante="limpo"
        titulo={`${saudacaoDoDia()}, ${admin?.nome.split(" ")[0] ?? "equipe"}`}
        descricao="Este é o panorama de hoje: reservas, faturamento e ocupação em um só lugar."
        acoes={
          <Button onClick={() => setNovaReserva(true)}>
            <CalendarPlus className="size-4" aria-hidden />
            Nova reserva
          </Button>
        }
      />

      <TransicaoEstado estado={isLoading ? "carregando" : "pronto"}>
        {isLoading ? (
          <CardsSkeleton quantidade={5} />
        ) : (
          /* Grid único de 12 colunas: destaque (4) + 4 indicadores em 2×2 (8).
             O gráfico (8) e a meta (4) fecham nas mesmas bordas verticais. */
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-12">
            {/* Card destaque — gradiente azul/ciano da marca */}
            <AppStatCard
              className="xl:col-span-4"
              indice={0}
              destaque
              titulo="Faturamento do mês"
              valor={formatarMoeda(resumo.receitaMes)}
              valorNumerico={resumo.receitaMes}
              formato={formatarMoeda}
              icone={TrendingUp}
              variacao={resumo.variacaoReceita}
              descricao={`Lucro estimado: ${formatarMoeda(resumo.lucroMes)} · Despesas: ${formatarMoeda(resumo.despesasMes)}`}
            />
            <AppStatCard
              indice={1}
              className="xl:col-span-2"
              titulo="Reservas hoje"
              valor={String(resumo.reservasHoje)}
              valorNumerico={resumo.reservasHoje}
              icone={CalendarCheck}
              descricao="confirmadas para hoje"
            />
            <AppStatCard
              indice={2}
              className="xl:col-span-2"
              titulo="Reservas do mês"
              valor={String(resumo.reservasMes)}
              valorNumerico={resumo.reservasMes}
              icone={CalendarCheck}
              variacao={resumo.variacaoReservas}
              descricao="vs. mês anterior"
            />
            <AppStatCard
              indice={3}
              className="xl:col-span-2"
              titulo="Clientes ativos"
              valor={String(resumo.clientesAtivos)}
              valorNumerico={resumo.clientesAtivos}
              icone={Users}
              descricao={`${clientes.length} cadastrados`}
            />
            <AppStatCard
              indice={4}
              className="xl:col-span-2"
              titulo="Taxa de ocupação"
              valor={`${resumo.ocupacao}%`}
              valorNumerico={resumo.ocupacao}
              formato={(n) => `${Math.round(n)}%`}
              icone={Target}
              descricao={`${resumo.reservasMes} reserva${resumo.reservasMes === 1 ? "" : "s"} em ${diasNoMes(mesAtual)} dias`}
              dica="Reservas do mês dividido pelo total de dias."
            />
          </div>
        )}
      </TransicaoEstado>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="rounded-[20px] xl:col-span-8">
          <CardHeader>
            <CardTitle className="text-base">Receitas e despesas · últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--card-foreground)",
                  }}
                  formatter={(valor: number) => formatarMoeda(valor)}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}
                />
                <Bar
                  dataKey="receita"
                  name="Receitas"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                  animationDuration={700}
                />
                <Bar
                  dataKey="despesa"
                  name="Despesas"
                  fill="var(--chart-3)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progresso do mês: receita recebida × média dos meses anteriores */}
        <Card className="rounded-[20px] xl:col-span-4">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Meta de faturamento</CardTitle>
            {metaSuperada ? (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                Meta superada
              </span>
            ) : (
              <Target className="size-4 text-primary" aria-hidden />
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[1.6rem] leading-tight font-bold tabular-nums lining-nums">
                  <AnimarNumero valor={resumo.receitaMes} formato={formatarMoeda} />
                </p>
                <p className="text-sm text-muted-foreground">
                  meta <span className="font-semibold text-foreground">{formatarMoeda(meta)}</span>
                </p>
              </div>
              <BarraProgresso className="mt-3" valor={meta > 0 ? barraMeta : 0} />
              {meta > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatarPercentual(progressoMeta)}
                    </span>{" "}
                    da meta
                    {metaSuperada ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · excedeu {formatarMoeda(resumo.receitaMes - meta)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {" "}
                        · faltam {formatarMoeda(meta - resumo.receitaMes)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meta = média dos últimos 5 meses
                    {metaSuperada && " (barra limitada a 100%)"}.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  A meta é calculada com a média dos meses anteriores — registre receitas para
                  liberar o acompanhamento.
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <CircleAlert className="size-6 shrink-0 text-warning" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pagamentos pendentes</p>
                <p className="text-lg font-bold tabular-nums text-warning">
                  <AnimarNumero valor={resumo.aReceber} formato={formatarMoeda} />
                </p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto rounded-full" asChild>
                <Link to="/financeiro">Detalhes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de próximas reservas — busca local, filtro e ações rápidas */}
      <Card className="overflow-hidden rounded-[20px] py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-5">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Próximas reservas</h3>
            <p className="text-xs text-muted-foreground">
              {linhasTabela.length === 1
                ? "1 reserva encontrada"
                : `${linhasTabela.length} reservas encontradas`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar cliente ou código…"
                aria-label="Buscar nas próximas reservas"
                className="h-9 w-52 rounded-full border border-border/70 bg-background pl-8.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              />
            </label>
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
              {(
                [
                  ["todos", "Todos"],
                  ["pendente", "Pendentes"],
                  ["pago", "Pagos"],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  aria-pressed={filtro === valor}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filtro === valor
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="/reservas">Ver todas</Link>
            </Button>
          </div>
        </div>

        <CardContent className="px-5 pb-4">
          <TransicaoEstado
            estado={isLoading ? "carregando" : linhasTabela.length === 0 ? "vazio" : "pronto"}
          >
            {isLoading ? (
              <TabelaSkeleton linhas={5} />
            ) : linhasTabela.length === 0 ? (
              <AppEmptyState
                icone={resumo.proximas.length > 0 ? Search : CalendarPlus}
                titulo={resumo.proximas.length > 0 ? "Nenhum resultado" : "Nenhuma reserva futura"}
                descricao={
                  resumo.proximas.length > 0
                    ? "Ajuste a busca ou o filtro para encontrar a reserva."
                    : "Crie uma reserva para começar a preencher a agenda."
                }
                acao={
                  resumo.proximas.length > 0
                    ? {
                        label: "Limpar filtros",
                        aoClicar: () => {
                          setBusca("");
                          setFiltro("todos");
                        },
                      }
                    : { label: "Nova reserva", aoClicar: () => setNovaReserva(true) }
                }
              />
            ) : (
              <TabelaReservas reservas={linhasTabela} />
            )}
          </TransicaoEstado>
        </CardContent>
      </Card>

      {/* Atividade financeira recente */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleAlert className="size-4 text-warning" aria-hidden />
            Pagamentos a listar hoje
          </CardTitle>
          <span className="text-sm font-semibold text-warning tabular-nums">
            <AnimarNumero valor={resumo.aReceber} formato={formatarMoeda} /> a receber
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

function TabelaReservas({ reservas }: { reservas: Reserva[] }) {
  const reduzir = useReducedMotion();
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[7rem]">Código</TableHead>
          <TableHead className="min-w-40">Cliente</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservas.map((reserva, indice) => (
          <ItemLista key={reserva.id} indice={indice} elemento="tr">
            <TableRow
              className={cn(
                "border-b transition-colors duration-150",
                reduzir ? "" : "bg-transparent hover:bg-primary-soft/40",
              )}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{reserva.id.slice(0, 5).toUpperCase()}
              </TableCell>
              <TableCell className="font-medium">{reserva.clienteNome}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatarData(reserva.data)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {reserva.entrada}–{reserva.saida}
                </span>
              </TableCell>
              <TableCell className="tabular-nums lining-nums font-semibold">
                {formatarMoeda(reserva.valor)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <BadgeStatusReserva status={reserva.statusReserva} />
                  <BadgeStatusPagamento status={reserva.statusPagamento} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                    <a
                      href={`https://wa.me/55${reserva.clienteTelefone}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`Falar com ${reserva.clienteNome} no WhatsApp`}
                    >
                      <MessageCircle className="size-4" aria-hidden />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                    <Link
                      to="/reservas"
                      aria-label={`Abrir reserva de ${reserva.clienteNome} nas reservas`}
                    >
                      <ExternalLink className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </ItemLista>
        ))}
      </TableBody>
    </Table>
  );
}
