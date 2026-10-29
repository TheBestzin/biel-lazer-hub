import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();
const metaAccessToken = defineSecret("META_WHATSAPP_ACCESS_TOKEN");
const metaPhoneNumberId = defineString("META_WHATSAPP_PHONE_NUMBER_ID");
const metaApiVersion = defineString("META_WHATSAPP_API_VERSION", { default: "v26.0" });
const templateAprovada = defineString("META_WHATSAPP_TEMPLATE_APROVADA", {
  default: "solicitacao_aprovada",
});
const templateRecusada = defineString("META_WHATSAPP_TEMPLATE_RECUSADA", {
  default: "solicitacao_recusada",
});

function telefoneE164Br(telefone) {
  const digits = String(telefone ?? "").replace(/\D/g, "");
  if (!/^[1-9]{2}9?[0-9]{8}$/.test(digits)) {
    throw new HttpsError("failed-precondition", "O telefone da solicitação não é válido.");
  }
  return `55${digits}`;
}

function dataISOValida(data) {
  if (typeof data !== "string" || !/^2\d{3}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split("-").map(Number);
  const dataCalendario = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    dataCalendario.getUTCFullYear() === ano &&
    dataCalendario.getUTCMonth() === mes - 1 &&
    dataCalendario.getUTCDate() === dia
  );
}

function formatarData(iso) {
  const partes = iso.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

async function enviarTemplateWhatsApp(solicitacao, decisao) {
  if (solicitacao.whatsappOptIn !== true) return "nao_autorizado";

  const token = metaAccessToken.value();
  const phoneNumberId = metaPhoneNumberId.value();
  const apiVersion = metaApiVersion.value();
  const templateName = decisao === "aprovada" ? templateAprovada.value() : templateRecusada.value();
  if (
    !token ||
    !/^\d+$/.test(phoneNumberId) ||
    !/^v\d+\.\d+$/.test(apiVersion) ||
    !/^[a-z0-9_]+$/.test(templateName)
  ) {
    console.warn("WhatsApp Cloud API ainda não está configurada para notificação de solicitação.");
    return "nao_configurado";
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: `+${telefoneE164Br(solicitacao.telefone)}`,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: solicitacao.nome },
                { type: "text", text: formatarData(solicitacao.data) },
              ],
            },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    console.error("Meta WhatsApp Cloud API recusou a notificação", {
      status: response.status,
    });
    return "falhou";
  }
  return "aceita";
}

