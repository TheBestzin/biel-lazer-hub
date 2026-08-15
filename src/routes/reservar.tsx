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
import { CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { AppLogo } from "@/components/app/AppLogo";
import { CampoTelefone } from "@/components/app/CamposMascarados";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 mesh-gradient" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
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
                  WhatsApp
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <a href="/?login=1">Área do admin</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl space-y-8 px-4 py-10">
        <section className="space-y-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            Reserva online em menos de 1 minuto
          </span>
          <h1 className="font-display text-4xl leading-[1.05] font-extrabold text-balance sm:text-5xl">
            O seu dia perfeito na{" "}
            <span className="text-brand-gradient">Área de Lazer Biel</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-pretty text-muted-foreground">
            Escolha a data no calendário, confirme seus dados e pronto. Sem burocracia, sem
            cadastro.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm">
            {[
              { icone: Sun, texto: `Das ${configuracoes?.entradaPadrao ?? "08:00"} às ${configuracoes?.saidaPadrao ?? "22:00"}` },
              { icone: Waves, texto: "Piscina e área gourmet" },
              {
                icone: CalendarCheck,
                texto: configuracoes?.valorPadrao
                  ? `Diária ${formatarMoeda(configuracoes.valorPadrao)}`
                  : "Diária sob consulta",
              },
            ].map((item) => (
              <span
                key={item.texto}
                className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 font-medium backdrop-blur"
              >
                <item.icone className="size-4 text-primary" aria-hidden />
                {item.texto}
              </span>
            ))}
          </div>
        </section>

        {concluido && (
          <Alert className="border-success/30 bg-success/10">
            <AlertDescription className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                Reserva confirmada para <strong>{formatarData(concluido)}</strong>. Em breve
                entraremos em contato pelo WhatsApp para combinar o pagamento.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-elegant backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-card/60">
            <CardTitle className="font-display text-lg capitalize">
              {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label="Mês anterior"
                onClick={() => setMes(addMonths(mes, -1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
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
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
              {DIAS.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
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
                      "relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition-all duration-200",
                      foraDoMes && "opacity-35",
                      desabilitado
                        ? "cursor-not-allowed border-transparent bg-muted/70 text-muted-foreground"
                        : "border-success/35 bg-success/10 text-foreground hover:-translate-y-0.5 hover:border-success hover:shadow-soft",
                      selecionado &&
                        "border-transparent brand-gradient text-primary-foreground shadow-glow hover:-translate-y-0.5",
                    )}
                  >
                    <span className="tabular-nums">{format(dia, "d")}</span>
                    {!desabilitado && !selecionado && (
                      <span className="mt-1 size-1.5 rounded-full bg-success" aria-hidden />
                    )}
                    {desabilitado && !passado && (
                      <span className="mt-1 h-0.5 w-4 rounded-full bg-muted-foreground/50" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-md border border-success/40 bg-success/15" /> Livre
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-md bg-muted" /> Ocupado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-md brand-gradient" /> Sua escolha
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-elegant backdrop-blur">
          <CardHeader className="border-b border-border/60 bg-card/60">
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <CalendarCheck className="size-4.5 text-primary" aria-hidden />
              Seus dados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form
              className="space-y-4"
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
                    : "border-dashed bg-muted/40",
                )}
              >
                {dataEscolhida ? (
                  <>
                    <p className="font-display font-bold">{formatarData(dataEscolhida)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Das {configuracoes?.entradaPadrao ?? "08:00"} às{" "}
                      {configuracoes?.saidaPadrao ?? "22:00"}
                      {configuracoes?.valorPadrao
                        ? ` · ${formatarMoeda(configuracoes.valorPadrao)}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Escolha uma data disponível acima.</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="publico-nome">Nome completo</Label>
                  <Input
                    id="publico-nome"
                    className="h-11 rounded-xl"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publico-telefone">Telefone / WhatsApp</Label>
                  <CampoTelefone
                    id="publico-telefone"
                    className="h-11 rounded-xl"
                    value={telefone}
                    onChange={(valor) => setTelefone(valor)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publico-obs">Observações (opcional)</Label>
                <Textarea
                  id="publico-obs"
                  rows={3}
                  className="rounded-xl"
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
                className="h-12 w-full rounded-xl text-base font-semibold shadow-glow"
                disabled={enviar.isPending || !dataEscolhida}
              >
                {enviar.isPending ? "Reservando..." : "Confirmar reserva"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                A reserva fica registrada como pendente de pagamento. Entraremos em contato para
                confirmar os detalhes.
              </p>
            </form>
          </CardContent>
        </Card>

        <footer className="pb-6 text-center text-xs text-muted-foreground">
          Área de Lazer Biel · Reservas online
        </footer>
      </main>
    </div>
  );
}

