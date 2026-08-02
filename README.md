# Biel Reservations

PARTE 1 — ESPECIFICAÇÃO GERAL DO PROJETO

Área de Lazer Biel

Sistema Profissional de Gerenciamento de Reservas

1. OBJETIVO DO PROJETO

Desenvolver um sistema web profissional, moderno, seguro, responsivo e escalável para gerenciamento completo da Área de Lazer Biel.

O sistema será utilizado exclusivamente pelos administradores da área de lazer para controlar clientes, reservas, pagamentos, faturamento, despesas e histórico das locações.

Este sistema não possui acesso para clientes finais.

Todo o sistema será interno.

O objetivo é substituir completamente controles feitos em papel ou planilhas.

O sistema deverá ser preparado para utilização durante muitos anos, permitindo expansão futura sem necessidade de reestruturação do código.

2. NOME DO SISTEMA

Nome Oficial

Área de Lazer Biel

Subtítulo

Sistema de Gerenciamento de Reservas

3. OBJETIVOS PRINCIPAIS

O sistema deverá permitir:

 Cadastro de clientes

 Cadastro de reservas

 Controle financeiro

 Controle de despesas

 Histórico completo dos clientes

 Histórico completo das reservas

 Controle de pagamentos

 Calendário inteligente

 Lista de espera

 Bloqueio de datas

 Auditoria completa

 Dashboard administrativo

 Configurações gerais

Tudo isso através de uma interface simples, rápida e extremamente intuitiva.

4. PÚBLICO DO SISTEMA

O sistema será utilizado apenas pelos administradores da Área de Lazer Biel.

Não existirão usuários comuns.

Não existirá área pública.

Não existirá portal do cliente.

5. TECNOLOGIAS

O projeto deve utilizar tecnologias modernas, estáveis e amplamente utilizadas no mercado.

Front-end

 React 19

 TypeScript

 Vite

Interface

 Tailwind CSS

 shadcn/ui

 Lucide React

 Framer Motion

Formulários

 React Hook Form

 Zod

Gerenciamento de Dados

 TanStack Query

Banco de Dados

 Firebase Cloud Firestore

Autenticação

 Firebase Authentication

Armazenamento

 Firebase Storage

Datas

 date-fns

PWA

 vite-plugin-pwa

Notificações

 React Hot Toast

Gráficos

 Recharts

6. O QUE NÃO DEVE SER UTILIZADO

Não utilizar:

 JavaScript puro

 Bootstrap

 jQuery

 Material UI

 Redux

 Firebase Realtime Database

 CSS global excessivo

 Componentes gigantes

 Arquivos acima de 300 linhas (quando possível)

7. PADRÃO DE CÓDIGO

Todo o projeto deverá seguir rigorosamente:

 SOLID

 Clean Code

 DRY

 KISS

 Componentização

 Tipagem completa

Nunca utilizar:

 any

 código duplicado

 lógica repetida

 funções enormes

8. IDIOMA

Todo o sistema deverá estar em:

Português (Brasil)

Incluindo:

 menus

 mensagens

 botões

 validações

 erros

 notificações

 datas

 moeda

9. IDENTIDADE VISUAL

Criar uma identidade visual exclusiva.

Inspirada em:

 piscina

 natureza

 área verde

 churrasqueira

 lazer

Não utilizar imagens prontas.

Criar um logotipo em SVG contendo elementos minimalistas relacionados ao lazer.

Criar também:

 favicon

 ícone para PWA

 tela de carregamento personalizada

10. PALETA DE CORES

Primárias

Azul piscina

Verde natureza

Branco

Cinza claro

Cinza escuro

Secundárias

Madeira

Bege suave

Utilizar gradientes discretos.

Evitar cores extremamente saturadas.

11. TIPOGRAFIA

Fonte:

Inter

Hierarquia bem definida.

Espaçamento confortável.

Excelente leitura.

12. DESIGN

Inspirar-se em:

 Linear

 Vercel Dashboard

 Stripe Dashboard

 Notion

 Apple

 Firebase Console

Não copiar nenhum.

Apenas utilizar como referência de qualidade.

13. RESPONSIVIDADE

O sistema deverá funcionar perfeitamente em:

Desktop

Notebook

Tablet

Celular

Todos os componentes devem se adaptar automaticamente.

Nenhuma funcionalidade poderá existir apenas na versão desktop.

14. DARK MODE

Criar suporte para:

Modo Claro

Modo Escuro

Modo Sistema

Salvar automaticamente a preferência do usuário.

15. PWA

O sistema deverá funcionar como Progressive Web App.

Permitir instalação em:

Android

iPhone

Windows

macOS

Mostrar instruções de instalação quando apropriado.

16. DESEMPENHO

Priorizar velocidade.

Utilizar:

Lazy Loading

Code Splitting

Memoização

Cache inteligente

Pré-carregamento de rotas principais

Paginação

Consultas otimizadas ao Firestore

17. EXPERIÊNCIA DO USUÁRIO

O sistema deve transmitir sensação de software premium.

Cada ação deverá exigir o menor número possível de cliques.

Sempre fornecer feedback visual.

Evitar carregamentos longos.

Nunca deixar o usuário sem resposta.

18. SEGURANÇA

Segurança deve ser prioridade.

Toda página deverá ser protegida.

Nenhum dado poderá ser acessado sem autenticação.

Toda validação importante deverá ocorrer também nas regras do Firestore.

Nunca confiar apenas na validação do frontend.

19. ACESSIBILIDADE

Garantir:

 Navegação por teclado

 Labels corretos

 Alto contraste

 Estados de foco

 Compatibilidade com leitores de tela

 Botões acessíveis

20. ESTRUTURA DO PROJETO

Utilizar arquitetura Feature-Based, separando o sistema por funcionalidades, e não apenas por tipo de arquivo.

Estrutura sugerida:

src/
│
├── app/
│   ├── providers/
│   ├── router/
│   ├── layouts/
│   └── guards/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── clientes/
│   ├── reservas/
│   ├── calendario/
│   ├── financeiro/
│   ├── configuracoes/
│   ├── administradores/
│   ├── notificacoes/
│   └── auditoria/
│
├── components/
│
├── hooks/
│
├── services/
│
├── firebase/
│
├── lib/
│
├── types/
│
├── utils/
│
├── constants/
│
├── assets/
│
└── styles/

