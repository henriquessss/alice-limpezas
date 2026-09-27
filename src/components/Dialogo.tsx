import { useEffect, type ReactNode } from "react";

export function Dialogo({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const teclado = (event: KeyboardEvent) => {
      if (event.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-panel sm:max-w-lg sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-full px-2 text-xl leading-none text-slate-500 hover:text-ink">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
