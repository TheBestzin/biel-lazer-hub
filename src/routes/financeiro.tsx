import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { AppStatCard } from "@/components/app/AppStatCard";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIAS_DESPESA } from "@/constants";
import { chaves, useAcao, useDespesas, useMovimentos } from "@/hooks/useDados";
import { DespesaService } from "@/services/DespesaService";
import { LogService } from "@/services/LogService";
import type { CategoriaDespesa, Despesa } from "@/types";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

export const Route = createFileRoute("/financeiro")({
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

const hojeISO = () => new Date().toISOString().slice(0, 10);

function PaginaFinanceiro() {
  const { admin } = useAuth();
  const { data: movimentos, isLoading } = useMovimentos();
  const { data: despesas } = useDespesas();
  const [aba, setAba] = useState("receitas");
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [formAberto, setFormAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Despesa | null>(null);

  const [categoria, setCategoria] = useState<CategoriaDespesa>("outros");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(hojeISO);

  const meses = useMemo(() => {
    const chavesMes = new Set<string>([new Date().toISOString().slice(0, 7)]);
    movimentos.forEach((m) => chavesMes.add(m.data.slice(0, 7)));
    despesas.forEach((d) => chavesMes.add(d.data.slice(0, 7)));
    return Array.from(chavesMes).sort((a, b) => b.localeCompare(a));
  }, [movimentos, despesas]);

  const receitasMes = useMemo(
    () => movimentos.filter((m) => m.tipo === "receita" && m.data.startsWith(mes)),
    [movimentos, mes],
  );
  const despesasMes = useMemo(() => despesas.filter((d) => d.data.startsWith(mes)), [despesas, mes]);

  const totalReceitas = receitasMes.reduce((total, m) => total + m.valor, 0);
  const totalDespesas = despesasMes.reduce((total, d) => total + d.valor, 0);

  const salvarDespesa = useAcao(
    async () => {
      if (!descricao.trim()) throw new Error("Informe a descrição da despesa.");
      if (valor <= 0) throw new Error("Informe um valor maior que zero.");
      const autor = admin?.uid ?? "sistema";
      const id = await DespesaService.criar({ categoria, descricao: descricao.trim(), valor, data }, autor);
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

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Financeiro"
        descricao="Receitas das locações, despesas e saldo consolidado."
        acoes={
          <>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {formatarData(`${item}-01`, "MMMM 'de' yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setFormAberto(true)}>
              <Plus className="size-4" aria-hidden /> Nova despesa
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AppStatCard
          titulo="Receitas do mês"
          valor={formatarMoeda(totalReceitas)}
          icone={ArrowUpCircle}
          descricao={`${receitasMes.length} lançamento(s)`}
          indice={0}
        />
        <AppStatCard
          titulo="Despesas do mês"
          valor={formatarMoeda(totalDespesas)}
          icone={ArrowDownCircle}
          descricao={`${despesasMes.length} lançamento(s)`}
          indice={1}
        />
        <AppStatCard
          titulo="Saldo do mês"
          valor={formatarMoeda(totalReceitas - totalDespesas)}
          icone={Wallet}
          descricao="Receitas menos despesas"
          indice={2}
        />
      </div>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
        </TabsList>
      </Tabs>

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
          <div className="space-y-2">
            {receitasMes.map((movimento) => (
              <Card key={movimento.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{movimento.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(movimento.data)} · {movimento.categoria}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success tabular-nums">
                    +{formatarMoeda(movimento.valor)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : despesasMes.length === 0 ? (
        <AppEmptyState
          icone={ArrowDownCircle}
          titulo="Nenhuma despesa no período"
          descricao="Registre gastos com água, energia, limpeza e manutenção para acompanhar o saldo."
          acao={{ label: "Nova despesa", aoClicar: () => setFormAberto(true) }}
        />
      ) : (
        <div className="space-y-2">
          {despesasMes.map((despesa) => (
            <Card key={despesa.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{despesa.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(despesa.data)} · {CATEGORIAS_DESPESA[despesa.categoria]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-destructive tabular-nums">
                    −{formatarMoeda(despesa.valor)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir despesa"
                    onClick={() => setParaExcluir(despesa)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            </Button>
            <Button onClick={() => salvarDespesa.mutate(undefined as never)} disabled={salvarDespesa.isPending}>
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
