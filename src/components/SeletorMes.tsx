import { somarMeses } from "../lib/datas";
import { nomeDoMes } from "../lib/format";

export function SeletorMes({ mes, mudarMes }: { mes: string; mudarMes: (novo: string) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(somarMeses(mes, -1))} className="h-11 w-11 text-lg text-slate-600 active:bg-mist md:h-10 md:w-10">
        ‹
      </button>
      <span className="min-w-[9.5rem] text-center font-display text-base text-ink sm:min-w-[10rem]">{nomeDoMes(mes)}</span>
      <button type="button" aria-label="Mês seguinte" onClick={() => mudarMes(somarMeses(mes, 1))} className="h-11 w-11 text-lg text-slate-600 active:bg-mist md:h-10 md:w-10">
        ›
      </button>
    </div>
  );
}
