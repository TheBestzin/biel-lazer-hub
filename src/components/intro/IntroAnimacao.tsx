import { useEffect, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Abertura cinematográfica do Área de Lazer Biel.
 *
 * Emblema vetorial (squircle azul) com vinheta de piscina ao entardecer:
 * aro que se desenha, sol nascendo com listras, palmeira desabrochando,
 * espreguiçadeiras e tochas acendendo, água cintilando e faixa ondulada
 * na borda — ~6s, sempre com ease-out-expo/spring, nunca linear.
 * Sem texto, sem letras: só a cena.
 */

const DIA = "M40,430 C 112,392 184,452 258,424 C 332,398 386,456 472,416";

const FRONDES = [
  "M122,166 C 100,140 74,124 56,104",
  "M122,166 C 102,150 74,148 54,160",
  "M122,166 C 118,132 118,110 126,88",
  "M122,166 C 146,140 174,128 198,120",
  "M122,166 C 146,152 176,150 200,158",
  "M122,166 C 108,192 92,206 78,216",
];

const LISTRAS = [
  { y: 246, h: 13 },
  { y: 263, h: 15 },
  { y: 282, h: 16 },
  { y: 302, h: 16 },
];

const ATRASOS = {
  listras: [1.15, 1.32, 1.49, 1.66],
  frondes: [1.5, 1.64, 1.78, 1.92, 2.06, 2.2],
};

const CAUSTICAS = [
  {
    d: "M64,346 Q88,338 112,346 T160,346 T208,346 T256,346 T304,346 T352,346 T400,346 T448,346",
    opacidade: 0.4,
  },
  {
    d: "M64,378 Q92,370 120,378 T176,378 T232,378 T288,378 T344,378 T400,378 T452,378",
    opacidade: 0.32,
  },
  {
    d: "M64,412 Q92,402 120,412 T176,412 T232,412 T288,412 T344,412 T400,412 T452,412",
    opacidade: 0.24,
  },
];

const ESTRELAS = [
  { x: 96, y: 88, atraso: 0.2 },
  { x: 128, y: 64, atraso: 0.8 },
  { x: 416, y: 84, atraso: 0.5 },
  { x: 396, y: 120, atraso: 1.4 },
  { x: 352, y: 60, atraso: 1.9 },
  { x: 88, y: 128, atraso: 2.4 },
];

const BRILHOS = [
  { x: 58, y: 104, atraso: 2.95 },
  { x: 348, y: 128, atraso: 3.35 },
  { x: 432, y: 262, atraso: 3.75 },
  { x: 140, y: 376, atraso: 4.15 },
  { x: 406, y: 416, atraso: 4.55 },
];

/** Colunas de reflexo dourado: tocha esquerda, sol central e tocha direita. */
const REFLEXOS: { cor: string; x: number; larguras: number[] }[] = [
  { cor: "#FFD27A", x: 64, larguras: [18, 14, 20, 12, 16] },
  { cor: "#FFC14D", x: 256, larguras: [30, 24, 18, 12, 8] },
  { cor: "#FFD27A", x: 436, larguras: [18, 14, 20, 12, 16] },
];

const LINHAS_DECK = [216, 268, 320, 372, 424];

const estiloAtraso = (segundos: number) => ({ "--ia-d": `${segundos}s` }) as CSSProperties;

export function IntroAnimacao({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="Abertura animada da Área de Lazer Biel"
      className={cn("ia", className)}
    >
      <defs>
        <linearGradient id="ia-aro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A8CFF" />
          <stop offset="0.55" stopColor="#00B8FF" />
          <stop offset="1" stopColor="#00C6FF" />
        </linearGradient>
        <linearGradient id="ia-fundo-brilho" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2AB4FF" />
          <stop offset="0.5" stopColor="#0A8CFF" />
          <stop offset="1" stopColor="#056CD2" />
        </linearGradient>
        <linearGradient id="ia-ceu" gradientUnits="userSpaceOnUse" x1="0" y1="48" x2="0" y2="318">
          <stop offset="0" stopColor="#0D1B34" />
          <stop offset="0.45" stopColor="#17294E" />
          <stop offset="1" stopColor="#2E4868" />
        </linearGradient>
        <radialGradient id="ia-sol" gradientUnits="userSpaceOnUse" cx="256" cy="196" r="96">
          <stop offset="0" stopColor="#FFD27A" />
          <stop offset="0.5" stopColor="#FFA233" />
          <stop offset="0.82" stopColor="#FF7C12" />
          <stop offset="1" stopColor="#F4680C" />
        </radialGradient>
        <radialGradient id="ia-halo-sol">
          <stop offset="0" stopColor="rgba(255,150,40,0.42)" />
          <stop offset="0.55" stopColor="rgba(255,140,60,0.18)" />
          <stop offset="1" stopColor="rgba(255,140,60,0)" />
        </radialGradient>
        <radialGradient id="ia-halo-lanterna">
          <stop offset="0" stopColor="rgba(255,200,90,0.55)" />
          <stop offset="0.45" stopColor="rgba(255,180,60,0.22)" />
          <stop offset="1" stopColor="rgba(255,180,60,0)" />
        </radialGradient>
        <linearGradient id="ia-agua" gradientUnits="userSpaceOnUse" x1="0" y1="318" x2="0" y2="464">
          <stop offset="0" stopColor="#35B7E8" />
          <stop offset="0.4" stopColor="#1580C0" />
          <stop offset="1" stopColor="#0A4473" />
        </linearGradient>
        <linearGradient id="ia-onda" gradientUnits="userSpaceOnUse" x1="0" y1="390" x2="0" y2="470">
          <stop offset="0" stopColor="#12A9FF" />
          <stop offset="1" stopColor="#0779D8" />
        </linearGradient>
        <linearGradient id="ia-luz-ondulada" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="ia-recorte">
          <rect x="48" y="48" width="416" height="416" rx="102" />
        </clipPath>
        <clipPath id="ia-recorte-emblema">
          <rect x="16" y="16" width="480" height="480" rx="134" />
        </clipPath>
        <clipPath id="ia-recorte-sol">
          <circle cx="256" cy="196" r="96" />
        </clipPath>
      </defs>

      <g className="ia-emblema">
        {/* Moldura: traço que se desenha + varredura de luz + preenchimento brilhante */}
        <rect
          className="ia-aro-traco"
          x="32"
          y="32"
          width="448"
          height="448"
          rx="118"
          fill="none"
          stroke="url(#ia-aro)"
          strokeWidth="32"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
        />
        <rect
          className="ia-aro-luz"
          x="32"
          y="32"
          width="448"
          height="448"
          rx="118"
          fill="none"
          stroke="#CDEFFF"
          strokeWidth="14"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="0.09 0.91"
        />
        <rect
          className="ia-preenchido"
          x="48"
          y="48"
          width="416"
          height="416"
          rx="102"
          fill="url(#ia-fundo-brilho)"
        />
        <rect
          className="ia-contorno-interno"
          x="48"
          y="48"
          width="416"
          height="416"
          rx="102"
          fill="none"
          stroke="#052A47"
          strokeWidth="6"
        />

        {/* Cena dentro do emblema, com leve impulso de paralaxe */}
        <g clipPath="url(#ia-recorte)" className="ia-cena">
          <g className="ia-cena-fundo">
            <rect x="48" y="48" width="416" height="270" fill="url(#ia-ceu)" />
            <ellipse cx="256" cy="300" rx="190" ry="110" fill="url(#ia-halo-sol)" opacity="0.9" />

            {ESTRELAS.map((e, i) => (
              <circle
                key={i}
                className="ia-estrela"
                style={estiloAtraso(e.atraso)}
                cx={e.x}
                cy={e.y}
                r="1.7"
                fill="#E8F4FF"
              />
            ))}

            {/* Sol: ergue do horizonte; halo respira; listras deslizam uma a uma */}
            <g className="ia-sol">
              <circle className="ia-sol-halo" cx="256" cy="196" r="172" fill="url(#ia-halo-sol)" />
              <circle cx="256" cy="196" r="96" fill="url(#ia-sol)" />
              <g clipPath="url(#ia-recorte-sol)">
                {LISTRAS.map((l, i) => (
                  <rect
                    key={i}
                    className="ia-listra"
                    style={estiloAtraso(ATRASOS.listras[i] ?? 1.2)}
                    x="166"
                    y={l.y}
                    width="180"
                    height={l.h}
                    fill="url(#ia-ceu)"
                  />
                ))}
              </g>
            </g>

            {/* Deck de madeira */}
            <rect x="48" y="292" width="416" height="26" fill="#262B33" />
            <rect x="48" y="292" width="416" height="3" fill="#4D5866" />
            {LINHAS_DECK.map((x, i) => (
              <rect key={i} x={x} y="296" width="2" height="20" fill="#191E26" opacity="0.6" />
            ))}
            <rect x="48" y="318" width="416" height="146" fill="url(#ia-agua)" />

            {/* Montinho de grama à esquerda */}
            <path d="M48,322 C 84,294 142,296 172,314 Q 148,318 48,322 Z" fill="#1E6B33" />

            {/* Palmeira: tronco fletido e frondas desabrochando */}
            <path
              className="ia-tronco"
              d="M108,314 C 114,266 98,222 120,166"
              fill="none"
              stroke="#6E5645"
              strokeWidth="13"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
            />
            <g className="ia-frondes">
              {FRONDES.map((d, i) => (
                <path
                  key={`f-${i}`}
                  className="ia-fronde"
                  style={estiloAtraso(ATRASOS.frondes[i] ?? 1.5)}
                  d={d}
                  fill="none"
                  stroke="#1F7A3A"
                  strokeWidth="10"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                />
              ))}
              {FRONDES.map((d, i) => (
                <path
                  key={`fl-${i}`}
                  className="ia-fronde-luz"
                  style={estiloAtraso(ATRASOS.frondes[i] ?? 1.5)}
                  d={d}
                  fill="none"
                  stroke="#2FA05A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                />
              ))}
              <g className="ia-cocos">
                <circle cx="116" cy="180" r="6.5" fill="#4A3428" />
                <circle cx="133" cy="176" r="6.5" fill="#4A3428" />
              </g>
            </g>
          </g>

          {/* Espreguiçadeiras entram deslizando pelos lados */}
          <g transform="translate(318,292)">
            <g className="ia-vem-esq" style={estiloAtraso(2.0)}>
              <path
                d="M-28,6 H30"
                fill="none"
                stroke="#EDF3F7"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M-28,6 L-44,-14"
                fill="none"
                stroke="#EDF3F7"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M-16,10 V18 M22,10 V18"
                fill="none"
                stroke="#C9CFD6"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          </g>
          <g transform="translate(392,292)">
            <g className="ia-vem-dir" style={estiloAtraso(2.25)}>
              <path
                d="M-28,6 H30"
                fill="none"
                stroke="#EDF3F7"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M-28,6 L-44,-14"
                fill="none"
                stroke="#EDF3F7"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M-16,10 V18 M22,10 V18"
                fill="none"
                stroke="#C9CFD6"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* Tochas acendendo uma por uma */}
          <g>
            <g className="ia-cena-fundo">
              <path
                d="M64,306 V250"
                stroke="#3C414A"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="58" y="242" width="12" height="9" rx="3" fill="#565E6A" />
            </g>
            <circle
              className="ia-lanterna-halo"
              style={estiloAtraso(2.6)}
              cx="64"
              cy="242"
              r="26"
              fill="url(#ia-halo-lanterna)"
            />
            <path
              className="ia-chama"
              style={estiloAtraso(2.6)}
              d="M64,234 C 69,241 69,247 64,250 C 59,247 59,241 64,234 Z"
              fill="#FFB640"
            />
          </g>
          <g>
            <g className="ia-cena-fundo">
              <path
                d="M436,292 V252"
                stroke="#3C414A"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="430" y="244" width="12" height="9" rx="3" fill="#565E6A" />
            </g>
            <circle
              className="ia-lanterna-halo"
              style={estiloAtraso(2.2)}
              cx="436"
              cy="244"
              r="26"
              fill="url(#ia-halo-lanterna)"
            />
            <path
              className="ia-chama"
              style={estiloAtraso(2.2)}
              d="M436,236 C 441,243 441,249 436,252 C 431,249 431,243 436,236 Z"
              fill="#FFB640"
            />
          </g>

          {/* Água: cáusticas ondulando e reflexos dourados dançando */}
          {CAUSTICAS.map((c, i) => (
            <path
              key={i}
              className="ia-caustica"
              d={c.d}
              fill="none"
              stroke="#D9F6FF"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={c.opacidade}
            />
          ))}
          {REFLEXOS.map((r, i) => (
            <g key={i} className="ia-reflexo" style={estiloAtraso(3.05 + i * 0.2)}>
              {r.larguras.map((w, j) => (
                <rect
                  key={j}
                  x={r.x - w / 2}
                  y={336 + j * 22}
                  width={w}
                  height="4"
                  rx="2"
                  fill={r.cor}
                  opacity={0.5 - j * 0.08}
                />
              ))}
            </g>
          ))}

          {/* Faixa ondulada varre do canto inferior esquerdo */}
          <path
            className="ia-onda-escura"
            d={DIA}
            fill="none"
            stroke="#06293F"
            strokeWidth="52"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
          />
          <path
            className="ia-onda-azul"
            d={DIA}
            fill="none"
            stroke="url(#ia-onda)"
            strokeWidth="36"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
          />
          <path
            className="ia-onda-luz"
            d={DIA}
            fill="none"
            stroke="#9EEBFF"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            transform="translate(0,-9)"
          />

          {/* Piscas de luz que pontuam a cena */}
          {BRILHOS.map((b, i) => (
            <g key={i} transform={`translate(${b.x},${b.y})`}>
              <path
                className="ia-pisca"
                style={estiloAtraso(b.atraso)}
                d="M0,-7 C 0.9,-2.4 2.4,-0.9 7,0 C 2.4,0.9 0.9,2.4 0,7 C -0.9,2.4 -2.4,0.9 -7,0 C -2.4,-0.9 -0.9,-2.4 0,-7 Z"
                fill="#FFF6E0"
              />
            </g>
          ))}
        </g>

        {/* Varredura de brilho passando pelo emblema inteiro */}
        <g clipPath="url(#ia-recorte-emblema)">
          <g transform="rotate(16 256 256)">
            <rect
              className="ia-luz"
              x="-60"
              y="-8"
              width="120"
              height="528"
              fill="url(#ia-luz-ondulada)"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

const CHAVE_EXIBIDA = "abertura-biel-video-v2-exibida";

/** A nova abertura toca uma vez por sessão; clique ou teclado permite pular. */
export function IntroAbertura() {
  const [estado, setEstado] = useState<"inativo" | "tocando" | "saindo">("inativo");

  useEffect(() => {
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const jaExibida = sessionStorage.getItem(CHAVE_EXIBIDA) === "1";
    if (reduzMovimento || jaExibida) return;

    setEstado("tocando");
  }, []);

  useEffect(() => {
    if (estado === "inativo") return;

    if (estado === "saindo") {
      sessionStorage.setItem(CHAVE_EXIBIDA, "1");
    }

    // Falhas de rede ou autoplay nunca devem bloquear o acesso ao sistema.
    const fim = setTimeout(
      () => setEstado(estado === "saindo" ? "inativo" : "saindo"),
      estado === "saindo" ? 800 : 15_000,
    );
    return () => clearTimeout(fim);
  }, [estado]);

  if (estado === "inativo") return null;

  return (
    <button
      type="button"
      className={cn("abertura-moldura", estado === "saindo" && "abertura-moldura--saindo")}
      aria-label="Pular animação de abertura"
      onClick={() => setEstado("saindo")}
    >
      <video
        className="h-auto w-[min(80vmin,540px)]"
        src="/intro/abertura-biel.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={() => setEstado("saindo")}
        onError={() => setEstado("saindo")}
      />
    </button>
  );
}
