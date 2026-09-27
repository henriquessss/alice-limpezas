import type { ReactNode } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { terminarSessao } from "../lib/auth";
import { ligacaoCom, useMes } from "../lib/mes";
import { navegar, useRota } from "../lib/rota";
import { apagarDadosLocais } from "../lib/repositorio";

const LIGACOES = [
  { path: "/", rotulo: "Painel" },
  { path: "/contas", rotulo: "Contas" },
  { path: "/clientes", rotulo: "Clientes" },
  { path: "/equipa", rotulo: "Equipa" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRota();
  const { mes } = useMes();

  const reporExemplo = () => {
    if (!window.confirm("Repor os dados de exemplo? Tudo o que alterou em modo local será perdido.")) return;
    apagarDadosLocais();
    window.location.reload();
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navegar("/");
            }}
            className="flex items-center gap-2 text-ink"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">AL</span>
            <span className="font-semibold">Alice Limpezas</span>
          </a>
          <nav className="flex gap-1 text-sm">
            {LIGACOES.map((l) => {
              const ativa = path === l.path;
              return (
                <a
                  key={l.path}
                  href={ligacaoCom(l.path, mes)}
                  onClick={(event) => {
                    event.preventDefault();
                    navegar(ligacaoCom(l.path, mes));
                  }}
                  className={`rounded-full px-3 py-1.5 font-medium ${ativa ? "bg-ink text-white" : "text-slate-600 hover:bg-sand"}`}
                >
                  {l.rotulo}
                </a>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            {isSupabaseConfigured ? (
              <button type="button" onClick={() => void terminarSessao()} className="hover:text-ink">
                Sair
              </button>
            ) : (
              <>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Modo local</span>
                <button type="button" onClick={reporExemplo} className="hover:text-ink">
                  Repor exemplo
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
