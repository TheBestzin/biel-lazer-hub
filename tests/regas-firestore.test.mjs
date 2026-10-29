/**
 * Testes das regras do Firestore com o emulador.
 *
 * Rodar com (npm script dedicado, já sobe o emulador):
 *   npm run test:rules
 *
 * Cobertura do critério de pronto da Fase 0:
 *  - visitante anônimo não lê reservas/clientes/logs/lixeira;
 *  - visitante anônimo não escreve em nada além de `solicitacoes`;
 *  - `solicitacoes` só aceita campos/formatos válidos;
 *  - `solicitacoes` é recusada quando a data já está em `datas_ocupadas`;
 *  - admin (claim) lê/escreve tudo administrativo e cria `datas_ocupadas`.
 */
import { readFileSync } from "node:fs";
import test from "node:test";
import { serverTimestamp } from "firebase/firestore";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

// Claims do token de teste. O uid vem do 1º argumento de
// `authenticatedContext(uid, claims)` — nunca dentro do objeto de claims
// (`uid` não é mais aceito pelo mockUserToken).
const usuarioAdmin = () => ({ admin: true, email: "admin@area.com" });

const semAdmin = () => ({ email: "comum@area.com" });

// Mesmo projeto do emulador (firebase.json usa singleProjectMode); o script
// `emulators:exec --project demo-biel` exporta GCLOUD_PROJECT.
const projetId = process.env["GCLOUD_PROJECT"] ?? "demo-biel";

let env;

test.before(async () => {
  env = await initializeTestEnvironment({
    projectId: projetId,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

test.beforeEach(async () => {
  await env.clearFirestore();
});

test.after(async () => {
  await env.cleanup();
});

/* ── Visitante anônimo ───────────────────────────────────────── */

test("anônimo não lê reservas, clientes, logs, lixeira ou notificações", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(db.collection("reservas").doc("x").get());
  await assertFails(db.collection("clientes").doc("x").get());
  await assertFails(db.collection("logs").doc("x").get());
  await assertFails(db.collection("lixeira").doc("x").get());
  await assertFails(db.collection("notificacoes").doc("x").get());
  await assertFails(db.collection("financeiro").doc("x").get());
  await assertFails(db.collection("despesas").doc("x").get());
});

test("anônimo não escreve em reservas/clientes/bloqueios", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(db.collection("reservas").add({ data: "2026-10-20" }));
  await assertFails(db.collection("clientes").add({ nome: "Fulano" }));
  await assertFails(db.collection("bloqueios").add({ data: "2026-10-20" }));
});

test("anônimo lê datas_ocupadas e configuracoes", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .collection("datas_ocupadas")
      .doc("2026-10-20")
      .set({ status: "reservada", updatedAt: "2026-10-01T12:00:00Z" });
  });
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(db.collection("datas_ocupadas").doc("2026-10-20").get());
  await assertSucceeds(db.collection("datas_ocupadas").get());
  await assertSucceeds(db.collection("configuracoes").doc("geral").get());
});

test("anônimo NÃO pode escrever datas_ocupadas", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(db.collection("datas_ocupadas").doc("2026-11-01").set({ status: "bloqueada" }));
});

/* ── Solicitações públicas ──────────────────────────────────── */

const solicitacaoValida = {
  nome: "Maria da Silva Souza",
  telefone: "47991234567",
  data: "2026-12-20",
  convidados: 40,
  observacoes: "Aniversário",
  whatsappOptIn: true,
};

test("anônimo cria solicitação válida com consentimento opcional de WhatsApp", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(db.collection("solicitacoes").add(solicitacaoValida));
  await assertSucceeds(
    db.collection("solicitacoes").add({ ...solicitacaoValida, whatsappOptIn: false }),
  );
  const { whatsappOptIn: _optIn, ...semOptIn } = solicitacaoValida;
  await assertSucceeds(db.collection("solicitacoes").add(semOptIn));
});

