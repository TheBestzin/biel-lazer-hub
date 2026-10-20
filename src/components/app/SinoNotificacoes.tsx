import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, CheckCheck, Inbox } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { chaves, useNotificacoes } from "@/hooks/useDados";
import { NotificacaoService } from "@/services/NotificacaoService";
import { BadgeTipoNotificacao } from "@/components/app/StatusBadges";
import { AppEmptyState } from "@/components/app/AppEmptyState";
import { scaleIn } from "@/lib/motion";
import { formatarDataRelativa } from "@/utils/formatadores";
import { cn } from "@/lib/utils";

/**
 * Sino no header do admin: contador de não lidas + painel com as
 * notificações mais recentes. Marca todas como lidas com um toque.
 */
export function SinoNotificacoes() {
  const { admin } = useAuth();
  const { data: notificacoes } = useNotificacoes();
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida), [notificacoes]);

  const marcarTodas = useMutation({
    mutationFn: () => NotificacaoService.marcarTodasLidas(notificacoes, admin?.id ?? "sistema"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.notificacoes });
      toast.success("Notificações marcadas como lidas.");
    },
    onError: () => toast.error("Não foi possível marcar como lidas."),
  });

  const recentes = notificacoes.slice(0, 6);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-xl"
        aria-label={
          naoLidas.length > 0
            ? `Notificações: ${naoLidas.length} não lidas`
            : "Notificações (nenhuma não lida)"
        }
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        {naoLidas.length > 0 ? (
          <BellRing className="size-4.5" aria-hidden />
        ) : (
          <Bell className="size-4.5" aria-hidden />
        )}
        <AnimatePresence>
          {naoLidas.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-muted px-1 text-[0.6rem] leading-4 font-semibold text-muted-foreground tabular-nums ring-2 ring-background"
            >
              {naoLidas.length > 9 ? "9+" : naoLidas.length}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {aberto && (
          <>
            {/* Fecha ao clicar fora */}
            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setAberto(false)} />
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-popover shadow-pop sm:w-96"
              role="dialog"
              aria-label="Notificações recentes"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <p className="text-sm font-semibold">Notificações</p>
                {naoLidas.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 rounded-full text-xs"
                    onClick={() => marcarTodas.mutate()}
                    disabled={marcarTodas.isPending}
                  >
                    <CheckCheck className="size-3.5" aria-hidden />
                    Marcar lidas
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {recentes.length === 0 ? (
                  <div className="px-4 py-6">
                    <AppEmptyState
                      icone={Inbox}
                      titulo="Tudo em ordem"
                      descricao="Você não tem notificações no momento."
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {recentes.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                          !item.lida && "bg-primary-soft/40",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            item.lida ? "bg-muted-foreground/30" : "bg-primary",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.titulo}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.descricao}
                          </p>
                          <p className="mt-1 text-[0.65rem] text-muted-foreground/70">
                            {formatarDataRelativa(item.createdAt)}
                          </p>
                        </div>
                        <BadgeTipoNotificacao tipo={item.tipo} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <a
                href="/notificacoes"
                className="block border-t border-border/60 px-4 py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-accent"
              >
                Ver todas as notificações
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
