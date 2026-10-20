import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { z } from "zod";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { AppStatCard } from "@/components/app/AppStatCard";
import { ItemLista, TransicaoEstado } from "@/components/app/MotionUI";
import { CampoMoeda } from "@/components/app/CamposMascarados";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORIAS_DESPESA } from "@/constants";
import { LembretesPagamento } from "@/components/reservas/LembretesPagamento";
import { chaves, useAcao, useDespesas, useMovimentos, useReservas } from "@/hooks/useDados";
import { DespesaService } from "@/services/DespesaService";
import { LogService } from "@/services/LogService";
import type { CategoriaDespesa, Despesa } from "@/types";
import { formatarData, formatarMoeda, variacaoPercentual } from "@/utils/formatadores";

/** Mês e aba da página na URL — voltar/compartilhar preserva a visão. */
const filtros = z.object({
  mes: z.string().optional(),
  aba: z.enum(["receitas", "despesas"]).optional(),
});

export const Route = createFileRoute("/financeiro")({
  validateSearch: filtros,
  head: () => ({
    meta: [
      { title: "Financeiro — Área de Lazer Biel" },
      {
        name: "description",
        content: "Receitas das locações, despesas por categoria e saldo consolidado do período.",
      },
      { property: "og:title", content: "Financeiro — Área de Lazer Biel" },
      { property: "og:description", content: "Acompanhe receitas, despesas e saldo do negócio." },
    ],
  }),
  component: PaginaFinanceiro,
});

type Abas = NonNullable<z.infer<typeof filtros>["aba"]>;

const hojeISO = () => new Date().toISOString().slice(0, 10);
const MES_VALIDO = /^\d{4}-\d{2}$/;

/** Move o mês em `"yyyy-MM"` por `delta` meses. */
function moverMes(mes: string, delta: number): string {
  const base = new Date(`${mes}-01T12:00:00`);
  return format(addMonths(base, delta), "yyyy-MM");
}