Esta arquitetura deverá permitir adicionar novas funcionalidades sem alterar as existentes.

21. PADRÃO DE COMPONENTES

Todo componente deverá possuir responsabilidade única.

Criar componentes reutilizáveis.

Nunca repetir interface.

Sempre reutilizar.

22. QUALIDADE FINAL

O resultado final deverá ser equivalente a um software desenvolvido por uma empresa especializada.

O projeto deverá estar preparado para:

 crescer;

 receber novas funcionalidades;

 manter excelente desempenho;

 ser facilmente mantido por outros desenvolvedores.

23. OBJETIVO FINAL DO LOVABLE

Você não está criando apenas um CRUD.

Você está desenvolvendo um software comercial completo.

Todas as decisões técnicas devem priorizar:

 qualidade;

 organização;

 segurança;

 escalabilidade;

 excelente experiência do usuário.

Caso alguma informação não esteja explicitamente descrita nas próximas partes, escolha sempre a solução mais profissional, moderna e segura, mantendo consistência com toda esta especificação.

📌 Observação importante (nova)

Quero que o Lovable desenvolva este projeto como se fosse um MVP de um SaaS, mesmo sendo para uso privado. Isso significa:

 código limpo;

 arquitetura escalável;

 facilidade para adicionar novas funcionalidades;

 componentes reutilizáveis;

 alta qualidade visual;

 excelente desempenho.

PARTE 2 — BACKEND, FIREBASE, FIRESTORE, SEGURANÇA E MODELO DE DADOS

Objetivo

Toda a infraestrutura do sistema deverá ser baseada na plataforma Firebase.

O backend deve ser seguro, organizado, escalável e otimizado para reduzir custos de leitura e escrita no Firestore.

Nenhuma informação sensível deverá depender exclusivamente da validação do frontend.

Todo dado deverá ser protegido pelas regras do Firestore.

Plataforma Backend

Utilizar exclusivamente:

 Firebase Authentication

 Cloud Firestore

 Firebase Storage (preparado para uso futuro)

 Firebase Hosting apenas como opção futura (o deploy principal será na Vercel)

Não utilizar:

 Realtime Database

 Supabase

 MongoDB

 MySQL

 PostgreSQL

 Backend próprio

Arquitetura da Integração

Toda comunicação com o Firebase deverá passar pela camada de Services.

Nunca acessar o Firestore diretamente nas páginas ou componentes.

Fluxo obrigatório:

Interface → Hook → Service → Firebase

Nunca:

Interface → Firebase

Configuração do Firebase

Utilizar variáveis de ambiente.

Nunca escrever as credenciais diretamente no código.

Estrutura esperada:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

Criar automaticamente:

 firebase.ts

 auth.ts

 firestore.ts

Projeto Firebase

O sistema deverá utilizar o projeto:

area-de-lazer-biel

Preparar a estrutura para aceitar apenas a troca das variáveis .env, permitindo reutilização em outros projetos futuramente.

Autenticação

Utilizar Firebase Authentication.

Método permitido:

 E-mail + Senha

Não permitir:

 Google

 Facebook

 GitHub

 Login anônimo

 Telefone

 Cadastro público

Bootstrap Seguro

Não utilizar o método "os três primeiros cadastros".

Implementar um fluxo de inicialização seguro.

Funcionamento:

Primeira execução

Verificar se existe algum administrador.

Caso não exista:

Exibir uma tela de configuração inicial.

Solicitar:

 Nome completo

 E-mail

 Senha

Criar automaticamente:

 Usuário no Firebase Authentication

 Documento do administrador no Firestore

Após isso:

 Marcar o sistema como inicializado.

 Nunca mais exibir essa tela.

Somente administradores autenticados poderão criar novos administradores.

Sessão

Implementar:

 Persistência segura da sessão.

 Renovação automática.

 Logout após período configurável de inatividade.

 Botão "Sair de todas as sessões" (quando suportado pelo Firebase).

Coleções do Firestore

Criar as seguintes coleções:

admins
clientes
reservas
financeiro
despesas
bloqueios
lista_espera
configuracoes
notificacoes
logs
lixeira

Coleção: admins

Campos:

id
uid
nome
email
foto
cargo
ativo
ultimoLogin
createdAt
updatedAt
createdBy

Regras:

 Nunca excluir o último administrador ativo.

 Permitir apenas desativação.

 Registrar todas as alterações em logs.

Coleção: clientes

Campos:

id
nome
cpf
telefone
status
observacoes
tags
favorito
totalReservas
totalGasto
ultimaReserva
createdAt
updatedAt
createdBy
deleted

Status permitidos:

 Confiável

 Atenção

 Não alugar novamente

Regras:

 CPF obrigatório.

 CPF único.

 Telefone obrigatório.

 Não excluir definitivamente.

Coleção: reservas

Campos:

id
clienteId
clienteNome
clienteTelefone
clienteCPF

data

entrada
saida

valor

statusPagamento

statusReserva

observacoes

checklist

createdBy

createdAt

updatedAt

deleted

Status Pagamento:

 Pendente

 Parcial

 Pago

Status Reserva:

 Reservada

 Finalizada

 Cancelada

Regras da Reserva

Não permitir:

 duas reservas na mesma data;

 reserva em data bloqueada;

 horários inválidos;

 cliente marcado como "Não alugar novamente".

Caso haja conflito:

Mostrar aviso.

Não salvar.

Coleção: despesas

Campos:

id
categoria
descricao
valor
data
createdBy
createdAt

Categorias:

 Água

 Energia

 Limpeza

 Produtos

 Funcionários

 Manutenção

 Outros

Coleção: financeiro

Esta coleção armazenará movimentações consolidadas.

Campos:

tipo
valor
categoria
reservaId
descricao
data
createdAt

Tipos:

Receita

Despesa

Coleção: bloqueios

Campos:

