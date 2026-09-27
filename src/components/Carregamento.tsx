import type { EstadoDados } from "../lib/dados";

export function Carregamento({ dados }: { dados: Exclude<EstadoDados, { estado: "pronto" }> }) {
  if (dados.estado === "erro") {
    return (
      <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {dados.mensagem}
      </div>
    );
  }
  return <p className="py-12 text-center text-sm text-slate-500">A carregar…</p>;
}
