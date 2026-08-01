import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "./config";

export function observarSessao(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function entrar(email: string, senha: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, senha);
}

export function registrar(email: string, senha: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, senha);
}

export function sair() {
  return signOut(getFirebaseAuth());
}

export function recuperarSenha(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function alterarSenha(senhaAtual: string, novaSenha: string) {
  const auth = getFirebaseAuth();
  const usuario = auth.currentUser;
  if (!usuario?.email) throw new Error("Nenhuma sessão ativa.");
  await reauthenticateWithCredential(
    usuario,
    EmailAuthProvider.credential(usuario.email, senhaAtual),
  );
  await updatePassword(usuario, novaSenha);
}

export function usuarioAtual(): User | null {
  return getFirebaseAuth().currentUser;
}

export type { User };
