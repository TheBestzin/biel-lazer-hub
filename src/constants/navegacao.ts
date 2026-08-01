import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
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

export const NAVEGACAO: ItemNavegacao[] = [
  { para: "/", label: "Dashboard", icone: LayoutDashboard, descricao: "Visão geral do negócio" },
  { para: "/clientes", label: "Clientes", icone: Users, descricao: "Cadastro e histórico" },
  { para: "/reservas", label: "Reservas", icone: ClipboardList, descricao: "Locações e checklist" },
  { para: "/agenda", label: "Agenda", icone: CalendarDays, descricao: "Calendário e bloqueios" },
  { para: "/financeiro", label: "Financeiro", icone: Wallet, descricao: "Receitas e despesas" },
  { para: "/relatorios", label: "Relatórios", icone: BarChart3, descricao: "Indicadores e gráficos" },
  { para: "/notificacoes", label: "Notificações", icone: Bell, descricao: "Alertas do sistema" },
  { para: "/auditoria", label: "Auditoria", icone: ClipboardList, descricao: "Registro de ações" },
  { para: "/lixeira", label: "Lixeira", icone: Trash2, descricao: "Itens removidos" },
  { para: "/configuracoes", label: "Configurações", icone: Settings, descricao: "Preferências gerais" },
];
