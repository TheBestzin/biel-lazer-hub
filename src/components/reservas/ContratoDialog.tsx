import { FileText, Printer } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONTRATO_PADRAO } from "@/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import { useConfiguracoes } from "@/hooks/useDados";
import type { Reserva } from "@/types";
import { mascararCPF, mascararTelefone } from "@/utils/documentos";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

interface ContratoDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  reserva: Reserva | null;
}

export function ContratoDialog({ aberto, aoFechar, reserva }: ContratoDialogProps) {
  const { data: configuracoes } = useConfiguracoes();
  const { admin } = useAuth();

  const texto = useMemo(() => {
    if (!reserva) return "";
    const modelo = configuracoes?.contratoPadrao?.trim() || CONTRATO_PADRAO;
    const substituicoes: Record<string, string> = {
      empresa: configuracoes?.nomeEmpresa ?? "Área de Lazer Biel",
      cliente: reserva.clienteNome,
      cpf: mascararCPF(reserva.clienteCPF),
      telefone: mascararTelefone(reserva.clienteTelefone),
      data: formatarData(reserva.data),
      entrada: reserva.entrada,
      saida: reserva.saida,
      valor: formatarMoeda(reserva.valor),
      observacoes: reserva.observacoes?.trim() || "Nenhuma",
      administrador: admin?.nome ?? "",
    };
    return modelo.replace(/\{\{(\w+)\}\}/g, (_, chave: string) => substituicoes[chave] ?? "");
  }, [reserva, configuracoes, admin]);

  function imprimir() {
    const janela = window.open("", "_blank", "width=800,height=900");
    if (!janela) return;
    janela.document.write(
      `<html><head><title>Contrato — ${reserva?.clienteNome ?? ""}</title></head><body style="font-family: ui-sans-serif, system-ui; padding:40px; white-space:pre-wrap; line-height:1.6;">${texto.replace(/</g, "&lt;")}</body></html>`,
    );
    janela.document.close();
    janela.focus();
    janela.print();
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4" aria-hidden />
            Contrato de locação
          </DialogTitle>
          <DialogDescription>
            Documento gerado a partir do modelo definido em Configurações.
          </DialogDescription>
        </DialogHeader>
        <pre className="rounded-xl border bg-muted/40 p-4 font-sans text-sm whitespace-pre-wrap">
          {texto}
        </pre>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Fechar
          </Button>
          <Button onClick={imprimir}>
            <Printer className="size-4" aria-hidden />
            Imprimir / salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
