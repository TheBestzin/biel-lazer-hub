import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, KeyRound, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";

import { AppLogo } from "@/components/app/AppLogo";
import { fadeInUp, quieto } from "@/lib/motion";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recuperarSenha } from "@/firebase/auth";
import { variaveisFirebaseFaltando } from "@/firebase/config";
import { APP_SUBTITULO } from "@/constants";

function Moldura({ children }: { children: React.ReactNode }) {
  const reduzir = useReducedMotion();
  return (
    <div className="surface-gradient relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* Brilhos decorativos — mesma linguagem visual do site público. */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full brand-gradient opacity-10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 mesh-gradient opacity-50"
        aria-hidden
      />
      <motion.div
        variants={reduzir ? quieto.fadeInUp : fadeInUp}
        initial="initial"
        animate="animate"
        className="glass-panel relative w-full max-w-md rounded-3xl p-8 shadow-elevated"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo
            tamanho={56}
            className="drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
          />
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Área de Lazer Biel
            </h1>
            <p className="text-sm text-muted-foreground">{APP_SUBTITULO}</p>
          </div>
        </div>
        <div className="mt-7">{children}</div>
      </motion.div>
    </div>
  );
}

export function TelaFirebasePendente() {
  return (
    <Moldura>
      <Alert variant="destructive">
        <AlertCircle className="size-4" aria-hidden />
        <AlertTitle>Conexão com o Firebase pendente</AlertTitle>
        <AlertDescription>
          <p>Defina as variáveis de ambiente abaixo para ativar o sistema:</p>
          <ul className="mt-2 list-inside list-disc font-mono text-xs">
            {variaveisFirebaseFaltando.map((nome) => (
              <li key={nome}>{nome}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </Moldura>
  );
}

export function TelaLogin() {
  const { entrarComEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    try {
      await entrarComEmail(email.trim(), senha);
      toast.success("Bem-vindo de volta!");
    } catch (erro) {
      const mensagem =
        erro instanceof Error && erro.message.includes("acesso ativo")
          ? erro.message
          : "E-mail ou senha inválidos.";
      toast.error(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  async function esqueciSenha() {
    if (!email.trim()) {
      toast.error("Informe o e-mail para receber o link de recuperação.");
      return;
    }
    try {
      await recuperarSenha(email.trim());
      toast.success("Enviamos um link de recuperação para o seu e-mail.");
    } catch {
      toast.error("Não foi possível enviar o e-mail de recuperação.");
    }
  }

  return (
    <Moldura>
      <form className="space-y-4" onSubmit={submeter}>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="pl-9"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <div className="relative">
            <KeyRound
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              className="pl-9"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        <Button type="submit" className="tap-press w-full shadow-glow" disabled={enviando}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Entrar
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => void esqueciSenha()}
        >
          Esqueci minha senha
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          É cliente?{" "}
          <a href="/reservar" className="font-medium text-primary hover:underline">
            Consulte datas e reserve online
          </a>
        </p>
      </form>
    </Moldura>
  );
}

/**
 * A criação do primeiro administrador agora é feita INFORME FORA DO SITE:
 *   scripts/set-admin.mjs (Firebase Admin SDK + service account).
 * Antes, qualquer visitante podia virar admin master enquanto a coleção
 * admins estivesse vazia — o registro agora exige o claim do token.
 */
