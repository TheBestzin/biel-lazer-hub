import { createFileRoute } from "@tanstack/react-router";
import { Save, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";
import { AppBadge } from "@/components/app/AppBadge";
import { CampoMoeda, CampoTelefone } from "@/components/app/CamposMascarados";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CARGOS } from "@/constants";
import { chaves, useAcao, useAdmins, useConfiguracoes } from "@/hooks/useDados";
import { ConfiguracaoService } from "@/services/ConfiguracaoService";
import { LogService } from "@/services/LogService";
import type { Configuracoes } from "@/types";
import { formatarDataHora } from "@/utils/formatadores";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Área de Lazer Biel" },
      {
        name: "description",
        content: "Dados da empresa, valores padrão, modelo de contrato e equipe com acesso.",
      },
      { property: "og:title", content: "Configurações — Área de Lazer Biel" },
      { property: "og:description", content: "Preferências gerais e equipe do sistema." },
    ],
  }),
  component: PaginaConfiguracoes,
});

function PaginaConfiguracoes() {
  const { admin } = useAuth();
  const { data: configuracoes } = useConfiguracoes();
  const { data: admins } = useAdmins();
  const [form, setForm] = useState<Partial<Configuracoes>>({});

  useEffect(() => {
    if (configuracoes) setForm(configuracoes);
  }, [configuracoes]);

  const atualizar = <C extends keyof Configuracoes>(campo: C, valor: Configuracoes[C]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvar = useAcao(
    async () => {
      await ConfiguracaoService.salvar({ ...form, inicializado: true });
      await LogService.registrar({
        usuario: admin?.uid ?? "sistema",
        usuarioNome: admin?.nome ?? "Sistema",
        acao: "atualizar",
        colecao: "configuracoes",
        documento: "geral",
        descricao: "Atualizou as configurações do sistema",
      });
    },
    { sucesso: "Configurações salvas.", invalidar: [chaves.configuracoes, chaves.logs] },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Configurações"
        descricao="Dados da empresa, padrões de reserva e modelo de contrato."
        acoes={
          <Button onClick={() => salvar.mutate(undefined as never)} disabled={salvar.isPending}>
            <Save className="size-4" aria-hidden /> Salvar alterações
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" aria-hidden /> Dados gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nomeEmpresa">Nome da empresa</Label>
            <Input
              id="nomeEmpresa"
              value={form.nomeEmpresa ?? ""}
              onChange={(evento) => atualizar("nomeEmpresa", evento.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <CampoTelefone
              id="telefone"
              value={form.telefone ?? ""}
              onChange={(valor) => atualizar("telefone", valor)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <CampoTelefone
              id="whatsapp"
              value={form.whatsapp ?? ""}
              onChange={(valor) => atualizar("whatsapp", valor)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorPadrao">Valor padrão da diária</Label>
            <CampoMoeda
              id="valorPadrao"
              value={form.valorPadrao ?? 0}
              onChange={(valor) => atualizar("valorPadrao", valor)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entradaPadrao">Horário de entrada padrão</Label>
            <Input
              id="entradaPadrao"
              type="time"
              value={form.entradaPadrao ?? "08:00"}
              onChange={(evento) => atualizar("entradaPadrao", evento.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saidaPadrao">Horário de saída padrão</Label>
            <Input
              id="saidaPadrao"
              type="time"
              value={form.saidaPadrao ?? "22:00"}
              onChange={(evento) => atualizar("saidaPadrao", evento.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modelo de contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Use os marcadores {"{{empresa}}"}, {"{{cliente}}"}, {"{{cpf}}"}, {"{{telefone}}"},{" "}
            {"{{data}}"}, {"{{entrada}}"}, {"{{saida}}"} e {"{{valor}}"}.
          </p>
          <Textarea
            rows={14}
            value={form.contratoPadrao ?? ""}
            onChange={(evento) => atualizar("contratoPadrao", evento.target.value)}
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" aria-hidden /> Equipe com acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum administrador cadastrado.</p>
          ) : (
            admins.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.email}
                    {item.ultimoLogin ? ` · último acesso ${formatarDataHora(item.ultimoLogin)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AppBadge tom="info">{CARGOS[item.cargo]}</AppBadge>
                  <AppBadge tom={item.ativo ? "success" : "destructive"}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </AppBadge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
