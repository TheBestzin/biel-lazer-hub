import { where } from "firebase/firestore";

import { COLECOES, atualizar, criar, listar, obter } from "@/firebase/firestore";
import { LixeiraService } from "@/services/LixeiraService";
import type { Cliente, StatusCliente } from "@/types";
import { apenasDigitos } from "@/utils/documentos";

export interface DadosCliente {
  nome: string;
  cpf: string;
  telefone: string;
  status: StatusCliente;
  observacoes?: string;
  tags: string[];
  favorito: boolean;
}

export const ClienteService = {
  listar(incluirExcluidos = false): Promise<Cliente[]> {
    return listar<Cliente>(COLECOES.clientes).then((itens) =>
      itens
        .filter((item) => (incluirExcluidos ? true : !item.deleted))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    );
  },

  obter(id: string): Promise<Cliente | null> {
    return obter<Cliente>(COLECOES.clientes, id);
  },

  async cpfDisponivel(cpf: string, ignorarId?: string): Promise<boolean> {
    const encontrados = await listar<Cliente>(COLECOES.clientes, [
      where("cpf", "==", apenasDigitos(cpf)),
    ]);
    return encontrados.every((item) => item.id === ignorarId);
  },

  async criar(dados: DadosCliente, autor: string): Promise<string> {
    const cpf = apenasDigitos(dados.cpf);
    if (!(await ClienteService.cpfDisponivel(cpf))) {
      throw new Error("Já existe um cliente cadastrado com este CPF.");
    }
    return criar(
      COLECOES.clientes,
      {
        ...dados,
        cpf,
        telefone: apenasDigitos(dados.telefone),
        observacoes: dados.observacoes ?? "",
        totalReservas: 0,
        totalGasto: 0,
        ultimaReserva: null,
      },
      autor,
    );
  },

  async atualizar(id: string, dados: Partial<DadosCliente>, autor: string): Promise<void> {
    const payload: Record<string, unknown> = { ...dados };
    if (dados.cpf) {
      const cpf = apenasDigitos(dados.cpf);
      if (!(await ClienteService.cpfDisponivel(cpf, id))) {
        throw new Error("Já existe um cliente cadastrado com este CPF.");
      }
      payload["cpf"] = cpf;
    }
    if (dados.telefone) payload["telefone"] = apenasDigitos(dados.telefone);
    await atualizar(COLECOES.clientes, id, payload, autor);
  },

  async alternarFavorito(cliente: Cliente, autor: string): Promise<void> {
    await atualizar(COLECOES.clientes, cliente.id, { favorito: !cliente.favorito }, autor);
  },

  async moverParaLixeira(cliente: Cliente, autor: string): Promise<void> {
    await atualizar(COLECOES.clientes, cliente.id, { deleted: true }, autor);
    await LixeiraService.mover(
      COLECOES.clientes,
      cliente.id,
      cliente.nome,
      { nome: cliente.nome, cpf: cliente.cpf },
      autor,
    );
  },

  async restaurar(id: string, autor: string): Promise<void> {
    await atualizar(COLECOES.clientes, id, { deleted: false }, autor);
  },

  async atualizarResumo(
    id: string,
    resumo: { totalReservas: number; totalGasto: number; ultimaReserva: string | null },
    autor: string,
  ): Promise<void> {
    await atualizar(COLECOES.clientes, id, resumo, autor);
  },
};
