export const APP_NOME = "Área de Lazer Biel";
export const APP_SUBTITULO = "Sistema de Gerenciamento de Reservas";

export const STATUS_CLIENTE = {
  confiavel: { label: "Confiável", tom: "success" },
  atencao: { label: "Atenção", tom: "warning" },
  nao_alugar: { label: "Não alugar novamente", tom: "destructive" },
} as const;

export const STATUS_PAGAMENTO = {
  pendente: { label: "Pendente", tom: "warning" },
  parcial: { label: "Parcial", tom: "info" },
  pago: { label: "Pago", tom: "success" },
} as const;

export const STATUS_RESERVA = {
  reservada: { label: "Reservada", tom: "info" },
  finalizada: { label: "Finalizada", tom: "success" },
  cancelada: { label: "Cancelada", tom: "destructive" },
} as const;

export const CARGOS = {
  master: "Administrador Master",
  administrador: "Administrador",
  funcionario: "Funcionário",
} as const;

export const CATEGORIAS_DESPESA = {
  agua: "Água",
  energia: "Energia",
  limpeza: "Limpeza",
  produtos: "Produtos",
  funcionarios: "Funcionários",
  manutencao: "Manutenção",
  outros: "Outros",
} as const;

export const MOTIVOS_BLOQUEIO = {
  familia: "Uso da família",
  manutencao: "Manutenção",
  evento: "Evento interno",
  outro: "Outro",
} as const;

export const CHECKLIST_PADRAO = [
  "Piscina limpa",
  "Churrasqueira limpa",
  "Banheiros limpos",
  "Lixo retirado",
  "Objetos esquecidos verificados",
  "Energia desligada",
  "Portão fechado",
] as const;

export const CONTRATO_PADRAO = `CONTRATO DE LOCAÇÃO — {{empresa}}

LOCATÁRIO: {{cliente}}
CPF: {{cpf}}
TELEFONE: {{telefone}}

DATA DA LOCAÇÃO: {{data}}
HORÁRIO: das {{entrada}} às {{saida}}
VALOR: {{valor}}

OBSERVAÇÕES: {{observacoes}}

REGRAS DA ÁREA DE LAZER
1. O espaço deve ser devolvido limpo e organizado.
2. É proibido o uso da piscina fora do horário contratado.
3. Danos ao patrimônio serão de responsabilidade do locatário.
4. Respeitar o silêncio a partir das 22h.
5. Menores de idade devem estar acompanhados pelos responsáveis.

Responsável pelo atendimento: {{administrador}}

_________________________________
Assinatura do locatário`;

export const CONFIG_DOC_ID = "geral";

export const TAGS_SUGERIDAS = ["VIP", "Família", "Empresa", "Indicação", "Cliente antigo"];