data
motivo
createdBy
createdAt

Motivos:

Uso da família

Manutenção

Evento interno

Outro

Coleção: lista_espera

Campos:

clienteId
clienteNome
telefone
dataDesejada
observacoes
createdAt

Quando uma reserva for cancelada:

Notificar administradores.

Coleção: notificacoes

Campos:

titulo
descricao
tipo
lida
createdAt

Tipos:

Reserva

Pagamento

Sistema

Cliente

Administrador

Coleção: logs

Registrar automaticamente:

Login

Logout

Cadastro

Edição

Exclusão

Alteração de pagamento

Mudança de status

Alteração de configuração

Campos:

usuario

acao

colecao

documento

descricao

createdAt

Coleção: lixeira

Sempre que um registro for excluído:

Mover para:

lixeira

Nunca apagar imediatamente.

Guardar:

30 dias.

Depois permitir exclusão definitiva.

Coleção: configuracoes

Documento único.

Campos:

nomeEmpresa

logo

imagemCapa

valorPadrao

entradaPadrao

saidaPadrao

tema

modoEscuro

whatsapp

contratoPadrao

updatedAt

Índices do Firestore

Criar índices para:

Clientes

 CPF

 Nome

 Telefone

Reservas

 Data

 Cliente

 Status

 Pagamento

Financeiro

 Data

 Tipo

Despesas

 Categoria

 Data

Logs

 Usuário

 Data

Validações

Nome

 mínimo 3 caracteres

 máximo 120

CPF

 obrigatório

 algoritmo oficial

 único

Telefone

 máscara brasileira

 obrigatório

Valor

 maior que zero

Datas

 válidas

 sem conflito

Horários

 entrada menor que saída

Auditoria

Todo documento deve armazenar:

createdAt

updatedAt

createdBy

Último responsável pela alteração.

Soft Delete

Nunca utilizar exclusão física como padrão.

Ao excluir:

 marcar deleted = true;

 mover para lixeira;

 ocultar das consultas normais.

Segurança do Firestore

Usuário não autenticado:

 não lê;

 não escreve.

Administrador autenticado:

 pode ler;

 criar;

 editar;

 excluir logicamente.

Todas as regras devem verificar autenticação antes de permitir acesso.

TanStack Query

Criar cache para:

Clientes

Reservas

Financeiro

Configurações

Notificações

Atualizar automaticamente quando houver alteração.

Estrutura de Services

Criar:

AuthService

AdminService

ClienteService

ReservaService

FinanceiroService

DespesaService

ConfiguracaoService

NotificacaoService

LogService

StorageService

Todos fortemente tipados.

Hooks

Criar:

useAuth

useAdmins

useClientes

useReservas

useFinanceiro

useDashboard

useConfiguracoes

useNotificacoes

Performance

As consultas devem:

 retornar apenas os campos necessários;

 utilizar paginação;

 evitar leituras repetidas;

 minimizar custos do Firestore.

Preparação para o Futuro

A arquitetura deve permitir, sem reestruturação:

 múltiplas áreas de lazer;

 múltiplos administradores;

 anexos de documentos;

 fotos das reservas;

 integração com WhatsApp;

 pagamentos via PIX;

 aplicativo mobile;

 portal do cliente.

Instrução Final ao Lovable

Implemente toda a integração com Firebase seguindo as melhores práticas oficiais.

Priorize:

 segurança;

 baixo custo de operação;

 excelente desempenho;

 facilidade de manutenção;

 escalabilidade.

Nunca utilize soluções improvisadas ou simplificadas quando houver uma abordagem mais robusta e profissional.

PARTE 3 — FUNCIONALIDADES, REGRAS DE NEGÓCIO E FLUXOS DO SISTEMA

Objetivo

Desenvolver um sistema completo para gerenciamento da Área de Lazer Biel.

Todas as funcionalidades descritas abaixo devem ser implementadas integralmente.

Não substituir funcionalidades por versões simplificadas.

Todo fluxo deve ser funcional.

Dashboard

O Dashboard será a página inicial do sistema.

Seu objetivo é fornecer todas as informações importantes em poucos segundos.

Ao entrar no sistema o administrador deverá visualizar:

Cards principais

Mostrar:

 Receita Bruta do mês

 Despesas do mês

 Lucro Líquido

 Quantidade de reservas

 Quantidade de clientes cadastrados

 Clientes bloqueados

 Lista de espera

 Próxima reserva

Cada card deve possuir:

 ícone

 animação

 tooltip

 comparação com mês anterior (quando existir histórico)

Indicadores

Mostrar automaticamente:

Cliente que mais alugou

Maior receita do mês

Dia da semana mais movimentado

Taxa de ocupação

Quantidade de reservas finalizadas

Quantidade de reservas canceladas

Quantidade de pagamentos pendentes

Calendário Resumido

Mostrar calendário do mês.

Legenda:

🟢 Livre

🟡 Reservado

🔵 Pago

🔴 Cancelado

⚫ Bloqueado

Ao clicar em um dia:

Abrir detalhes.

Últimas movimentações

Mostrar:

Cliente cadastrado

Reserva criada

Pagamento alterado

Administrador criou usuário

Cliente bloqueado

Sempre ordenar pelas mais recentes.

Cadastro de Clientes

Tela exclusiva.

Lista

Mostrar:

Nome

CPF

Telefone

Status

Total de Reservas

Valor Total Gasto

Última Reserva

Favorito

Ações

Pesquisa

Pesquisar instantaneamente por:

Nome

CPF

Telefone

Sem necessidade de clicar em pesquisar.

Filtros

Todos

Favoritos

Confiáveis

Atenção

Não alugar novamente

Clientes ativos

Clientes excluídos (lixeira)

Ordenação

Nome

Última reserva

Valor gasto

Quantidade de reservas

Mais recente

Mais antigo

Cadastro de Cliente

Campos obrigatórios:

Nome

CPF

Telefone

Status

Observações

Tags

Favorito

Validação

Validar CPF.

Impedir CPF duplicado.

Aplicar máscara.

Mostrar erro imediatamente.

Perfil do Cliente

