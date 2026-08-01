import { COLECOES, atualizar, criar, listar } from "@/firebase/firestore";
import type { Notificacao, TipoNotificacao } from "@/types";

export const NotificacaoService = {
  listar(): Promise<Notificacao[]> {
    return listar<Notificacao>(COLECOES.notificacoes).then((itens) =>
      itens.filter((i) => !i.deleted).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  criar(
    dados: { titulo: string; descricao: string; tipo: TipoNotificacao },
    autor: string,
  ): Promise<string> {
    return criar(COLECOES.notificacoes, { ...dados, lida: false }, autor);
  },

  marcarLida(id: string, autor: string): Promise<void> {
    return atualizar(COLECOES.notificacoes, id, { lida: true }, autor);
  },

  async marcarTodasLidas(itens: Notificacao[], autor: string): Promise<void> {
    await Promise.all(
      itens.filter((i) => !i.lida).map((i) => atualizar(COLECOES.notificacoes, i.id, { lida: true }, autor)),
    );
  },
};
