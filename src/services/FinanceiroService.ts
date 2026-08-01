import { COLECOES, criar, listar } from "@/firebase/firestore";
import type { Movimento, TipoMovimento } from "@/types";

export const FinanceiroService = {
  listar(): Promise<Movimento[]> {
    return listar<Movimento>(COLECOES.financeiro).then((itens) =>
      itens.filter((i) => !i.deleted).sort((a, b) => b.data.localeCompare(a.data)),
    );
  },

  registrar(
    dados: {
      tipo: TipoMovimento;
      valor: number;
      categoria: string;
      reservaId?: string;
      descricao: string;
      data: string;
    },
    autor: string,
  ): Promise<string> {
    return criar(COLECOES.financeiro, { ...dados, reservaId: dados.reservaId ?? null }, autor);
  },
};