export const decidirSolicitacao = onCall(
  {
    region: "us-central1",
    secrets: [metaAccessToken],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Entre no painel para continuar.");
    }
    if (request.auth.token.admin !== true) {
      throw new HttpsError(
        "permission-denied",
        "Somente administradores podem decidir solicitações.",
      );
    }

    const { id, decisao, enviarWhatsApp = true } = request.data ?? {};
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{10,128}$/.test(id)) {
      throw new HttpsError("invalid-argument", "Solicitação inválida.");
    }
    if (decisao !== "aprovada" && decisao !== "recusada") {
      throw new HttpsError("invalid-argument", "Decisão inválida.");
    }
    if (typeof enviarWhatsApp !== "boolean") {
      throw new HttpsError("invalid-argument", "Opção de envio do WhatsApp inválida.");
    }

    const solicitacaoRef = db.collection("solicitacoes").doc(id);
    const novaReservaRef = db.collection("reservas").doc();
    const novoClienteRef = db.collection("clientes").doc();
    const logRef = db.collection("logs").doc();
    const configuracaoRef = db.collection("configuracoes").doc("geral");

    const { solicitacao, reservaId } = await db.runTransaction(async (tx) => {
      const solicitacaoSnap = await tx.get(solicitacaoRef);
      if (!solicitacaoSnap.exists) {
        throw new HttpsError("not-found", "Solicitação não encontrada.");
      }
      const solicitacao = solicitacaoSnap.data();
      if (solicitacao.status && solicitacao.status !== "pendente") {
        throw new HttpsError("failed-precondition", "Esta solicitação já foi decidida.");
      }

      let reservaId = null;
      if (decisao === "aprovada") {
        const data = solicitacao.data;
        const telefone = String(solicitacao.telefone ?? "").replace(/\D/g, "");
        const nomeSolicitante = String(solicitacao.nome ?? "").trim();
        if (
          !dataISOValida(data) ||
          !/^[1-9]{2}9?[0-9]{8}$/.test(telefone) ||
          nomeSolicitante.length < 3 ||
          nomeSolicitante.length > 120 ||
          !Number.isInteger(solicitacao.convidados) ||
          solicitacao.convidados < 1 ||
          solicitacao.convidados > 200
        ) {
          throw new HttpsError("failed-precondition", "Os dados desta solicitação são inválidos.");
        }

        const dataRef = db.collection("datas_ocupadas").doc(data);
        const reservasDaData = db.collection("reservas").where("data", "==", data);
        const bloqueiosDaData = db.collection("bloqueios").where("data", "==", data);
        const clientesTelefone = db.collection("clientes").where("telefone", "==", telefone);
        const [ocupacaoSnap, reservasSnap, bloqueiosSnap, clientesSnap, configuracaoSnap] =
          await Promise.all([
            tx.get(dataRef),
            tx.get(reservasDaData),
            tx.get(bloqueiosDaData),
            tx.get(clientesTelefone),
            tx.get(configuracaoRef),
          ]);

        const reservaExistente = reservasSnap.docs.some((doc) => {
          const dados = doc.data();
          return !dados.deleted && dados.statusReserva !== "cancelada";
        });
        const bloqueioExistente = bloqueiosSnap.docs.some((doc) => !doc.data().deleted);
        if (ocupacaoSnap.exists || reservaExistente || bloqueioExistente) {
          throw new HttpsError("already-exists", "Esta data já foi reservada ou bloqueada.");
        }

        const clienteExistente = clientesSnap.docs.find((doc) => !doc.data().deleted);
        const cliente = clienteExistente?.data();
        if (cliente?.status === "nao_alugar") {
          throw new HttpsError("failed-precondition", "Este cliente está marcado para não alugar.");
        }

        const config = configuracaoSnap.data() ?? {};
        const clienteId = clienteExistente?.id ?? novoClienteRef.id;
        const nome = String(solicitacao.nome).trim();
        const entrada = typeof config.entradaPadrao === "string" ? config.entradaPadrao : "08:00";
        const saida = typeof config.saidaPadrao === "string" ? config.saidaPadrao : "22:00";
        const valor = Number.isFinite(config.valorPadrao) ? config.valorPadrao : 350;
        const agora = FieldValue.serverTimestamp();

        tx.create(dataRef, { status: "reservada", updatedAt: agora });
        if (clienteExistente) {
          tx.update(clienteExistente.ref, {
            totalReservas: FieldValue.increment(1),
            ultimaReserva: data,
            updatedBy: request.auth.uid,
            updatedAt: agora,
          });
        } else {
          tx.create(novoClienteRef, {
            nome,
            cpf: "",
            telefone,
            status: "confiavel",
            observacoes: "Cadastro feito pelo site.",
            tags: ["Site"],
            favorito: false,
            totalReservas: 1,
            totalGasto: 0,
            ultimaReserva: data,
            deleted: false,
            createdBy: request.auth.uid,
            updatedBy: request.auth.uid,
            createdAt: agora,
            updatedAt: agora,
          });
        }

        tx.create(novaReservaRef, {
          clienteId,
          clienteNome: cliente?.nome ?? nome,
          clienteTelefone: telefone,
          data,
          entrada,
          saida,
          valor,
          valorPago: 0,
          statusPagamento: "pendente",
          statusReserva: "reservada",
          observacoes: String(solicitacao.observacoes ?? "").slice(0, 500),
          checklist: [
            "Piscina limpa",
            "Churrasqueira limpa",
            "Banheiros limpos",
            "Lixo retirado",
            "Objetos esquecidos verificados",
            "Energia desligada",
            "Portão fechado",
          ].map((label, indice) => ({ id: `item-${indice}`, label, concluido: false })),
          deleted: false,
          createdBy: request.auth.uid,
          updatedBy: request.auth.uid,
          createdAt: agora,
          updatedAt: agora,
        });
        reservaId = novaReservaRef.id;
      }

      tx.update(solicitacaoRef, {
        status: decisao,
        ...(reservaId ? { reservaId } : {}),
        decidedAt: FieldValue.serverTimestamp(),
        decidedBy: request.auth.uid,
      });
      tx.create(logRef, {
        usuario: request.auth.uid,
        usuarioNome: String(request.auth.token.name ?? request.auth.token.email ?? "Administrador"),
        acao: decisao === "aprovada" ? "aprovar_solicitacao" : "recusar_solicitacao",
        colecao: "solicitacoes",
        documento: id,
        descricao: `${decisao === "aprovada" ? "Aprovou" : "Recusou"} solicitação de ${solicitacao.nome}`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { solicitacao, reservaId };
    });

    const whatsappStatus = enviarWhatsApp
      ? await enviarTemplateWhatsApp(solicitacao, decisao).catch((erro) => {
          console.error("Falha ao enviar atualização WhatsApp da solicitação", erro);
          return "falhou";
        })
      : "nao_enviado";
    await solicitacaoRef
      .update({ whatsappStatus, whatsappUpdatedAt: FieldValue.serverTimestamp() })
      .catch((erro) => console.error("Não foi possível salvar o resultado do WhatsApp", erro));

    return { status: decisao, reservaId, whatsappStatus };
  },
);
