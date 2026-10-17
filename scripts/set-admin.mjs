#!/usr/bin/env node
/**
 * Concede o claim administrativo a um usuário do Firebase Auth.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=/caminho/seguro/conta.json \
 *     node scripts/set-admin.mjs email@dominio.com [--cargo master]
 *
 * A service account DEVE ficar fora do repositório (o repo é público).
 * Baixe em: Firebase Console → Configurações do projeto → Contas de
 * serviço → Gerar nova chave privada.
 *
 * Após rodar, o usuário precisa fazer login novamente para receber o
 * token com o claim. Consultar: node scripts/set-admin.mjs --verificar email@dominio.com
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, "..");

let credenciais;
try {
  credenciais = (await import("firebase-admin")).default;
} catch {
  console.error(
    "Firebase Admin SDK não instalado. Rode: npm install --save-dev firebase-admin",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const verificar = args.includes("--verificar");
const restantes = args.filter((a) => !a.startsWith("--"));
const email = restantes[0];
const indiceCargo = args.indexOf("--cargo");
const cargo = indiceCargo >= 0 ? args[indiceCargo + 1] ?? "master" : "master";

if (!email) {
  console.error(
    "Uso: node scripts/set-admin.mjs email@dominio.com [--cargo master|administrador|funcionario]\n" +
      "      node scripts/set-admin.mjs --verificar email@dominio.com",
  );
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Defina GOOGLE_APPLICATION_CREDENTIALS apontando para a service account JSON (fora do git).",
  );
  process.exit(1);
}

// Garante que a service account não está dentro do repositório.
const caminhoCred = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (caminhoCred.startsWith(raiz)) {
  console.error(
    "A service account está dentro do repositório — mova-a para fora (o repo é público).",
  );
  process.exit(1);
}

const { initializeApp, cert } = credenciais;
const app = initializeApp({ credential: cert(requireJSON(caminhoCred)) });
const auth = app.auth();

function requireJSON(caminho) {
  return JSON.parse(readFileSync(caminho, "utf8"));
}

try {
  const usuario = await auth.getUserByEmail(email);
  if (verificar) {
    console.log(`Claims atuais de ${email}:`, usuario.customClaims ?? {});
    process.exit(0);
  }

  await auth.setCustomUserClaims(usuario.uid, {
    ...usuario.customClaims,
    admin: true,
    cargo,
  });
  console.log(`✔ Claim aplicado: ${email} → admin=${true}, cargo=${cargo}`);
  console.log("O usuário precisa sair e entrar novamente no sistema para receber o claim.");
  process.exit(0);
} catch (erro) {
  console.error("Falhou:", erro?.message ?? erro);
  console.error(
    "Se o erro for user-not-found, crie o usuário no Firebase Authentication (e-mail/senha) antes.",
  );
  process.exit(1);
}
