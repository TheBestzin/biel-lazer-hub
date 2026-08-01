import { COLECOES, atualizar, criar, listar } from "@/firebase/firestore";
import type { Bloqueio, ListaEsperaItem, MotivoBloqueio } from "@/types";

export const BloqueioService = {
  listar(): Promise<Bloqueio[]> {
    return listar<Bloqueio>(COLECOES.bloqueios).then((itens) =>
      itens.filter((item) => !item.deleted).sort((a, b) => a.data.localeCompare(b.data)),
    );
  },

  criar(
    dados: { data: string; motivo: MotivoBloqueio; descricao?: string },
    autor: string,
  ): Promise<string> {
    return criar(COLECOES.bloqueios, { ...dados, descricao: dados.descricao ?? "" }, autor);
  },

  remover(id: string, autor: string): Promise<void> {
    return atualizar(COLECOES.bloqueios, id, { deleted: true }, autor);
  },
};

export const ListaEsperaService = {
  listar(): Promise<ListaEsperaItem[]> {
    return listar<ListaEsperaItem>(COLECOES.listaEspera).then((itens) =>
      itens.filter((item) => !item.deleted).sort((a, b) => a.dataDesejada.localeCompare(b.dataDesejada)),
    );
  },

  criar(
    dados: {
      clienteId: string;
      clienteNome: string;
      telefone: string;
      dataDesejada: string;
      observacoes?: string;
    },
    autor: string,
  ): Promise<string> {
    return criar(
      COLECOES.listaEspera,
      { ...dados, observacoes: dados.observacoes ?? "", atendido: false },
      autor,
    );
  },

  marcarAtendido(id: string, autor: string): Promise<void> {
    return atualizar(COLECOES.listaEspera, id, { atendido: true }, autor);
  },

  remover(id: string, autor: string): Promise<void> {
    return atualizar(COLECOES.listaEspera, id, { deleted: true }, autor);
  },
};
