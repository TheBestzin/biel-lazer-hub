import { useEffect, useMemo, useState } from "react";

import { CampoMoeda } from "@/components/app/CamposMascarados";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STATUS_PAGAMENTO } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { chaves, useAcao, useBloqueios, useClientes, useConfiguracoes, useReservas } from "@/hooks/useDados";
import { FinanceiroService } from "@/services/FinanceiroService";
import { LogService } from "@/services/LogService";
import { NotificacaoService } from "@/services/NotificacaoService";
import { ReservaService, type DadosReserva } from "@/services/ReservaService";
import type { Reserva, StatusPagamento } from "@/types";
import { formatarData } from "@/utils/formatadores";

interface ReservaFormDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  reserva?: Reserva | null;
  dataInicial?: string | undefined;
}

export function ReservaFormDialog({ aberto, aoFechar, reserva, dataInicial }: ReservaFormDialogProps) {
  const { admin } = useAuth();
  const { data: clientes } = useClientes();
  const { data: reservas } = useReservas();
  const { data: bloqueios } = useBloqueios();
  const { data: configuracoes } = useConfiguracoes();
  const [dados, setDados] = useState<DadosReserva>({
    clienteId: "",
    data: dataInicial ?? "",
    entrada: "08:00",
    saida: "22:00",
    valor: 0,
    valorPago: 0,
    statusPagamento: "pendente",
    observacoes: "",
  });
  const [conflito, setConflito] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setConflito(null);
    setDados(
      reserva
        ? {
            clienteId: reserva.clienteId,
            data: reserva.data,
            entrada: reserva.entrada,
            saida: reserva.saida,
            valor: reserva.valor,
            valorPago: reserva.valorPago,
            statusPagamento: reserva.statusPagamento,
            observacoes: reserva.observacoes ?? "",
          }
        : {
            clienteId: "",
            data: dataInicial ?? "",
            entrada: configuracoes?.entradaPadrao ?? "08:00",
            saida: configuracoes?.saidaPadrao ?? "22:00",
            valor: configuracoes?.valorPadrao ?? 0,
            valorPago: 0,
            statusPagamento: "pendente",
            observacoes: "",
          },
    );
  }, [aberto, reserva, dataInicial, configuracoes]);

  const clienteSelecionado = useMemo(
    () => clientes.find((item) => item.id === dados.clienteId) ?? null,
    [clientes, dados.clienteId],
  );

  const salvar = useAcao(
    async (valores: DadosReserva) => {
      const autor = admin?.uid ?? "sistema";
      if (!clienteSelecionado) throw new Error("Selecione um cliente para a reserva.");
      const problema = await ReservaService.validar(
        valores,
        clienteSelecionado,
        reservas,
        bloqueios,
        reserva?.id,
      );
      if (problema) throw new Error(problema.motivo);

      if (reserva) {
        await ReservaService.atualizar(
          reserva.id,
          {
            ...valores,
            clienteNome: clienteSelecionado.nome,
            clienteTelefone: clienteSelecionado.telefone,
            clienteCPF: clienteSelecionado.cpf ?? "",
          },
          autor,
        );
        await LogService.registrar({
          usuario: autor,
          usuarioNome: admin?.nome ?? "Sistema",
          acao: "atualizar",
          colecao: "reservas",
          documento: reserva.id,
          descricao: `Atualizou a reserva de ${clienteSelecionado.nome} em ${formatarData(valores.data)}`,
          antes: reserva,
          depois: valores,
        });
      } else {
        const id = await ReservaService.criar(valores, clienteSelecionado, autor);
        await LogService.registrar({
          usuario: autor,
          usuarioNome: admin?.nome ?? "Sistema",
          acao: "criar",
          colecao: "reservas",
          documento: id,
          descricao: `Criou a reserva de ${clienteSelecionado.nome} em ${formatarData(valores.data)}`,
          depois: valores,
        });
        await NotificacaoService.criar(
          {
            titulo: "Nova reserva registrada",
            descricao: `${clienteSelecionado.nome} — ${formatarData(valores.data)}`,
            tipo: "reserva",
          },
          autor,
        );
      }

      const pagoAnterior = reserva?.valorPago ?? 0;
      const diferenca = valores.valorPago - pagoAnterior;
      if (diferenca > 0) {
        await FinanceiroService.registrar(
          {
            tipo: "receita",
            valor: diferenca,
            categoria: "Locação",
            ...(reserva ? { reservaId: reserva.id } : {}),
            descricao: `Pagamento — ${clienteSelecionado.nome}`,
            data: valores.data,
          },
          autor,
        );
      }
      await ReservaService.recalcularResumoCliente(clienteSelecionado.id, autor);
    },
    {
      sucesso: reserva ? "Reserva atualizada." : "Reserva criada.",
      invalidar: [chaves.reservas, chaves.clientes, chaves.financeiro, chaves.logs, chaves.notificacoes],
      aoConcluir: aoFechar,
    },
  );

  function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    if (!dados.clienteId || !dados.data) {
      setConflito("Selecione o cliente e a data da reserva.");
      return;
    }
    setConflito(null);
    salvar.mutate(dados);
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{reserva ? "Editar reserva" : "Nova reserva"}</DialogTitle>
          <DialogDescription>
            O sistema valida datas bloqueadas, conflitos e clientes restritos.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submeter}>
          <div className="space-y-2">
            <Label htmlFor="reserva-cliente">Cliente</Label>
            <Select
              value={dados.clienteId}
              onValueChange={(valor) => setDados({ ...dados, clienteId: valor })}
            >
              <SelectTrigger id="reserva-cliente">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {clienteSelecionado?.status === "nao_alugar" && (
            <Alert variant="destructive">
              <AlertDescription>
                Este cliente está marcado como &quot;Não alugar novamente&quot;.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="reserva-data">Data</Label>
              <Input
                id="reserva-data"
                type="date"
                value={dados.data}
                onChange={(evento) => setDados({ ...dados, data: evento.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserva-entrada">Entrada</Label>
              <Input
                id="reserva-entrada"
                type="time"
                value={dados.entrada}
                onChange={(evento) => setDados({ ...dados, entrada: evento.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserva-saida">Saída</Label>
              <Input
                id="reserva-saida"
                type="time"
                value={dados.saida}
                onChange={(evento) => setDados({ ...dados, saida: evento.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserva-valor">Valor total</Label>
              <CampoMoeda
                id="reserva-valor"
                value={dados.valor}
                onChange={(valor) => setDados({ ...dados, valor })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reserva-pago">Valor pago</Label>
              <CampoMoeda
                id="reserva-pago"
                value={dados.valorPago}
                onChange={(valor) =>
                  setDados({
                    ...dados,
                    valorPago: valor,
                    statusPagamento:
                      valor <= 0 ? "pendente" : valor >= dados.valor ? "pago" : "parcial",
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserva-status">Status do pagamento</Label>
              <Select
                value={dados.statusPagamento}
                onValueChange={(valor) =>
                  setDados({ ...dados, statusPagamento: valor as StatusPagamento })
                }
              >
                <SelectTrigger id="reserva-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_PAGAMENTO).map(([chave, item]) => (
                    <SelectItem key={chave} value={chave}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reserva-obs">Observações</Label>
            <Textarea
              id="reserva-obs"
              rows={3}
              value={dados.observacoes}
              onChange={(evento) => setDados({ ...dados, observacoes: evento.target.value })}
              placeholder="Número de convidados, combinados especiais, etc."
            />
          </div>
          {conflito && (
            <Alert variant="destructive">
              <AlertDescription>{conflito}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {reserva ? "Salvar alterações" : "Criar reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