Ao abrir um cliente mostrar:

Nome

CPF

Telefone

Data de cadastro

Última reserva

Primeira reserva

Quantidade de reservas

Total gasto

Status

Favorito

Tags

Observações

Histórico

Mostrar todas as reservas.

Cada reserva deve possuir:

Data

Valor

Pagamento

Administrador responsável

Status

Checklist

Observações

Contrato

Ações

Editar

Nova Reserva

Alterar Status

Mover para Lixeira

Restaurar

Abrir conversa no WhatsApp

Sistema de Status

Existem apenas três status.

Confiável

Atenção

Não alugar novamente

Se o cliente estiver marcado como:

Não alugar novamente

O sistema deverá impedir novas reservas.

O administrador poderá alterar manualmente esse status.

Reservas

Tela principal de reservas.

Tabela

Mostrar:

Cliente

Telefone

Data

Entrada

Saída

Valor

Pagamento

Status

Administrador

Ações

Pesquisa

Cliente

CPF

Telefone

Data

Valor

Filtros

Hoje

Amanhã

Esta Semana

Este Mês

Pagas

Pendentes

Canceladas

Finalizadas

Criar Reserva

Fluxo obrigatório.

Selecionar cliente.

Selecionar data.

Selecionar horário.

Selecionar valor.

Selecionar status do pagamento.

Adicionar observações.

Salvar.

Antes de salvar:

Verificar automaticamente:

Data bloqueada?

Já existe reserva?

Cliente bloqueado?

Horário válido?

Tudo válido?

Somente então salvar.

Lista de Espera

Caso o dia esteja ocupado.

Mostrar:

"Esta data já possui uma reserva."

Perguntar:

"Deseja adicionar este cliente à lista de espera?"

Se sim:

Cadastrar automaticamente.

Quando a reserva for cancelada:

Notificar administradores.

Detalhes da Reserva

Mostrar:

Cliente

CPF

Telefone

Data

Entrada

Saída

Valor

Pagamento

Administrador

Observações

Checklist

Contrato

Histórico de alterações

Ações

Editar

Cancelar

Finalizar

Gerar Contrato

Abrir WhatsApp

Mover para Lixeira

Calendário

Criar calendário exclusivo.

Visual mensal.

Mostrar:

Reservas

Bloqueios

Lista de espera

Feriados (preparado para implementação futura)

Clique

Dia Livre

Nova Reserva

Dia Reservado

Detalhes

Dia Bloqueado

Editar Bloqueio

Navegação

Mês anterior

Próximo mês

Hoje

Ir para data

Bloqueio de Datas

Permitir bloquear datas.

Motivos:

Uso da família

Manutenção

Evento Particular

Outro

Dias bloqueados:

Não poderão receber reservas.

Financeiro

Separar:

Receitas

Despesas

Resumo

Receita

Mostrar:

Cliente

Reserva

Valor

Pagamento

Data

Administrador

Despesas

Mostrar:

Categoria

Descrição

Valor

Data

Administrador

Dashboard Financeiro

Receita Bruta

Despesas

Lucro Líquido

Ticket Médio

Maior Receita

Maior Despesa

Gráficos

Receitas mensais

Despesas mensais

Lucro

Reservas

Todos animados.

Contratos

Cada reserva poderá gerar um contrato automaticamente.

O contrato deverá utilizar um modelo editável.

Preencher automaticamente:

Nome

CPF

Telefone

Data

Entrada

Saída

Valor

Observações

Administrador

Regras da Área de Lazer

Assinatura

Gerar PDF.

WhatsApp

Criar botão.

Abrir conversa automaticamente.

Criar mensagens prontas:

Confirmação

Lembrete

Cancelamento

Agradecimento

Checklist

Ao finalizar reserva.

Mostrar:

Piscina limpa

Churrasqueira limpa

Banheiros limpos

Lixo retirado

Objetos esquecidos

Energia desligada

Portão fechado

Outros

Salvar automaticamente.

Despesas

Cadastrar:

Categoria

Valor

Descrição

Data

Administrador

Impactar automaticamente:

Lucro Líquido.

Configurações

Separar em abas.

Geral

Nome

Logo

Imagem

Telefone

WhatsApp

Valor padrão

Entrada

Saída

Administradores

Criar

Editar

Desativar

Ativar

Resetar senha

Sistema

Tema

Modo escuro

Idioma

Sessão

Contrato

Editar modelo.

Salvar.

Pré-visualizar.

Backup

Exportar JSON

Exportar CSV

Exportar Excel (preparado)

Notificações

Criar central.

Notificar:

Reserva criada

Reserva cancelada

Pagamento alterado

Cliente bloqueado

Administrador criado

Backup realizado

Auditoria

Criar tela exclusiva.

Mostrar:

Quem fez

O quê

Quando

Antes

Depois

Pesquisar.

Filtrar.

Exportar.

Lixeira

Clientes

Reservas

Despesas

Configurações

Nunca excluir imediatamente.

Permitir restaurar.

Perfil do Administrador

Mostrar:

Nome

Email

Foto

Último login

Alterar senha

Tema

Idioma

Busca Global

Disponível no cabeçalho.

Pesquisar:

Clientes

Reservas

Datas

CPF

Telefone

Tags

Resultados instantâneos.

Regras Gerais

Sempre confirmar:

Excluir

Cancelar

Restaurar

Resetar senha

Limpar dados

Nunca executar diretamente.

Estados do Sistema

Criar estados elegantes para:

Sem internet

Sem resultados

Erro inesperado

Carregando

Sem reservas

Sem clientes

Sem despesas

Sempre com ilustrações e botão de ação.

Instrução Final ao Lovable

Cada fluxo descrito acima deve funcionar de forma integrada.

As informações devem permanecer consistentes entre todas as telas.

Evite duplicação de lógica.

Priorize simplicidade para o usuário e robustez na implementação.

⭐ MELHORIA QUE EU ADICIONARIA (MUITO IMPORTANTE)

Esta é uma funcionalidade que normalmente só aparece em softwares pagos.

Timeline Completa

Dentro do perfil de cada cliente, criar uma linha do tempo com todo o histórico.

