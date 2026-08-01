import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useAuth } from "@/app/providers/AuthProvider";
import { firebaseConfigurado } from "@/firebase/config";
import { AdminService } from "@/services/AdminService";
import { BloqueioService, ListaEsperaService } from "@/services/AgendaService";
import { ClienteService } from "@/services/ClienteService";
import { ConfiguracaoService } from "@/services/ConfiguracaoService";
import { DespesaService } from "@/services/DespesaService";
import { FinanceiroService } from "@/services/FinanceiroService";
import { LixeiraService } from "@/services/LixeiraService";
import { LogService } from "@/services/LogService";
import { NotificacaoService } from "@/services/NotificacaoService";
import { ReservaService } from "@/services/ReservaService";

export const chaves = {
  clientes: ["clientes"] as QueryKey,
  cliente: (id: string) => ["clientes", id] as QueryKey,
  reservas: ["reservas"] as QueryKey,
  reservasCliente: (id: string) => ["reservas", "cliente", id] as QueryKey,
  despesas: ["despesas"] as QueryKey,
  financeiro: ["financeiro"] as QueryKey,
  bloqueios: ["bloqueios"] as QueryKey,
  listaEspera: ["lista_espera"] as QueryKey,
  notificacoes: ["notificacoes"] as QueryKey,
  logs: ["logs"] as QueryKey,
  lixeira: ["lixeira"] as QueryKey,
  admins: ["admins"] as QueryKey,
  configuracoes: ["configuracoes"] as QueryKey,
};

function usarConsulta<T>(chave: QueryKey, fn: () => Promise<T>, vazio: T) {
  const { admin } = useAuth();
  const consulta = useQuery({
    queryKey: chave,
    queryFn: fn,
    enabled: firebaseConfigurado && Boolean(admin),
    staleTime: 60_000,
  });
  return { ...consulta, data: (consulta.data ?? vazio) as T };
}

export const useClientes = (incluirExcluidos = false) =>
  usarConsulta([...(chaves.clientes as string[]), incluirExcluidos], () => ClienteService.listar(incluirExcluidos), []);

export const useCliente = (id: string) =>
  usarConsulta(chaves.cliente(id), () => ClienteService.obter(id), null);

export const useReservas = (incluirExcluidas = false) =>
  usarConsulta([...(chaves.reservas as string[]), incluirExcluidas], () => ReservaService.listar(incluirExcluidas), []);

export const useReservasDoCliente = (id: string) =>
  usarConsulta(chaves.reservasCliente(id), () => ReservaService.listarPorCliente(id), []);

export const useDespesas = () => usarConsulta(chaves.despesas, () => DespesaService.listar(), []);
export const useMovimentos = () => usarConsulta(chaves.financeiro, () => FinanceiroService.listar(), []);
export const useBloqueios = () => usarConsulta(chaves.bloqueios, () => BloqueioService.listar(), []);
export const useListaEspera = () => usarConsulta(chaves.listaEspera, () => ListaEsperaService.listar(), []);
export const useNotificacoes = () => usarConsulta(chaves.notificacoes, () => NotificacaoService.listar(), []);
export const useLogs = () => usarConsulta(chaves.logs, () => LogService.listar(), []);
export const useLixeira = () => usarConsulta(chaves.lixeira, () => LixeiraService.listar(), []);
export const useAdmins = () => usarConsulta(chaves.admins, () => AdminService.listar(), []);
export const useConfiguracoes = () =>
  usarConsulta(chaves.configuracoes, () => ConfiguracaoService.obter(), null);

export function useInvalidar() {
  const queryClient = useQueryClient();
  return (...chavesAlvo: QueryKey[]) => {
    chavesAlvo.forEach((chave) => void queryClient.invalidateQueries({ queryKey: chave }));
  };
}

export function useAcao<TVars>(
  executar: (vars: TVars) => Promise<unknown>,
  opcoes: { sucesso: string; invalidar?: QueryKey[]; aoConcluir?: () => void },
) {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: executar,
    onSuccess: () => {
      invalidar(...(opcoes.invalidar ?? []));
      toast.success(opcoes.sucesso);
      opcoes.aoConcluir?.();
    },
    onError: (erro: unknown) => {
      const mensagem = erro instanceof Error ? erro.message : "Não foi possível concluir a ação.";
      toast.error(mensagem);
    },
  });
}
