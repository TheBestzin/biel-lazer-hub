import { Link } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, Target } from "lucide-react";

import { AnimarNumero, BarraProgresso } from "@/components/app/MotionUI";
import { Button } from "@/components/ui/button";
import { CartaoErro, CartaoSecao, EsqueletoBloco } from "@/components/dashboard/Estados";
import { formatarMoeda, formatarPercentual } from "@/utils/formatadores";

interface MetaFaturamentoProps {
  receitaMes: number;
  /** Média dos últimos 5 meses; zero quando ainda não há histórico. */
  meta: number;
  /** Percentual real (pode passar de 100). */
  progressoMeta: number;
  aReceber: number;
  carregando: boolean;
  erro: boolean;
  onTentar: () => void;
}

export function MetaFaturamento({
  receitaMes,
  meta,
  progressoMeta,
  aReceber,
  carregando,
  erro,
  onTentar,
}: MetaFaturamentoProps) {
  const metaSuperada = meta > 0 && receitaMes >= meta;
  /** Barra limitada a 100%: o texto ao lado mostra o valor excedente. */
  const barra = Math.min(100, Math.max(0, progressoMeta));

  return (
    <CartaoSecao
      titulo="Meta de faturamento"
      descricao="Receita do mês × média dos últimos 5 meses"
      acoes={
        metaSuperada ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
            <CircleCheck className="size-3.5" aria-hidden />
            Superada
          </span>
        ) : (
          <Target className="size-4 text-muted-foreground" aria-hidden />
        )
      }
      className="xl:col-span-4"
    >
      {carregando ? (
        <div className="space-y-4">
          <EsqueletoBloco className="h-9 w-2/3" />
          <EsqueletoBloco className="h-2.5 w-full" />
          <EsqueletoBloco className="h-16 w-full" />
        </div>
      ) : erro ? (
        <CartaoErro titulo="a meta" onTentar={onTentar} />
      ) : (
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[1.6rem] leading-tight font-bold tabular-nums">
                <AnimarNumero valor={receitaMes} formato={formatarMoeda} />
              </p>
              {meta > 0 && (
                <p className="text-sm text-muted-foreground">
                  meta{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatarMoeda(meta)}
                  </span>
                </p>
              )}
            </div>

            <BarraProgresso className="mt-3" valor={meta > 0 ? barra : 0} />

            {meta === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                A meta é calculada com a média dos meses anteriores — registre receitas para liberar
                o acompanhamento.
              </p>
            ) : metaSuperada ? (
              <div className="mt-3 space-y-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-success tabular-nums">
                  <CircleCheck className="size-4 shrink-0" aria-hidden />
                  Meta superada em {formatarMoeda(receitaMes - meta)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Meta = média dos últimos 5 meses. Barra limitada a 100%.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatarPercentual(progressoMeta)}
                  </span>{" "}
                  da meta · faltam{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatarMoeda(meta - receitaMes)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">Meta = média dos últimos 5 meses.</p>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <CircleAlert className="size-6 shrink-0 text-warning" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pagamentos pendentes</p>
              <p className="text-lg font-bold tabular-nums text-warning">
                <AnimarNumero valor={aReceber} formato={formatarMoeda} />
              </p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto rounded-full" asChild>
              <Link to="/financeiro">Detalhes</Link>
            </Button>
          </div>
        </div>
      )}
    </CartaoSecao>
  );
}
