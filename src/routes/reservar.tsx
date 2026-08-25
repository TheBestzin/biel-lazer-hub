import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Sparkles,
  Waves,
  Wallet,
} from "lucide-react";

import heroPiscina from "@/assets/hero-piscina.jpg";
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

function PaginaReservarPublica() {
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [dataEscolhida, setDataEscolhida] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState<string | null>(null);

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

      await ReservaService.criar(
        {
          clienteId: cliente.id,
          data: dataEscolhida,
          entrada: configuracoes?.entradaPadrao ?? "08:00",
          saida: configuracoes?.saidaPadrao ?? "22:00",
          valor: configuracoes?.valorPadrao ?? 0,
          valorPago: 0,
          statusPagamento: "pendente",
          observacoes: observacoes.trim(),
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
  const saida = configuracoes?.saidaPadrao ?? "22:00";

  const destaques = [
    { icone: Clock, rotulo: "Horário", texto: `Das ${entrada} às ${saida}` },
    { icone: Waves, rotulo: "Estrutura", texto: "Piscina & área gourmet" },
    {
      icone: Wallet,
      rotulo: "Investimento",
      texto: configuracoes?.valorPadrao
        ? `${formatarMoeda(configuracoes.valorPadrao)} / diária`
        : "Diária sob consulta",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
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

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="overflow-hidden rounded-3xl border bg-card shadow-elegant"
        >
          {/* Hero */}
          <div className="relative h-60 overflow-hidden sm:h-80">
            <img
              src={heroPiscina}
              alt="Piscina e área gourmet da Área de Lazer Biel"
              width={1920}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-6 sm:p-9">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-bold tracking-widest text-white uppercase backdrop-blur">
                <Sparkles className="size-3" aria-hidden />
                Reserva online em menos de 1 minuto
              </span>
              <h1 className="font-display max-w-2xl text-3xl leading-tight font-semibold text-white text-balance sm:text-5xl">
                Área de Lazer Biel
              </h1>
              <p className="max-w-lg text-sm text-white/85 sm:text-base">
                Um refúgio com piscina e área gourmet para os seus melhores momentos. Escolha a
                data, confirme seus dados e pronto.
              </p>
            </div>
          </div>

          {/* Destaques */}
          <div className="grid grid-cols-1 gap-px border-b bg-border sm:grid-cols-3">
            {destaques.map((item) => (
              <div key={item.rotulo} className="flex items-center gap-4 bg-card p-5 sm:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft">
                  <item.icone className="size-5 text-primary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    {item.rotulo}
                  </p>
                  <p className="truncate font-semibold">{item.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {concluido && (
            <Alert className="rounded-none border-0 border-b border-success/30 bg-success/10">
              <AlertDescription className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>
                  Reserva confirmada para <strong>{formatarData(concluido)}</strong>. Em breve
                  entraremos em contato pelo WhatsApp para combinar o pagamento.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Calendário + Formulário */}
          <div className="flex flex-col lg:flex-row">
            {/* Calendário */}
            <section
              className="p-5 sm:p-8 lg:w-3/5 lg:border-r"
              aria-label="Calendário de disponibilidade"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold sm:text-2xl">
                  Selecione a data
                </h2>
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
                  <span className="min-w-32 text-center text-sm font-semibold lowercase first-letter:uppercase">
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

              <div className="mb-3 grid grid-cols-7 gap-1.5 text-center text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
                {DIAS.map((dia) => (
                  <span key={dia}>{dia}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {dias.map((dia) => {
                  const chave = chaveDia(dia);
                  const foraDoMes = !isSameMonth(dia, mes);
                  const passado = isBefore(dia, hoje);
                  const indisponivel = ocupadas.has(chave);
                  const desabilitado = passado || indisponivel;
                  const selecionado = dataEscolhida === chave;
                  return (
                    <button
                      key={chave}
                      type="button"
                      disabled={desabilitado}
                      onClick={() => {
                        setDataEscolhida(chave);
                        setErro(null);
                        setConcluido(null);
                      }}
                      aria-label={`${formatarData(chave)} — ${indisponivel ? "indisponível" : "disponível"}`}
                      className={cn(
                        "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-200",
                        foraDoMes && "opacity-35",
                        desabilitado
                          ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground"
                          : "border-success/30 bg-success/10 text-foreground hover:-translate-y-0.5 hover:border-success hover:shadow-soft",
                        selecionado &&
                          "border-transparent brand-gradient text-primary-foreground shadow-glow hover:-translate-y-0.5",
                      )}
                    >
                      <span className="tabular-nums">{format(dia, "d")}</span>
                      {!desabilitado && !selecionado && (
                        <span className="mt-1 size-1.5 rounded-full bg-success" aria-hidden />
                      )}
                      {desabilitado && !passado && (
                        <span
                          className="mt-1 h-0.5 w-4 rounded-full bg-muted-foreground/50"
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full border border-success/40 bg-success/15" />{" "}
                  Disponível
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-muted" /> Ocupado / bloqueado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full brand-gradient" /> Sua escolha
                </span>
              </div>
            </section>

            {/* Formulário */}
            <section className="bg-muted/40 p-5 sm:p-8 lg:w-2/5" aria-label="Dados da reserva">
              <h2 className="font-display mb-6 flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                <CalendarCheck className="size-5 text-primary" aria-hidden />
                Finalizar reserva
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
                      ? "border-primary/30 bg-primary-soft"
                      : "border-dashed bg-card/60",
                  )}
                >
                  {dataEscolhida ? (
                    <>
                      <p className="font-display font-semibold">{formatarData(dataEscolhida)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Das {entrada} às {saida}
                        {configuracoes?.valorPadrao
                          ? ` · ${formatarMoeda(configuracoes.valorPadrao)}`
                          : ""}
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
                    className="text-xs font-bold tracking-widest text-muted-foreground uppercase"
                  >
                    Nome completo
                  </Label>
                  <Input
                    id="publico-nome"
                    className="h-11 rounded-xl bg-card"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    placeholder="Como devemos te chamar?"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="publico-telefone"
                    className="text-xs font-bold tracking-widest text-muted-foreground uppercase"
                  >
                    WhatsApp
                  </Label>
                  <CampoTelefone
                    id="publico-telefone"
                    className="h-11 rounded-xl bg-card"
                    value={telefone}
                    onChange={(valor) => setTelefone(valor)}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="publico-obs"
                    className="text-xs font-bold tracking-widest text-muted-foreground uppercase"
                  >
                    Observações (opcional)
                  </Label>
                  <Textarea
                    id="publico-obs"
                    rows={3}
                    className="resize-none rounded-xl bg-card"
                    value={observacoes}
                    onChange={(evento) => setObservacoes(evento.target.value)}
                    placeholder="Quantidade de convidados, tipo de evento, etc."
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
                  className="h-12 w-full rounded-xl text-base font-bold shadow-glow transition-transform active:scale-[0.98]"
                  disabled={enviar.isPending || !dataEscolhida}
                >
                  {enviar.isPending
                    ? "Reservando..."
                    : dataEscolhida
                      ? `Solicitar reserva para ${formatarData(dataEscolhida)}`
                      : "Confirmar reserva"}
                </Button>
                <p className="px-2 text-center text-xs text-muted-foreground">
                  A reserva fica registrada como pendente de pagamento. Entraremos em contato pelo
                  WhatsApp para confirmar os detalhes.
                </p>
              </form>
            </section>
          </div>
        </motion.div>

        <footer className="py-8 text-center text-xs text-muted-foreground">
          Área de Lazer Biel · Reservas online
        </footer>
      </main>
    </div>
  );
}
