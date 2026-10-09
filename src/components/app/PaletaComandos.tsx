import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, CheckSquare, Moon, Search, Sun, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { NAVEGACAO } from "@/constants/navegacao";
import { useTema } from "@/app/providers/ThemeProvider";

interface AcaoRapida {
  titulo: string;
  atalho?: string;
  icone: typeof Search;
  executar: (irPara: (rota: string) => void) => void;
}

/**
 * Paleta de comandos (⌘K / Ctrl+K): pular para qualquer tela e
 * disparar ações rápidas sem tocar no mouse.
 */
export function PaletaComandos() {
  const [aberta, setAberta] = useState(false);
  const navegar = useNavigate();
  const { tema, definirTema, escuroAtivo } = useTema();

  const irPara = useCallback(
    (rota: string) => {
      setAberta(false);
      void navegar({ to: rota });
    },
    [navegar],
  );

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "k" && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault();
        setAberta((v) => !v);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const acoes: AcaoRapida[] = [
    {
      titulo: "Nova reserva",
      icone: CalendarPlus,
      executar: () => {
        setAberta(false);
        void navegar({ to: "/reservas" });
        toast("Clique em \u201cNova reserva\u201d para abrir o formul\u00e1rio.", {
          icon: "\ud83d\udcc5",
        });
      },
    },
    {
      titulo: "Novo cliente",
      icone: UserPlus,
      executar: () => {
        setAberta(false);
        void navegar({ to: "/clientes" });
        toast("Clique em \u201cNovo cliente\u201d para abrir o formul\u00e1rio.", {
          icon: "\ud83d\udc64",
        });
      },
    },
    {
      titulo: escuroAtivo ? "Ativar tema claro" : "Ativar tema escuro",
      icone: escuroAtivo ? Sun : Moon,
      executar: () => {
        definirTema(tema === "dark" ? "light" : "dark");
        setAberta(false);
      },
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 text-muted-foreground"
        onClick={() => setAberta(true)}
        aria-label="Abrir paleta de comandos"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden lg:inline">Buscar…</span>
        <kbd className="pointer-events-none hidden rounded border border-border bg-background px-1.5 font-mono text-[0.65rem] font-medium lg:inline">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog open={aberta} onOpenChange={setAberta}>
        <CommandInput placeholder="Buscar páginas e ações…" />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Ações rápidas">
            {acoes.map((acao) => (
              <CommandItem
                key={acao.titulo}
                value={acao.titulo}
                onSelect={() => acao.executar(irPara)}
              >
                <acao.icone aria-hidden />
                <span>{acao.titulo}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Ir para">
            {NAVEGACAO.map((item) => (
              <CommandItem
                key={item.para}
                value={`${item.label} ${item.descricao}`}
                onSelect={() => irPara(item.para)}
              >
                <item.icone aria-hidden />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{item.descricao}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Fluxos do sistema">
            <CommandItem
              value="Checklist de encerramento"
              onSelect={() => {
                setAberta(false);
                void navegar({ to: "/reservas" });
                toast("Abra uma reserva para preencher o checklist.", { icon: "✅" });
              }}
            >
              <CheckSquare aria-hidden />
              <span>Checklist de encerramento</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
