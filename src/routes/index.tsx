import { createFileRoute } from "@tanstack/react-router";
import { addDays } from "date-fns";
import { CalendarCheck, CalendarPlus, Target, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/app/PageHeader";
import { AppStatCard } from "@/components/app/AppStatCard";
import { CardsSkeleton } from "@/components/app/AppLoading";
import { TransicaoEstado } from "@/components/app/MotionUI";
import { CartaoErro } from "@/components/dashboard/Estados";
import { GraficoReceitas } from "@/components/dashboard/GraficoReceitas";
import { MapaCalorAgenda } from "@/components/dashboard/MapaCalorAgenda";
import { MetaFaturamento } from "@/components/dashboard/MetaFaturamento";
import { PendenciasHoje as CartaoPendencias } from "@/components/dashboard/PendenciasHoje";
import { mapaOcupacao, montarSerieMensal, pendenciasHoje } from "@/components/dashboard/modelos";
import {
  TabelaProximasReservas,
  type FiltroPagamento,
} from "@/components/dashboard/TabelaProximasReservas";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { useBloqueios, useClientes, useDespesas, useReservas } from "@/hooks/useDados";
import { chaveDia, formatarMoeda, variacaoPercentual } from "@/utils/formatadores";

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

function Dashboard() {
  const { admin } = useAuth();
  const {
    data: reservas,
    isLoading,
    isError: erroReservas,
    refetch: recarregarReservas,
  } = useReservas();
  const { data: clientes, isError: erroClientes, refetch: recarregarClientes } = useClientes();
  const { data: despesas, isError: erroDespesas, refetch: recarregarDespesas } = useDespesas();
  const {
    data: bloqueios,
    isLoading: carregandoBloqueios,
    isError: erroBloqueios,
    refetch: recarregarBloqueios,
  } = useBloqueios();
  const [novaReserva, setNovaReserva] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPagamento>("todos");

  // Cálculos existentes (faturamento, ocupação, meta) seguem com a mesma base de data.
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  const mesAnterior = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7);

  // Datas locais para as novas visões do dia (pendências, agenda e contratos).
  const hojeLocal = chaveDia(new Date());
  const amanhaLocal = chaveDia(addDays(new Date(), 1));
  const ateContratos = chaveDia(addDays(new Date(), 2));

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

  /** Últimos 12 meses; a meta usa só os 6 últimos, como antes. */
  const serie12 = useMemo(() => montarSerieMensal(reservas, despesas, 12), [reservas, despesas]);
  const serie6 = useMemo(() => montarSerieMensal(reservas, despesas, 6), [reservas, despesas]);

  /** Meta de faturamento = média de receita dos meses anteriores. */
  const meta = useMemo(() => {
    const anteriores = serie6.slice(0, 5).map((item) => item.receita);
    const total = anteriores.reduce((soma, valor) => soma + valor, 0);
    return total > 0 ? Math.round(total / anteriores.length) : 0;
  }, [serie6]);
  const progressoMeta = meta > 0 ? (resumo.receitaMes / meta) * 100 : 0;

  const pendencias = useMemo(
    () =>
      pendenciasHoje({
        reservas,
        hoje: hojeLocal,
        amanha: amanhaLocal,
        ateContratos,
      }),
    [reservas, hojeLocal, amanhaLocal, ateContratos],
  );

  const celulasAgenda = useMemo(
    () => mapaOcupacao({ reservas, bloqueios, inicio: new Date() }),
    [reservas, bloqueios],
  );

  /** Tabela de próximas reservas: filtro de pagamento apenas (busca agora é global). */
  const linhasTabela = useMemo(
    () =>
      resumo.proximas
        .filter((r) =>
          filtro === "todos"
            ? true
            : filtro === "pago"
              ? r.statusPagamento === "pago"
              : r.statusPagamento !== "pago",
        )
        .slice(0, 8),
    [resumo.proximas, filtro],
  );

  const tentarReservas = () => {
    void recarregarReservas();
    void recarregarClientes();
  };
  const tentarFinanceiro = () => {
    void recarregarReservas();
    void recarregarDespesas();
  };
  const tentarAgenda = () => {
    void recarregarReservas();
    void recarregarBloqueios();
  };

  const erroFinanceiro = erroReservas || erroDespesas;
  const erroIndicadores = erroReservas || erroClientes;

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

      {/* Indicadores: destaque + 4 cards. Erro de reservas afeta todos, então um aviso único. */}
      <TransicaoEstado estado={isLoading ? "carregando" : erroIndicadores ? "erro" : "pronto"}>
        {isLoading ? (
          <CardsSkeleton quantidade={5} />
        ) : erroIndicadores ? (
          <CartaoErro titulo="os indicadores" onTentar={tentarReservas} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-12">
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

      {/* Receitas (gráfico suave) e meta. */}
      <div className="grid gap-5 xl:grid-cols-12">
        <GraficoReceitas
          serie={serie12}
          carregando={isLoading}
          erro={erroFinanceiro}
          onTentar={tentarFinanceiro}
        />
        <MetaFaturamento
          receitaMes={resumo.receitaMes}
          meta={meta}
          progressoMeta={progressoMeta}
          aReceber={resumo.aReceber}
          carregando={isLoading}
          erro={erroFinanceiro}
          onTentar={tentarFinanceiro}
        />
      </div>

      {/* Pendências do dia (ações rápidas) e mapa de calor da agenda. */}
      <div className="grid gap-5 xl:grid-cols-12">
        <CartaoPendencias
          pendencias={isLoading || erroReservas ? null : pendencias}
          carregando={isLoading}
          erro={erroReservas}
          onTentar={tentarReservas}
        />
        <MapaCalorAgenda
          celulas={celulasAgenda}
          carregando={isLoading || carregandoBloqueios}
          erro={erroReservas || erroBloqueios}
          onTentar={tentarAgenda}
        />
      </div>

      <TabelaProximasReservas
        reservas={linhasTabela}
        totalFuturas={resumo.proximas.length}
        filtro={filtro}
        aoMudarFiltro={setFiltro}
        aoNovaReserva={() => setNovaReserva(true)}
        carregando={isLoading}
        erro={erroReservas}
        onTentar={tentarReservas}
      />

      <ReservaFormDialog aberto={novaReserva} aoFechar={() => setNovaReserva(false)} />
    </div>
  );
}
