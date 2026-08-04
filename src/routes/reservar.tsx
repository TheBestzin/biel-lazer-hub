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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <AppLogo />
          {whatsapp && (
            <Button variant="outline" size="sm" asChild>
              <a href={`https://wa.me/55${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="space-y-2 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Reserve sua data</h1>
          <p className="text-sm text-muted-foreground">
            Veja no calendário se o dia que você quer está livre e faça sua reserva na hora.
            {configuracoes?.valorPadrao
              ? ` Diária a partir de ${formatarMoeda(configuracoes.valorPadrao)}.`
              : ""}
          </p>
        </section>

        {concluido && (
          <Alert>
            <AlertDescription className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                Reserva confirmada para <strong>{formatarData(concluido)}</strong>. Em breve
                entraremos em contato pelo WhatsApp para combinar o pagamento.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base capitalize">
              {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Mês anterior"
                onClick={() => setMes(addMonths(mes, -1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Próximo mês"
                onClick={() => setMes(addMonths(mes, 1))}
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {DIAS.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
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
                      "flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition",
                      foraDoMes && "opacity-40",
                      desabilitado
                        ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground line-through"
                        : "border-success/40 bg-success/10 text-foreground hover:border-success",
                      selecionado && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {format(dia, "d")}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded border border-success/40 bg-success/10" /> Disponível
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded bg-muted" /> Indisponível
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4" aria-hidden />
              Seus dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(evento) => {
                evento.preventDefault();
                enviar.mutate();
              }}
            >
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                {dataEscolhida ? (
                  <>
                    <p className="font-medium">{formatarData(dataEscolhida)}</p>
                    <p className="text-xs text-muted-foreground">
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
              <div className="space-y-2">
                <Label htmlFor="publico-nome">Nome completo</Label>
                <Input
                  id="publico-nome"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publico-telefone">Telefone / WhatsApp</Label>
                <CampoTelefone
                  id="publico-telefone"
                  value={telefone}
                  onChange={(valor) => setTelefone(valor)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publico-obs">Observações (opcional)</Label>
                <Textarea
                  id="publico-obs"
                  rows={3}
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
              <Button type="submit" className="w-full" disabled={enviar.isPending || !dataEscolhida}>
                {enviar.isPending ? "Reservando..." : "Confirmar reserva"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                A reserva fica registrada como pendente de pagamento. Entraremos em contato para
                confirmar os detalhes.
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
