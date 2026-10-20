import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ScrollText,
  Settings,
  Ticket,
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
 * Cada seção tem ícone próprio: nenhum ícone se repete no menu.
 */
export const NAVEGACAO: ItemNavegacao[] = [
  { para: "/clientes", label: "Clientes", icone: Users, descricao: "Cadastro e histórico" },
  { para: "/reservas", label: "Reservas", icone: Ticket, descricao: "Locações e checklist" },
  { para: "/agenda", label: "Agenda", icone: CalendarDays, descricao: "Calendário e bloqueios" },
  { para: "/financeiro", label: "Financeiro", icone: Wallet, descricao: "Receitas e despesas" },
  {
    para: "/relatorios",
    label: "Relatórios",
    icone: ChartNoAxesCombined,
    descricao: "Indicadores e gráficos",
  },
  { para: "/notificacoes", label: "Notificações", icone: Bell, descricao: "Alertas do sistema" },
  { para: "/auditoria", label: "Auditoria", icone: ScrollText, descricao: "Registro de ações" },
  { para: "/lixeira", label: "Lixeira", icone: Trash2, descricao: "Itens removidos" },
  {
    para: "/configuracoes",
    label: "Configurações",
    icone: Settings,
    descricao: "Preferências gerais",
  },
];

/** Busca um item pelo caminho — evita índices frágeis ao reorganizar o menu. */
function item(para: string): ItemNavegacao {
  const encontrado = NAVEGACAO.find((entrada) => entrada.para === para);
  if (!encontrado) throw new Error(`Item de navegação inexistente: ${para}`);
  return encontrado;
}

/**
 * Sidebar agrupada por função: Operação (dia a dia),
 * Gestão (dinheiro e análise) e Sistema (controle e preferências).
 * Cada item aparece em exatamente um grupo.
 */
export const GRUPOS_NAVEGACAO: GrupoNavegacao[] = [
  {
    rotulo: "Operação",
    itens: [item("/clientes"), item("/reservas"), item("/agenda")],
  },
  {
    rotulo: "Gestão",
    itens: [item("/financeiro"), item("/relatorios")],
  },
  {
    rotulo: "Sistema",
    itens: [item("/notificacoes"), item("/auditoria"), item("/lixeira"), item("/configuracoes")],
  },
];
