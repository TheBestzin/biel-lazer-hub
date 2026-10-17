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

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

// Contas de teste recebidas via env.authenticatedContext(id, token).
const usuarioAdmin = () => ({
  uid: "admin-uid",
  email: "admin@area.com",
  token: { admin: true, email: "admin@area.com" },
});

const semAdmin = () => ({ uid: "comum-uid", token: {} });

const projetId = "demo-biel-regras";

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

test.after.always(async () => {
  await env.cleanup();
});

/* ── Visitante anônimo ───────────────────────────────────────── */

test("anônimo não lê reservas, clientes, logs, lixeira ou notificações", async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(db.collection("reservas").doc("x").get());
  await assertFails(db.collection("clientes").doc("x").get());
  await assertFails(db.collection("logs").doc("x").get());
  await assertFails(db.collection("lixeira").doc("x").get());
  await assertFails(db.collection("notificacoes").doc("x").get());
  await assertFails(db.collection("financeiro").doc("x").get());
  await assertFails(db.collection("despesas").doc("x").get());
});

test("anônimo não escreve em reservas/clientes/bloqueios", async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(db.collection("reservas").add({ data: "2026-10-20" }));
  await assertFails(db.collection("clientes").add({ nome: "Fulano" }));
  await assertFails(db.collection("bloqueios").add({ data: "2026-10-20" }));
});

test("anônimo lê datas_ocupadas e configuracoes", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .database()
      .collection("datas_ocupadas")
      .doc("2026-10-20")
      .set({ status: "reservada", updatedAt: "2026-10-01T12:00:00Z" });
  });
  const db = env.unauthenticatedContext().database();
  await assertSucceeds(db.collection("datas_ocupadas").doc("2026-10-20").get());
  await assertSucceeds(db.collection("datas_ocupadas").get());
  await assertSucceeds(db.collection("configuracoes").doc("geral").get());
});

test("anônimo NÃO pode escrever datas_ocupadas", async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(
    db.collection("datas_ocupadas").doc("2026-11-01").set({ status: "bloqueada" }),
  );
});

/* ── Solicitações públicas ──────────────────────────────────── */

const solicitacaoValida = {
  nome: "Maria da Silva Souza",
  telefone: "47991234567",
  data: "2026-12-20",
  convidados: 40,
  observacoes: "Aniversário",
};

test("anônimo cria solicitação válida", async () => {
  const db = env.unauthenticatedContext().database();
  await assertSucceeds(db.collection("solicitacoes").add(solicitacaoValida));
});

test("recusa campos extras, nome curto, telefone inválido e limite de convidados", async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(
    db.collection("solicitacoes").add({ ...solicitacaoValida, cpf: "12345678900" }),
  );
  await assertFails(db.collection("solicitacoes").add({ ...solicitacaoValida, nome: "M" }));
  await assertFails(
    db.collection("solicitacoes").add({ ...solicitacaoValida, telefone: "99999" }),
  );
  await assertFails(
    db.collection("solicitacoes").add({ ...solicitacaoValida, convidados: 201 }),
  );
  await assertFails(
    db.collection("solicitacoes").add({ ...solicitacaoValida, convidados: 0 }),
  );
});

test("recusa solicitação em data já ocupada (choque de datas)", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .database()
      .collection("datas_ocupadas")
      .doc(solicitacaoValida.data)
      .set({ status: "reservada", updatedAt: "2026-10-01T12:00:00Z" });
  });
  const db = env.unauthenticatedContext().database();
  await assertFails(db.collection("solicitacoes").add(solicitacaoValida));
});

test("anônimo não altera nem lista solicitações alheias", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.database().collection("solicitacoes").doc("req1").set(solicitacaoValida);
  });
  const db = env.unauthenticatedContext().database();
  await assertFails(db.collection("solicitacoes").get());
  await assertFails(db.collection("solicitacoes").doc("req1").get());
  await assertFails(
    db.collection("solicitacoes").doc("req1").update({ convidados: 10 }),
  );
});

/* ── Admin com claim ────────────────────────────────────────── */

test("admin (claim) lê e escreve coleções administrativas e cria datas_ocupadas", async () => {
  const db = env.authenticatedContext("admin-uid", usuarioAdmin()).database();
  await assertSucceeds(db.collection("reservas").get());
  await assertSucceeds(
    db.collection("reservas").doc("r1").set({ clienteId: "c1", data: "2026-12-20" }),
  );
  await assertSucceeds(
    db
      .collection("datas_ocupadas")
      .doc("2026-12-20")
      .set({ status: "reservada", updatedAt: "2026-10-17T10:00:00Z" }),
  );
});

test("autenticado SEM claim não lê dados nem escreve reservas", async () => {
  const db = env.authenticatedContext("comum-uid", semAdmin()).database();
  await assertFails(db.collection("reservas").get());
  await assertFails(db.collection("reservas").add({ data: "2026-12-20" }));
  await assertFails(
    db.collection("datas_ocupadas").doc("2026-12-21").set({ status: "bloqueada" }),
  );
});

test("logs: só create do próprio uid; nunca update/delete (nem do admin)", async () => {
  const dbAdmin = env.authenticatedContext("admin-uid", usuarioAdmin()).database();
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
  const dbAnon = env.unauthenticatedContext().database();
  await assertFails(
    dbAnon
      .collection("admins")
      .doc("novo-uid")
      .set({ nome: "Invasor", email: "inv@x.com", cargo: "master" }),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .database()
      .collection("admins")
      .doc("admin-uid")
      .set({ nome: "Admin", email: "admin@area.com", ativo: true });
  });
  // O próprio admin autenticado lê o próprio registro.
  const dbAdmin = env.authenticatedContext("admin-uid", usuarioAdmin()).database();
  await assertSucceeds(dbAdmin.collection("admins").doc("admin-uid").get());
});
