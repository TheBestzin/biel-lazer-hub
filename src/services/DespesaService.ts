import { COLECOES, atualizar, criar, listar } from "@/firebase/firestore";
import { LixeiraService } from "@/services/LixeiraService";
import type { CategoriaDespesa, Despesa } from "@/types";

export interface DadosDespesa {
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
}

export const DespesaService = {
  listar(incluirExcluidas = false): Promise<Despesa[]> {
    return listar<Despesa>(COLECOES.despesas).then((itens) =>
      itens
        .filter((item) => (incluirExcluidas ? true : !item.deleted))
        .sort((a, b) => b.data.localeCompare(a.data)),
    );
  },

  criar(dados: DadosDespesa, autor: string): Promise<string> {
    return criar(COLECOES.despesas, { ...dados }, autor);
  },

  atualizar(id: string, dados: Partial<DadosDespesa>, autor: string): Promise<void> {
    return atualizar(COLECOES.despesas, id, dados as Record<string, unknown>, autor);
  },

  async moverParaLixeira(despesa: Despesa, autor: string): Promise<void> {
    await atualizar(COLECOES.despesas, despesa.id, { deleted: true }, autor);
    await LixeiraService.mover(
      COLECOES.despesas,
      despesa.id,
      despesa.descricao,
      { descricao: despesa.descricao, valor: despesa.valor },
      autor,
    );
  },
};
