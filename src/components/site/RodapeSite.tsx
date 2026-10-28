import { CalendarDays, Clock, MapPin, MessageCircle } from "lucide-react";

import { AppLogo } from "@/components/app/AppLogo";
import { Button } from "@/components/ui/button";

/**
 * Barra de CTA fixa no mobile: mantém "Ver datas" sempre a um toque,
 * respeitando a área segura de aparelhos com notch.
 */
export function CtaBarraMobile({ whatsapp }: { whatsapp: string }) {
  const tel = whatsapp.replace(/\D/g, "");
  return (
    <div className="glass-panel cta-barra-mobile fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 p-3 sm:hidden">
      <div className="flex gap-2">
        <Button className="tap-press min-h-11 flex-1" asChild>
          <a href="#reservar">
            <CalendarDays className="size-4.5" aria-hidden />
            Ver datas
          </a>
        </Button>
        {tel && (
          <Button variant="outline" size="icon" className="min-h-11 size-12" asChild>
            <a
              href={`https://wa.me/55${tel}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Falar no WhatsApp"
            >
              <MessageCircle className="size-5" aria-hidden />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

interface RodapeSiteProps {
  whatsapp: string;
  entrada: string;
  saida: string;
}

/** Rodapé público: marca, horários, contato e créditos. */
export function RodapeSite({ whatsapp, entrada, saida }: RodapeSiteProps) {
  const tel = whatsapp.replace(/\D/g, "");
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AppLogo tamanho={40} />
            <p className="font-display text-lg font-semibold">Área de Lazer Biel</p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Espaço privativo para dias de lazer em família: piscina com deck, área gourmet completa
            e muito verde.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Informações</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 text-primary" aria-hidden />
              <span>
                Atendimento das {entrada} às {saida}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 text-primary" aria-hidden />
              <span>Consulte a localização pelo WhatsApp</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Reservas</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Garanta sua data em poucos minutos — reserve online ou fale direto com a gente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="tap-press rounded-full" asChild>
              <a href="#reservar">
                <CalendarDays className="size-4" aria-hidden />
                Reservar data
              </a>
            </Button>
            {tel && (
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <a href={`https://wa.me/55${tel}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" aria-hidden />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Área de Lazer Biel · Reservas online · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
