import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  PartyPopper,
  Plus,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
  Wallet,
  User,
  Users,
} from "lucide-react";

import { AppLogo } from "@/components/app/AppLogo";
import { CampoTelefone } from "@/components/app/CamposMascarados";
import { CalendarioReserva } from "@/components/reservas/CalendarioReserva";
import { EtapasReserva } from "@/components/reservas/EtapasReserva";
import { ResumoReserva, ResumoReservaCompacto } from "@/components/reservas/ResumoReserva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BloqueioService } from "@/services/AgendaService";
import { ClienteService } from "@/services/ClienteService";
import { ConfiguracaoService } from "@/services/ConfiguracaoService";
import { NotificacaoService } from "@/services/NotificacaoService";
import { ReservaService } from "@/services/ReservaService";
import { chaveDia, formatarData, formatarDataExtenso, formatarMoeda } from "@/utils/formatadores";
import { validarTelefone } from "@/utils/documentos";
import { cn } from "@/lib/utils";

const espaco1 = { url: "/espaco/espaco-1.jpg" };
const espaco2 = { url: "/espaco/espaco-2.jpg" };
const espaco3 = { url: "/espaco/espaco-3.jpg" };
const espaco4 = { url: "/espaco/espaco-4.jpg" };

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
    links: [
      { rel: "preload", as: "image", href: espaco4.url },
      { rel: "preload", as: "image", href: espaco1.url },
    ],
  }),
  component: PaginaReservarPublica,
});

const BENEFICIOS = [
  { icone: Waves, texto: "Piscina exclusiva" },
  { icone: UtensilsCrossed, texto: "Área gourmet completa" },
  { icone: ShieldCheck, texto: "Ambiente privativo" },
  { icone: MessageCircle, texto: "Reserva rápida pelo WhatsApp" },
];

const GALERIA = [
  { url: espaco4.url, legenda: "Piscina com deck de madeira" },
  { url: espaco1.url, legenda: "Coqueiros e área gourmet" },
  { url: espaco2.url, legenda: "Área coberta com rede de descanso" },
  { url: espaco3.url, legenda: "Gramado e vista do espaço" },
];

const PERIODO_MANHA = { rotulo: "Manhã", de: "00:00", ate: "12:00", icone: Waves };
const PERIODO_TARDE = { rotulo: "Tarde", de: "12:00", ate: "18:00", icone: UtensilsCrossed };
const PERIODO_NOITE = { rotulo: "Noite", de: "18:00", ate: "23:59", icone: Sparkles };

