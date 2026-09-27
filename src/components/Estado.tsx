import { ROTULO_ESTADO, type EstadoMarcacao } from "../lib/modelo";

const CLASSES: Record<EstadoMarcacao, string> = {
  recebido: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pendente: "bg-amber-50 text-amber-800 border-amber-200",
  em_atraso: "bg-rose-50 text-rose-800 border-rose-200",
};

export const COR_ESTADO: Record<EstadoMarcacao, string> = {
  recebido: "#0f8a6a",
  pendente: "#d98a1f",
  em_atraso: "#d6455d",
};

export function Estado({ estado, onClick }: { estado: EstadoMarcacao; onClick?: () => void }) {
  const classes = `inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CLASSES[estado]}`;
  if (!onClick) return <span className={classes}>{ROTULO_ESTADO[estado]}</span>;
  return (
    <button type="button" onClick={onClick} className={`${classes} hover:brightness-95`} title="Alterar estado">
      {ROTULO_ESTADO[estado]}
    </button>
  );
}
