/**
 * Rótulos legíveis para valores crus expostos na interface.
 *
 * O backend guarda chaves internas ("criar", "clientes", "reservas") —
 * o que aparece para o usuário deve ser português, não chave de
 * documento. Quando faltar uma entrada, o fallback é a chave
 * capitalizada, então nunca quebra ao inventariar uma coleção nova.
 */

/** Ações registradas na auditoria (`LogService.registrar`). */
export const ROTULOS_ACAO_LOG = {
  criar: "Criação",
  atualizar: "Atualização",
  excluir: "Exclusão",
  cancelar: "Cancelamento",
  restaurar: "Restauração",
  login: "Login",
  logout: "Logout",
} as const;

/** Coleções auditáveis (nome do documento no Firestore). */
export const ROTULOS_COLECAO = {
  clientes: "Clientes",
  "clientes/{clienteId}": "Cliente",
  reservas: "Reservas",
  despesas: "Despesas",
  financeiro: "Financeiro",
  bloqueios: "Bloqueios",
  lista_espera: "Lista de espera",
  admins: "Administradores",
  notificacoes: "Notificações",
  configuracoes: "Configurações",
  lixeira: "Lixeira",
  logs: "Registros de auditoria",
} as const;

export function rotuloMaiusculo(cru: string): string {
  return cru.charAt(0).toUpperCase() + cru.slice(1);
}

export function rotuloAcao(cru: string): string {
  return (ROTULOS_ACAO_LOG as Record<string, string | undefined>)[cru] ?? rotuloMaiusculo(cru);
}

export function rotuloColecao(cru: string): string {
  return (ROTULOS_COLECAO as Record<string, string | undefined>)[cru] ?? rotuloMaiusculo(cru);
}
