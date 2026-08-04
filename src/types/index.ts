export type StatusCliente = "confiavel" | "atencao" | "nao_alugar";
export type StatusPagamento = "pendente" | "parcial" | "pago";
export type StatusReserva = "reservada" | "finalizada" | "cancelada";
export type CargoAdmin = "master" | "administrador" | "funcionario";
export type MotivoBloqueio = "familia" | "manutencao" | "evento" | "outro";
export type CategoriaDespesa =
  | "agua"
  | "energia"
  | "limpeza"
  | "produtos"
  | "funcionarios"
  | "manutencao"
  | "outros";
export type TipoMovimento = "receita" | "despesa";
export type TipoNotificacao = "reserva" | "pagamento" | "sistema" | "cliente" | "administrador";
export type Tema = "light" | "dark" | "system";

export interface Auditavel {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  deleted: boolean;
}

export interface Admin extends Auditavel {
  id: string;
  uid: string;
  nome: string;
  email: string;
  foto?: string;
  cargo: CargoAdmin;
  ativo: boolean;
  ultimoLogin?: string;
}

export interface Cliente extends Auditavel {
  id: string;
  nome: string;
  cpf?: string;
  telefone: string;
  status: StatusCliente;
  observacoes?: string;
  tags: string[];
  favorito: boolean;
  totalReservas: number;
  totalGasto: number;
  ultimaReserva?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  concluido: boolean;
}

export interface Reserva extends Auditavel {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteCPF?: string;
  /** ISO yyyy-MM-dd */
  data: string;
  entrada: string;
  saida: string;
  valor: number;
  valorPago: number;
  statusPagamento: StatusPagamento;
  statusReserva: StatusReserva;
  observacoes?: string;
  checklist: ChecklistItem[];
}

export interface Despesa extends Auditavel {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
}

export interface Movimento extends Auditavel {
  id: string;
  tipo: TipoMovimento;
  valor: number;
  categoria: string;
  reservaId?: string;
  descricao: string;
  data: string;
}

export interface Bloqueio extends Auditavel {
  id: string;
  data: string;
  motivo: MotivoBloqueio;
  descricao?: string;
}

export interface ListaEsperaItem extends Auditavel {
  id: string;
  clienteId: string;
  clienteNome: string;
  telefone: string;
  dataDesejada: string;
  observacoes?: string;
  atendido: boolean;
}

export interface Notificacao extends Auditavel {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoNotificacao;
  lida: boolean;
}

export interface LogEntry {
  id: string;
  usuario: string;
  usuarioNome: string;
  acao: string;
  colecao: string;
  documento: string;
  descricao: string;
  antes?: string;
  depois?: string;
  createdAt: string;
}

export interface ItemLixeira {
  id: string;
  colecao: string;
  documentoId: string;
  titulo: string;
  dados: Record<string, unknown>;
  removidoPor: string;
  createdAt: string;
}

export interface Configuracoes {
  id: string;
  nomeEmpresa: string;
  logo?: string;
  imagemCapa?: string;
  telefone: string;
  whatsapp: string;
  valorPadrao: number;
  entradaPadrao: string;
  saidaPadrao: string;
  tema: Tema;
  contratoPadrao: string;
  inicializado: boolean;
  updatedAt: string;
}

export interface Paginacao {
  pagina: number;
  porPagina: number;
}
