import type { ReactNode } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { terminarSessao } from "../lib/auth";
import { ligacaoCom, useMes } from "../lib/mes";
import { navegar, useRota } from "../lib/rota";
import { apagarDadosLocais } from "../lib/repositorio";
import { IconeCalendario, IconeClientes, IconeContas, IconeEquipa, IconeSair } from "./Icones";

const LIGACOES = [
  { path: "/", rotulo: "Painel", Icone: IconeCalendario },
  { path: "/contas", rotulo: "Contas", Icone: IconeContas },
  { path: "/clientes", rotulo: "Clientes", Icone: IconeClientes },
  { path: "/equipa", rotulo: "Equipa", Icone: IconeEquipa },
];

/**
 * No telemóvel a navegação vive numa barra fixa em baixo, ao alcance do
 * polegar; em ecrãs largos sobe para o cabeçalho. O conteúdo leva
 * `padding-bottom` suficiente para a barra e para a área segura do iPhone.
 */
export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRota();
  const { mes } = useMes();

  const reporExemplo = () => {
    if (!window.confirm("Repor os dados de exemplo? Tudo o que alterou em modo local será perdido.")) return;
    apagarDadosLocais();
    window.location.reload();
  };

  const ligacao = (l: (typeof LIGACOES)[number], classes: string, conteudo: ReactNode) => (
    <a
      key={l.path}
      href={ligacaoCom(l.path, mes)}
      aria-current={path === l.path ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        navegar(ligacaoCom(l.path, mes));
      }}
      className={classes}
    >
      {conteudo}
    </a>
  );

  return (
    <div className="min-h-dvh pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-x-6 px-4 sm:px-6">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navegar("/");
            }}
            className="flex items-center gap-2.5 text-ink"
          >
            <img src="/monograma.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg leading-none tracking-tight">
              Alice <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-accent">Limpezas</span>
            </span>
          </a>
          <nav className="hidden gap-1 text-sm md:flex">
            {LIGACOES.map((l) =>
              ligacao(
                l,
                `rounded-full px-3 py-1.5 font-medium ${path === l.path ? "bg-ink text-white" : "text-slate-600 hover:bg-mist hover:text-ink"}`,
                l.rotulo,
              ),
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            {isSupabaseConfigured ? (
              <button type="button" onClick={() => void terminarSessao()} aria-label="Sair" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-mist hover:text-ink md:h-auto md:w-auto md:px-2">
                <IconeSair className="h-5 w-5 md:hidden" />
                <span className="hidden md:inline">Sair</span>
              </button>
            ) : (
              <>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Modo local</span>
                <button type="button" onClick={reporExemplo} className="hidden hover:text-ink sm:inline">
                  Repor exemplo
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Principal">
        <div className="grid h-[4.25rem] grid-cols-4">
          {LIGACOES.map((l) => {
            const ativa = path === l.path;
            return ligacao(
              l,
              `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${ativa ? "text-accent" : "text-slate-500"}`,
              <>
                <span className={`grid h-8 w-12 place-items-center rounded-full ${ativa ? "bg-mist" : ""}`}>
                  <l.Icone className="h-5 w-5" />
                </span>
                {l.rotulo}
              </>,
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Botão flutuante de ação principal, acima da barra de separadores no telemóvel. */
export function BotaoFlutuante({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom)+1rem)] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(30,111,174,0.4)] active:scale-95 md:hidden"
    >
      {children}
    </button>
  );
}
