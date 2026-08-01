import { orderBy, where } from "firebase/firestore";

import { COLECOES, criar, listar } from "@/firebase/firestore";
import type { LogEntry } from "@/types";

export interface EntradaLog {
  usuario: string;
  usuarioNome: string;
  acao: string;
  colecao: string;
  documento: string;
  descricao: string;
  antes?: unknown;
  depois?: unknown;
}

function resumir(valor: unknown): string | undefined {
  if (valor === undefined || valor === null) return undefined;
  try {
    return JSON.stringify(valor).slice(0, 4000);
  } catch {
    return undefined;
  }
}

export const LogService = {
  async registrar(entrada: EntradaLog): Promise<void> {
    try {
      await criar(
        COLECOES.logs,
        {
          usuario: entrada.usuario,
          usuarioNome: entrada.usuarioNome,
          acao: entrada.acao,
          colecao: entrada.colecao,
          documento: entrada.documento,
          descricao: entrada.descricao,
          antes: resumir(entrada.antes) ?? null,
          depois: resumir(entrada.depois) ?? null,
        },
        entrada.usuario,
      );
    } catch (erro) {
      console.error("Falha ao registrar log", erro);
    }
  },

  listar(limite = 300): Promise<LogEntry[]> {
    return listar<LogEntry>(COLECOES.logs, [orderBy("createdAt", "desc")]).then((itens) =>
      itens.slice(0, limite),
    );
  },

  listarPorDocumento(documento: string): Promise<LogEntry[]> {
    return listar<LogEntry>(COLECOES.logs, [where("documento", "==", documento)]).then((itens) =>
      itens.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },
};