/** Variação do mês em texto curto para os stat cards. */
function textoVariacao(atual: number, anterior: number): string {
  if (!anterior) return atual ? "Sem registros no mês anterior" : "Mês anterior sem registros";
  const variacao = variacaoPercentual(atual, anterior);
  if (variacao === null) return "Sem base de comparação";
  const sinal = variacao >= 0 ? "▲" : "▼";
  return `${sinal} ${Math.abs(variacao).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% vs. mês anterior`;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function PaginaFinanceiro() {
  const { admin } = useAuth();
  const { data: movimentos, isLoading } = useMovimentos();
  const { data: reservas } = useReservas();
  const { data: despesas } = useDespesas();
  const search = Route.useSearch();
  const navegar = Route.useNavigate();

  /** Receitas derivadas das reservas (fonte da verdade) + lançamentos manuais sem reserva. */
  const receitas = useMemo(() => {
    const deReservas = reservas
      .filter((r) => !r.deleted && r.statusReserva !== "cancelada" && (r.valorPago || 0) > 0)
      .map((r) => ({
        id: `reserva-${r.id}`,
        descricao: `Pagamento — ${r.clienteNome}`,
        categoria: "Locação",
        data: r.data,
        valor: r.valorPago,
      }));
    const manuais = movimentos
      .filter((m) => m.tipo === "receita" && !m.reservaId)
      .map((m) => ({
        id: m.id,
        descricao: m.descricao,
        categoria: m.categoria,
        data: m.data,
        valor: m.valor,
      }));
    return [...deReservas, ...manuais].sort((a, b) => b.data.localeCompare(a.data));
  }, [reservas, movimentos]);

  const searchMes = search.mes && MES_VALIDO.test(search.mes) ? search.mes : undefined;
  const mes = searchMes ?? new Date().toISOString().slice(0, 7);
  const aba: Abas = search.aba ?? "receitas";

  const mudarSearch = (patch: { mes?: string | undefined; aba?: Abas | undefined }) =>
    void navegar({ search: (anterior) => ({ ...anterior, ...patch }), replace: true });

  const receitasMes = useMemo(
    () =>
      receitas.filter((m) => m.data.startsWith(mes)).sort((a, b) => b.data.localeCompare(a.data)),
    [receitas, mes],
  );
  const despesasMes = useMemo(
    () =>
      despesas.filter((d) => d.data.startsWith(mes)).sort((a, b) => b.data.localeCompare(a.data)),
    [despesas, mes],
  );

  const totalReceitas = receitasMes.reduce((total, m) => total + m.valor, 0);
  const totalDespesas = despesasMes.reduce((total, d) => total + d.valor, 0);

  /* Mês anterior para comparação nos stat cards. */
  const mesAnterior = moverMes(mes, -1);
  const receitasAnterior = receitas
    .filter((m) => m.data.startsWith(mesAnterior))
    .reduce((total, m) => total + m.valor, 0);
  const despesasAnterior = despesas
    .filter((d) => d.data.startsWith(mesAnterior))
    .reduce((total, d) => total + d.valor, 0);

  const [formAberto, setFormAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Despesa | null>(null);

  const [categoria, setCategoria] = useState<CategoriaDespesa>("outros");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(hojeISO);

  const salvarDespesa = useAcao(
    async () => {
      if (!descricao.trim()) throw new Error("Informe a descrição da despesa.");
      if (valor <= 0) throw new Error("Informe um valor maior que zero.");
      const autor = admin?.uid ?? "sistema";
      const id = await DespesaService.criar(
        { categoria, descricao: descricao.trim(), valor, data },
        autor,
      );
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "criar",
        colecao: "despesas",
        documento: id,
        descricao: `Registrou a despesa "${descricao.trim()}" de ${formatarMoeda(valor)}`,
      });
    },
    {
      sucesso: "Despesa registrada.",
      invalidar: [chaves.despesas, chaves.financeiro, chaves.logs],
      aoConcluir: () => {
        setFormAberto(false);
        setDescricao("");
        setValor(0);
        setCategoria("outros");
        setData(hojeISO());
      },
    },
  );

  const excluirDespesa = useAcao(
    async (despesa: Despesa) => {
      const autor = admin?.uid ?? "sistema";
      await DespesaService.moverParaLixeira(despesa, autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "excluir",
        colecao: "despesas",
        documento: despesa.id,
        descricao: `Moveu para a lixeira a despesa "${despesa.descricao}"`,
        antes: despesa,
      });
    },
    {
      sucesso: "Despesa movida para a lixeira.",
      invalidar: [chaves.despesas, chaves.lixeira, chaves.logs],
      aoConcluir: () => setParaExcluir(null),
    },
  );

  const listaAtual = aba === "receitas" ? receitasMes : despesasMes;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Financeiro"
        descricao="Receitas das locações, despesas e saldo consolidado."
        acoes={
          <Button onClick={() => setFormAberto(true)}>
            <Plus className="size-4" aria-hidden /> Nova despesa
          </Button>
        }
      />

      {/* Navegação de mês + abas com contagem */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          className="inline-flex items-center gap-1 rounded-2xl border bg-card px-2 py-1.5"
          role="group"
          aria-label="Selecionar mês"
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => mudarSearch({ mes: moverMes(mes, -1) })}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-32 text-center text-sm font-semibold">
            {capitalizar(formatarData(`${mes}-01`, "MMMM 'de' yyyy"))}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => mudarSearch({ mes: moverMes(mes, 1) })}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <Tabs value={aba} onValueChange={(valor) => mudarSearch({ aba: valor as Abas })}>
          <TabsList>
            <TabsTrigger value="receitas">
              Receitas
              <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                {receitasMes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="despesas">
              Despesas
              <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                {despesasMes.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AppStatCard
          titulo="Receitas do mês"
          valor={formatarMoeda(totalReceitas)}
          icone={ArrowUpCircle}
          descricao={textoVariacao(totalReceitas, receitasAnterior)}
          indice={0}
        />
        <AppStatCard
          titulo="Despesas do mês"
          valor={formatarMoeda(totalDespesas)}
          icone={ArrowDownCircle}
          descricao={textoVariacao(totalDespesas, despesasAnterior)}
          indice={1}
        />
        <AppStatCard
          titulo="Saldo do mês"
          valor={formatarMoeda(totalReceitas - totalDespesas)}
          icone={Wallet}
          descricao={textoVariacao(
            totalReceitas - totalDespesas,
            receitasAnterior - despesasAnterior,
          )}
          indice={2}
        />
      </div>

      <LembretesPagamento />

      <TransicaoEstado
        estado={isLoading ? "carregando" : listaAtual.length === 0 ? "vazio" : "pronto"}
      >
        {isLoading ? (
          <ListaSkeleton />
        ) : aba === "receitas" ? (
          receitasMes.length === 0 ? (
            <AppEmptyState
              icone={ArrowUpCircle}
              titulo="Nenhuma receita no período"
              descricao="As receitas são geradas automaticamente ao registrar pagamentos de reservas."
            />
          ) : (
            <ListaMovimentos
              tipo="receita"
              movimentos={receitasMes}
              aoExcluir={() => undefined}
              baseIndice={0}
            />
          )
        ) : despesasMes.length === 0 ? (
          <AppEmptyState
            icone={ArrowDownCircle}
            titulo="Nenhuma despesa no período"
            descricao="Registre gastos com água, energia, limpeza e manutenção para acompanhar o saldo."
            acao={{ label: "Nova despesa", aoClicar: () => setFormAberto(true) }}
          />
        ) : (
          <ListaMovimentos
            tipo="despesa"
            movimentos={despesasMes}
            aoExcluir={setParaExcluir}
            baseIndice={0}
          />
        )}
      </TransicaoEstado>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao-despesa">Descrição</Label>
              <Input
                id="descricao-despesa"
                value={descricao}
                onChange={(evento) => setDescricao(evento.target.value)}
                placeholder="Conta de energia"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={categoria}
                  onValueChange={(valorSelecionado) =>
                    setCategoria(valorSelecionado as CategoriaDespesa)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIAS_DESPESA).map(([chave, label]) => (
                      <SelectItem key={chave} value={chave}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor-despesa">Valor</Label>
                <CampoMoeda id="valor-despesa" value={valor} onChange={setValor} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-despesa">Data</Label>
              <Input
                id="data-despesa"
                type="date"
                value={data}
                onChange={(evento) => setData(evento.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormAberto(false)}>
              Cancelar
            </Button>{" "}
            <Button onClick={() => salvarDespesa.mutate()} disabled={salvarDespesa.isPending}>
              {salvarDespesa.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Salvar despesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppConfirmDialog
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Excluir despesa"
        descricao="A despesa será movida para a lixeira e poderá ser restaurada depois."
        confirmarLabel="Excluir"
        destrutivo
        aoConfirmar={() => paraExcluir && excluirDespesa.mutate(paraExcluir)}
      />
    </div>
  );
}

type MovimentoLista = {
  id: string;
  descricao: string;
  categoria: string;
  data: string;
  valor: number;
};

/** Lista de lançamentos: tabela no desktop, cards no celular. */
function ListaMovimentos({
  tipo,
  movimentos,
  aoExcluir,
  baseIndice,
}: {
  tipo: "receita" | "despesa";
  movimentos: MovimentoLista[];
  aoExcluir: (despesa: Despesa) => void;
  baseIndice: number;
}) {
  const sinal = tipo === "receita" ? "+" : "−";
  const cor = tipo === "receita" ? "text-success" : "text-destructive";

  return (
    <>
      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {movimentos.map((movimento, indice) => (
          <ItemLista key={movimento.id} indice={baseIndice + indice}>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{movimento.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(movimento.data)} · {movimento.categoria}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${cor} tabular-nums`}>
                    {sinal}
                    {formatarMoeda(movimento.valor)}
                  </span>
                  {tipo === "despesa" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir despesa"
                      onClick={() => aoExcluir(movimento as Despesa)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </ItemLista>
        ))}
      </div>

      {/* Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-48">Descrição</TableHead>
                <TableHead className="w-[10rem]">Categoria</TableHead>
                <TableHead className="w-[8rem]">Data</TableHead>
                <TableHead className="w-[8rem] text-right">Valor</TableHead>
                {tipo === "despesa" && <TableHead className="w-[4rem] text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentos.map((movimento, indice) => (
                <ItemLista
                  key={movimento.id}
                  indice={baseIndice + indice}
                  elemento="tr"
                  className="bg-transparent transition-colors duration-150 hover:bg-primary-soft/40"
                >
                  <TableRow className="border-0 bg-transparent hover:bg-transparent">
                    <TableCell className="font-medium">{movimento.descricao}</TableCell>
                    <TableCell className="text-muted-foreground">{movimento.categoria}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatarData(movimento.data)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${cor} tabular-nums`}>
                      {sinal}
                      {formatarMoeda(movimento.valor)}
                    </TableCell>
                    {tipo === "despesa" && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-destructive hover:text-destructive"
                              aria-label={`Excluir ${movimento.descricao}`}
                              onClick={() => aoExcluir(movimento as Despesa)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                </ItemLista>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
