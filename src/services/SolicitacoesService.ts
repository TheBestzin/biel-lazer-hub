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
 * Somente administradores podem decidir as solicitações. Aprovações
 * gravam reserva, data ocupada e cliente numa transação do Firestore.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentReference,
} from "firebase/firestore";
import { CHECKLIST_PADRAO, CONFIG_DOC_ID } from "@/constants";
import { getDb, limitar } from "@/firebase/firestore";
import { getFirebaseAuth } from "@/firebase/config";
import { validarTelefone, apenasDigitos } from "@/utils/documentos";

export interface SolicitacaoPayload {
  nome: string;
  telefone: string;
  /** ISO yyyy-MM-dd */
  data: string;
  convidados: number;
  observacoes?: string;
  whatsappOptIn?: boolean;
}

export interface Solicitacao extends SolicitacaoPayload {
  id: string;
  status?: "pendente" | "aprovada" | "recusada" | "lista_espera";
  createdAt?: string;
  whatsappOptIn?: boolean;
  whatsappStatus?: string;
  reservaId?: string;
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
      whatsappOptIn: payload.whatsappOptIn,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Decide no Firestore sem depender de Cloud Functions ou do plano Blaze. */
  async decidir(
    id: string,
    decisao: "aprovada" | "recusada",
    autor: string,
    autorNome: string,
  ): Promise<{ status: "aprovada" | "recusada"; reservaId: string | null }> {
    const usuario = getFirebaseAuth().currentUser;
    if (!usuario || usuario.uid !== autor) {
      throw new Error("Entre novamente no painel para decidir esta solicitação.");
    }
    if (!/^[A-Za-z0-9_-]{10,128}$/.test(id)) throw new Error("Solicitação inválida.");

    const db = getDb();
    const solicitacaoRef = doc(db, "solicitacoes", id);
    const solicitacaoInicialSnap = await getDoc(solicitacaoRef);
    if (!solicitacaoInicialSnap.exists()) throw new Error("Solicitação não encontrada.");
    const solicitacaoInicial = solicitacaoInicialSnap.data() as Solicitacao;
    if (solicitacaoInicial.status && solicitacaoInicial.status !== "pendente") {
      throw new Error("Esta solicitação já foi decidida.");
    }

    let reservaRef: DocumentReference | null = null;
    let clienteRef: DocumentReference | null = null;
    let ocupacaoRef: DocumentReference | null = null;
    let configuracaoRef: DocumentReference | null = null;

    if (decisao === "aprovada") {
      const data = solicitacaoInicial.data;
      const telefone = apenasDigitos(solicitacaoInicial.telefone ?? "");
      const nome = String(solicitacaoInicial.nome ?? "").trim();
      const partesData = /^(2\d{3})-(\d{2})-(\d{2})$/.exec(data ?? "");
      const dataUTC = partesData
        ? new Date(
            Date.UTC(Number(partesData[1]), Number(partesData[2]) - 1, Number(partesData[3])),
          )
        : null;
      if (
        !dataUTC ||
        dataUTC.getUTCFullYear() !== Number(partesData?.[1]) ||
        dataUTC.getUTCMonth() !== Number(partesData?.[2]) - 1 ||
        dataUTC.getUTCDate() !== Number(partesData?.[3]) ||
        !validarTelefone(telefone) ||
        nome.length < 3 ||
        nome.length > 120 ||
        !Number.isInteger(solicitacaoInicial.convidados) ||
        solicitacaoInicial.convidados < 1 ||
        solicitacaoInicial.convidados > 200 ||
        (solicitacaoInicial.observacoes ?? "").length > 500
      ) {
        throw new Error("Os dados desta solicitação são inválidos.");
      }

      const [reservasSnap, bloqueiosSnap, clientesSnap, ocupacaoSnap] = await Promise.all([
        getDocs(query(collection(db, "reservas"), where("data", "==", data))),
        getDocs(query(collection(db, "bloqueios"), where("data", "==", data))),
        getDocs(query(collection(db, "clientes"), where("telefone", "==", telefone))),
        getDoc(doc(db, "datas_ocupadas", data)),
      ]);
      if (
        reservasSnap.docs.some((reserva) => {
          const dados = reserva.data();
          return !dados.deleted && dados.statusReserva !== "cancelada";
        })
      ) {
        throw new Error("Esta data já possui uma reserva ativa.");
      }
      if (
        ocupacaoSnap.exists() ||
        bloqueiosSnap.docs.some((bloqueio) => !bloqueio.data().deleted)
      ) {
        throw new Error("Esta data está bloqueada ou ocupada e não pode receber reservas.");
      }

      const cliente = clientesSnap.docs.find((item) => !item.data().deleted);
      clienteRef = cliente?.ref ?? doc(collection(db, "clientes"));
      reservaRef = doc(collection(db, "reservas"));
      ocupacaoRef = doc(db, "datas_ocupadas", data);
      configuracaoRef = doc(db, "configuracoes", CONFIG_DOC_ID);
    }

    const logRef = doc(collection(db, "logs"));
    const agora = serverTimestamp();
    return runTransaction(db, async (tx) => {
      const solicitacaoSnap = await tx.get(solicitacaoRef);
      if (!solicitacaoSnap.exists()) throw new Error("Solicitação não encontrada.");
      const solicitacao = solicitacaoSnap.data() as Solicitacao;
      if (solicitacao.status && solicitacao.status !== "pendente") {
        throw new Error("Esta solicitação já foi decidida.");
      }

      let reservaId: string | null = null;
      if (decisao === "aprovada") {
        if (!reservaRef || !clienteRef || !ocupacaoRef || !configuracaoRef) {
          throw new Error("Não foi possível preparar a reserva.");
        }
        const [ocupacaoSnap, configuracaoSnap, clienteSnap] = await Promise.all([
          tx.get(ocupacaoRef),
          tx.get(configuracaoRef),
          tx.get(clienteRef),
        ]);
        if (ocupacaoSnap.exists()) throw new Error("Esta data já foi reservada ou bloqueada.");
        const cliente = clienteSnap.exists() ? clienteSnap.data() : null;
        if (cliente?.deleted)
          throw new Error(
            "O cadastro deste cliente foi alterado. Atualize os pedidos e tente novamente.",
          );
        if (cliente?.status === "nao_alugar") {
          throw new Error("Este cliente está marcado para não alugar.");
        }

        const configuracao = configuracaoSnap.data() ?? {};
        const entrada =
          typeof configuracao.entradaPadrao === "string" ? configuracao.entradaPadrao : "08:00";
        const saida =
          typeof configuracao.saidaPadrao === "string" ? configuracao.saidaPadrao : "22:00";
        if (
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(entrada) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(saida) ||
          entrada >= saida
        ) {
          throw new Error(
            "Os horários padrão estão inválidos. Corrija as configurações antes de aprovar.",
          );
        }
        const valor =
          typeof configuracao.valorPadrao === "number" &&
          Number.isFinite(configuracao.valorPadrao) &&
          configuracao.valorPadrao >= 0
            ? configuracao.valorPadrao
            : 350;
        const data = solicitacao.data;
        const nome = String(solicitacao.nome ?? "").trim();
        const telefone = apenasDigitos(solicitacao.telefone ?? "");
        const nomeCliente = String(cliente?.nome ?? nome);

        tx.set(ocupacaoRef, {
          status: "reservada",
          solicitacaoId: id,
          reservaId: reservaRef.id,
          updatedAt: agora,
        });
        if (cliente) {
          tx.update(clienteRef, {
            totalReservas: increment(1),
            ultimaReserva: data,
            updatedBy: autor,
            updatedAt: agora,
          });
        } else {
          tx.set(clienteRef, {
            nome,
            cpf: "",
            telefone,
            status: "confiavel",
            observacoes: "Cadastro feito pelo site.",
            tags: ["Site"],
            favorito: false,
            totalReservas: 1,
            totalGasto: 0,
            ultimaReserva: data,
            deleted: false,
            createdBy: autor,
            updatedBy: autor,
            createdAt: agora,
            updatedAt: agora,
          });
        }
        tx.set(reservaRef, {
          solicitacaoId: id,
          clienteId: clienteRef.id,
          clienteNome: nomeCliente,
          clienteTelefone: telefone,
          data,
          entrada,
          saida,
          valor,
          valorPago: 0,
          statusPagamento: "pendente",
          statusReserva: "reservada",
          observacoes: String(solicitacao.observacoes ?? ""),
          checklist: CHECKLIST_PADRAO.map((label, indice) => ({
            id: `item-${indice}`,
            label,
            concluido: false,
          })),
          deleted: false,
          createdBy: autor,
          updatedBy: autor,
          createdAt: agora,
          updatedAt: agora,
        });
        reservaId = reservaRef.id;
      }

      tx.update(solicitacaoRef, {
        status: decisao,
        ...(reservaId ? { reservaId } : {}),
        decidedAt: agora,
        decidedBy: autor,
      });
      tx.set(logRef, {
        usuario: autor,
        usuarioNome: autorNome,
        acao: decisao === "aprovada" ? "aprovar_solicitacao" : "recusar_solicitacao",
        colecao: "solicitacoes",
        documento: id,
        descricao: `${decisao === "aprovada" ? "Aprovou" : "Recusou"} solicitação de ${solicitacao.nome}`,
        createdAt: agora,
      });

      return { status: decisao, reservaId };
    });
  },

  /** Lado admin: lista solicitações mais recentes primeiro. */
  async listarAdmin(limite = 100): Promise<Solicitacao[]> {
    const snap = await getDocs(
      query(collection(getDb(), "solicitacoes"), orderBy("createdAt", "desc"), limitar(limite)),
    );
    return snap.docs.map((doc) => {
      const dados = doc.data() as Partial<Solicitacao> & { whatsappStatus?: string };
      return {
        id: doc.id,
        ...dados,
        status: dados.status ?? "pendente",
      } as Solicitacao;
    });
  },
};
