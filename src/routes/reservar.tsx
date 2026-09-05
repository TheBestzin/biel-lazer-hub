import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
  Wallet,
} from "lucide-react";

import espaco1 from "@/assets/espaco-1.jpg.asset.json";
import espaco2 from "@/assets/espaco-2.jpg.asset.json";
import espaco3 from "@/assets/espaco-3.jpg.asset.json";
import espaco4 from "@/assets/espaco-4.jpg.asset.json";
import { AppLogo } from "@/components/app/AppLogo";
import { CampoTelefone } from "@/components/app/CamposMascarados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BloqueioService } from "@/services/AgendaService";
import { ClienteService } from "@/services/ClienteService";
import { ConfiguracaoService } from "@/services/ConfiguracaoService";
import { NotificacaoService } from "@/services/NotificacaoService";
import { ReservaService } from "@/services/ReservaService";
import { chaveDia, formatarData, formatarMoeda } from "@/utils/formatadores";
import { validarTelefone } from "@/utils/documentos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservar")({
  head: () => ({
    meta: [
      { title: "Reserve sua data — Área de Lazer Biel" },
      {
        name: "description",
        content:
          "Veja as datas disponíveis da Área de Lazer Biel e faça sua reserva online em poucos segundos.",
      },
      { property: "og:title", content: "Reserve sua data — Área de Lazer Biel" },
      {
        property: "og:description",
        content: "Consulte a disponibilidade do dia que você quer e reserve online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaReservarPublica,
});

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const BENEFICIOS = [
  { icone: Waves, texto: "Piscina exclusiva" },
  { icone: UtensilsCrossed, texto: "Área gourmet completa" },
  { icone: ShieldCheck, texto: "Ambiente privativo" },
  { icone: MessageCircle, texto: "Reserva rápida pelo WhatsApp" },
];

function PaginaReservarPublica() {
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [dataEscolhida, setDataEscolhida] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [convidados, setConvidados] = useState(10);
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState<string | null>(null);

  // Força o visual escuro na página pública, sem alterar preferências salvas.
  useEffect(() => {
    const html = document.documentElement;
    const jaEscuro = html.classList.contains("dark");
    if (!jaEscuro) html.classList.add("dark");
    return () => {
      if (!jaEscuro) html.classList.remove("dark");
    };
  }, []);

  const { data: reservas = [], refetch: recarregarReservas } = useQuery({
    queryKey: ["publico", "reservas"],
    queryFn: () => ReservaService.listar(),
    staleTime: 30_000,
  });
  const { data: bloqueios = [] } = useQuery({
    queryKey: ["publico", "bloqueios"],
    queryFn: () => BloqueioService.listar(),
    staleTime: 30_000,
  });
  const { data: configuracoes } = useQuery({
    queryKey: ["publico", "configuracoes"],
    queryFn: () => ConfiguracaoService.obter(),
    staleTime: 60_000,
  });

  const ocupadas = useMemo(() => {
    const mapa = new Set<string>();
    reservas
      .filter((r) => !r.deleted && r.statusReserva !== "cancelada")
      .forEach((r) => mapa.add(r.data));
    bloqueios.filter((b) => !b.deleted).forEach((b) => mapa.add(b.data));
    return mapa;
  }, [reservas, bloqueios]);

  const dias = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(mes), { locale: ptBR }),
        end: endOfWeek(endOfMonth(mes), { locale: ptBR }),
      }),
    [mes],
  );

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const enviar = useMutation({
    mutationFn: async () => {
      if (!dataEscolhida) throw new Error("Escolha uma data disponível no calendário.");
      if (nome.trim().length < 3) throw new Error("Informe seu nome completo.");
      if (!validarTelefone(telefone)) throw new Error("Informe um telefone válido com DDD.");

      const atualizadas = await ReservaService.listar();
      const bloqueiosAtuais = await BloqueioService.listar();
      const indisponivel =
        atualizadas.some(
          (r) => !r.deleted && r.statusReserva !== "cancelada" && r.data === dataEscolhida,
        ) || bloqueiosAtuais.some((b) => !b.deleted && b.data === dataEscolhida);
      if (indisponivel) throw new Error("Esta data acabou de ser reservada. Escolha outra.");

      let cliente = await ClienteService.porTelefone(telefone);
      if (!cliente) {
        const id = await ClienteService.criar(
          {
            nome: nome.trim(),
            cpf: "",
            telefone,
            status: "confiavel",
            observacoes: "Cadastro feito pelo site.",
            tags: ["Site"],
            favorito: false,
          },
          "site",
        );
        cliente = await ClienteService.obter(id);
      }
      if (!cliente) throw new Error("Não foi possível registrar seus dados. Tente novamente.");
      if (cliente.status === "nao_alugar") {
        throw new Error("Não foi possível concluir a reserva. Entre em contato pelo WhatsApp.");
      }

      const anotacoes = [`Convidados: ${convidados}`, observacoes.trim()]
        .filter(Boolean)
        .join(" · ");

      await ReservaService.criar(
        {
          clienteId: cliente.id,
          data: dataEscolhida,
          entrada: configuracoes?.entradaPadrao ?? "08:00",
          saida: configuracoes?.saidaPadrao ?? "22:00",
          valor: configuracoes?.valorPadrao ?? 0,
          valorPago: 0,
          statusPagamento: "pendente",
          observacoes: anotacoes,
        },
        cliente,
        "site",
      );
      await NotificacaoService.criar(
        {
          titulo: "Nova reserva pelo site",
          descricao: `${cliente.nome} — ${formatarData(dataEscolhida)}`,
          tipo: "reserva",
        },
        "site",
      );
      return dataEscolhida;
    },
    onSuccess: (data) => {
      setConcluido(data);
      setErro(null);
      setDataEscolhida(null);
      setNome("");
      setTelefone("");
      setConvidados(10);
      setObservacoes("");
      void recarregarReservas();
      toast.success("Reserva registrada!");
    },
    onError: (e: unknown) => {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a reserva.");
    },
  });

  const whatsapp = configuracoes?.whatsapp ?? configuracoes?.telefone ?? "";
  const entrada = configuracoes?.entradaPadrao ?? "08:00";
  const saida = configuracoes?.saidaPadrao ?? "18:00";

  const destaques = [
    { icone: Clock, rotulo: "Horário", texto: `${entrada} – ${saida}` },
    { icone: Waves, rotulo: "Estrutura", texto: "Piscina + Área gourmet" },
    {
      icone: Wallet,
      rotulo: "Investimento",
      texto: configuracoes?.valorPadrao
        ? `${formatarMoeda(configuracoes.valorPadrao)} / diária`
        : "R$ 300,00 / diária",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo tamanho={36} />
          <div className="flex items-center gap-2">
            {whatsapp && (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <a
                  href={`https://wa.me/55${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <a href="/?login=1">Área do admin</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <img
          src={heroPiscina}
          alt="Piscina e área gourmet da Área de Lazer Biel"
          width={1920}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[76vh] max-w-6xl flex-col justify-end gap-6 px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="space-y-5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[0.7rem] font-bold tracking-[0.25em] text-primary uppercase backdrop-blur">
              <Sparkles className="size-3" aria-hidden />
              Reservas online
            </span>
            <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-semibold text-foreground text-balance sm:text-6xl lg:text-7xl">
              Área de Lazer Biel
            </h1>
            <p className="max-w-xl text-lg text-foreground/80 sm:text-2xl">
              Seu dia de descanso começa aqui.
            </p>
            <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
              Piscina • Área gourmet • Espaço exclusivo
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className="grid gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/60 shadow-elegant sm:grid-cols-3"
          >
            {destaques.map((item) => (
              <div
                key={item.rotulo}
                className="flex items-center gap-4 bg-card/85 p-5 backdrop-blur-xl sm:p-6"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <item.icone className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    {item.rotulo}
                  </p>
                  <p className="truncate font-semibold">{item.texto}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <AnimatePresence>
          {concluido && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-8"
            >
              <Alert className="rounded-2xl border-primary/30 bg-primary/10">
                <AlertDescription className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Reserva confirmada para <strong>{formatarData(concluido)}</strong>. Em breve
                    entraremos em contato pelo WhatsApp para combinar o pagamento.
                  </span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {/* Calendário */}
          <section
            className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-elegant backdrop-blur-xl sm:p-8"
            aria-label="Calendário de disponibilidade"
          >
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Escolha sua data</h2>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label="Mês anterior"
                  onClick={() => setMes(addMonths(mes, -1))}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <span className="min-w-34 text-center text-sm font-semibold lowercase first-letter:uppercase">
                  {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label="Próximo mês"
                  onClick={() => setMes(addMonths(mes, 1))}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-1.5 text-center text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              {DIAS.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {dias.map((dia) => {
                const chave = chaveDia(dia);
                const foraDoMes = !isSameMonth(dia, mes);
                const passado = isBefore(dia, hoje);
                const indisponivel = ocupadas.has(chave);
                const desabilitado = passado || indisponivel;
                const selecionado = dataEscolhida === chave;
                return (
                  <motion.button
                    key={chave}
                    type="button"
                    {...(desabilitado ? {} : { whileHover: { y: -3 }, whileTap: { scale: 0.95 } })}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    disabled={desabilitado}
                    onClick={() => {
                      setDataEscolhida(chave);
                      setErro(null);
                      setConcluido(null);
                    }}
                    aria-label={`${formatarData(chave)} — ${indisponivel ? "indisponível" : "disponível"}`}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition-colors duration-200",
                      foraDoMes && "opacity-30",
                      desabilitado
                        ? "cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground/70 line-through decoration-1"
                        : "border-primary/25 bg-primary/8 text-foreground hover:border-primary hover:bg-primary/15",
                      selecionado &&
                        "border-transparent bg-primary text-primary-foreground shadow-glow hover:bg-primary",
                    )}
                  >
                    <span className="tabular-nums">{format(dia, "d")}</span>
                    {!desabilitado && !selecionado && (
                      <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-5 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full border border-primary/40 bg-primary/15" />
                Disponível
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-muted" /> Ocupado
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary" /> Selecionado
              </span>
            </div>
          </section>

          {/* Formulário */}
          <section
            className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-elegant backdrop-blur-xl sm:p-8 lg:sticky lg:top-24"
            aria-label="Dados da reserva"
          >
            <h2 className="font-display mb-6 flex items-center gap-2.5 text-2xl font-semibold sm:text-3xl">
              <CalendarCheck className="size-6 text-primary" aria-hidden />
              Finalize sua reserva
            </h2>
            <form
              className="space-y-5"
              onSubmit={(evento) => {
                evento.preventDefault();
                enviar.mutate();
              }}
            >
              <div
                className={cn(
                  "rounded-2xl border p-4 text-sm transition-colors",
                  dataEscolhida
                    ? "border-primary/40 bg-primary/10"
                    : "border-dashed border-border bg-background/40",
                )}
              >
                {dataEscolhida ? (
                  <>
                    <p className="text-[0.65rem] font-bold tracking-[0.2em] text-primary uppercase">
                      Resumo
                    </p>
                    <p className="font-display mt-1 text-lg font-semibold">
                      {formatarData(dataEscolhida)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Das {entrada} às {saida}
                      {configuracoes?.valorPadrao
                        ? ` · ${formatarMoeda(configuracoes.valorPadrao)}`
                        : ""}
                      {` · ${convidados} convidado${convidados === 1 ? "" : "s"}`}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Escolha uma data disponível no calendário.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="publico-nome"
                  className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase"
                >
                  Nome completo
                </Label>
                <Input
                  id="publico-nome"
                  className="h-12 rounded-xl bg-background/60"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  placeholder="Como devemos te chamar?"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="publico-telefone"
                  className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase"
                >
                  WhatsApp
                </Label>
                <CampoTelefone
                  id="publico-telefone"
                  className="h-12 rounded-xl bg-background/60"
                  value={telefone}
                  onChange={(valor) => setTelefone(valor)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
                  Convidados
                </Label>
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Menos convidados"
                    onClick={() => setConvidados((n) => Math.max(1, n - 1))}
                  >
                    <Minus className="size-4" aria-hidden />
                  </Button>
                  <span className="text-lg font-bold tabular-nums" aria-live="polite">
                    {convidados}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Mais convidados"
                    onClick={() => setConvidados((n) => Math.min(200, n + 1))}
                  >
                    <Plus className="size-4" aria-hidden />
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
                  onChange={(evento) => setObservacoes(evento.target.value)}
                  placeholder="Tipo de evento, horário de chegada, etc."
                />
              </div>

              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="group h-13 w-full rounded-xl text-base font-bold shadow-glow transition-transform active:scale-[0.98]"
                disabled={enviar.isPending || !dataEscolhida}
              >
                {enviar.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Confirmando sua reserva...
                  </>
                ) : (
                  <>
                    Confirmar reserva
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </>
                )}
              </Button>
              <p className="px-2 text-center text-xs text-muted-foreground">
                A reserva fica registrada como pendente de pagamento. Entraremos em contato pelo
                WhatsApp para confirmar os detalhes.
              </p>
            </form>
          </section>
        </div>

        {/* Benefícios */}
        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Benefícios">
          {BENEFICIOS.map((item) => (
            <div
              key={item.texto}
              className="card-hover flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                <item.icone className="size-4.5" aria-hidden />
              </span>
              <p className="min-w-0 text-sm font-semibold">{item.texto}</p>
            </div>
          ))}
        </section>

        <footer className="pt-12 text-center text-xs text-muted-foreground">
          Área de Lazer Biel · Reservas online
        </footer>
      </main>
    </div>
  );
}