Exemplo:

10/01/2026
Cliente cadastrado

25/01/2026
Primeira reserva

26/01/2026
Pagamento confirmado

27/01/2026
Checklist concluído

15/03/2026
Nova reserva

20/03/2026
Status alterado para "Atenção"

05/05/2026
Status voltou para "Confiável"

Isso facilita muito acompanhar o histórico do cliente e aumenta bastante o valor do sistema.

PARTE 4 — INTERFACE, UX/UI, DESIGN SYSTEM E EXPERIÊNCIA DO USUÁRIO

Objetivo

Criar uma interface moderna, elegante, intuitiva e altamente responsiva para o sistema Área de Lazer Biel.

O design deve transmitir confiança, organização e profissionalismo, sendo agradável tanto para uso em computadores quanto em celulares.

A interface deve priorizar produtividade, com poucos cliques para executar as tarefas mais frequentes.

Referências Visuais

Inspirar-se apenas na qualidade visual e organização dos seguintes produtos:

 Vercel Dashboard

 Linear

 Stripe Dashboard

 Notion

 Apple

 Firebase Console

Não copiar layouts ou elementos específicos. Apenas utilizar como referência para organização, tipografia, espaçamento, animações e experiência do usuário.

Identidade Visual

A identidade visual deve remeter a:

 Piscina

 Área verde

 Churrasqueira

 Lazer

 Família

 Organização

O sistema deve passar sensação de tranquilidade e confiança.

Paleta de Cores

Cor Primária

