import { orderBy, where } from "firebase/firestore";

import { COLECOES, atualizar, criarComId, listar, obter } from "@/firebase/firestore";
import type { Admin, CargoAdmin } from "@/types";

export interface NovoAdmin {
  uid: string;
  nome: string;
  email: string;
  cargo: CargoAdmin;
}

export const AdminService = {
  listar(): Promise<Admin[]> {
    return listar<Admin>(COLECOES.admins, [orderBy("nome")]);
  },

  ativos(): Promise<Admin[]> {
    return listar<Admin>(COLECOES.admins, [where("ativo", "==", true)]);
  },

  obterPorUid(uid: string): Promise<Admin | null> {
    return obter<Admin>(COLECOES.admins, uid);
  },

  async existeAlgum(): Promise<boolean> {
    const itens = await listar<Admin>(COLECOES.admins);
    return itens.length > 0;
  },

  async criar(dados: NovoAdmin, autor: string): Promise<void> {
    await criarComId(
      COLECOES.admins,
      dados.uid,
      {
        uid: dados.uid,
        nome: dados.nome,
        email: dados.email,
        cargo: dados.cargo,
        ativo: true,
        foto: "",
      },
      autor,
    );
  },

  async atualizar(uid: string, dados: Partial<Admin>, autor: string): Promise<void> {
    await atualizar(COLECOES.admins, uid, dados as Record<string, unknown>, autor);
  },

  async definirAtivo(uid: string, ativo: boolean, autor: string): Promise<void> {
    if (!ativo) {
      const ativos = await AdminService.ativos();
      if (ativos.length <= 1) {
        throw new Error("Não é possível desativar o último administrador ativo.");
      }
    }
    await atualizar(COLECOES.admins, uid, { ativo }, autor);
  },

  async registrarLogin(uid: string): Promise<void> {
    await atualizar(COLECOES.admins, uid, { ultimoLogin: new Date().toISOString() }, uid);
  },
};
