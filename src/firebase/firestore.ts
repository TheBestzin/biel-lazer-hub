import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";

import { getDb } from "./config";

export const COLECOES = {
  admins: "admins",
  clientes: "clientes",
  reservas: "reservas",
  financeiro: "financeiro",
  despesas: "despesas",
  bloqueios: "bloqueios",
  listaEspera: "lista_espera",
  configuracoes: "configuracoes",
  notificacoes: "notificacoes",
  logs: "logs",
  lixeira: "lixeira",
} as const;

export type NomeColecao = (typeof COLECOES)[keyof typeof COLECOES];

export function toISO(valor: unknown): string {
  if (!valor) return new Date().toISOString();
  if (valor instanceof Timestamp) return valor.toDate().toISOString();
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "string") return valor;
  return new Date().toISOString();
}

export function normalizar<T>(id: string, dados: DocumentData): T {
  const saida: DocumentData = { id };
  for (const [chave, valor] of Object.entries(dados)) {
    saida[chave] = valor instanceof Timestamp ? valor.toDate().toISOString() : valor;
  }
  return saida as T;
}

export async function listar<T>(
  colecao: NomeColecao,
  restricoes: QueryConstraint[] = [],
): Promise<T[]> {
  const snap = await getDocs(query(collection(getDb(), colecao), ...restricoes));
  return snap.docs.map((d) => normalizar<T>(d.id, d.data()));
}

export async function obter<T>(colecao: NomeColecao, id: string): Promise<T | null> {
  const snap = await getDoc(doc(getDb(), colecao, id));
  return snap.exists() ? normalizar<T>(snap.id, snap.data()) : null;
}

export async function criar(
  colecao: NomeColecao,
  dados: Record<string, unknown>,
  autor: string,
): Promise<string> {
  const ref = await addDoc(collection(getDb(), colecao), {
    ...dados,
    deleted: false,
    createdBy: autor,
    updatedBy: autor,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function criarComId(
  colecao: NomeColecao,
  id: string,
  dados: Record<string, unknown>,
  autor: string,
): Promise<void> {
  await setDoc(doc(getDb(), colecao, id), {
    ...dados,
    deleted: false,
    createdBy: autor,
    updatedBy: autor,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function atualizar(
  colecao: NomeColecao,
  id: string,
  dados: Record<string, unknown>,
  autor: string,
): Promise<void> {
  await updateDoc(doc(getDb(), colecao, id), {
    ...dados,
    updatedBy: autor,
    updatedAt: serverTimestamp(),
  });
}

export async function removerDefinitivo(colecao: NomeColecao, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), colecao, id));
}

export { collection, doc, query, where, orderBy, fbLimit as limitar, serverTimestamp, getDb };