Azul piscina (#0EA5E9 como referência visual)

Cor Secundária

Verde natureza (#22C55E como referência)

Cor de Destaque

Laranja suave para alertas e notificações.

Cores de Estado

Sucesso: Verde

Informação: Azul

Aviso: Amarelo

Erro: Vermelho

Neutros:

Cinza claro

Cinza médio

Cinza escuro

Branco

Preto suave

Todas as cores devem ser centralizadas em um único arquivo de tema.

Nunca utilizar códigos de cor espalhados pelo projeto.

Tipografia

Fonte:

Inter

Hierarquia obrigatória:

Título da Página

Título de Seção

Subtítulo

Texto

Legenda

Botões

Nunca misturar tamanhos aleatoriamente.

Espaçamento

Utilizar escala consistente.

Exemplo:

4

8

12

16

24

32

48

64

Nunca utilizar espaçamentos aleatórios.

Bordas

Cards

16px

Botões

12px

Inputs

12px

Modais

20px

Menus

16px

Sombras

Sombras discretas.

Inspiradas na Apple.

Nunca utilizar sombras pesadas.

Componentes Reutilizáveis

Criar biblioteca própria.

Todos reutilizáveis.

Exemplos:

AppButton

AppInput

AppTextarea

AppSelect

AppCheckbox

AppSwitch

AppDatePicker

AppTimePicker

AppMoneyInput

AppPhoneInput

AppCpfInput

AppModal

AppDrawer

AppDialog

AppCard

AppStatCard

AppTable

AppAvatar

AppBadge

AppTabs

AppAccordion

AppLoading

AppSkeleton

AppSearch

AppPagination

AppHeader

AppSidebar

AppBreadcrumb

AppTooltip

AppToast

AppCalendar

AppConfirmDialog

AppEmptyState

AppTimeline

AppChart

AppLogo

Todos devem seguir o mesmo padrão visual.

Botões

Criar variantes:

Primário

Secundário

Outline

Ghost

Sucesso

Perigo

Link

Todos com estados:

Hover

Pressed

Focus

Loading

Disabled

Inputs

Todos os campos devem possuir:

Label

Placeholder

Mensagem de erro

Validação

Ícone opcional

Máscara quando necessário

Descrição auxiliar (quando aplicável)

Formulários

Utilizar:

React Hook Form

Zod

Validação em tempo real.

Mostrar erros imediatamente.

Tabelas

Todas as tabelas devem possuir:

Pesquisa

Ordenação

Paginação

Filtros

Seleção de colunas

Quantidade de registros por página

Estado vazio

Loading

Responsividade

Preparação para exportação

Cards

Todos os cards devem apresentar:

Título

Valor principal

Ícone

Informação complementar

Tooltip

Clique opcional

Animação discreta

Dashboard

Organizar os cards em um grid responsivo.

No desktop:

4 colunas

No tablet:

2 colunas

No celular:

1 coluna

Sidebar

Colapsável.

Desktop:

Menu lateral fixo.

Celular:

Menu deslizante.

Exibir:

Logo

Nome do sistema

Menus

Perfil

Logout

Header

Mostrar:

Título da página

Busca global

Notificações

Tema

Perfil do usuário

Calendário

Criar um calendário moderno.

Cada dia deve possuir indicadores visuais.

Legenda:

Livre

Reservado

Pago

Cancelado

Bloqueado

Lista de espera

Ao passar o mouse:

Mostrar resumo.

Ao clicar:

Abrir detalhes.

Timeline

Criar componente de linha do tempo.

Utilizar:

Ícones

Datas

Hora

Descrição

Administrador responsável

Modais

Todos os modais devem possuir:

Título

Descrição

Botão Cancelar

Botão Confirmar

Animação

Fechamento por ESC

Fechamento ao clicar fora (configurável)

Drawers

No celular, utilizar Drawer sempre que melhorar a experiência do usuário.

Tooltips

Todos os ícones importantes devem possuir tooltip.

Badges

Cliente

Confiável

Atenção

Não alugar novamente

Pagamento

Pendente

Parcial

Pago

Reserva

Reservada

Finalizada

Cancelada

Todos com cores consistentes.

Loading

Criar:

Skeleton

Spinner

Barra de progresso

Nunca deixar tela em branco.

Estados Vazios

Criar ilustrações elegantes para:

Nenhum cliente

Nenhuma reserva

Nenhuma despesa

Nenhum resultado

Nenhuma notificação

Sempre mostrar botão de ação.

Notificações

Utilizar React Hot Toast.

Posição:

Superior direita.

Criar:

Sucesso

Erro

Informação

Aviso

Pesquisa Global

Disponível no Header.

Resultados instantâneos.

Agrupar resultados por categoria.

Animações

Utilizar Framer Motion.

Animações discretas.

Nunca exagerar.

Exemplos:

Entrada de páginas

Cards

Modais

Sidebar

Calendário

Listas

Tema

Criar:

Modo Claro

Modo Escuro

Modo Sistema

Salvar automaticamente.

Acessibilidade

Garantir:

Contraste adequado

Navegação por teclado

ARIA Labels

Focus Ring

Leitores de tela

Responsividade

Desktop

Notebook

Tablet

Celular

Nenhuma funcionalidade poderá desaparecer em telas menores.

Apenas adaptar o layout.

PWA

Criar:

Tela de instalação

Splash Screen

Ícones

Manifest

Tema

Atalho na tela inicial

UX

Cada ação importante deve exigir poucos cliques.

Fluxos longos devem ser evitados.

Priorizar:

Rapidez

Simplicidade

Feedback constante

Performance Visual

Evitar:

Layout Shift

Piscar elementos

Recarregamentos desnecessários

Sempre manter transições suaves.

Página de Login

Criar uma tela elegante com:

Logo da Área de Lazer Biel

Título

Campo de e-mail

Campo de senha

Botão Entrar

Botão Esqueci minha senha

Indicador de carregamento

Mensagens claras de erro

Visual moderno inspirado em aplicações SaaS.

Página de Configuração Inicial

Caso não exista administrador:

Mostrar um assistente de configuração (wizard).

Etapas:

 Bem-vindo

 Dados do primeiro administrador

 Configuração inicial da área de lazer

 Confirmação

Após concluir:

Nunca mais exibir esta tela.

Página 404

Criar uma página personalizada.

Mensagem amigável.

Botão para voltar ao Dashboard.

Página de Erro

Criar Error Boundary.

Caso ocorra erro inesperado:

Mostrar mensagem clara.

Permitir recarregar.

Nunca mostrar erros técnicos ao usuário.

Qualidade Final

O sistema deve transmitir a sensação de um software premium.

O usuário deve conseguir aprender a utilizá-lo em poucos minutos.

Todo o design deve ser consistente do início ao fim.

Instrução Final ao Lovable

Todos os componentes devem ser reutilizáveis, acessíveis, responsivos e seguir rigorosamente o Design System definido nesta especificação.

A experiência do usuário deve ser prioridade, sem sacrificar desempenho ou organização do código.

⭐ Melhorias Extras (Nível Profissional)

Além do solicitado, implemente também:

Atalhos de teclado

Exemplos:

Ctrl + K → Busca global.

Ctrl + N → Nova reserva.

Ctrl + Shift + C → Novo cliente.

Esc → Fechar modais.

Dashboard personalizável

Permitir que cada administrador escolha quais cards deseja visualizar e em que ordem eles aparecem.

Centro de Ajuda

Adicionar uma área simples com:

 Perguntas frequentes.

 Dicas rápidas de uso.

 Atalhos do sistema.

Tour guiado

Na primeira utilização de cada administrador, apresentar um pequeno tour explicando as principais áreas do sistema, com opção de pular ou rever posteriormente.

PARTE 5 — PRODUÇÃO, DEPLOY, QUALIDADE, DOCUMENTAÇÃO E MANUTENÇÃO

Objetivo

O sistema Área de Lazer Biel deve ser entregue como um projeto profissional pronto para produção.

Não deve ser apenas uma demonstração visual.

O resultado final precisa:

 compilar sem erros;

 funcionar em produção;

 ser seguro;

 possuir documentação;

 permitir manutenção futura;

 estar preparado para crescimento.

1. AMBIENTE DE DESENVOLVIMENTO

Utilizar:

 Node.js versão LTS

 npm ou pnpm

 TypeScript

 Vite

Criar scripts:

{
  "dev": "iniciar desenvolvimento",
  "build": "gerar produção",
  "preview": "visualizar produção",
  "lint": "verificar código",
  "format": "formatar código"
}

2. CONFIGURAÇÃO DO PROJETO

Criar:

.env.example

.gitignore

README.md

 configuração do ESLint

 configuração do Prettier

Nunca deixar informações sensíveis no código.

3. VARIÁVEIS DE AMBIENTE

Todas as configurações externas devem utilizar variáveis.

Criar:

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=

VITE_FIREBASE_STORAGE_BUCKET=

VITE_FIREBASE_MESSAGING_SENDER_ID=

VITE_FIREBASE_APP_ID=

VITE_FIREBASE_MEASUREMENT_ID=

4. FIREBASE

O projeto deve ser preparado para utilizar:

Firebase Authentication

Cloud Firestore

Firebase Storage

Criar arquivos:

firebase/

├── config.ts
├── auth.ts
├── firestore.ts
├── storage.ts
└── types.ts

5. FIRESTORE RULES

Criar arquivo:

firestore.rules

As regras devem:

 bloquear usuários não autenticados;

 validar permissões;

 proteger documentos;

 impedir alterações indevidas.

Nunca utilizar:

allow read, write: if true;

6. FIRESTORE INDEXES

Criar:

firestore.indexes.json

Com todos os índices necessários.

O projeto deve funcionar sem erros de consulta.

7. DEPLOY NA VERCEL

O projeto deve ser totalmente compatível com:

Vercel

Configurar:

Build Command:

npm run build

Output:

dist

Adicionar variáveis de ambiente no painel da Vercel.

8. CONFIGURAÇÃO DE ROTAS

Como será utilizado React Router:

Criar configuração para SPA.

A Vercel deve redirecionar corretamente:

/* → index.html

Nenhuma rota deve retornar erro 404 ao atualizar a página.

9. PWA

Configurar:

 Manifest

 Service Worker

 Ícones

 Splash Screen

 Nome do aplicativo

Nome:

Área de Lazer Biel

Permitir instalação:

Android

iOS

Desktop

10. CACHE

Implementar cache inteligente.

Utilizar:

TanStack Query.

Configurar:

 stale time;

 refetch automático;

 invalidação de cache;

 atualização após mutações.

11. PERFORMANCE

O sistema deve ser otimizado.

Implementar:

Lazy Loading das páginas.

Carregamento sob demanda.

Compressão de assets.

Imagens otimizadas.

Evitar renderizações desnecessárias.

12. MONITORAMENTO DE ERROS

Preparar arquitetura para integração futura com:

 Firebase Crashlytics

 Sentry

Criar tratamento global:

Error Boundary.

13. TESTES

Preparar estrutura para testes.

Utilizar futuramente:

 Vitest

 React Testing Library

Criar testes principais para:

Login

Cadastro de cliente

Criação de reserva

Alteração de pagamento

Controle de permissões

14. QUALIDADE DO CÓDIGO

Antes da entrega final:

Executar:

 TypeScript Check

 ESLint

 Build de produção

Corrigir:

 erros;

 warnings;

 imports não utilizados;

 problemas de tipagem.

15. PADRÃO DE COMMITS

Preparar para Git.

Utilizar padrão:

feat:
nova funcionalidade

fix:
correção

refactor:
melhoria interna

docs:
documentação

style:
alteração visual

16. README COMPLETO

Criar documentação contendo:

Sobre o projeto

Descrição da Área de Lazer Biel.

Tecnologias

Lista completa.

Instalação

Passo a passo.

Firebase

Como configurar:

Authentication

Firestore

Storage

Rules

Indexes

Desenvolvimento

Como executar localmente.

Deploy

Como publicar na Vercel.

Estrutura

Explicação das pastas.

Manutenção

Como adicionar funcionalidades.

17. BACKUP

Criar estrutura preparada para backup.

Permitir futuramente:

Exportação completa:

Clientes

Reservas

Financeiro

Logs

Configurações

18. EXPORTAÇÃO DE DADOS

Preparar funções para:

CSV

JSON

PDF

Excel

19. SEGURANÇA ADICIONAL

Implementar:

Proteção contra ações acidentais.

Confirmação antes de:

Excluir

Cancelar reserva

Restaurar

Alterar administrador

20. AUDITORIA

Toda ação importante deve gerar log.

Exemplos:

Administrador entrou.

Cliente criado.

Reserva alterada.

Pagamento atualizado.

Configuração modificada.

21. CONTROLE DE VERSÃO

Criar:

Arquivo:

version.json

Exemplo:

{
 "version":"1.0.0",
 "releaseDate":"2026"
}

Mostrar versão no rodapé.

22. ATUALIZAÇÕES FUTURAS

A arquitetura deve permitir adicionar:

 aplicativo mobile;

 múltiplas áreas de lazer;

 pagamentos online;

 assinatura digital;

 integração WhatsApp;

 relatórios avançados.

Sem necessidade de reescrever o sistema.

23. CHECKLIST DE ENTREGA

Antes de considerar o projeto finalizado:

Código

☑ Sem erros TypeScript
☑ Sem erros ESLint
☑ Build funcionando
☑ Código organizado

Firebase

☑ Authentication funcionando
☑ Firestore conectado
☑ Rules configuradas
☑ Indexes criados
☑ Storage preparado

Sistema

☑ Login funcionando
☑ Administradores funcionando
☑ Clientes funcionando
☑ Reservas funcionando
☑ Financeiro funcionando
☑ Dashboard funcionando
☑ Responsivo

Deploy

☑ Projeto publicado na Vercel
☑ Variáveis configuradas
☑ Rotas funcionando

24. INSTRUÇÃO FINAL AO LOVABLE

Entregue o projeto como uma aplicação profissional pronta para uso real.

Não entregue:

 protótipo;

 telas estáticas;

 dados falsos;

 funções simuladas.

Todas as funcionalidades devem estar conectadas ao Firebase e funcionando.

Priorize:

 segurança;

 estabilidade;

 organização;

 desempenho;

 facilidade de manutenção.

⭐ Melhorias adicionadas nesta parte

Além do planejamento inicial, foram incluídos:

 Controle de versão do sistema.

 Preparação para monitoramento de erros.

 Estrutura de testes.

 CI/CD preparado.

 Backup futuro.

 Documentação profissional.

 Regras de qualidade antes da entrega.

PARTE 6 — RECURSOS PREMIUM, ESCALABILIDADE, FUTURO DO SISTEMA E INSTRUÇÕES FINAIS

Objetivo

Transformar o sistema Área de Lazer Biel em uma plataforma profissional de gerenciamento de espaços de lazer.

Mesmo sendo inicialmente para uso particular, o sistema deve ser desenvolvido com arquitetura de produto comercial, permitindo crescimento futuro sem necessidade de reconstrução.

1. VISÃO DE LONGO PRAZO

O sistema deve ser construído pensando em:

 uma única área de lazer inicialmente;

 possibilidade de administrar várias áreas futuramente;

 múltiplos administradores;

 grande quantidade de clientes;

 histórico de vários anos;

 relatórios avançados.

A arquitetura deve permitir expansão.

2. PREPARAÇÃO PARA MULTIÁREAS

Mesmo utilizando inicialmente apenas:

Área de Lazer Biel

Criar a arquitetura preparada para futuramente possuir:

areas_lazer

Cada área poderá possuir:

 Nome

 Fotos

 Endereço

 Configurações

 Valores

 Horários

 Reservas

 Administradores responsáveis

Não implementar agora.

Apenas deixar preparado.

3. SISTEMA DE PERMISSÕES FUTURO

Preparar estrutura para diferentes níveis de acesso:

Administrador Master

Acesso total.

Pode:

 criar usuários;

 alterar configurações;

 visualizar financeiro;

 acessar logs.

Administrador

Pode:

 cadastrar clientes;

 criar reservas;

 atualizar pagamentos.

Funcionário

Pode futuramente:

 visualizar agenda;

 realizar checklist;

 atualizar status da reserva.

4. INTELIGÊNCIA DO SISTEMA

Adicionar recursos inteligentes.

Sugestões automáticas

Exemplo:

Ao cadastrar uma reserva:

"Este cliente já alugou 5 vezes."

"Este cliente possui histórico positivo."

"Este cliente possui observações importantes."

Alertas inteligentes

Exemplos:

"Cliente possui pagamento pendente."

"Cliente possui histórico de problemas."

"Reserva próxima sem contrato gerado."

5. RELATÓRIOS AVANÇADOS

Preparar estrutura para relatórios.

Relatórios:

Clientes

 Clientes novos por período.

 Clientes recorrentes.

 Clientes bloqueados.

 Clientes VIP.

Reservas

 Quantidade por mês.

 Dias mais utilizados.

 Cancelamentos.

 Ocupação.

Financeiro

 Receita mensal.

 Receita anual.

 Despesas.

 Lucro.

 Comparativos.

6. SISTEMA DE CLIENTE VIP

Criar estrutura de tags.

Exemplos:

VIP

Família

Empresa

Indicação

Cliente antigo

Permitir criar tags personalizadas.

7. PROGRAMA DE FIDELIDADE (FUTURO)

Preparar para:

 quantidade de reservas;

 descontos;

 benefícios;

 clientes especiais.

Não implementar inicialmente.

8. INTEGRAÇÃO WHATSAPP FUTURA

Preparar arquitetura para:

 WhatsApp Business API;

 mensagens automáticas;

 lembretes;

 confirmações.

Possíveis mensagens:

"Olá João, sua reserva é amanhã às 8h."

"Obrigado por utilizar a Área de Lazer Biel."

9. PAGAMENTOS FUTUROS

Preparar para integração:

 PIX;

 cartão;

 links de pagamento.

Possíveis recursos:

 Registrar comprovante.

 Confirmar pagamento automático.

 Histórico financeiro.

10. ASSINATURA DIGITAL

Preparar contratos para:

 assinatura desenhada;

 assinatura via link;

 armazenamento seguro.

11. DOCUMENTOS E ARQUIVOS

Preparar Firebase Storage para armazenar:

 contratos;

 comprovantes;

 fotos;

 documentos.

12. APLICATIVO FUTURO

A arquitetura deve permitir transformar o sistema em:

Aplicativo Android

Aplicativo iOS

Utilizando:

React Native ou Expo

Compartilhando lógica e serviços.

13. INTELIGÊNCIA ARTIFICIAL FUTURA

Preparar dados para possíveis recursos:

 previsão de demanda;

 sugestão de preços;

 análise de clientes;

 relatórios automáticos.

14. SEGURANÇA AVANÇADA

Preparar:

 autenticação reforçada;

 histórico de dispositivos;

 controle de sessões;

 permissões detalhadas.

15. PRIVACIDADE DOS DADOS

O sistema deve tratar dados pessoais com responsabilidade.

Especialmente:

 CPF;

 telefone;

 histórico de clientes.

Implementar:

 acesso restrito;

 exclusão lógica;

 rastreamento de alterações.

16. EXPERIÊNCIA MOBILE

No celular:

Priorizar ações rápidas.

Exemplo:

Abrir aplicativo.

Ver próximas reservas.

Criar reserva.

Abrir WhatsApp.

Confirmar pagamento.

17. COMANDOS RÁPIDOS

Implementar atalhos:

Ctrl + K

Busca global.

Ctrl + N

Nova reserva.

Ctrl + Shift + C

Novo cliente.

ESC

Fechar janelas.

18. PRIMEIRO ACESSO

Criar onboarding.

Quando um administrador entrar pela primeira vez:

Mostrar:

 visão geral;

 onde ficam clientes;

 como criar reservas;

 como acompanhar financeiro.

Permitir:

Pular

Rever depois

19. CONFIGURAÇÃO INICIAL

Criar assistente inicial.

Passos:

Etapa 1

Bem-vindo.

Etapa 2

Criar administrador.

Etapa 3

Configurar Área de Lazer Biel.

Informações:

Nome

Telefone

WhatsApp

Horários

Valor padrão

Logo

Imagem

Etapa 4

Finalizar.

20. PADRÃO DE ENTREGA FINAL

O Lovable deve entregar:

Código

 Código completo.

 Código organizado.

 TypeScript sem erros.

 Componentes reutilizáveis.

Firebase

 Authentication configurado.

 Firestore conectado.

 Rules criadas.

 Indexes criados.

 Storage preparado.

Documentação

Entregar:

README completo.

Manual básico de utilização.

Documentação técnica.

Deploy

Preparado para:

Vercel.

21. INSTRUÇÃO FINAL DEFINITIVA AO LOVABLE

Copie exatamente:

Você é um engenheiro de software Full Stack sênior especializado em React, TypeScript, Firebase, UX/UI e arquitetura escalável.

Sua missão é desenvolver o sistema completo:

Área de Lazer Biel

Não crie um protótipo.

Não crie telas falsas.

Não utilize dados simulados.

Desenvolva uma aplicação real, funcional e pronta para produção.

Siga rigorosamente todas as especificações das Partes 1, 2, 3, 4, 5 e 6.

Prioridades:

 Segurança dos dados.

 Excelente experiência do usuário.

 Código limpo.

 Arquitetura escalável.

 Alto desempenho.

 Facilidade de manutenção.

Caso exista alguma dúvida de implementação:

Escolha sempre a solução mais profissional, segura e preparada para o futuro.

O resultado final deve parecer um software desenvolvido por uma empresa especializada.

22. CHECKLIST FINAL DE APROVAÇÃO

Antes da entrega:

☑ Sistema funcionando completamente
☑ Firebase conectado
☑ Login funcionando
☑ Primeiro administrador configurável
☑ Clientes funcionando
☑ Reservas funcionando
☑ Calendário funcionando
☑ Financeiro funcionando
☑ Contratos funcionando
☑ Dashboard funcionando
☑ Auditoria funcionando
☑ Responsivo
☑ PWA funcionando
☑ Deploy preparado para Vercel
☑ Sem erros de compilação

FIM DA ESPECIFICAÇÃO

Projeto: Área de Lazer Biel
Versão: 1.0.0
Objetivo: Sistema profissional de gerenciamento de reservas e administração de área de lazer.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/30d42e00-6272-45cd-92e3-34029ea33c56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
