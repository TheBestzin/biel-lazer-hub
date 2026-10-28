import { motion } from "framer-motion";
import { CalendarDays, Clock, User, Users, MapPin, Waves } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatarData, formatarDataExtenso, formatarMoeda } from "@/utils/formatadores";

interface ResumoReservaProps {
  data: string | null;
  /** Horário de entrada (ex.: "08:00") */
  entrada: string | null;
  /** Horário de saída (ex.: "22:00") */
  saida: string;
  nome: string;
  convidados: number;
  valor: number | null;
  /** Número de etapas já concluídas (0–4) — controla o progresso visual */
  progresso: number;
  className?: string;
}

export function ResumoReserva({
  data,
  entrada,
  saida,
  nome,
  convidados,
  valor,
  progresso,
  className,
}: ResumoReservaProps) {
  const dadosCliente = nome.trim().length > 0;

  const linhas = [
    {
      id: "data",
      icone: CalendarDays,
      rotulo: "Data",
      chaveValor: data ?? "",
      conteudo: data ? (
        <span className="font-semibold capitalize">{formatarDataExtenso(data)}</span>
      ) : null,
    },
    {
      id: "horario",
      icone: Clock,
      rotulo: "Horário",
      chaveValor: entrada ?? "",
      conteudo: entrada ? (
        <span className="font-semibold tabular-nums">
          Das {entrada} às {saida}
        </span>
      ) : null,
    },
    {
      id: "cliente",
      icone: User,
      rotulo: "Cliente",
      chaveValor: dadosCliente ? nome.trim() : "",
      conteudo: dadosCliente ? <span className="font-semibold">{nome.trim()}</span> : null,
    },
    {
      id: "local",
      icone: MapPin,
      rotulo: "Local",
      chaveValor: "fixo",
      conteudo: <span className="font-semibold">Área de Lazer Biel</span>,
    },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/25 bg-card/85 shadow-elegant backdrop-blur-xl",
        className,
      )}
      aria-label="Resumo da reserva"
    >
      {/* Brilho decorativo */}
      <span
        className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <Waves className="size-4.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">Sua reserva</p>
            <p className="text-[0.7rem] text-muted-foreground">Atualiza conforme você escolhe</p>
          </div>
        </div>

        <ul className="mt-5 space-y-3.5">
          {linhas.map((linha) => {
            const preenchido = Boolean(linha.conteudo);
            return (
              <li key={linha.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-300",
                    preenchido
                      ? "bg-primary-soft text-primary"
                      : "bg-muted text-muted-foreground/60",
                  )}
                >
                  <linha.icone className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {linha.rotulo}
                  </p>
                  <AnimateValue
                    chave={linha.id}
                    chaveValor={linha.chaveValor}
                    valor={linha.conteudo}
                    preenchido={preenchido}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {/* Convidados — resumido no mobile para não duplicar informação */}
        <div className="mt-5 hidden items-center justify-between rounded-2xl border border-border/70 bg-background/50 px-4 py-3 sm:flex">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4 text-primary" aria-hidden />
            Convidados
          </span>
          <motion.span
            key={convidados}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="font-display text-lg font-bold tabular-nums"
          >
            {convidados}
          </motion.span>
        </div>

        {/* Valor */}
        {valor !== null && valor > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-primary/25 bg-primary-soft/60 px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Diária</span>
            <span className="font-display text-lg font-bold tabular-nums text-primary">
              {formatarMoeda(valor)}
            </span>
          </div>
        )}

        {/* Barra de progresso */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[0.7rem] font-semibold text-muted-foreground">
            <span>Progresso</span>
            <span className="tabular-nums">{Math.round((progresso / 4) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full brand-gradient"
              initial={false}
              animate={{ scaleX: progresso / 4 }}
              style={{ transformOrigin: "left" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

/** Conteúdo que faz crossfade ao trocar de valor. */
function AnimateValue({
  chave,
  chaveValor,
  valor,
  preenchido,
}: {
  chave: string;
  chaveValor: string;
  valor: React.ReactNode | null;
  preenchido: boolean;
}) {
  return (
    <div className="mt-0.5 text-sm">
      <motion.div
        key={`${chave}-${preenchido}-${chaveValor}`}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(!preenchido && "text-muted-foreground")}
      >
        {valor ?? <span className="text-muted-foreground">A definir…</span>}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resumo compacto — usado no mobile, onde o card lateral ocupa        */
/* espaço demais. Mostra os 4 itens em grade mínima.                   */
/* ------------------------------------------------------------------ */

interface ResumoReservaCompactoProps {
  data: string | null;
  entrada: string | null;
  saida: string;
  nome: string;
}

export function ResumoReservaCompacto({ data, entrada, saida, nome }: ResumoReservaCompactoProps) {
  const itens = [
    {
      icone: CalendarDays,
      rotulo: "Data",
      valor: data ? formatarData(data) : null,
    },
    {
      icone: Clock,
      rotulo: "Horário",
      valor: entrada ? `${entrada}–${saida}` : null,
    },
    {
      icone: User,
      rotulo: "Cliente",
      valor: nome.trim() || null,
    },
    { icone: MapPin, rotulo: "Local", valor: "Área de Lazer Biel" },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-2xl border border-primary/20 bg-primary-soft/40 p-3 sm:grid-cols-4"
      aria-label="Resumo da reserva"
    >
      {itens.map((item) => (
        <div key={item.rotulo} className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg",
              item.valor ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/60",
            )}
          >
            <item.icone className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[0.6rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {item.rotulo}
            </p>
            <p
              className={cn(
                "truncate text-xs font-semibold",
                !item.valor && "text-muted-foreground/70",
              )}
            >
              {item.valor ?? "A definir"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