test("recusa campos extras, nome curto, telefone inválido e limite de convidados", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(
    db.collection("solicitacoes").add({ ...solicitacaoValida, cpf: "12345678900" }),
  );
  await assertFails(
    db.collection("solicitacoes").add({ ...solicitacaoValida, whatsappOptIn: "sim" }),
  );
  await assertFails(db.collection("solicitacoes").add({ ...solicitacaoValida, nome: "M" }));
  await assertFails(db.collection("solicitacoes").add({ ...solicitacaoValida, telefone: "99999" }));
  await assertFails(db.collection("solicitacoes").add({ ...solicitacaoValida, convidados: 201 }));
  await assertFails(db.collection("solicitacoes").add({ ...solicitacaoValida, convidados: 0 }));
});

test("recusa solicitação em data já ocupada (choque de datas)", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .collection("datas_ocupadas")
      .doc(solicitacaoValida.data)
      .set({ status: "reservada", updatedAt: "2026-10-01T12:00:00Z" });
  });
  const db = env.unauthenticatedContext().firestore();
  await assertFails(db.collection("solicitacoes").add(solicitacaoValida));
});

test("admin pode recusar solicitação pendente sem criar reserva", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("solicitacoes").doc("pedido-recusa").set(solicitacaoValida);
  });
  const db = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertSucceeds(
    db.collection("solicitacoes").doc("pedido-recusa").update({
      status: "recusada",
      decidedAt: serverTimestamp(),
      decidedBy: "admin-uid",
    }),
  );
});

test("admin legado com documento ativo pode recusar solicitação sem claim", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("admins").doc("admin-legado").set({ ativo: true });
    await ctx.firestore().collection("solicitacoes").doc("pedido-legado").set(solicitacaoValida);
  });
  const db = env.authenticatedContext("admin-legado", semAdmin()).firestore();
  await assertSucceeds(db.collection("solicitacoes").doc("pedido-legado").get());
  await assertSucceeds(
    db.collection("solicitacoes").doc("pedido-legado").update({
      status: "recusada",
      decidedAt: serverTimestamp(),
      decidedBy: "admin-legado",
    }),
  );
});

test("admin só aprova solicitação em transação com reserva, cliente e data ocupada", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("solicitacoes").doc("pedido-aprova").set(solicitacaoValida);
  });
  const db = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  const pedido = db.collection("solicitacoes").doc("pedido-aprova");
  const cliente = db.collection("clientes").doc("cliente-1");
  const reserva = db.collection("reservas").doc("reserva-1");
  const ocupacao = db.collection("datas_ocupadas").doc(solicitacaoValida.data);
  const agora = serverTimestamp();
  const batch = db.batch();
  batch.set(cliente, {
    nome: solicitacaoValida.nome,
    cpf: "",
    telefone: solicitacaoValida.telefone,
    status: "confiavel",
    observacoes: "Cadastro feito pelo site.",
    tags: ["Site"],
    favorito: false,
    totalReservas: 1,
    totalGasto: 0,
    ultimaReserva: solicitacaoValida.data,
    deleted: false,
    createdBy: "admin-uid",
    updatedBy: "admin-uid",
    createdAt: agora,
    updatedAt: agora,
  });
  batch.set(reserva, {
    solicitacaoId: pedido.id,
    clienteId: cliente.id,
    clienteNome: solicitacaoValida.nome,
    clienteTelefone: solicitacaoValida.telefone,
    data: solicitacaoValida.data,
    entrada: "08:00",
    saida: "22:00",
    valor: 350,
    valorPago: 0,
    statusPagamento: "pendente",
    statusReserva: "reservada",
    observacoes: solicitacaoValida.observacoes,
    checklist: [],
    deleted: false,
    createdBy: "admin-uid",
    updatedBy: "admin-uid",
    createdAt: agora,
    updatedAt: agora,
  });
  batch.set(ocupacao, {
    status: "reservada",
    solicitacaoId: pedido.id,
    reservaId: reserva.id,
    updatedAt: agora,
  });
  batch.update(pedido, {
    status: "aprovada",
    reservaId: reserva.id,
    decidedAt: agora,
    decidedBy: "admin-uid",
  });
  await assertSucceeds(batch.commit());
});

