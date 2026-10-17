import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ativarAppCheck, firebaseConfigurado } from "@/firebase/config";
import { entrar, observarSessao, sair, usuarioAtual, type User } from "@/firebase/auth";
import { AdminService } from "@/services/AdminService";
import { LogService } from "@/services/LogService";
import type { Admin } from "@/types";

interface EstadoAuth {
  carregando: boolean;
  usuario: User | null;
  admin: Admin | null;
  configurado: boolean;
  entrarComEmail: (email: string, senha: string) => Promise<void>;
  encerrarSessao: () => Promise<void>;
  revalidar: () => Promise<void>;
}

const AuthContext = createContext<EstadoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  const carregarContexto = useCallback(async (user: User | null) => {
    if (!firebaseConfigurado) {
      setCarregando(false);
      return;
    }
    try {
      if (user) {
        // A permissão vem do claim no token (aplicado por
        // scripts/set-admin.mjs com a service account) — nunca de
        // uma leitura de coleção no cliente.
        const token = await user.getIdTokenResult();
        if (token.claims["admin"] === true) {
          const registro = await AdminService.obterPorUid(user.uid);
          setAdmin(registro);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
    } catch (erro) {
      console.error("Falha ao carregar contexto de acesso", erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfigurado) {
      setCarregando(false);
      return;
    }
    void ativarAppCheck();
    return observarSessao((user) => {
      setUsuario(user);
      void carregarContexto(user);
    });
  }, [carregarContexto]);

  const entrarComEmail = useCallback(async (email: string, senha: string) => {
    const credencial = await entrar(email, senha);
    // Claim fresco no token emitido no login — sem claims, sem acesso.
    const token = await credencial.user.getIdTokenResult();
    if (token.claims["admin"] !== true) {
      await sair();
      throw new Error("Este usuário não possui acesso administrativo ao sistema.");
    }
    const registro = await AdminService.obterPorUid(credencial.user.uid);
    if (!registro || !registro.ativo) {
      await sair();
      throw new Error("Este usuário não possui acesso ativo ao sistema.");
    }
    await AdminService.registrarLogin(registro.uid);
    await LogService.registrar({
      usuario: registro.uid,
      usuarioNome: registro.nome,
      acao: "login",
      colecao: "admins",
      documento: registro.uid,
      descricao: "Entrou no sistema",
    });
    setAdmin(registro);
  }, []);

  const encerrarSessao = useCallback(async () => {
    const atual = usuarioAtual();
    if (atual && admin) {
      await LogService.registrar({
        usuario: admin.uid,
        usuarioNome: admin.nome,
        acao: "logout",
        colecao: "admins",
        documento: admin.uid,
        descricao: "Encerrou a sessão",
      });
    }
    await sair();
    setAdmin(null);
  }, [admin]);

  const revalidar = useCallback(() => carregarContexto(usuarioAtual()), [carregarContexto]);

  const valor = useMemo<EstadoAuth>(
    () => ({
      carregando,
      usuario,
      admin,
      configurado: firebaseConfigurado,
      entrarComEmail,
      encerrarSessao,
      revalidar,
    }),
    [carregando, usuario, admin, entrarComEmail, encerrarSessao, revalidar],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): EstadoAuth {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return contexto;
}

export function useAdminAtual(): Admin {
  const { admin } = useAuth();
  if (!admin) throw new Error("Nenhum administrador autenticado.");
  return admin;
}
