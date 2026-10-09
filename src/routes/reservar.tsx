import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { HeroSite } from "@/components/site/HeroSite";
import { ComoFunciona, GaleriaEspaco } from "@/components/site/SecoesSite";
import { Depoimentos } from "@/components/site/Depoimentos";
import { Faq } from "@/components/site/Faq";
import { CtaBarraMobile, RodapeSite } from "@/components/site/RodapeSite";
import {
  EtapaConfirmacao,
  EtapaData,
  EtapaDados,
  EtapaHorario,
  TelaSucesso,
} from "@/components/site/EtapasReservaPublica";
import {
  PERIODO_MANHA,
  PERIODO_NOITE,
  PERIODO_TARDE,
  type ChavePeriodo,
} from "@/components/site/constantes";
import {
  dadosEstruturadosLocal,
  links as linksMeta,
  meta as metaTags,
} from "@/components/site/meta";
import { EtapasReserva } from "@/components/reservas/EtapasReserva";
import { ResumoReserva, ResumoReservaCompacto } from "@/components/reservas/ResumoReserva";
import { Button } from "@/components/ui/button";
import { BloqueioService } from "@/services/AgendaService";
import { ClienteService } from "@/services/ClienteService";
import { ConfiguracaoService } from "@/services/ConfiguracaoService";
import { NotificacaoService } from "@/services/NotificacaoService";
import { ReservaService } from "@/services/ReservaService";
import { formatarData } from "@/utils/formatadores";
import { validarTelefone } from "@/utils/documentos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservar")({
  head: () => ({
    meta: metaTags,
    links: linksMeta,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(dadosEstruturadosLocal()),
      },
    ],
  }),
  component: PaginaReservarPublica,
});

function PaginaReservarPublica() {
  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(hoje);
  });
  const [etapa, setEtapa] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const topoFormulario = useRef<HTMLDivElement>(null);

  const [dataEscolhida, setDataEscolhida] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<ChavePeriodo>("tarde");
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
  const precoDiaria = configuracoes?.valorPadrao ?? 0;
  const carregandoAgenda = carregandoReservas || carregandoBloqueios;

  const periodos = [
    { chave: "manha" as const, ...PERIODO_MANHA },
    { chave: "tarde" as const, ...PERIODO_TARDE },
    { chave: "noite" as const, ...PERIODO_NOITE },
  ];

  const irParaEtapa = (proximo: number) => {
    if (proximo === etapa) return;
    setDirecao(proximo > etapa ? 1 : -1);
    setEtapa(Math.min(Math.max(proximo, 0), 3));
    topoFormulario.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validarDados = (): boolean => {
    const novos: { nome?: string; telefone?: string } = {};
    if (nome.trim().length < 3) novos.nome = "Informe seu nome completo.";
    if (!validarTelefone(telefone)) novos.telefone = "Informe um telefone válido com DDD.";
    setErrosCampo(novos);
    return Object.keys(novos).length === 0;
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

  const voltarEtapa = () => {
    setErro(null);
    irParaEtapa(etapa - 1);
  };

  const selecionarData = (chave: string) => {
    setDataEscolhida(chave);
    setErro(null);
    setConcluido(null);
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

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <CabecalhoSite whatsapp={whatsapp} />

      <HeroSite whatsapp={whatsapp} entrada={entrada} saida={saida} valorDiaria={precoDiaria} />

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
                          periodos={periodos}
                          entrada={entrada}
                          saida={saida}
                          valor={precoDiaria}
                          periodo={periodo}
                          aoSelecionar={setPeriodo}
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

        <ComoFunciona />
        <GaleriaEspaco />
      </main>

      <Depoimentos />
      <Faq />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RodapeSite whatsapp={whatsapp} entrada={entrada} saida={saida} />
      </div>

      <CtaBarraMobile whatsapp={whatsapp} />
    </div>
  );
}
