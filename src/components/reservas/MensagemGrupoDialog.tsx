import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Reserva } from "@/types";
import { formatarData } from "@/utils/formatadores";

const TITULO_MENSAGEM = "🏄‍♂️ RESERVAS ÁREA DE LAZER FAMILIA BIEL";

export function montarMensagemGrupo(reservas: Reserva[]): string {
  const hoje = new Date().toISOString().slice(0, 10);
  const linhas = reservas
    .filter(
      (reserva) =>
        !reserva.deleted && reserva.statusReserva !== "cancelada" && reserva.data >= hoje,
    )
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((reserva) => `${formatarData(reserva.data)} - ${reserva.clienteNome}`);

  if (linhas.length === 0) return `${TITULO_MENSAGEM}\n\nNenhuma reserva agendada no momento.`;
  return `${TITULO_MENSAGEM}\n\n${linhas.join("\n\n")}`;
}

interface MensagemGrupoDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  reservas: Reserva[];
}

export function MensagemGrupoDialog({ aberto, aoFechar, reservas }: MensagemGrupoDialogProps) {
  const mensagemInicial = useMemo(() => montarMensagemGrupo(reservas), [reservas]);
  const [mensagem, setMensagem] = useState(mensagemInicial);
  const [texto, setTexto] = useState(mensagemInicial);
  const [copiado, setCopiado] = useState(false);

  // Recalcula quando a lista muda ou o diálogo reabre.
  if (mensagem !== mensagemInicial) {
    setMensagem(mensagemInicial);
    setTexto(mensagemInicial);
    setCopiado(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Mensagem copiada. É só colar no grupo.");
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mensagem para o grupo</DialogTitle>
          <DialogDescription>
            Lista das próximas reservas pronta para enviar no WhatsApp. Você pode editar antes de
            enviar.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={12}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          className="font-mono text-sm whitespace-pre-wrap"
          aria-label="Mensagem das reservas"
        />
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={copiar}>
            {copiado ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copiado ? "Copiado" : "Copiar mensagem"}
          </Button>
          <Button asChild>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" aria-hidden />
              Enviar no WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
