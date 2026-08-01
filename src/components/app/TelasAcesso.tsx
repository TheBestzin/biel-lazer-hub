import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, KeyRound, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";

import { AppLogo } from "@/components/app/AppLogo";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recuperarSenha, registrar } from "@/firebase/auth";
import { variaveisFirebaseFaltando } from "@/firebase/config";
import { AdminService } from "@/services/AdminService";
import { APP_SUBTITULO } from "@/constants";

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-elevated"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo tamanho={56} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Área de Lazer Biel</h1>
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
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
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
            <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
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
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Entrar
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => void esqueciSenha()}>
          Esqueci minha senha
        </Button>
      </form>
    </Moldura>
  );
}

export function TelaPrimeiroAcesso() {
  const { revalidar, entrarComEmail } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    if (senha.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      const credencial = await registrar(email.trim(), senha);
      await AdminService.criar(
        { uid: credencial.user.uid, nome: nome.trim(), email: email.trim(), cargo: "master" },
        credencial.user.uid,
      );
      await revalidar();
      await entrarComEmail(email.trim(), senha);
      toast.success("Administrador master criado com sucesso!");
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível concluir a configuração inicial.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Moldura>
      <div className="mb-5 rounded-xl bg-primary-soft p-3 text-center text-sm text-primary">
        Nenhum administrador cadastrado. Crie a conta master para começar.
      </div>
      <form className="space-y-4" onSubmit={submeter}>
        <div className="space-y-2">
          <Label htmlFor="nome-master">Nome completo</Label>
          <Input
            id="nome-master"
            required
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Gabriel Souza"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-master">E-mail</Label>
          <Input
            id="email-master"
            type="email"
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha-master">Senha</Label>
          <Input
            id="senha-master"
            type="password"
            required
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            placeholder="Mínimo de 6 caracteres"
          />
        </div>
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Criar administrador master
        </Button>
      </form>
    </Moldura>
  );
}
