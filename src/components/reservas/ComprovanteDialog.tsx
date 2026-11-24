import { Download, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Reserva } from "@/types";
import { formatarData, formatarMoeda } from "@/utils/formatadores";

interface ComprovanteDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  reserva: Reserva | null;
}

const LARGURA = 1200;
const ALTURA = 760;
const AZUL_ESCURO = "#0b2e59";
const AZUL = "#1565c0";
const VERDE = "#2e9e3e";

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => rejeitar(new Error(`Não foi possível carregar ${src}`));
    imagem.src = src;
  });
}

function desenharCampo(
  ctx: CanvasRenderingContext2D,
  rotulo: string,
  valor: string,
  x: number,
  y: number,
) {
  ctx.fillStyle = AZUL;
  ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(rotulo.toUpperCase(), x, y);
  ctx.fillStyle = AZUL_ESCURO;
  ctx.font = "600 34px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(valor, x, y + 42);
}

function desenharCartao(
  canvas: HTMLCanvasElement,
  banner: HTMLImageElement,
  logo: HTMLImageElement,
  reserva: Reserva,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = LARGURA;
  canvas.height = ALTURA;

  // Fundo branco e faixa superior com a arte da área de lazer.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  const alturaBanner = 230;
  const escala = Math.max(LARGURA / banner.width, alturaBanner / banner.height);
  const larguraBanner = banner.width * escala;
  const alturaImagem = banner.height * escala;
  ctx.drawImage(
    banner,
    (LARGURA - larguraBanner) / 2,
    (alturaBanner - alturaImagem) / 2,
    larguraBanner,
    alturaImagem,
  );
  ctx.fillStyle = "rgba(11, 46, 89, 0.55)";
  ctx.fillRect(0, 0, LARGURA, alturaBanner);

  // Logo sobre a faixa.
  ctx.drawImage(logo, 60, 45, 140, 140);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 44px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Área de Lazer Biel", 230, 115);

  // Selo de confirmação.
  ctx.beginPath();
  ctx.arc(LARGURA / 2, 330, 46, 0, Math.PI * 2);
  ctx.fillStyle = VERDE;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(LARGURA / 2 - 22, 332);
  ctx.lineTo(LARGURA / 2 - 6, 348);
  ctx.lineTo(LARGURA / 2 + 24, 316);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = AZUL_ESCURO;
  ctx.font = "700 46px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Reserva realizada com sucesso!", LARGURA / 2, 425);
  ctx.font = "400 26px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#44546a";
  ctx.fillText("Obrigado pela preferência. Te esperamos!", LARGURA / 2, 470);

  // Detalhes da reserva: primeira linha com o cliente, segunda com data, horário e valor.
  const linhaCliente: [string, string][] = [["Cliente", reserva.clienteNome]];
  const linhaDetalhes: [string, string, number][] = [
    ["Data", formatarData(reserva.data), 160],
    ["Horário", `${reserva.entrada} às ${reserva.saida}`, 600],
    ["Valor", formatarMoeda(reserva.valor), 1040],
  ];
  ctx.textAlign = "left";
  linhaCliente.forEach(([rotulo, valor]) => {
    desenharCampo(ctx, rotulo, valor, LARGURA / 2 - 400, 540);
  });
  linhaDetalhes.forEach(([rotulo, valor, x]) => {
    desenharCampo(ctx, rotulo, valor, x, 650);
  });

  // Rodapé.
  ctx.fillStyle = AZUL_ESCURO;
  ctx.fillRect(0, ALTURA - 56, LARGURA, 56);
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Área de Lazer Biel · Guarde este comprovante", LARGURA / 2, ALTURA - 28);
}

export function ComprovanteDialog({ aberto, aoFechar, reserva }: ComprovanteDialogProps) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto || !reserva) return;
    let cancelado = false;
    setErro(null);
    setImagemUrl(null);
    setBlob(null);
    (async () => {
      try {
        const [banner, logo] = await Promise.all([
          carregarImagem("/images/area-lazer-banner.jpg"),
          carregarImagem("/logo-biel.png"),
        ]);
        const canvas = document.createElement("canvas");
        desenharCartao(canvas, banner, logo, reserva);
        canvas.toBlob((arquivo) => {
          if (cancelado || !arquivo) return;
          setBlob(arquivo);
          setImagemUrl(URL.createObjectURL(arquivo));
        }, "image/png");
      } catch (falha) {
        if (!cancelado) setErro(falha instanceof Error ? falha.message : "Falha ao gerar a imagem.");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [aberto, reserva]);

  useEffect(() => {
    return () => {
      if (imagemUrl) URL.revokeObjectURL(imagemUrl);
    };
  }, [imagemUrl]);

  function baixar() {
    if (!blob || !reserva) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comprovante-${reserva.data}-${reserva.clienteNome.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function enviarWhatsApp() {
    if (!reserva) return;
    const telefone = String(reserva.clienteTelefone ?? "").replace(/\D/g, "");
    const mensagem = `Olá, ${reserva.clienteNome}! Sua reserva na Área de Lazer Biel foi realizada com sucesso para ${formatarData(reserva.data)}, das ${reserva.entrada} às ${reserva.saida}. Obrigado!`;
    window.open(
      `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Comprovante da reserva</DialogTitle>
          <DialogDescription>
            Imagem pronta para baixar ou enviar ao cliente pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>
        {erro ? (
          <p className="text-sm text-destructive">{erro}</p>
        ) : imagemUrl ? (
          <img
            src={imagemUrl}
            alt={`Comprovante da reserva de ${reserva?.clienteNome ?? ""}`}
            className="w-full rounded-xl border"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Gerando comprovante…</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Fechar
          </Button>
          <Button variant="outline" onClick={enviarWhatsApp} disabled={!reserva}>
            <MessageCircle className="size-4" aria-hidden />
            Enviar pelo WhatsApp
          </Button>
          <Button onClick={baixar} disabled={!blob}>
            <Download className="size-4" aria-hidden />
            Baixar imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
