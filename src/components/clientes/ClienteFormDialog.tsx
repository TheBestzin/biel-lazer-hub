import { useEffect, useState } from "react";

import { CampoCPF, CampoTelefone } from "@/components/app/CamposMascarados";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_CLIENTE, TAGS_SUGERIDAS } from "@/constants";
import { AppBadge } from "@/components/app/AppBadge";
import { useAcao, chaves } from "@/hooks/useDados";
import { useAuth } from "@/app/providers/AuthProvider";
import { ClienteService, type DadosCliente } from "@/services/ClienteService";
import { LogService } from "@/services/LogService";
import type { Cliente, StatusCliente } from "@/types";
import { validarCPF, validarTelefone } from "@/utils/documentos";
import { cn } from "@/lib/utils";

interface ClienteFormDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  cliente?: Cliente | null;
}

const VAZIO: DadosCliente = {
  nome: "",
  cpf: "",
  telefone: "",
  status: "confiavel",
  observacoes: "",
  tags: [],
  favorito: false,
};

export function ClienteFormDialog({ aberto, aoFechar, cliente }: ClienteFormDialogProps) {
  const { admin } = useAuth();
  const [dados, setDados] = useState<DadosCliente>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!aberto) return;
    setErros({});
    setDados(
      cliente
        ? {
            nome: cliente.nome,
            cpf: cliente.cpf ?? "",
            telefone: cliente.telefone,
            status: cliente.status,
            observacoes: cliente.observacoes ?? "",
            tags: cliente.tags ?? [],
            favorito: cliente.favorito,
          }
        : VAZIO,
    );
  }, [aberto, cliente]);

  const salvar = useAcao(
    async (valores: DadosCliente) => {
      const autor = admin?.uid ?? "sistema";
      if (cliente) {
        await ClienteService.atualizar(cliente.id, valores, autor);
        await LogService.registrar({
          usuario: autor,
          usuarioNome: admin?.nome ?? "Sistema",
          acao: "atualizar",
          colecao: "clientes",
          documento: cliente.id,
          descricao: `Atualizou o cliente ${valores.nome}`,
          antes: cliente,
          depois: valores,
        });
        return;
      }
      const id = await ClienteService.criar(valores, autor);
      await LogService.registrar({
        usuario: autor,
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "criar",
        colecao: "clientes",
        documento: id,
        descricao: `Cadastrou o cliente ${valores.nome}`,
        depois: valores,
      });
    },
    {
      sucesso: cliente ? "Cliente atualizado." : "Cliente cadastrado.",
      invalidar: [chaves.clientes, chaves.logs],
      aoConcluir: aoFechar,
    },
  );

  function submeter(evento: React.FormEvent) {
    evento.preventDefault();
    const novosErros: Record<string, string> = {};
    if (dados.nome.trim().length < 3) novosErros["nome"] = "Informe o nome completo.";
    if (dados.cpf.trim() && !validarCPF(dados.cpf)) novosErros["cpf"] = "CPF inválido.";
    if (!validarTelefone(dados.telefone)) novosErros["telefone"] = "Telefone inválido.";
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;
    salvar.mutate({ ...dados, nome: dados.nome.trim() });
  }

  function alternarTag(tag: string) {
    setDados((atual) => ({
      ...atual,
      tags: atual.tags.includes(tag)
        ? atual.tags.filter((item) => item !== tag)
        : [...atual.tags, tag],
    }));
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Dados usados nas reservas, contratos e no histórico de locações.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submeter}>
          <div className="space-y-2">
            <Label htmlFor="cliente-nome">Nome completo</Label>
            <Input
              id="cliente-nome"
              value={dados.nome}
              onChange={(evento) => setDados({ ...dados, nome: evento.target.value })}
              placeholder="Maria Aparecida Silva"
            />
            {erros["nome"] && <p className="text-xs text-destructive">{erros["nome"]}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente-cpf">CPF (opcional)</Label>
              <CampoCPF
                id="cliente-cpf"
                value={dados.cpf}
                onChange={(valor) => setDados({ ...dados, cpf: valor })}
              />
              {erros["cpf"] && <p className="text-xs text-destructive">{erros["cpf"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-telefone">Telefone / WhatsApp</Label>
              <CampoTelefone
                id="cliente-telefone"
                value={dados.telefone}
                onChange={(valor) => setDados({ ...dados, telefone: valor })}
              />
              {erros["telefone"] && <p className="text-xs text-destructive">{erros["telefone"]}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-status">Status do cliente</Label>
            <Select
              value={dados.status}
              onValueChange={(valor) => setDados({ ...dados, status: valor as StatusCliente })}
            >
              <SelectTrigger id="cliente-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CLIENTE).map(([chave, item]) => (
                  <SelectItem key={chave} value={chave}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS_SUGERIDAS.map((tag) => (
                <button key={tag} type="button" onClick={() => alternarTag(tag)}>
                  <AppBadge
                    tom={dados.tags.includes(tag) ? "info" : "neutro"}
                    className={cn("cursor-pointer", dados.tags.includes(tag) && "ring-1 ring-info/40")}
                  >
                    {tag}
                  </AppBadge>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-obs">Observações</Label>
            <Textarea
              id="cliente-obs"
              rows={3}
              value={dados.observacoes}
              onChange={(evento) => setDados({ ...dados, observacoes: evento.target.value })}
              placeholder="Preferências, restrições ou histórico relevante."
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Cliente favorito</p>
              <p className="text-xs text-muted-foreground">Aparece em destaque nas listagens.</p>
            </div>
            <Switch
              checked={dados.favorito}
              onCheckedChange={(valor) => setDados({ ...dados, favorito: valor })}
              aria-label="Marcar como favorito"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {cliente ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
