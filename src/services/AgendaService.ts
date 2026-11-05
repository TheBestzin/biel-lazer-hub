import { COLECOES, atualizar, criar, listar, obter } from "@/firebase/firestore";
import { DatasOcupadasService } from "@/services/SolicitacoesService";
import type { Bloqueio, ListaEsperaItem, MotivoBloqueio } from "@/types";

/** Repassa a ocupação do bloqueio para o calendário público do site. */
async function sincronizarCalendarioPublico(data: string): Promise<void> {
  try {
    await DatasOcupadasService.recalcular(data);
  } catch (erro) {
    console.warn("Não foi possível atualizar o calendário público", erro);
  }
}

export const BloqueioService = {
  listar(): Promise<Bloqueio[]> {
    return listar<Bloqueio>(COLECOES.bloqueios).then((itens) =>
      itens.filter((item) => !item.deleted).sort((a, b) => a.data.localeCompare(b.data)),
    );
  },

  async criar(
    dados: { data: string; motivo: MotivoBloqueio; descricao?: string },
    autor: string,
  ): Promise<string> {
    const id = await criar(
      COLECOES.bloqueios,
      { ...dados, descricao: dados.descricao ?? "" },
      autor,
    );
    await sincronizarCalendarioPublico(dados.data);
    return id;
  },

  async remover(id: string, autor: string): Promise<void> {
    const bloqueio = await obter<Bloqueio>(COLECOES.bloqueios, id);
    await atualizar(COLECOES.bloqueios, id, { deleted: true }, autor);
    await sincronizarCalendarioPublico(bloqueio?.data ?? "");
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
