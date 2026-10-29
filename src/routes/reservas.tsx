import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  CheckSquare,
  FileText,
  MessageCircle,
  Pencil,
  Phone,
  Search,
  Trash2,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { z } from "zod";

import { PageHeader } from "@/components/app/PageHeader";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { ListaSkeleton } from "@/components/app/AppLoading";
import { ItemLista, TransicaoEstado } from "@/components/app/MotionUI";
import { AppConfirmDialog } from "@/components/app/AppConfirmDialog";
import { BadgeStatusPagamento, BadgeStatusReserva } from "@/components/app/StatusBadges";
import { ChecklistDialog } from "@/components/reservas/ChecklistDialog";
import { ContratoDialog } from "@/components/reservas/ContratoDialog";
import { LembretesPagamento } from "@/components/reservas/LembretesPagamento";
import { MensagemGrupoDialog } from "@/components/reservas/MensagemGrupoDialog";
import { ReservaFormDialog } from "@/components/reservas/ReservaFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { STATUS_PAGAMENTO } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { chaves, useAcao, useReservas, useSolicitacoesSite } from "@/hooks/useDados";
import { LogService } from "@/services/LogService";
import { ReservaService } from "@/services/ReservaService";
import { SolicitacoesService, type Solicitacao } from "@/services/SolicitacoesService";
import type { Reserva } from "@/types";
import { chaveDia, formatarData, formatarDataExtenso, formatarMoeda } from "@/utils/formatadores";

/** Filtros da página na URL: compartilháveis pelo endereço e preservados ao voltar. */
const filtros = z.object({
  busca: z.string().optional(),
  /** Abre direto a reserva indicada (usado pela busca global e pelo mapa da agenda). */
  reserva: z.string().optional(),
  aba: z.enum(["todas", "futuras", "finalizadas", "canceladas"]).optional(),
  pagamento: z.string().optional(),
});

export const Route = createFileRoute("/reservas")({
  validateSearch: filtros,
  head: () => ({
    meta: [
      { title: "Reservas — Área de Lazer Biel" },
      {
        name: "description",
        content: "Controle de locações, pagamentos, contratos e checklist de encerramento.",
      },
      { property: "og:title", content: "Reservas — Área de Lazer Biel" },
      { property: "og:description", content: "Gerencie locações, pagamentos e contratos." },
    ],
  }),
  component: PaginaReservas,
});

type Abas = NonNullable<z.infer<typeof filtros>["aba"]>;

/** Patch de filtros na URL — `undefined` remove o parâmetro. */
type PatchSearch = {
  busca?: string | undefined;
  aba?: Abas | undefined;
  pagamento?: string | undefined;
};

const ABAS: Array<{ valor: Abas; label: string }> = [
  { valor: "todas", label: "Todas" },
  { valor: "futuras", label: "Futuras" },
  { valor: "finalizadas", label: "Finalizadas" },
  { valor: "canceladas", label: "Canceladas" },
];

/** Título da seção de um dia: relativo para hoje/amanhã, extenso para o resto. */
function tituloGrupo(dataISO: string): string {
  const hoje = chaveDia(new Date());
  const amanha = chaveDia(addDays(new Date(), 1));
  if (dataISO === hoje) return "Hoje";
  if (dataISO === amanha) return "Amanhã";
  return formatarDataExtenso(dataISO).replace(/^./, (letra) => letra.toUpperCase());
}

