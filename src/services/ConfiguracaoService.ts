import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { CONFIG_DOC_ID, CONTRATO_PADRAO, APP_NOME } from "@/constants";
import { COLECOES, getDb, normalizar } from "@/firebase/firestore";
import type { Configuracoes } from "@/types";

export const CONFIG_INICIAL: Omit<Configuracoes, "id" | "updatedAt"> = {
  nomeEmpresa: APP_NOME,
  logo: "",
  imagemCapa: "",
  telefone: "",
  whatsapp: "",
  valorPadrao: 350,
  entradaPadrao: "08:00",
  saidaPadrao: "22:00",
  tema: "system",
  contratoPadrao: CONTRATO_PADRAO,
  inicializado: false,
};

export const ConfiguracaoService = {
  async obter(): Promise<Configuracoes> {
    const snap = await getDoc(doc(getDb(), COLECOES.configuracoes, CONFIG_DOC_ID));
    if (!snap.exists()) {
      return { id: CONFIG_DOC_ID, ...CONFIG_INICIAL, updatedAt: new Date().toISOString() };
    }
    return normalizar<Configuracoes>(snap.id, snap.data());
  },

  async salvar(dados: Partial<Configuracoes>): Promise<void> {
    await setDoc(
      doc(getDb(), COLECOES.configuracoes, CONFIG_DOC_ID),
      { ...dados, updatedAt: serverTimestamp() },
      { merge: true },
    );
  },
};
