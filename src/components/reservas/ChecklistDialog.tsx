import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/app/providers/AuthProvider";
import { chaves, useAcao } from "@/hooks/useDados";
import { LogService } from "@/services/LogService";
import { ReservaService, checklistInicial } from "@/services/ReservaService";
import type { ChecklistItem, Reserva } from "@/types";
import { formatarData } from "@/utils/formatadores";

interface ChecklistDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  reserva: Reserva | null;
}

export function ChecklistDialog({ aberto, aoFechar, reserva }: ChecklistDialogProps) {
  const { admin } = useAuth();
  const [itens, setItens] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (!aberto || !reserva) return;
    setItens(reserva.checklist?.length ? reserva.checklist : checklistInicial());
  }, [aberto, reserva]);

  const concluidos = itens.filter((item) => item.concluido).length;
  const progresso = itens.length ? Math.round((concluidos / itens.length) * 100) : 0;

  const salvar = useAcao(
    async (finalizar: boolean) => {
      if (!reserva) return;
      const autor = admin?.uid ?? "sistema";
      await ReservaService.salvarChecklist(reserva.id, itens, autor);
      if (finalizar) {
        await ReservaService.definirStatus(reserva.id, "finalizada", autor);
        await LogService.registrar({
          usuario: autor,
          usuarioNome: admin?.nome ?? "Sistema",
          acao: "finalizar",
          colecao: "reservas",
          documento: reserva.id,
          descricao: `Finalizou a reserva de ${reserva.clienteNome} em ${formatarData(reserva.data)}`,
        });
        await ReservaService.recalcularResumoCliente(reserva.clienteId, autor);
      }
    },
    {
      sucesso: "Checklist salvo.",
      invalidar: [chaves.reservas, chaves.clientes, chaves.logs],
      aoConcluir: aoFechar,
    },
  );

  return (
    <Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checklist de encerramento</DialogTitle>
          <DialogDescription>
            {reserva ? `${reserva.clienteNome} — ${formatarData(reserva.data)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={progresso} aria-label="Progresso do checklist" />
          <p className="text-xs text-muted-foreground">
            {concluidos} de {itens.length} itens concluídos
          </p>
          <ul className="space-y-2">
            {itens.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border p-3">
                <Checkbox
                  id={`check-${item.id}`}
                  checked={item.concluido}
                  onCheckedChange={(valor) =>
                    setItens((atual) =>
                      atual.map((linha) =>
                        linha.id === item.id ? { ...linha, concluido: Boolean(valor) } : linha,
                      ),
                    )
                  }
                />
                <label htmlFor={`check-${item.id}`} className="text-sm">
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => salvar.mutate(false)}
            disabled={salvar.isPending}
          >
            Salvar
          </Button>
          <Button
            onClick={() => salvar.mutate(true)}
            disabled={salvar.isPending || progresso < 100}
          >
            <CheckCircle2 className="size-4" aria-hidden />
            Finalizar reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
