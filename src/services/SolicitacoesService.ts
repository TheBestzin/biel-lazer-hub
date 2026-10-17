/**
 * Superfície pública de dados — Leia junto com `firestore.rules`.
 *
 * - `DatasOcupadasService`: o visitante anônimo lê apenas coleção
 *   `datas_ocupadas` (ID = yyyy-MM-dd, campos `status` e `updatedAt` —
 *   NENHUM dado pessoal). É a única fonte do calendário público.
 * - `SolicitacoesService`: cria a solicitação pelo site. O servidor
 *   (regras) rejeita campos extras, tipos inválidos, limite de
 *   convidados e datas já ocupadas.
 *
 * Envio nunca escrivre diretamente em `reservas`/`clientes` — isso é
 * papel do admin ao aprovar (Fase 3, em transação).
 */
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getDb, limitar } from "@/firebase/firestore";
import { validarTelefone, apenasDigitos } from "@/utils/documentos";

export interface SolicitacaoPayload {
  nome: string;
  telefone: string;
  /** ISO yyyy-MM-dd */
  data: string;
  convidados: number;
  observacoes?: string;
}

export interface Solicitacao extends SolicitacaoPayload {
  id: string;
  status?: "pendente" | "aprovada" | "recusada" | "lista_espera";
  createdAt?: string;
  observacoes: string;
}

export type StatusDataOcupada = "reservada" | "bloqueada";

export interface DataOcupada {
  data: string;
  status: StatusDataOcupada;
  updatedAt?: string;
}

export const DatasOcupadasService = {
  /** Mapa data → status, para o calendário público. */
  async listar(): Promise<Map<string, StatusDataOcupada>> {
    const snap = await getDocs(collection(getDb(), "datas_ocupadas"));
    const mapa = new Map<string, StatusDataOcupada>();
    snap.forEach((doc) => {
      const dados = doc.data() as { status?: StatusDataOcupada };
      if (dados.status === "reservada" || dados.status === "bloqueada") {
        mapa.set(doc.id, dados.status);
      }
    });
    return mapa;
  },
};

const LIMITE_CONVIDADOS = 200;

export const errosValidacaoSolicitacao = (s: SolicitacaoPayload): string | null => {
  if (s.nome.trim().length < 3 || s.nome.trim().length > 120) {
    return "Informe seu nome completo (3 a 120 caracteres).";
  }
  if (!validarTelefone(s.telefone)) {
    return "Informe um WhatsApp válido com DDD.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.data)) {
    return "Escolha uma data no calendário para continuar.";
  }
  if (!Number.isInteger(s.convidados) || s.convidados < 1 || s.convidados > LIMITE_CONVIDADOS) {
    return `O número de convidados deve ficar entre 1 e ${LIMITE_CONVIDADOS}.`;
  }
  if ((s.observacoes ?? "").length > 500) {
    return "As observações devem ter no máximo 500 caracteres.";
  }
  return null;
};

export const SolicitacoesService = {
  LIMITE_CONVIDADOS,

  /**
   * Cria a solicitação com EXATAMENTE os campos permitidos pelas regras.
   * `createdAt` é carimbo do servidor (serverTimestamp) — nunca do cliente.
   */
  async criar(payload: SolicitacaoPayload): Promise<string> {
    const erro = errosValidacaoSolicitacao(payload);
    if (erro) throw new Error(erro);

    const ref = await addDoc(collection(getDb(), "solicitacoes"), {
      nome: payload.nome.trim(),
      telefone: apenasDigitos(payload.telefone),
      data: payload.data,
      convidados: Math.round(payload.convidados),
      observacoes: payload.observacoes ?? "",
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Lado admin: lista solicitações mais recentes primeiro. */
  async listarAdmin(limite = 100): Promise<Solicitacao[]> {
    const snap = await getDocs(
      query(collection(getDb(), "solicitacoes"), orderBy("createdAt", "desc"), limitar(limite)),
    );
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Partial<Solicitacao>),
    })) as Solicitacao[];
  },
};
