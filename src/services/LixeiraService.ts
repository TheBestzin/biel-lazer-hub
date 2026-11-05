import { COLECOES, criar, listar, obter, removerDefinitivo, atualizar } from "@/firebase/firestore";
import { DatasOcupadasService } from "@/services/SolicitacoesService";
import type { ItemLixeira } from "@/types";

export const LixeiraService = {
  async mover(
    colecao: string,
    documentoId: string,
    titulo: string,
    dados: Record<string, unknown>,
    autor: string,
  ): Promise<void> {
    await criar(
      COLECOES.lixeira,
      { colecao, documentoId, titulo, dados, removidoPor: autor },
      autor,
    );
  },

  listar(): Promise<ItemLixeira[]> {
    return listar<ItemLixeira>(COLECOES.lixeira).then((itens) =>
      itens.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async restaurar(item: ItemLixeira, autor: string): Promise<void> {
    const alvo = item.colecao as never;
    const existe = await obter(alvo, item.documentoId);
    if (existe) await atualizar(alvo, item.documentoId, { deleted: false }, autor);
    // Restaurar reserva/bloqueio pode ocupar a data de novo no site.
    if (item.colecao === COLECOES.reservas || item.colecao === COLECOES.bloqueios) {
      const data = (item.dados as { data?: unknown } | undefined)?.data;
      if (typeof data === "string" && data) {
        try {
          await DatasOcupadasService.recalcular(data);
        } catch (erro) {
          console.warn("Não foi possível atualizar o calendário público", erro);
        }
      }
    }
    await removerDefinitivo(COLECOES.lixeira, item.id);
  },

  async excluirDefinitivo(item: ItemLixeira): Promise<void> {
    await removerDefinitivo(item.colecao as never, item.documentoId);
    await removerDefinitivo(COLECOES.lixeira, item.id);
  },
};
