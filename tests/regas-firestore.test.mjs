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

test("somente admin lê solicitações e alterações são exclusivas da Cloud Function", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("solicitacoes").doc("req1").set(solicitacaoValida);
  });
  const dbAnon = env.unauthenticatedContext().firestore();
  const dbAdmin = env.authenticatedContext("admin-uid", usuarioAdmin()).firestore();
  await assertSucceeds(dbAdmin.collection("solicitacoes").doc("req1").get());
  await assertFails(dbAdmin.collection("solicitacoes").doc("req1").update({ status: "aprovada" }));
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
      .set({ status: "reservada", updatedAt: "2026-10-17T10:00:00Z" }),
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
