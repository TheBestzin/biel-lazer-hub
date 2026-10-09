import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  PartyPopper,
  Plus,
  User,
  Users,
  CalendarDays as CalendarIcon,
} from "lucide-react";

import { CampoTelefone } from "@/components/app/CamposMascarados";
import { CalendarioReserva } from "@/components/reservas/CalendarioReserva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ROTULOS_PERIODO, type ChavePeriodo } from "@/components/site/constantes";
import { formatarDataExtenso, formatarMoeda } from "@/utils/formatadores";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Campos com erro animado (reutilizável entre etapas)                 */
/* ------------------------------------------------------------------ */

export function CampoComErro({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase"
      >
        {label}
      </Label>
      {children}
      <AnimatePresence>
        {erro && (
          <motion.p
            id={`${id}-erro`}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 overflow-hidden text-xs font-medium text-destructive"
          >
            <span aria-hidden>⚠</span> {erro}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 1 — Data                                                      */
/* ------------------------------------------------------------------ */

export function EtapaData({
  mes,
  aoMudarMes,
  hoje,
  ocupadas,
  carregando,
  selecionada,
  aoSelecionar,
  erro,
}: {
  mes: Date;
  aoMudarMes: (mes: Date) => void;
  hoje: Date;
  ocupadas: Set<string>;
  carregando: boolean;
  selecionada: string | null;
  aoSelecionar: (chave: string) => void;
  erro: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display flex items-center gap-2.5 text-2xl font-semibold sm:text-3xl">
          <CalendarDays className="size-6 text-primary" aria-hidden />
          Escolha sua data
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Toque em um dia livre para selecionar. Datas riscadas já foram reservadas.
        </p>
      </div>

      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {carregando ? (
        <div className="space-y-3" aria-busy aria-live="polite">
          <Skeleton className="h-10 w-52 rounded-xl" />
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: 35 }).map((_, indice) => (
              <Skeleton key={indice} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <CalendarioReserva
          mes={mes}
          aoMudarMes={aoMudarMes}
          hoje={hoje}
          ocupadas={ocupadas}
          selecionada={selecionada}
          aoSelecionar={aoSelecionar}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 2 — Horário                                                   */
/* ------------------------------------------------------------------ */

interface OpcaoPeriodo {
  chave: ChavePeriodo;
  rotulo: string;
  de: string;
  ate: string;
  icone: typeof Clock;
}

export function EtapaHorario({
  periodos,
  entrada,
  saida,
  valor,
  periodo,
  aoSelecionar,
}: {
  periodos: OpcaoPeriodo[];
  entrada: string;
  saida: string;
  valor: number;
  periodo: ChavePeriodo;
  aoSelecionar: (chave: ChavePeriodo) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display flex items-center gap-2.5 text-2xl font-semibold sm:text-3xl">
          <Clock className="size-6 text-primary" aria-hidden />
          Escolha o melhor horário
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A reserva cobre o dia inteiro: das {entrada} às {saida}.
          {valor > 0 && ` Investimento de ${formatarMoeda(valor)} pela diária.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Melhor período">
        {periodos.map((item) => {
          const ativo = periodo === item.chave;
          return (
            <motion.button
              key={item.chave}
              type="button"
              role="radio"
              aria-checked={ativo}
              whileTap={{ scale: 0.97 }}
              onClick={() => aoSelecionar(item.chave)}
              className={cn(
                "relative flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                ativo
                  ? "border-primary bg-primary-soft shadow-glow"
                  : "border-border bg-background/50 hover:border-primary/40 hover:bg-primary-soft/60",
              )}
            >
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl transition-colors duration-200",
                  ativo ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <item.icone className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{item.rotulo}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.de} – {item.ate}
                </span>
              </span>
              <AnimatePresence>
                {ativo && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"
                    aria-hidden
                  >
                    <BadgeCheck className="size-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          O período é apenas uma referência de chegada — você terá o espaço disponível das{" "}
          <strong className="text-foreground">{entrada}</strong> às{" "}
          <strong className="text-foreground">{saida}</strong>.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 3 — Dados do cliente                                          */
/* ------------------------------------------------------------------ */

export function EtapaDados({
  nome,
  aoMudarNome,
  telefone,
  aoMudarTelefone,
  convidados,
  aoMudarConvidados,
  observacoes,
  aoMudarObservacoes,
  errosCampo,
  tentouEnviar,
}: {
  nome: string;
  aoMudarNome: (valor: string) => void;
  telefone: string;
  aoMudarTelefone: (valor: string) => void;
  convidados: number;
  aoMudarConvidados: (valor: number) => void;
  observacoes: string;
  aoMudarObservacoes: (valor: string) => void;
  errosCampo: { nome?: string; telefone?: string };
  tentouEnviar: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display flex items-center gap-2.5 text-2xl font-semibold sm:text-3xl">
          <User className="size-6 text-primary" aria-hidden />
          Seus dados
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Usamos essas informações apenas para confirmar sua reserva.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoComErro id="publico-nome" label="Nome completo" erro={errosCampo.nome}>
          <Input
            id="publico-nome"
            className="h-12 rounded-xl bg-background/60"
            autoComplete="name"
            value={nome}
            aria-invalid={Boolean(errosCampo.nome)}
            aria-describedby={errosCampo.nome ? "publico-nome-erro" : undefined}
            onChange={(evento) => aoMudarNome(evento.target.value)}
            placeholder="Como devemos te chamar?"
          />
        </CampoComErro>

        <CampoComErro id="publico-telefone" label="WhatsApp" erro={errosCampo.telefone}>
          <CampoTelefone
            id="publico-telefone"
            className={cn(
              "h-12 rounded-xl bg-background/60",
              errosCampo.telefone && tentouEnviar && "border-destructive",
            )}
            value={telefone}
            aria-invalid={Boolean(errosCampo.telefone)}
            aria-describedby={errosCampo.telefone ? "publico-telefone-erro" : undefined}
            onChange={(valor) => aoMudarTelefone(valor)}
          />
        </CampoComErro>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="publico-convidados"
          className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase"
        >
          Convidados
        </Label>
        <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label="Menos convidados"
            disabled={convidados <= 1}
            onClick={() => aoMudarConvidados(Math.max(1, convidados - 1))}
          >
            <Minus className="size-5" aria-hidden />
          </Button>
          <span className="text-xl font-bold tabular-nums lining-nums" aria-live="polite">
            {convidados}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label="Mais convidados"
            disabled={convidados >= 200}
            onClick={() => aoMudarConvidados(Math.min(200, convidados + 1))}
          >
            <Plus className="size-5" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="publico-obs"
          className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase"
        >
          Observações (opcional)
        </Label>
        <Textarea
          id="publico-obs"
          rows={3}
          className="resize-none rounded-xl bg-background/60"
          value={observacoes}
          onChange={(evento) => aoMudarObservacoes(evento.target.value)}
          placeholder="Tipo de evento, horário de chegada, etc."
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 4 — Confirmação                                               */
/* ------------------------------------------------------------------ */

export function EtapaConfirmacao({
  data,
  periodo,
  entrada,
  saida,
  nome,
  telefone,
  convidados,
  observacoes,
  valor,
  enviando,
  erro,
  aoVoltar,
  aoConfirmar,
}: {
  data: string | null;
  periodo: ChavePeriodo;
  entrada: string;
  saida: string;
  nome: string;
  telefone: string;
  convidados: number;
  observacoes: string;
  valor: number;
  enviando: boolean;
  erro: string | null;
  aoVoltar: () => void;
  aoConfirmar: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display flex items-center gap-2.5 text-2xl font-semibold sm:text-3xl">
          <BadgeCheck className="size-6 text-primary" aria-hidden />
          Revise sua reserva
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Confira os dados antes de confirmar. Você poderá ajustar se algo estiver errado.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/40">
        {[
          {
            rotulo: "Data",
            valor: data ? formatarDataExtenso(data) : "—",
          },
          { rotulo: "Período", valor: ROTULOS_PERIODO[periodo] },
          { rotulo: "Horário", valor: `Das ${entrada} às ${saida}` },
          { rotulo: "Cliente", valor: nome.trim() || "—" },
          { rotulo: "WhatsApp", valor: telefone ? telefone : "—" },
          { rotulo: "Convidados", valor: `${convidados}` },
          ...(observacoes.trim() ? [{ rotulo: "Observações", valor: observacoes.trim() }] : []),
          ...(valor > 0
            ? [{ rotulo: "Investimento", valor: `${formatarMoeda(valor)} / diária` }]
            : []),
        ].map((linha) => (
          <div
            key={linha.rotulo}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border/50 px-4 py-3 last:border-b-0 sm:px-5"
          >
            <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {linha.rotulo}
            </span>
            <span className="text-right text-sm font-semibold capitalize">{linha.valor}</span>
          </div>
        ))}
      </div>

      {erro && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={aoVoltar} disabled={enviando}>
          <ArrowLeft className="size-4" aria-hidden />
          Editar dados
        </Button>
        <Button
          size="lg"
          className="tap-press shadow-glow"
          onClick={aoConfirmar}
          disabled={enviando || !data}
        >
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Confirmando...
            </>
          ) : (
            <>
              <BadgeCheck className="size-4.5" aria-hidden />
              Confirmar reserva
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tela de sucesso                                                     */
/* ------------------------------------------------------------------ */

export function TelaSucesso({
  data,
  nome,
  convidados,
  entrada,
  saida,
  whatsapp,
  aoFazerOutra,
}: {
  data: string;
  nome: string;
  convidados: number;
  entrada: string;
  saida: string;
  whatsapp: string;
  aoFazerOutra: () => void;
}) {
  const tel = whatsapp.replace(/\D/g, "");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="mx-auto max-w-lg py-6 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-success/15 ring-8 ring-success/10"
      >
        <PartyPopper className="size-9 text-success" aria-hidden />
      </motion.div>

      <h2 className="font-display mt-6 text-3xl font-bold sm:text-4xl">Reserva realizada!</h2>
      <p className="mt-2 text-muted-foreground">
        Tudo pronto, {nome.split(" ")[0]}. Em breve entraremos em contato pelo WhatsApp para
        combinar os detalhes do pagamento.
      </p>

      <div className="mt-8 space-y-3 rounded-2xl border border-border/70 bg-background/40 p-5 text-left">
        {[
          {
            icone: CalendarIcon,
            rotulo: "Data",
            valor: formatarDataExtenso(data),
            capitalizar: true,
          },
          {
            icone: Clock,
            rotulo: "Horário",
            valor: `Das ${entrada} às ${saida} · dia inteiro`,
          },
          { icone: User, rotulo: "Cliente", valor: nome },
          { icone: Users, rotulo: "Convidados", valor: `${convidados}` },
          { icone: MapPin, rotulo: "Local", valor: "Área de Lazer Biel" },
        ].map((item) => (
          <div key={item.rotulo} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <item.icone className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {item.rotulo}
              </p>
              <p className={cn("truncate text-sm font-semibold", item.capitalizar && "capitalize")}>
                {item.valor}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {tel && (
          <Button size="lg" className="tap-press shadow-glow" asChild>
            <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4.5" aria-hidden />
              Falar no WhatsApp
            </a>
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={aoFazerOutra}>
          <CalendarDays className="size-4.5" aria-hidden />
          Fazer outra reserva
        </Button>
      </div>
    </motion.div>
  );
}
