import {
	AbsoluteFill,
	Easing,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

/**
 * Abertura cinematográfica "Área de Lazer Biel" — emblema squircle azul com
 * vinheta de piscina ao entardecer, ~6s de coreografia + respiração final.
 * Sem texto e sem letras. Toda animação é frame-math (nada de CSS animation).
 */

const E_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const E_SNAP = Easing.bezier(0.34, 1.4, 0.64, 1);
const E_SWEEP = Easing.bezier(0.4, 0, 0.2, 1);

const Sinal = (t: number) => Math.sin(t * Math.PI * 2);

/** segundos -> frames */
const useS = () => {
	const { fps } = useVideoConfig();
	return (segundos: number) => segundos * fps;
};

const DIA_ONDA = "M35,435 C128,397 180,466 277,429 C351,401 397,442 479,417";

/* Folhas de palmeira preenchidas, radiando da copa (122,172) */
const FRONDAS = [
	{
		d: "M122,172 C98,129 65,119 40,146 C61,137 64,144 70,148 L67,137 L83,148 L80,136 L96,151 L94,140 L112,164 Z",
		cor: "#17604C",
	},
	{
		d: "M122,172 C78,144 50,164 46,204 C54,187 61,183 68,180 L62,177 L79,175 L73,169 L91,170 L87,164 L111,172 Z",
		cor: "#238268",
	},
	{
		d: "M122,172 C98,131 105,99 133,85 C124,99 124,107 127,116 L118,111 L124,129 L115,124 L122,143 L114,139 L125,170 Z",
		cor: "#439776",
	},
	{
		d: "M122,172 C131,121 166,105 201,126 C181,122 176,129 170,136 L170,125 L158,141 L158,131 L146,151 L146,141 L128,173 Z",
		cor: "#238268",
	},
	{
		d: "M122,172 C164,140 208,153 222,192 C205,176 196,175 185,177 L189,167 L171,174 L177,164 L156,171 L159,162 L125,176 Z",
		cor: "#368C6B",
	},
	{
		d: "M122,172 C156,169 176,192 164,224 C162,208 157,205 150,201 L157,198 L145,191 L152,190 L136,181 L139,180 L122,178 Z",
		cor: "#17604C",
	},
];

const VEIAS = [
	"M122,172 Q79,119 40,146",
	"M122,172 Q61,150 46,204",
	"M122,172 Q104,115 133,85",
	"M122,172 Q151,109 201,126",
	"M122,172 Q187,145 222,192",
	"M122,172 Q166,184 164,224",
];

const ESTRELAS = [
	{ x: 386, y: 91, fase: 0 },
	{ x: 417, y: 142, fase: 1.1 },
	{ x: 284, y: 83, fase: 2.2 },
];

const CAUSTICAS = [
	{ y: 338, xs: [70, 119, 180, 340, 398], op: 0.3 },
	{ y: 360, xs: [95, 201, 322, 408], op: 0.24 },
	{ y: 390, xs: [64, 155, 285, 376], op: 0.15 },
];

const PISCAS = [
	{ x: 58, y: 104, f: 103 },
	{ x: 348, y: 128, f: 117 },
	{ x: 432, y: 262, f: 130 },
	{ x: 140, y: 376, f: 142 },
	{ x: 406, y: 416, f: 154 },
];

const DIA_CHAMA = "M0,-16 C 7,-6 8,2 0,6 C -8,2 -7,-6 0,-16 Z";

/* ------------------------------------------------------------------ */
/* Emblema: aro que se desenha, varredura de luz no aro, fill glossy    */
/* ------------------------------------------------------------------ */

const CoroaAro = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const traco = interpolate(frame, [s(0.35), s(1.0)], [1.001, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	const varreduraOffset = interpolate(frame, [s(0.3), s(1.5)], [-0.12, 1.12], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_SWEEP,
	});
	const varreduraOp = interpolate(frame, [s(0.25), s(0.5), s(1.4), s(1.8)], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const glossy = interpolate(frame, [s(0.5), s(0.9)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	const contorno = interpolate(frame, [s(1.4), s(2)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	return (
		<g>
			<rect
				x="48"
				y="48"
				width="416"
				height="416"
				rx="102"
				fill="url(#g-glossy)"
				style={{ opacity: glossy }}
			/>
			<rect
				x="48"
				y="48"
				width="416"
				height="416"
				rx="102"
				fill="none"
				stroke="#073B5C"
				strokeWidth="5"
				style={{ opacity: contorno * 0.9 }}
			/>
			<rect
				x="32"
				y="32"
				width="448"
				height="448"
				rx="118"
				fill="none"
				stroke="url(#g-aro)"
				strokeWidth="25"
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				style={{ strokeDashoffset: traco }}
			/>
			<rect x="23" y="23" width="466" height="466" rx="127" fill="none" stroke="#B6E8FF" strokeWidth="1.2" opacity={contorno * 0.65} />
			<rect x="43" y="43" width="426" height="426" rx="107" fill="none" stroke="#003955" strokeWidth="1.5" opacity={contorno * 0.8} />
			<rect
				x="32"
				y="32"
				width="448"
				height="448"
				rx="118"
				fill="none"
				stroke="#EAFBFF"
				strokeWidth="12"
				strokeLinejoin="round"
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray="0.09 0.91"
				style={{
					strokeDashoffset: varreduraOffset,
					opacity: varreduraOp,
					filter: "blur(2.5px)",
				}}
			/>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Céu: gradiente de entardecer + crepúsculo + estrelas                 */
/* ------------------------------------------------------------------ */

const FundoCeu = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const opacidade = interpolate(frame, [s(1.2), s(1.75)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	return (
		<g style={{ opacity: opacidade }}>
			<rect x="48" y="48" width="416" height="274" fill="url(#g-ceu)" />
			<ellipse cx="277" cy="287" rx="220" ry="140" fill="url(#g-crepusculo)" />
			<path d="M48 291 Q105 278 168 287 T290 283 T464 288 V318 H48Z" fill="#163F46" opacity="0.65" />
			<path d="M313 172 Q321 166 329 171 M334 156 Q340 151 346 155" fill="none" stroke="#EEC3A0" strokeWidth="1.2" opacity="0.5" />
			{ESTRELAS.map((e, i) => (
				<circle
					key={i}
					cx={e.x}
					cy={e.y}
					r="0.8"
					fill="#E8F4FF"
					style={{
						opacity: 0.35 + 0.35 * Math.sin((frame / 30) * 1.3 + e.fase),
					}}
				/>
			))}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Sol: nasce com listras (máscara) e respira no fim                    */
/* ------------------------------------------------------------------ */

const Sol = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const nasce = interpolate(frame, [s(1.4), s(2.4)], [274, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});
	const entra = interpolate(frame, [s(1.4), s(1.7)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	const halo =
		1 - 0.12 * Math.max(0, Math.sin(((frame - s(5)) / 30) * 1.2));

	const listras = [0, 1, 2, 3].map((i) => ({
		escala: interpolate(
			frame,
			[s(1.7 + i * 0.15), s(2.0 + i * 0.15)],
			[0.02, 1],
			{ extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_OUT_EXPO },
		),
		y: [246, 260, 274, 287][i],
		h: [4, 6, 8, 10][i],
	}));

	return (
		<g
			style={{
				translate: `0px ${nasce}px`,
				opacity: entra,
			}}
		>
			<circle
				cx="256"
				cy="196"
				r="176"
				fill="url(#g-halo-sol)"
				style={{ opacity: 0.9 * halo }}
			/>
			<mask id="m-listras-sol">
				<rect x="0" y="0" width="512" height="512" fill="#fff" />
				{listras.map((l, i) => (
					<rect
						key={i}
						x="150"
						y={l.y}
						width="212"
						height={l.h}
						rx={l.h / 2}
						fill="#000"
						style={{
							scale: `${l.escala} 1`,
							transformOrigin: "256px 0px",
						}}
					/>
				))}
			</mask>
			<g mask="url(#m-listras-sol)">
				<circle cx="277" cy="214" r="76" fill="url(#g-sol)" />
				<circle cx="266" cy="196" r="62" fill="url(#g-sol-nucleo)" opacity="0.3" />
			</g>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Deck à beira d'água: tábuas, friso, água base, grama                 */
/* ------------------------------------------------------------------ */

const FundoChao = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const opacidade = interpolate(frame, [s(1.2), s(1.75)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	const coluna = interpolate(frame, [s(2.0), s(3.0)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	return (
		<g style={{ opacity: opacidade }}>
			{/* base escura sob as tábuas para os vãos não vazarem a cor do céu */}
			<rect x="48" y="292" width="416" height="28" fill="#6D6C60" />
			{Array.from({ length: 9 }).map((_, i) => (
				<rect
					key={i}
					x={48 + i * 46.3}
					y="292"
					width="45.4"
					height="28"
					fill={i % 2 === 0 ? "#AB9D83" : "#B6A68C"}
				/>
			))}
			<path d="M48 300 H464 M48 310 H464" stroke="#E2CBA6" strokeWidth="0.6" opacity="0.45" />
			<rect x="48" y="292" width="416" height="2" fill="#E5C6A1" />
			<rect x="48" y="314" width="416" height="7" fill="#E9D7B9" />
			<rect x="48" y="320" width="416" height="3" fill="#114D5E" />

			<rect x="48" y="320" width="416" height="144" fill="url(#g-agua)" />
			<path d="M48 325 H464 M48 337 H464 M48 355 H464 M48 381 H464 M48 418 H464 M48 462 H464" stroke="#B4E5D9" strokeWidth="0.6" opacity="0.16" />
			<path d="M215 320 L160 464 M259 320 L260 464 M303 320 L362 464 M348 320 L464 464 M170 320 L48 464" fill="none" stroke="#A8E1D8" strokeWidth="0.6" opacity="0.13" />
			<rect x="48" y="320" width="416" height="3" fill="#C2EFDF" opacity="0.5" />

			{/* coluna de luz do sol na água */}
			<path
				d="M253 322 H300 L334 455 Q279 474 220 455Z"
				fill="url(#g-reflexo-sol)"
				style={{ opacity: coluna * 0.55 }}
			/>

			{/* monte de grama com hastes */}
			<path d="M48,322 C 80,296 128,296 158,314 Q 130,318 84,320 L48,322 Z" fill="#204E43" />
			<path
				d="M60,304 q 3,-8 6,0 M72,300 q 3,-8 6,0 M88,302 q 3,-8 6,0"
				stroke="#6E9470"
				strokeWidth="2"
				fill="none"
			/>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Palmeira: tronco revela da base, copas desabrocham                   */
/* ------------------------------------------------------------------ */

const Palmeira = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const revelaTronco = interpolate(frame, [s(1.5), s(2.35)], [326, 156], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	const alturaTronco = 330 - revelaTronco;

	const tempoVento = Math.max(0, (frame - s(3.4)) / 30);
	const balanca = 0.9 * Sinal(tempoVento * 0.55) * Math.min(1, tempoVento);

	return (
		<g>
			<clipPath id="cp-tronco">
				<rect x="80" y={revelaTronco} width="90" height={Math.max(0, alturaTronco)} />
			</clipPath>
			<g clipPath="url(#cp-tronco)">
				<path
					d="M100,316 C 106,270 92,220 112,166 L 130,170 C 114,222 126,270 120,316 Z"
					fill="url(#g-tronco)"
				/>
				<path
					d="M100,316 C 106,270 92,220 112,166 L 118,167 C 102,219 114,270 110,316 Z"
					fill="#5C5642"
				/>
				{[230, 258, 286, 306].map((y, i) => (
					<path
						key={i}
						d={`M${104 + (y - 230) * 0.12},${y} q 9,5 18,0`}
						stroke="#C6A67D"
						strokeWidth="1.2"
						fill="none"
						strokeLinecap="round"
					/>
				))}
			</g>

			<g
				style={{
					rotate: `${balanca}deg`,
					transformOrigin: "122px 174px",
				}}
			>
				{FRONDAS.map((f, i) => {
					const broto = interpolate(
						frame,
						[s(1.75 + i * 0.16), s(2.2 + i * 0.16)],
						[0, 1],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_SNAP },
					);
					return (
						<path
							key={i}
							d={f.d}
							fill={f.cor}
							style={{
								scale: `${0.04 + 0.96 * broto}`,
								rotate: `${(1 - broto) * -16}deg`,
								transformOrigin: "122px 174px",
								opacity: broto > 0.02 ? 1 : 0,
							}}
						/>
					);
				})}
				{VEIAS.map((d, i) => {
					const brota = interpolate(
						frame,
						[s(1.95 + i * 0.16), s(2.35 + i * 0.16)],
						[0, 1],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_OUT_EXPO },
					);
					return (
						<path
							key={i}
							d={d}
							stroke="#A5CD88"
							strokeWidth="0.85"
							fill="none"
							strokeLinecap="round"
							pathLength={1}
							strokeDasharray={1}
							style={{
								strokeDashoffset: 1 - brota,
								opacity: brota > 0.02 ? 0.85 : 0,
							}}
						/>
					);
				})}

				{(() => {
					const broto = interpolate(frame, [s(2.8), s(3.15)], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
						easing: E_SNAP,
					});
					return (
						<g
							style={{
								transformOrigin: "124px 180px",
								scale: `${broto}`,
								opacity: broto,
							}}
						>
							<circle cx="116" cy="182" r="7" fill="#4A3428" />
							<circle cx="134" cy="176" r="6.4" fill="#5A4230" />
						</g>
					);
				})()}
			</g>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Espreguiçadeiras entram deslizando das laterais                      */
/* ------------------------------------------------------------------ */

const Espreguicadeira = () => (
	<>
		<ellipse cx="0" cy="17" rx="34" ry="3" fill="#081F2B" opacity="0.3" />
		<path d="M-27 3 L-38 -20 L-30 -23 L-13 -1 L29 -1 L35 4 L25 8 L-21 8Z" fill="#D5CEB9" />
		<path d="M-35 -19 L-29 -20 L-14 0 L28 0 L30 3 L-18 3Z" fill="#FCF0D8" />
		<path d="M-19 8 L-23 16 M25 8 L28 16" fill="none" stroke="#B9A17F" strokeWidth="2.5" />
		<path d="M-28 -15 L-22 -7 M-10 2 H24" stroke="#FFF9EB" strokeWidth="1.2" opacity="0.8" />
		<path d="M-7 0 H6 L10 4 H-3Z" fill="#6D9B9D" />
	</>
);

const Espreguicadeiras = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const entra = (inicio: number, lado: number) =>
		({
			translate: `${interpolate(frame, [s(inicio), s(inicio + 0.8)], [70 * lado, 0], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
				easing: E_SNAP,
			})}px 0px`,
			opacity: interpolate(frame, [s(inicio), s(inicio + 0.35)], [0, 1], {
				extrapolateLeft: "clamp",
				extrapolateRight: "clamp",
			}),
		}) as const;

	return (
		<>
			<g transform="translate(214,292)" style={entra(2.55, -1)}>
				<Espreguicadeira />
			</g>
			<g transform="translate(392,292)" style={entra(2.8, 1)}>
				<Espreguicadeira />
			</g>
		</>
	);
};

/* ------------------------------------------------------------------ */
/* Tochas acendem uma por uma                                           */
/* ------------------------------------------------------------------ */

const Tocha = ({ x, atraso }: { x: number; atraso: number }) => {
	const frame = useCurrentFrame();
	const s = useS();

	const acende = interpolate(frame, [s(atraso), s(atraso + 0.45)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_SNAP,
	});
	const brasa = 1 + 0.1 * Sinal((frame / 30) * 4.2);

	return (
		<g style={{ opacity: acende * acende }}>
			<path
				d={`M${x},292 V252`}
				stroke="#41565A"
				strokeWidth="3"
				strokeLinecap="round"
				fill="none"
			/>
			<path d={`M${x-7} 243 L${x-4} 253 H${x+4} L${x+7} 243Z`} fill="#8F7753" />
			<path d={`M${x-6} 243 H${x+6}`} stroke="#D4AC72" strokeWidth="1" />
			<circle
				cx={x}
				cy="244"
				r="27"
				fill="url(#g-halo-toca)"
				style={{
					opacity: 0.9 + 0.1 * Sinal((frame / 30) * 1.5),
					scale: `${Math.max(0.001, acende)}`,
					transformOrigin: `${x}px 244px`,
				}}
			/>
			<g
				style={{
					translate: `${x}px 252px`,
					scale: `${Math.max(0.001, acende)}`,
				}}
			>
				<g style={{ scale: `1 ${brasa}`, transformOrigin: "0px 6px" }}>
					<path d={DIA_CHAMA} fill="#FF9E2E" />
					<path
						d={DIA_CHAMA}
						fill="#FFD27A"
						style={{ scale: "0.55", transformOrigin: "0px 2px" }}
					/>
				</g>
			</g>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Água: cáusticas que derivam + reflexos dançantes                     */
/* ------------------------------------------------------------------ */

const Agua = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const surge = interpolate(frame, [s(3.35), s(4.0)], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	return (
		<g style={{ opacity: surge }}>
			{[0, 1, 2, 3, 4].map((i) => {
				const desloc = 9 * Sinal((frame / 30) * 2 + i * 0.9);
				const w = [47, 36, 57, 43, 61][i];
				return (
					<rect
						key={`sol-${i}`}
						x={277 - w / 2 + desloc}
						y={336 + i * 24}
						width={w}
						height={1.2 + i * 0.3}
						rx="1"
						fill="#FFC14D"
						style={{ opacity: 0.5 - i * 0.08 }}
					/>
				);
			})}

			{CAUSTICAS.map((linha, r) =>
				linha.xs.map((x, i) => {
					const desloc = 12 * Sinal((frame / 30) * 0.35 + r * 0.7 + i * 0.35);
					return (
						<path
							key={`${r}-${i}`}
							d={`M${x},${linha.y} q 12,-2 26,0 t18,0`}
							stroke="#BFF0FE"
							strokeWidth="1.1"
							strokeLinecap="round"
							fill="none"
							style={{
								translate: `${desloc}px 0px`,
								opacity: linha.op * (0.7 + 0.3 * Sinal((frame / 30) * 1.1 + i + r)),
							}}
						/>
					);
				}),
			)}

			{[64, 436].map((x, coluna) =>
				[0, 1, 2, 3, 4].map((i) => {
					const w = [18, 14, 20, 12, 16][i];
					return (
						<rect
							key={`${coluna}-${i}`}
							x={x - w / 2 + 4 * Sinal((frame / 30) * 1.4 + i * 1.1 + coluna * 2)}
							y={336 + i * 22}
							width={w}
							height="4"
							rx="2"
							fill="#FFD27A"
							style={{
								opacity:
									(0.45 - i * 0.07) *
									interpolate(
										frame,
										[s(3.05 + coluna * 0.2), s(3.6 + coluna * 0.2)],
										[0, 1],
										{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
									) *
									(0.75 + 0.25 * Sinal((frame / 30) * 2.2 + i * 1.3 + coluna)),
							}}
						/>
					);
				}),
			)}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Faixa ondulada: contorno + carcere com brilho deslizando             */
/* ------------------------------------------------------------------ */

const Onda = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const brilho = interpolate(frame, [s(4.35), s(5.5)], [1.02, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});
	const brilhoDesliza = interpolate(frame, [s(4.75), s(8)], [1.02, -0.14], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const luzOp = interpolate(frame, [s(4.95), s(5.45)], [0, 0.9], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<g>
			<path
				d={DIA_ONDA}
				fill="none"
				stroke="#075A80"
				strokeWidth="27"
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray={1}
				style={{ strokeDashoffset: brilho }}
			/>
			<path
				d={DIA_ONDA}
				fill="none"
				stroke="url(#g-onda)"
				strokeWidth="23"
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray={1}
				style={{ strokeDashoffset: brilho }}
			/>
			<path
				d={DIA_ONDA}
				fill="none"
				stroke="url(#g-onda)"
				strokeWidth="23"
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray={1}
				style={{ strokeDashoffset: brilho }}
			/>
			<path
				d={DIA_ONDA}
				fill="none"
				stroke="#B7F2FF"
				strokeWidth="1.6"
				strokeLinecap="round"
				pathLength={1}
				strokeDasharray="0.12 0.88"
				transform="translate(0,-6)"
				style={{ strokeDashoffset: brilhoDesliza, opacity: luzOp }}
			/>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* Varredura de luz pelo emblema                                        */
/* ------------------------------------------------------------------ */

const VarreduraLuz = () => {
	const frame = useCurrentFrame();
	const s = useS();

	const desliza = interpolate(frame, [s(5.05), s(7.05)], [-110, 720], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_SWEEP,
	});
	const opacidade = interpolate(frame, [s(5.05), s(5.45), s(6.75), s(7.15)], [0, 0.45, 0.45, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<g transform="rotate(15 256 256)">
			<rect
				x={-60 + desliza}
				y="0"
				width="120"
				height="512"
				fill="url(#g-luz)"
				style={{ opacity: opacidade }}
				clipPath="url(#cp-emblema)"
			/>
		</g>
	);
};

const Piscas = () => {
	const frame = useCurrentFrame();
	const s = useS();

	return (
		<>
			{PISCAS.map((p, i) => {
				const broto = interpolate(
					frame,
					[s(p.f / 30), s(p.f / 30 + 0.12), s(p.f / 30 + 0.6)],
					[0, 1, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E_OUT_EXPO },
				);
				return (
					<path
						key={i}
						d="M0,-7 C 0.9,-2.4 2.4,-0.9 7,0 C 2.4,0.9 0.9,2.4 0,7 C -0.9,2.4 -2.4,0.9 -7,0 C -2.4,-0.9 -0.9,-2.4 0,-7 Z"
						fill="#FFF6E0"
						transform={`translate(${p.x},${p.y})`}
						style={{
							scale: `${Math.max(0.001, broto)}`,
							opacity: broto,
							transformOrigin: `${p.x}px ${p.y}px`,
							rotate: `${(1 - broto) * 30}deg`,
						}}
					/>
				);
			})}
		</>
	);
};

/* ------------------------------------------------------------------ */
/* Composição principal                                                 */
/* ------------------------------------------------------------------ */

export const AberturaBiel: React.FC<{ logoEstatica?: boolean }> = ({ logoEstatica = false }) => {
	const frame = useCurrentFrame();
	const s = useS();

	const emblema = {
		opacity: interpolate(frame, [s(0), s(0.45)], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		scale:
			0.92 +
			0.08 *
				interpolate(frame, [s(0), s(0.7)], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
					easing: E_SNAP,
				}),
	};

	const impulso = interpolate(frame, [s(3.35), s(5.9)], [1.08, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: E_OUT_EXPO,
	});

	return (
		<AbsoluteFill style={{ backgroundColor: logoEstatica ? "transparent" : "#ffffff" }}>
			<svg
				viewBox={logoEstatica ? "14 14 484 484" : "-46 -46 604 604"}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					filter: logoEstatica ? "none" : "drop-shadow(0 12px 16px rgba(7,47,70,0.14))",
				}}
			>
				<defs>
					<linearGradient id="g-aro" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#80DBFF" />
						<stop offset="0.28" stopColor="#0A8CFF" />
						<stop offset="0.65" stopColor="#0572BE" />
						<stop offset="1" stopColor="#00C6FF" />
					</linearGradient>
					<linearGradient id="g-tronco" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stopColor="#595644" />
						<stop offset="0.65" stopColor="#A89067" />
						<stop offset="1" stopColor="#D9B88C" />
					</linearGradient>
					<linearGradient id="g-glossy" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#2AB4FF" />
						<stop offset="0.5" stopColor="#0A8CFF" />
						<stop offset="1" stopColor="#056CD2" />
					</linearGradient>
					<linearGradient id="g-ceu" gradientUnits="userSpaceOnUse" x1="0" y1="48" x2="0" y2="318">
						<stop offset="0" stopColor="#102D42" />
						<stop offset="0.48" stopColor="#4B6670" />
						<stop offset="0.82" stopColor="#B08C7A" />
						<stop offset="1" stopColor="#E9B38A" />
					</linearGradient>
					<radialGradient id="g-crepusculo">
				<stop offset="0" stopColor="rgba(255,140,50,0.36)" />
				<stop offset="0.6" stopColor="rgba(255,140,60,0.16)" />
						<stop offset="1" stopColor="rgba(255,140,60,0)" />
					</radialGradient>
					<radialGradient id="g-halo-sol">
				<stop offset="0" stopColor="rgba(255,150,40,0.55)" />
				<stop offset="0.55" stopColor="rgba(255,140,60,0.24)" />
						<stop offset="1" stopColor="rgba(255,140,60,0)" />
					</radialGradient>
					<radialGradient id="g-sol" gradientUnits="userSpaceOnUse" cx="265" cy="188" r="103">
						<stop offset="0" stopColor="#FFE3A4" />
						<stop offset="0.5" stopColor="#FFC16B" />
						<stop offset="0.82" stopColor="#FFA04F" />
						<stop offset="1" stopColor="#FF8A3C" />
					</radialGradient>
					<radialGradient id="g-sol-nucleo">
						<stop offset="0" stopColor="rgba(255,226,150,0.65)" />
						<stop offset="1" stopColor="rgba(255,226,150,0)" />
					</radialGradient>
					<linearGradient id="g-agua" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="0" y2="464">
						<stop offset="0" stopColor="#53C5CF" />
						<stop offset="0.42" stopColor="#158FA9" />
						<stop offset="1" stopColor="#075272" />
					</linearGradient>
					<linearGradient id="g-reflexo-sol" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="rgba(255,158,74,0.28)" />
						<stop offset="1" stopColor="rgba(255,158,74,0)" />
					</linearGradient>
					<radialGradient id="g-halo-toca">
						<stop offset="0" stopColor="rgba(255,200,90,0.55)" />
						<stop offset="0.45" stopColor="rgba(255,180,60,0.22)" />
						<stop offset="1" stopColor="rgba(255,180,60,0)" />
					</radialGradient>
					<linearGradient id="g-onda" gradientUnits="userSpaceOnUse" x1="0" y1="390" x2="0" y2="470">
						<stop offset="0" stopColor="#3ED0FF" />
						<stop offset="1" stopColor="#0A8CFF" />
					</linearGradient>
					<linearGradient id="g-luz" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stopColor="rgba(255,255,255,0)" />
						<stop offset="0.5" stopColor="rgba(255,255,255,0.75)" />
						<stop offset="1" stopColor="rgba(255,255,255,0)" />
					</linearGradient>

					<clipPath id="cp-interior">
						<rect x="48" y="48" width="416" height="416" rx="102" />
					</clipPath>
					<clipPath id="cp-emblema">
						<rect x="14" y="14" width="484" height="484" rx="134" />
					</clipPath>
				</defs>

				<g style={{ opacity: emblema.opacity, scale: `${emblema.scale}`, transformOrigin: "256px 256px" }}>
					<CoroaAro />

					<g clipPath="url(#cp-interior)">
						<g style={{ scale: `${impulso}`, transformOrigin: "256px 256px" }}>
							<FundoCeu />
							<Sol />
							<FundoChao />
							<Palmeira />
							<Espreguicadeiras />
			<Tocha x={64} atraso={3.15} />
			<Tocha x={436} atraso={2.75} />
							<Agua />
							<Onda />
							<Piscas />
						</g>
					</g>
				</g>

				<VarreduraLuz />
			</svg>
		</AbsoluteFill>
	);
};
