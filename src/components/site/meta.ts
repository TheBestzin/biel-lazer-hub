/**
 * Metadados e dados estruturados da página pública (/reservar).
 * SEO visual: og:image, favicon refinado e JSON-LD de negócio local.
 */
import { URL_OG_IMAGE } from "@/components/site/constantes";

export const meta = [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { title: "Reserve sua data — Área de Lazer Biel" },
  {
    name: "description",
    content:
      "Alugue a Área de Lazer Biel: piscina com deck, área gourmet completa e ambiente privativo. Veja datas disponíveis e reserve online em poucos segundos.",
  },
  { name: "author", content: "Área de Lazer Biel" },
  { property: "og:title", content: "Reserve sua data — Área de Lazer Biel" },
  {
    property: "og:description",
    content:
      "Piscina exclusiva, área gourmet completa e espaço privativo. Consulte a disponibilidade do dia que você quer e reserve online.",
  },
  { property: "og:type", content: "website" },
  { property: "og:image", content: URL_OG_IMAGE },
  { property: "og:image:alt", content: "Piscina com deck de madeira da Área de Lazer Biel" },
  { property: "og:locale", content: "pt_BR" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "Reserve sua data — Área de Lazer Biel" },
  {
    name: "twitter:description",
    content: "Consulte a disponibilidade do dia que você quer e reserve online.",
  },
  { name: "twitter:image", content: URL_OG_IMAGE },
  { name: "theme-color", content: "#f5f5f7", media: "(prefers-color-scheme: light)" },
  { name: "theme-color", content: "#101012", media: "(prefers-color-scheme: dark)" },
];

/** Ícones carregados no head — apple-touch-icon para instalação no iPhone. */
export const links = [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/logo.png" },
  { rel: "preload", as: "image", href: URL_OG_IMAGE },
];

/**
 * JSON-LD de negócio local — enriquece resultados de busca do Google
 * (nome, fotos, contato e horários). Mantido em sincronia com as
 * configurações padrão do sistema.
 */
export function dadosEstruturadosLocal(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Área de Lazer Biel",
    description:
      "Área de lazer privativa para eventos e confraternizações: piscina com deck, área gourmet completa, churrasqueira e área coberta.",
    image: URL_OG_IMAGE,
    logo: "/logo.png",
    telephone: "+55-55-1999999999",
    priceRange: "R$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "08:00",
        closes: "22:00",
      },
    ],
    makesOffer: {
      "@type": "Offer",
      name: "Diária de locação da área de lazer",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: "/reservar",
    },
  };
}