function PaginaReservarPublica() {
  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(hoje);
  });
  const [slide, setSlide] = useState(0);

  // Pré-carrega todas as fotos para o carrossel nunca aparecer vazio.
  useEffect(() => {
    GALERIA.forEach((foto) => {
      const img = new Image();
      img.src = foto.url;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((atual) => (atual + 1) % GALERIA.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const [etapa, setEtapa] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const topoFormulario = useRef<HTMLDivElement>(null);

  const [dataEscolhida, setDataEscolhida] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<"manha" | "tarde" | "noite">("tarde");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [convidados, setConvidados] = useState(10);
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<{ nome?: string; telefone?: string }>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [concluido, setConcluido] = useState<{
    data: string;
    nome: string;
    convidados: number;
  } | null>(null);

  // Força o visual escuro na página pública, sem alterar preferências salvas.
  useEffect(() => {
    const html = document.documentElement;
    const jaEscuro = html.classList.contains("dark");
    if (!jaEscuro) html.classList.add("dark");
    return () => {
      if (!jaEscuro) html.classList.remove("dark");
    };
  }, []);

  const {
    data: reservas = [],
    refetch: recarregarReservas,
    isLoading: carregandoReservas,
  } = useQuery({
    queryKey: ["publico", "reservas"],
    queryFn: () => ReservaService.listar(),
    staleTime: 30_000,
  });
  const { data: bloqueios = [], isLoading: carregandoBloqueios } = useQuery({
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
      setConcluido({ data, nome: nome.trim(), convidados });
      setErro(null);
      setErrosCampo({});
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

  const irParaEtapa = (proximo: number) => {
    if (proximo === etapa) return;
    setDirecao(proximo > etapa ? 1 : -1);
    setEtapa(Math.min(Math.max(proximo, 0), 3));
    topoFormulario.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const avancar = () => {
    if (etapa === 0) {
      if (!dataEscolhida) {
        setErro("Escolha uma data disponível no calendário para continuar.");
        return;
      }
    }
    if (etapa === 2) {
      if (!validarDados()) return;
    }
    setErro(null);
    irParaEtapa(etapa + 1);
  };

  const validarDados = (): boolean => {
    const novos: { nome?: string; telefone?: string } = {};
    if (nome.trim().length < 3) novos.nome = "Informe seu nome completo.";
    if (!validarTelefone(telefone)) novos.telefone = "Informe um telefone válido com DDD.";
    setErrosCampo(novos);
    return Object.keys(novos).length === 0;
  };

  const voltarEtapa = () => {
    setErro(null);
    irParaEtapa(etapa - 1);
  };

  const selecionarData = (chave: string) => {
    setDataEscolhida(chave);
    setErro(null);
    setConcluido(null);
  };

  const selecionarPeriodo = (chave: "manha" | "tarde" | "noite") => {
    setPeriodo(chave);
  };

  const reiniciar = () => {
    setConcluido(null);
    setErro(null);
    setTentouEnviar(false);
    setErrosCampo({});
    setDataEscolhida(null);
    setPeriodo("tarde");
    setNome("");
    setTelefone("");
    setConvidados(10);
    setObservacoes("");
    irParaEtapa(0);
  };

  const falouWhatsApp = whatsapp.replace(/\D/g, "");
  const precoDiaria = configuracoes?.valorPadrao ?? 0;
  const carregandoAgenda = carregandoReservas || carregandoBloqueios;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo tamanho={36} />
          <div className="flex items-center gap-2">
            {whatsapp && (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <a href={`https://wa.me/55${falouWhatsApp}`} target="_blank" rel="noreferrer">
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
        <div
          className="absolute inset-0 overflow-hidden bg-slate-900 bg-cover bg-center"
          style={{ backgroundImage: `url(${GALERIA[0]!.url})` }}
          aria-hidden
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={GALERIA[slide]!.url}
              src={GALERIA[slide]!.url}
              alt=""
              loading="eager"
              decoding="async"
              fetchPriority="high"
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.6, ease: "easeInOut" },
                scale: { duration: 7, ease: "linear" },
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[64vh] max-w-6xl flex-col justify-end gap-6 px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16">
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
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="xl" className="tap-press shadow-glow" asChild>
                <a href="#reservar">
                  <CalendarDays className="size-4.5" aria-hidden />
                  Ver datas disponíveis
                </a>
              </Button>
              {whatsapp && (
                <Button size="xl" variant="outline" className="backdrop-blur" asChild>
                  <a href={`https://wa.me/55${falouWhatsApp}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4.5" aria-hidden />
                    Falar no WhatsApp
                  </a>
                </Button>
              )}
            </div>
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
      </section>{" "}
      <main className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6" id="reservar">
        {/* Wizard de reserva */}
        <section
          className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-elegant backdrop-blur-xl sm:p-8"
          aria-label="Reservar"
        >
          <div ref={topoFormulario} className="scroll-mt-24" />

          {concluido ? (
            <TelaSucesso
              data={concluido.data}
              nome={concluido.nome}
              convidados={concluido.convidados}
              entrada={entrada}
              saida={saida}
              whatsapp={whatsapp}
              aoFazerOutra={reiniciar}
            />
          ) : (
            <>
              <EtapasReserva atual={etapa} aoIrPara={irParaEtapa} />

              <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
                {/* Resumo compacto — só no mobile, acima do conteúdo */}
                <div className="lg:hidden">
                  <ResumoReservaCompacto
                    data={dataEscolhida}
                    entrada={dataEscolhida ? entrada : null}
                    saida={saida}
                    nome={nome}
                  />
                </div>
                <div>
                  <AnimatePresence mode="wait" custom={direcao} initial={false}>
                    <motion.div
                      key={etapa}
                      custom={direcao}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {etapa === 0 && (
                        <EtapaData
                          mes={mes}
                          aoMudarMes={setMes}
                          hoje={hoje}
                          ocupadas={ocupadas}
                          carregando={carregandoAgenda}
                          selecionada={dataEscolhida}
                          aoSelecionar={selecionarData}
                          erro={erro}
                        />
                      )}
                      {etapa === 1 && (
                        <EtapaHorario
                          entrada={entrada}
                          saida={saida}
                          valor={precoDiaria}
                          periodo={periodo}
                          aoSelecionar={selecionarPeriodo}
                        />
                      )}
                      {etapa === 2 && (
                        <EtapaDados
                          nome={nome}
                          aoMudarNome={setNome}
                          telefone={telefone}
                          aoMudarTelefone={setTelefone}
                          convidados={convidados}
                          aoMudarConvidados={setConvidados}
                          observacoes={observacoes}
                          aoMudarObservacoes={setObservacoes}
                          errosCampo={errosCampo}
                          tentouEnviar={tentouEnviar}
                        />
                      )}
                      {etapa === 3 && (
                        <EtapaConfirmacao
                          data={dataEscolhida}
                          periodo={periodo}
                          entrada={entrada}
                          saida={saida}
                          nome={nome}
                          telefone={telefone}
                          convidados={convidados}
                          observacoes={observacoes}
                          valor={precoDiaria}
                          enviando={enviar.isPending}
                          erro={erro}
                          aoVoltar={voltarEtapa}
                          aoConfirmar={() => {
                            setTentouEnviar(true);
                            enviar.mutate();
                          }}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navegação inferior */}
                  {etapa < 3 && (
                    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-6">
                      <Button
                        variant="ghost"
                        onClick={voltarEtapa}
                        disabled={etapa === 0}
                        className={cn("min-h-11", etapa === 0 && "invisible")}
                      >
                        <ArrowLeft className="size-4" aria-hidden />
                        Voltar
                      </Button>
                      <Button
                        onClick={avancar}
                        size="lg"
                        className="tap-press min-h-11 min-w-40 flex-1 shadow-glow sm:flex-none"
                      >
                        {etapa === 2 ? "Revisar reserva" : "Continuar"}
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Resumo lateral (desktop) / compacto (mobile) */}
                <ResumoReserva
                  className="lg:sticky lg:top-24"
                  data={dataEscolhida}
                  entrada={dataEscolhida ? entrada : null}
                  saida={saida}
                  nome={nome}
                  convidados={convidados}
                  valor={dataEscolhida ? precoDiaria : null}
                  progresso={dataEscolhida ? etapa + 1 : etapa}
                />
              </div>
            </>
          )}
        </section>

        {/* Galeria do espaço */}
        <section className="mt-12" aria-label="Fotos do espaço">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Conheça o espaço</h2>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Fotos reais da nossa área de lazer
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GALERIA.map((foto) => (
              <figure
                key={foto.url}
                className="group card-hover relative overflow-hidden rounded-2xl border border-border/70 bg-card/60"
              >
                <img
                  src={foto.url}
                  alt={foto.legenda}
                  loading="lazy"
                  decoding="async"
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 text-xs font-medium text-foreground">
                  {foto.legenda}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Benefícios */}
        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Benefícios">
          {BENEFICIOS.map((item, indice) => (
            <motion.div
              key={item.texto}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: indice * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              className="card-hover flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                <item.icone className="size-4.5" aria-hidden />
              </span>
              <p className="min-w-0 text-sm font-semibold">{item.texto}</p>
            </motion.div>
          ))}
        </section>

        <footer className="pt-12 text-center text-xs text-muted-foreground">
          Área de Lazer Biel · Reservas online
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 1 — Data                                                      */
/* ------------------------------------------------------------------ */

function EtapaData({
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

function EtapaHorario({
  entrada,
  saida,
  valor,
  periodo,
  aoSelecionar,
}: {
  entrada: string;
  saida: string;
  valor: number;
  periodo: "manha" | "tarde" | "noite";
  aoSelecionar: (chave: "manha" | "tarde" | "noite") => void;
}) {
  const periodos = [
    { chave: "manha" as const, ...PERIODO_MANHA },
    { chave: "tarde" as const, ...PERIODO_TARDE },
    { chave: "noite" as const, ...PERIODO_NOITE },
  ];

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

function CampoComErro({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string | undefined;
  children: React.ReactNode;
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

function EtapaDados({
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
        <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Menos convidados"
            onClick={() => aoMudarConvidados(Math.max(1, convidados - 1))}
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
            onClick={() => aoMudarConvidados(Math.min(200, convidados + 1))}
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

function EtapaConfirmacao({
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
  periodo: "manha" | "tarde" | "noite";
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
  const periodosRotulo = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

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
          { rotulo: "Período", valor: periodosRotulo[periodo] },
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
            <span className="text-sm font-semibold capitalize text-right">{linha.valor}</span>
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

function TelaSucesso({
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
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <CalendarDays className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Data
            </p>
            <p className="truncate text-sm font-semibold capitalize">{formatarDataExtenso(data)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Clock className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Horário
            </p>
            <p className="text-sm font-semibold tabular-nums">
              Das {entrada} às {saida} · dia inteiro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <User className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Cliente
            </p>
            <p className="truncate text-sm font-semibold">{nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Users className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Convidados
            </p>
            <p className="text-sm font-semibold">{convidados}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <MapPin className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Local
            </p>
            <p className="text-sm font-semibold">Área de Lazer Biel</p>
          </div>
        </div>
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