function PaginaReservas() {
  const { admin } = useAuth();
  const { data: reservas, isLoading } = useReservas();
  const {
    data: solicitacoesSite,
    isLoading: carregandoSolicitacoes,
    isError: erroSolicitacoes,
    refetch: recarregarSolicitacoes,
  } = useSolicitacoesSite();
  const search = Route.useSearch();
  const navegar = Route.useNavigate();

  const busca = search.busca ?? "";
  const aba: Abas = search.aba ?? "todas";
  const filtroPagamento = search.pagamento ?? "todos";

  // Deep-link ?reserva=id: abre a reserva assim que os dados chegam e limpa o parâmetro.
  useEffect(() => {
    if (!search.reserva || reservas.length === 0) return;
    const alvo = reservas.find((reserva) => reserva.id === search.reserva);
    if (alvo) {
      setEmEdicao(alvo);
      setFormAberto(true);
    }
    void navegar({ search: (anterior) => ({ ...anterior, reserva: undefined }), replace: true });
  }, [search.reserva, reservas, navegar]);

  const mudarSearch = (patch: PatchSearch) =>
    void navegar({ search: (anterior) => ({ ...anterior, ...patch }), replace: true });

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Reserva | null>(null);
  const [contrato, setContrato] = useState<Reserva | null>(null);
  const [checklist, setChecklist] = useState<Reserva | null>(null);
  const [paraCancelar, setParaCancelar] = useState<Reserva | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Reserva | null>(null);
  const [mensagemAberta, setMensagemAberta] = useState(false);
  const [decisaoSolicitacao, setDecisaoSolicitacao] = useState<{
    solicitacao: Solicitacao;
    decisao: "aprovada" | "recusada";
    abrirWhatsApp: boolean;
  } | null>(null);

  const decidirSolicitacao = useAcao(
    ({ solicitacao, decisao }: {
      solicitacao: Solicitacao;
      decisao: "aprovada" | "recusada";
      abrirWhatsApp: boolean;
    }) => SolicitacoesService.decidir(solicitacao.id, decisao, decisao === "aprovada"),
    {
      sucesso: "Solicitação atualizada. O status da notificação aparece no pedido.",
      invalidar: [chaves.solicitacoesSite, chaves.reservas, chaves.clientes, chaves.logs],
      aoConcluir: () => setDecisaoSolicitacao(null),
    },
  );

  const cancelar = useAcao(
    async (reserva: Reserva) => {
      const autor = admin?.uid ?? "sistema";
      await ReservaService.definirStatus(reserva.id, "cancelada", autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "cancelar",
        colecao: "reservas",
        documento: reserva.id,
        descricao: `Cancelou a reserva de ${reserva.clienteNome} em ${formatarData(reserva.data)}`,
      });
      await ReservaService.recalcularResumoCliente(reserva.clienteId, autor);
    },
    {
      sucesso: "Reserva cancelada.",
      invalidar: [chaves.reservas, chaves.clientes, chaves.logs],
      aoConcluir: () => setParaCancelar(null),
    },
  );

  const excluir = useAcao(
    async (reserva: Reserva) => {
      const autor = admin?.uid ?? "sistema";
      await ReservaService.moverParaLixeira(reserva, autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "excluir",
        colecao: "reservas",
        documento: reserva.id,
        descricao: `Moveu para a lixeira a reserva de ${reserva.clienteNome}`,
        antes: reserva,
      });
    },
    {
      sucesso: "Reserva movida para a lixeira.",
      invalidar: [chaves.reservas, chaves.lixeira, chaves.logs],
      aoConcluir: () => setParaExcluir(null),
    },
  );

  /** Contagem por aba — reflete os filtros, menos a própria aba. */
  const contagens = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const hoje = chaveDia(new Date());
    const base = reservas
      .filter((reserva) =>
        filtroPagamento === "todos" ? true : reserva.statusPagamento === filtroPagamento,
      )
      .filter((reserva) => !termo || reserva.clienteNome.toLowerCase().includes(termo));
    return {
      todas: base.length,
      futuras: base.filter((r) => r.data >= hoje && r.statusReserva === "reservada").length,
      finalizadas: base.filter((r) => r.statusReserva === "finalizada").length,
      canceladas: base.filter((r) => r.statusReserva === "cancelada").length,
    };
  }, [reservas, filtroPagamento, busca]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const hoje = chaveDia(new Date());
    return reservas
      .filter((reserva) => {
        if (aba === "futuras") return reserva.data >= hoje && reserva.statusReserva === "reservada";
        if (aba === "finalizadas") return reserva.statusReserva === "finalizada";
        if (aba === "canceladas") return reserva.statusReserva === "cancelada";
        return true;
      })
      .filter((reserva) =>
        filtroPagamento === "todos" ? true : reserva.statusPagamento === filtroPagamento,
      )
      .filter((reserva) => !termo || reserva.clienteNome.toLowerCase().includes(termo))
      .sort(
        (a, b) =>
          a.data.localeCompare(b.data) ||
          a.entrada.localeCompare(b.entrada) ||
          a.clienteNome.localeCompare(b.clienteNome),
      );
  }, [reservas, aba, filtroPagamento, busca]);

  /** Agrupadas por dia, mantendo a ordenação. */
  const grupos = useMemo(() => {
    const mapa = new Map<string, Reserva[]>();
    filtradas.forEach((reserva) => {
      const lista = mapa.get(reserva.data) ?? [];
      lista.push(reserva);
      mapa.set(reserva.data, lista);
    });
    return Array.from(mapa.entries());
  }, [filtradas]);

  const abrirNova = () => {
    setEmEdicao(null);
    setFormAberto(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Reservas"
        descricao="Locações, pagamentos, contratos e encerramento com checklist."
        acoes={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMensagemAberta(true)}>
              <MessageCircle className="size-4" aria-hidden />
              Mensagem do grupo
            </Button>
            <Button onClick={abrirNova}>
              <CalendarPlus className="size-4" aria-hidden />
              Nova reserva
            </Button>
          </div>
        }
      />

      <LembretesPagamento />

      <section className="space-y-3" aria-labelledby="pedidos-site-titulo">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="pedidos-site-titulo" className="text-lg font-semibold tracking-tight">
              Pedidos do site
            </h2>
            <p className="text-sm text-muted-foreground">
              Solicitações recebidas pelo formulário público; ainda não são reservas confirmadas.
            </p>
          </div>
          <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            {solicitacoesSite.length} recente{solicitacoesSite.length === 1 ? "" : "s"}
          </span>
        </div>

        {carregandoSolicitacoes ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Carregando pedidos do site…
            </CardContent>
          </Card>
        ) : erroSolicitacoes ? (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-destructive">Não foi possível carregar os pedidos do site.</p>
              <Button variant="outline" size="sm" onClick={() => void recarregarSolicitacoes()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : solicitacoesSite.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Nenhum pedido recebido pelo site ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {solicitacoesSite.map((solicitacao) => (
              <Card key={solicitacao.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{solicitacao.nome}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          solicitacao.status === "aprovada"
                            ? "bg-success/10 text-success"
                            : solicitacao.status === "recusada"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {solicitacao.status === "aprovada"
                          ? "Aprovada"
                          : solicitacao.status === "recusada"
                            ? "Recusada"
                            : "Aguardando análise"}
                      </span>
                      {solicitacao.whatsappStatus && (
                        <span
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                          title="O status do envio da notificação para este contato."
                        >
                          WhatsApp: {rotuloStatusWhatsApp(solicitacao.whatsappStatus)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4" aria-hidden />
                        {formatarData(solicitacao.data)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UsersRound className="size-4" aria-hidden />
                        {solicitacao.convidados} convidados
                      </span>
                    </div>
                    {solicitacao.observacoes && (
                      <p className="text-sm text-muted-foreground">{solicitacao.observacoes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(!solicitacao.status || solicitacao.status === "pendente") && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success text-white hover:bg-success/90"
                          disabled={decidirSolicitacao.isPending}
                          onClick={() =>
                            setDecisaoSolicitacao({ solicitacao, decisao: "aprovada", abrirWhatsApp: false })
                          }
                        >
                          <Check className="size-4" aria-hidden />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={decidirSolicitacao.isPending}
                          onClick={() =>
                            setDecisaoSolicitacao({ solicitacao, decisao: "recusada", abrirWhatsApp: true })
                          }
                        >
                          <X className="size-4" aria-hidden />
                          Recusar
                        </Button>
                      </>
                    )}
                    <a
                      href={`https://wa.me/55${solicitacao.telefone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label={`Conversar com ${solicitacao.nome} pelo WhatsApp`}
                    >
                      <Phone className="size-4" aria-hidden />
                      WhatsApp
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Buscar por cliente"
            value={busca}
            onChange={(evento) => mudarSearch({ busca: evento.target.value || undefined })}
            aria-label="Buscar reservas"
          />
        </div>
        <Select
          value={filtroPagamento}
          onValueChange={(valor) => mudarSearch({ pagamento: valor })}
        >
          <SelectTrigger className="sm:w-52" aria-label="Filtrar por pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os pagamentos</SelectItem>
            {Object.entries(STATUS_PAGAMENTO).map(([chave, item]) => (
              <SelectItem key={chave} value={chave}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={aba} onValueChange={(valor) => mudarSearch({ aba: valor as Abas })}>
        <TabsList>
          {ABAS.map((item) => (
            <TabsTrigger key={item.valor} value={item.valor}>
              {item.label}
              <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                {contagens[item.valor]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <TransicaoEstado
        estado={isLoading ? "carregando" : filtradas.length === 0 ? "vazio" : "pronto"}
      >
        {isLoading ? (
          <ListaSkeleton />
        ) : filtradas.length === 0 ? (
          <AppEmptyState
            icone={CalendarPlus}
            titulo="Nenhuma reserva encontrada"
            descricao="Ajuste os filtros ou registre uma nova locação."
            acao={{ label: "Nova reserva", aoClicar: abrirNova }}
          />
        ) : (
          <div className="space-y-6">
            {grupos.map(([data, itens], indiceGrupo) => (
              <section key={data} className="space-y-2" aria-label={tituloGrupo(data)}>
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    {tituloGrupo(data)}
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {itens.length} reserva{itens.length === 1 ? "" : "s"}
                  </span>
                  <div className="h-px flex-1 bg-border" aria-hidden />
                </div>

                {/* Mobile: lista de cards */}
                <ul className="space-y-2 md:hidden">
                  {itens.map((reserva, indice) => (
                    <ItemLista key={reserva.id} indice={indice + indiceGrupo * itens.length}>
                      <li>
                        <Card>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{reserva.clienteNome}</p>
                              <BadgeStatusReserva status={reserva.statusReserva} />
                              <BadgeStatusPagamento status={reserva.statusPagamento} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatarData(reserva.data)} · {reserva.entrada}–{reserva.saida} ·{" "}
                              {formatarMoeda(reserva.valor)}
                              {reserva.statusPagamento !== "pago" && (
                                <span className="ml-1 text-warning">
                                  (falta {formatarMoeda(reserva.valor - reserva.valorPago)})
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setContrato(reserva)}
                              >
                                <FileText className="size-3.5" aria-hidden />
                                Contrato
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setChecklist(reserva)}
                              >
                                <CheckSquare className="size-3.5" aria-hidden />
                                Checklist
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEmEdicao(reserva);
                                  setFormAberto(true);
                                }}
                              >
                                <Pencil className="size-3.5" aria-hidden />
                                Editar
                              </Button>
                              {reserva.statusReserva === "reservada" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setParaCancelar(reserva)}
                                >
                                  <XCircle className="size-3.5" aria-hidden />
                                  Cancelar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setParaExcluir(reserva)}
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                                Excluir
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    </ItemLista>
                  ))}
                </ul>

                {/* Desktop: tabela por grupo */}
                <div className="hidden md:block">
                  <TabelaGrupo
                    reservas={itens}
                    baseIndice={indiceGrupo * itens.length}
                    aoContrato={setContrato}
                    aoChecklist={setChecklist}
                    aoEditar={(reserva) => {
                      setEmEdicao(reserva);
                      setFormAberto(true);
                    }}
                    aoCancelar={setParaCancelar}
                    aoExcluir={setParaExcluir}
                  />
                </div>
              </section>
            ))}
          </div>
        )}
      </TransicaoEstado>

      <MensagemGrupoDialog
        aberto={mensagemAberta}
        aoFechar={() => setMensagemAberta(false)}
        reservas={reservas}
      />
      <ReservaFormDialog
        aberto={formAberto}
        aoFechar={() => setFormAberto(false)}
        reserva={emEdicao}
      />
      <ContratoDialog
        aberto={Boolean(contrato)}
        aoFechar={() => setContrato(null)}
        reserva={contrato}
      />
      <ChecklistDialog
        aberto={Boolean(checklist)}
        aoFechar={() => setChecklist(null)}
        reserva={checklist}
      />
      <AppConfirmDialog
        aberto={Boolean(decisaoSolicitacao)}
        aoFechar={() => setDecisaoSolicitacao(null)}
        titulo={decisaoSolicitacao?.decisao === "aprovada" ? "Aprovar esta solicitação?" : "Recusar esta solicitação?"}
        descricao={
          decisaoSolicitacao?.decisao === "aprovada"
            ? "A data será reservada e uma reserva será criada no painel."
            : "A solicitação será recusada. Você pode escolher se quer avisar a pessoa pelo WhatsApp."
        }
        conteudo={
          decisaoSolicitacao?.decisao === "recusada" ? (
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-primary"
                checked={decisaoSolicitacao.abrirWhatsApp}
                onChange={(evento) =>
                  setDecisaoSolicitacao((atual) =>
                    atual ? { ...atual, abrirWhatsApp: evento.target.checked } : atual,
                  )
                }
              />
              <span>Abrir o WhatsApp com uma mensagem de recusa pronta. Você poderá revisar e decidir se envia; desmarque para não abrir a conversa.</span>
            </label>
          ) : null
        }
        confirmarLabel={decisaoSolicitacao?.decisao === "aprovada" ? "Aprovar pedido" : "Recusar pedido"}
        destrutivo={decisaoSolicitacao?.decisao === "recusada"}
        aoConfirmar={() => {
          if (!decisaoSolicitacao) return;
          const decisao = decisaoSolicitacao;
          const janelaWhatsApp =
            decisao.decisao === "recusada" && decisao.abrirWhatsApp
              ? window.open("about:blank", "_blank")
              : null;
          if (janelaWhatsApp) janelaWhatsApp.opener = null;
          decidirSolicitacao.mutate(decisao, {
            onSuccess: () => {
              if (janelaWhatsApp) {
                janelaWhatsApp.location.href = urlWhatsAppRecusa(decisao.solicitacao);
              }
            },
            onError: () => janelaWhatsApp?.close(),
          });
        }}
      />
      <AppConfirmDialog
        aberto={Boolean(paraCancelar)}
        aoFechar={() => setParaCancelar(null)}
        titulo="Cancelar esta reserva?"
        descricao="A data volta a ficar disponível na agenda e o histórico do cliente é recalculado."
        confirmarLabel="Cancelar reserva"
        destrutivo
        aoConfirmar={() => paraCancelar && cancelar.mutate(paraCancelar)}
      />
      <AppConfirmDialog
        aberto={Boolean(paraExcluir)}
        aoFechar={() => setParaExcluir(null)}
        titulo="Mover reserva para a lixeira?"
        descricao="Você poderá restaurá-la depois pela página Lixeira."
        confirmarLabel="Mover para lixeira"
        destrutivo
        aoConfirmar={() => paraExcluir && excluir.mutate(paraExcluir)}
      />
    </div>
  );
}

function urlWhatsAppRecusa(solicitacao: Solicitacao): string {
  const telefone = String(solicitacao.telefone ?? "").replace(/\D/g, "");
  const mensagem = `Olá, ${solicitacao.nome}! Agradecemos pelo seu pedido de reserva para ${formatarData(solicitacao.data)}. Infelizmente, não poderemos confirmar essa solicitação. Agradecemos a compreensão. — Área de Lazer Biel.`;
  return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
}

function rotuloStatusWhatsApp(status: string): string {
  switch (status) {
    case "aceita":
      return "aceita pela Meta";
    case "falhou":
      return "falhou";
    case "nao_configurado":
      return "não configurado";
    case "enviando":
      return "enviando";
    case "nao_autorizado":
      return "sem consentimento";
    case "nao_enviado":
      return "não enviada automaticamente";
    default:
      return status;
  }
}

function TabelaGrupo({
  reservas,
  baseIndice,
  aoContrato,
  aoChecklist,
  aoEditar,
  aoCancelar,
  aoExcluir,
}: {
  reservas: Reserva[];
  baseIndice: number;
  aoContrato: (reserva: Reserva) => void;
  aoChecklist: (reserva: Reserva) => void;
  aoEditar: (reserva: Reserva) => void;
  aoCancelar: (reserva: Reserva) => void;
  aoExcluir: (reserva: Reserva) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="min-w-40">Cliente</TableHead>
          <TableHead className="w-[11rem]">Data</TableHead>
          <TableHead className="w-[9rem]">Valor</TableHead>
          <TableHead className="w-[11rem]">Status</TableHead>
          <TableHead className="w-[13rem] text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservas.map((reserva, indice) => (
          <ItemLista key={reserva.id} indice={baseIndice + indice} elemento="tr">
            <TableRow className="bg-transparent transition-colors duration-150 hover:bg-primary-soft/40">
              <TableCell className="font-medium">{reserva.clienteNome}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                <span className="mr-2 text-foreground">{formatarData(reserva.data)}</span>
                {reserva.entrada}–{reserva.saida}
              </TableCell>
              <TableCell className="tabular-nums">
                <span className="font-semibold">{formatarMoeda(reserva.valor)}</span>
                {reserva.statusPagamento !== "pago" && (
                  <span className="ml-1 text-xs text-warning">
                    falta {formatarMoeda(reserva.valor - reserva.valorPago)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <BadgeStatusReserva status={reserva.statusReserva} />
                  <BadgeStatusPagamento status={reserva.statusPagamento} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <BotaoIcone
                    titulo="Contrato"
                    ariaLabel={`Contrato de ${reserva.clienteNome}`}
                    onClick={() => aoContrato(reserva)}
                  >
                    <FileText className="size-4" aria-hidden />
                  </BotaoIcone>
                  <BotaoIcone
                    titulo="Checklist"
                    ariaLabel={`Checklist de ${reserva.clienteNome}`}
                    onClick={() => aoChecklist(reserva)}
                  >
                    <CheckSquare className="size-4" aria-hidden />
                  </BotaoIcone>
                  <BotaoIcone
                    titulo="Editar"
                    ariaLabel={`Editar reserva de ${reserva.clienteNome}`}
                    onClick={() => aoEditar(reserva)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </BotaoIcone>
                  {reserva.statusReserva === "reservada" && (
                    <BotaoIcone
                      titulo="Cancelar reserva"
                      ariaLabel={`Cancelar reserva de ${reserva.clienteNome}`}
                      classe="text-warning hover:text-warning"
                      onClick={() => aoCancelar(reserva)}
                    >
                      <XCircle className="size-4" aria-hidden />
                    </BotaoIcone>
                  )}
                  <BotaoIcone
                    titulo="Excluir"
                    ariaLabel={`Excluir reserva de ${reserva.clienteNome}`}
                    classe="text-destructive hover:text-destructive"
                    onClick={() => aoExcluir(reserva)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </BotaoIcone>
                </div>
              </TableCell>
            </TableRow>
          </ItemLista>
        ))}
      </TableBody>
    </Table>
  );
}

function BotaoIcone({
  titulo,
  ariaLabel,
  classe,
  onClick,
  children,
}: {
  titulo: string;
  ariaLabel: string;
  classe?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`size-8 rounded-full ${classe ?? ""}`}
          onClick={onClick}
          aria-label={ariaLabel}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{titulo}</TooltipContent>
    </Tooltip>
  );
}
