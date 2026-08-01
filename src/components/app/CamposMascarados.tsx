import { forwardRef } from "react";

import { Input } from "@/components/ui/input";
import { mascararCPF, mascararTelefone, apenasDigitos } from "@/utils/documentos";

interface CampoMascaradoProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onChange: (valor: string) => void;
}

export const CampoCPF = forwardRef<HTMLInputElement, CampoMascaradoProps>(
  ({ value, onChange, ...props }, ref) => (
    <Input
      ref={ref}
      inputMode="numeric"
      placeholder="000.000.000-00"
      value={mascararCPF(value)}
      onChange={(evento) => onChange(apenasDigitos(evento.target.value).slice(0, 11))}
      {...props}
    />
  ),
);
CampoCPF.displayName = "CampoCPF";

export const CampoTelefone = forwardRef<HTMLInputElement, CampoMascaradoProps>(
  ({ value, onChange, ...props }, ref) => (
    <Input
      ref={ref}
      inputMode="tel"
      placeholder="(00) 00000-0000"
      value={mascararTelefone(value)}
      onChange={(evento) => onChange(apenasDigitos(evento.target.value).slice(0, 11))}
      {...props}
    />
  ),
);
CampoTelefone.displayName = "CampoTelefone";

interface CampoMoedaProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: number;
  onChange: (valor: number) => void;
}

export const CampoMoeda = forwardRef<HTMLInputElement, CampoMoedaProps>(
  ({ value, onChange, ...props }, ref) => (
    <Input
      ref={ref}
      inputMode="decimal"
      placeholder="R$ 0,00"
      value={
        value
          ? (value / 1).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : ""
      }
      onChange={(evento) => {
        const digitos = apenasDigitos(evento.target.value);
        onChange(digitos ? Number(digitos) / 100 : 0);
      }}
      {...props}
    />
  ),
);
CampoMoeda.displayName = "CampoMoeda";
