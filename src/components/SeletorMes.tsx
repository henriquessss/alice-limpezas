import { somarMeses } from "../lib/datas";
import { nomeDoMes } from "../lib/format";

export function SeletorMes({ mes, mudarMes }: { mes: string; mudarMes: (novo: string) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(somarMeses(mes, -1))} className="h-10 px-3 text-slate-600 hover:text-ink">
        ‹
      </button>
      <span className="min-w-[10rem] text-center text-sm font-semibold text-ink">{nomeDoMes(mes)}</span>
      <button type="button" aria-label="Mês seguinte" onClick={() => mudarMes(somarMeses(mes, 1))} className="h-10 px-3 text-slate-600 hover:text-ink">
        ›
      </button>
    </div>
  );
}
