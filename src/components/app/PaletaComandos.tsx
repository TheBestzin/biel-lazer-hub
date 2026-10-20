import { useEffect, useCallback, useMemo, useState } from "react";
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
import { NAVEGACAO } from "@/constants/navegacao";
import { useTema } from "@/app/providers/ThemeProvider";
import { useClientes, useReservas } from "@/hooks/useDados";
import { formatarData } from "@/utils/formatadores";

/** Limites da busca: a paleta filtra localmente, então mantém a lista enxuta. */
const LIMITE_RESERVAS = 60;
const LIMITE_CLIENTES = 60;

interface AcaoRapida {
  titulo: string;
  icone: typeof Search;
  executar: () => void;
}

/**
 * Campo de busca global do cabeçalho (Ctrl+K). Abre a paleta que encontra
 * páginas, ações, reservas e clientes. No celular, vira só o ícone.
 */
export function PaletaComandos() {
  const [aberta, setAberta] = useState(false);
  const navegar = useNavigate();
  const { tema, definirTema, escuroAtivo } = useTema();
  const { data: reservas } = useReservas();
  const { data: clientes } = useClientes();

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

  /** Reservas mais recentes primeiro; o código curto é o mesmo exibido nas tabelas. */
  const reservasBusca = useMemo(
    () => [...reservas].sort((a, b) => b.data.localeCompare(a.data)).slice(0, LIMITE_RESERVAS),
    [reservas],
  );

  const clientesBusca = useMemo(() => clientes.slice(0, LIMITE_CLIENTES), [clientes]);

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
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-label="Buscar reservas, clientes ou páginas (Ctrl K)"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:w-full md:justify-start md:gap-2 md:px-3"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden min-w-0 flex-1 truncate text-left text-sm md:inline">
          Buscar reservas, clientes ou páginas…
        </span>
        <kbd className="pointer-events-none hidden rounded border border-border bg-background px-1.5 font-mono text-[0.65rem] font-medium lg:inline">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={aberta} onOpenChange={setAberta}>
        <CommandInput placeholder="Buscar reservas, clientes ou páginas…" />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Reservas">
            {reservasBusca.map((reserva) => (
              <CommandItem
                key={reserva.id}
                value={`reserva ${reserva.clienteNome} ${formatarData(reserva.data)} ${reserva.id} ${reserva.statusReserva}`}
                onSelect={() => {
                  setAberta(false);
                  void navegar({ to: "/reservas", search: { reserva: reserva.id } });
                }}
              >
                <CalendarPlus aria-hidden />
                <span className="truncate">{reserva.clienteNome}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatarData(reserva.data)} · #{reserva.id.slice(0, 5).toUpperCase()}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Clientes">
            {clientesBusca.map((cliente) => (
              <CommandItem
                key={cliente.id}
                value={`cliente ${cliente.nome} ${cliente.telefone} ${cliente.id}`}
                onSelect={() => {
                  setAberta(false);
                  void navegar({ to: "/clientes/$clienteId", params: { clienteId: cliente.id } });
                }}
              >
                <UserPlus aria-hidden />
                <span className="truncate">{cliente.nome}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                  {cliente.totalReservas} reserva{cliente.totalReservas === 1 ? "" : "s"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Ações rápidas">
            {acoes.map((acao) => (
              <CommandItem key={acao.titulo} value={acao.titulo} onSelect={acao.executar}>
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