test("admin não aprova sem reserva e data ocupada correspondentes", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .collection("solicitacoes")
      .doc("pedido-sem-reserva")
      .set(solicitacaoValida);
  });
  const db = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertFails(
    db.collection("solicitacoes").doc("pedido-sem-reserva").update({
      status: "aprovada",
      reservaId: "reserva-inexistente",
      decidedAt: serverTimestamp(),
      decidedBy: "admin-uid",
    }),
  );
});

test("somente admin lê solicitações e não pode editar nem apagar pedidos", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("solicitacoes").doc("req1").set(solicitacaoValida);
  });
  const dbAnon = env.unauthenticatedContext().firestore();
  const dbAdmin = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertSucceeds(dbAdmin.collection("solicitacoes").doc("req1").get());
  await assertFails(
    dbAdmin.collection("solicitacoes").doc("req1").update({
      status: "aprovada",
      reservaId: "reserva-inexistente",
      decidedAt: serverTimestamp(),
      decidedBy: "admin-uid",
    }),
  );
  await assertFails(dbAdmin.collection("solicitacoes").doc("req1").delete());
  await assertFails(dbAnon.collection("solicitacoes").get());
  await assertFails(dbAnon.collection("solicitacoes").doc("req1").get());
  await assertFails(dbAnon.collection("solicitacoes").doc("req1").update({ convidados: 10 }));
});

/* ── Admin com claim ────────────────────────────────────────── */

test("admin (claim) lê e escreve coleções administrativas e cria datas_ocupadas", async () => {
  const db = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertSucceeds(db.collection("reservas").get());
  await assertSucceeds(
    db.collection("reservas").doc("r1").set({ clienteId: "c1", data: "2026-12-20" }),
  );
  await assertSucceeds(
    db
      .collection("datas_ocupadas")
      .doc("2026-12-20")
      .set({ status: "bloqueada", updatedAt: serverTimestamp() }),
  );
});

test("autenticado SEM claim não lê dados nem escreve reservas", async () => {
  const db = env.authenticatedContext("comum-uid", semAdmin()).firestore();
  await assertFails(db.collection("reservas").get());
  await assertFails(db.collection("reservas").add({ data: "2026-12-20" }));
  await assertFails(db.collection("datas_ocupadas").doc("2026-12-21").set({ status: "bloqueada" }));
});

test("logs: só create do próprio uid; nunca update/delete (nem do admin)", async () => {
  const dbAdmin = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertSucceeds(
    dbAdmin.collection("logs").add({
      usuario: "admin-uid",
      usuarioNome: "Admin",
      acao: "login",
      colecao: "admins",
      documento: "admin-uid",
      descricao: "Entrou no sistema",
    }),
  );
  await assertFails(
    dbAdmin.collection("logs").add({
      usuario: "outro-uid", // log em nome de outra pessoa: recusado
      usuarioNome: "Sua",
      acao: "login",
      colecao: "admins",
      documento: "outro-uid",
      descricao: "Tentativa indevida",
    }),
  );
  await assertFails(dbAdmin.collection("logs").doc("log1").update({ descricao: "editado" }));
  await assertFails(dbAdmin.collection("logs").doc("log1").delete());
});

test("admins: qualquer um lê o próprio doc; criar-account público é bloqueado", async () => {
  const dbAnon = env.unauthenticatedContext().firestore();
  await assertFails(
    dbAnon
      .collection("admins")
      .doc("novo-uid")
      .set({ nome: "Invasor", email: "inv@x.com", cargo: "master" }),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .collection("admins")
      .doc("admin-uid")
      .set({ nome: "Admin", email: "admin@area.com", ativo: true });
  });
  // O próprio admin autenticado lê o próprio registro.
  const dbAdmin = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertSucceeds(dbAdmin.collection("admins").doc("admin-uid").get());
});
