import { where } from "firebase/firestore";

import { COLECOES, atualizar, criar, listar, obter } from "@/firebase/firestore";
import { ClienteService } from "@/services/ClienteService";
import { LixeiraService } from "@/services/LixeiraService";
import type {
  Bloqueio,
  ChecklistItem,
  Cliente,
  Reserva,
  StatusPagamento,
  StatusReserva,
} from "@/types";
import { CHECKLIST_PADRAO } from "@/constants";
import { apenasDigitos } from "@/utils/documentos";

export interface DadosReserva {
  clienteId: string;
  data: string;
  entrada: string;
  saida: string;
  valor: number;
  valorPago: number;
  statusPagamento: StatusPagamento;
  observacoes?: string;
}

export interface ConflitoReserva {
  motivo: string;
}

export function checklistInicial(): ChecklistItem[] {
  return CHECKLIST_PADRAO.map((label, indice) => ({
    id: `item-${indice}`,
    label,
    concluido: false,
  }));
}

export const ReservaService = {
  listar(incluirExcluidas = false): Promise<Reserva[]> {
    return listar<Reserva>(COLECOES.reservas).then((itens) =>
      itens
        .filter((item) => (incluirExcluidas ? true : !item.deleted))
        .sort((a, b) => b.data.localeCompare(a.data)),
    );
  },

  obter(id: string): Promise<Reserva | null> {
    return obter<Reserva>(COLECOES.reservas, id);
  },

  listarPorCliente(clienteId: string): Promise<Reserva[]> {
    return listar<Reserva>(COLECOES.reservas, [where("clienteId", "==", clienteId)]).then((itens) =>
      itens.filter((item) => !item.deleted).sort((a, b) => b.data.localeCompare(a.data)),
    );
  },

  async validar(
    dados: Pick<DadosReserva, "data" | "entrada" | "saida">,
    cliente: Cliente,
    reservas: Reserva[],
    bloqueios: Bloqueio[],
    ignorarId?: string,
  ): Promise<ConflitoReserva | null> {
    if (cliente.status === "nao_alugar") {
      return { motivo: `${cliente.nome} está marcado como "Não alugar novamente".` };
    }
    if (dados.entrada >= dados.saida) {
      return { motivo: "O horário de entrada deve ser anterior ao horário de saída." };
    }
    if (bloqueios.some((b) => !b.deleted && b.data === dados.data)) {
      return { motivo: "Esta data está bloqueada e não pode receber reservas." };
    }
    const conflito = reservas.some(
      (r) =>
        !r.deleted &&
        r.id !== ignorarId &&
        r.data === dados.data &&
        r.statusReserva !== "cancelada",
    );
    if (conflito) return { motivo: "Esta data já possui uma reserva ativa." };
    return null;
  },

  async criar(dados: DadosReserva, cliente: Cliente, autor: string): Promise<string> {
    return criar(
      COLECOES.reservas,
      {
        ...dados,
        clienteNome: cliente.nome,
        clienteTelefone: apenasDigitos(cliente.telefone),
        clienteCPF: cliente.cpf,
        observacoes: dados.observacoes ?? "",
        statusReserva: "reservada" satisfies StatusReserva,
        checklist: checklistInicial(),
      },
      autor,
    );
  },

  async atualizar(id: string, dados: Partial<Reserva>, autor: string): Promise<void> {
    await atualizar(COLECOES.reservas, id, dados as Record<string, unknown>, autor);
  },

  async definirStatus(id: string, status: StatusReserva, autor: string): Promise<void> {
    await atualizar(COLECOES.reservas, id, { statusReserva: status }, autor);
  },

  async definirPagamento(
    id: string,
    statusPagamento: StatusPagamento,
    valorPago: number,
    autor: string,
  ): Promise<void> {
    await atualizar(COLECOES.reservas, id, { statusPagamento, valorPago }, autor);
  },

  async salvarChecklist(id: string, checklist: ChecklistItem[], autor: string): Promise<void> {
    await atualizar(COLECOES.reservas, id, { checklist }, autor);
  },

  async moverParaLixeira(reserva: Reserva, autor: string): Promise<void> {
    await atualizar(COLECOES.reservas, reserva.id, { deleted: true }, autor);
    await LixeiraService.mover(
      COLECOES.reservas,
      reserva.id,
      `${reserva.clienteNome} — ${reserva.data}`,
      { clienteNome: reserva.clienteNome, data: reserva.data, valor: reserva.valor },
      autor,
    );
  },

  async recalcularResumoCliente(clienteId: string, autor: string): Promise<void> {
    const reservas = await ReservaService.listarPorCliente(clienteId);
    const validas = reservas.filter((r) => r.statusReserva !== "cancelada");
    await ClienteService.atualizarResumo(
      clienteId,
      {
        totalReservas: validas.length,
        totalGasto: validas.reduce((total, r) => total + (r.valorPago || 0), 0),
        ultimaReserva: validas[0]?.data ?? null,
      },
      autor,
    );
  },
};
