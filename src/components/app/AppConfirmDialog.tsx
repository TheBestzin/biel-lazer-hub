import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AppConfirmDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao: string;
  confirmarLabel?: string;
  destrutivo?: boolean;
  aoConfirmar: () => void;
}

export function AppConfirmDialog({
  aberto,
  aoFechar,
  titulo,
  descricao,
  confirmarLabel = "Confirmar",
  destrutivo,
  aoConfirmar,
}: AppConfirmDialogProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={cn(destrutivo && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            onClick={aoConfirmar}
          >
            {confirmarLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
