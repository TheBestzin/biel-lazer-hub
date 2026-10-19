import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  Layout,
  Settings,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ItemNavegacao {
  para: string;
  label: string;
  icone: LucideIcon;
  descricao: string;
}

export interface GrupoNavegacao {
  rotulo: string;
  itens: ItemNavegacao[];
}

/**
 * Itens em ordem plana — consumido pela paleta de comandos (⌘K).
 */
export const NAVEGACAO: ItemNavegacao[] = [
  { para: "/clientes", label: "Clientes", icone: Users, descricao: "Cadastro e histórico" },
  { para: "/reservas", label: "Reservas", icone: ClipboardList, descricao: "Locações e checklist" },
  { para: "/agenda", label: "Agenda", icone: CalendarDays, descricao: "Calendário e bloqueios" },
  { para: "/financeiro", label: "Financeiro", icone: Wallet, descricao: "Receitas e despesas" },
  {
    para: "/relatorios",
    label: "Relatórios",
    icone: BarChart3,
    descricao: "Indicadores e gráficos",
  },
  { para: "/notificacoes", label: "Notificações", icone: Bell, descricao: "Alertas do sistema" },
  { para: "/auditoria", label: "Auditoria", icone: ClipboardList, descricao: "Registro de ações" },
  { para: "/lixeira", label: "Lixeira", icone: Trash2, descricao: "Itens removidos" },
  {
    para: "/configuracoes",
    label: "Configurações",
    icone: Settings,
    descricao: "Preferências gerais",
  },
];

/**
 * Sidebar agrupada por função: Operação (dia a dia),
 * Gestão (dinheiro e análise) e Sistema (controle e preferências).
 */
export const GRUPOS_NAVEGACAO: GrupoNavegacao[] = [
  {
    rotulo: "Operação",
    itens: [
      NAVEGACAO[0]!, // Clientes
      NAVEGACAO[1]!, // Reservas
      NAVEGACAO[2]!, // Agenda
    ],
  },
  {
    rotulo: "Gestão",
    itens: [
      NAVEGACAO[0]!, // Clientes (agora índice 0 após remoção do Dashboard)
      NAVEGACAO[2]!, // Financeiro (índice 2: financeiro era 3, agora 2 após remoção)
      NAVEGACAO[3]!, // Relatórios (índice 3: relatórios era 4, agora 3 após remoção)
    ],
  },
  {
    rotulo: "Sistema",
    itens: [
      NAVEGACAO[4]!, // Notificações (índice 4: notificações era 5, agora 4 após remoção do Dashboard)
      NAVEGACAO[5]!, // Auditoria (índice 5: auditoria era 6, agora 5 após remoção)
      NAVEGACAO[6]!, // Lixeira (índice 6: lixeira era 7, agora 6 após remoção)
      NAVEGACAO[7]!, // Configurações (índice 7: configurações era 8, agora 7 após remoção)
    ],
  },
];
