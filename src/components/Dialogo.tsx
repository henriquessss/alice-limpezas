import { useEffect, type ReactNode } from "react";

export function Dialogo({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const teclado = (event: KeyboardEvent) => {
      if (event.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", teclado);
    // A página por trás não pode deslizar enquanto a folha está aberta — no
    // iOS o scroll passava para o fundo e a folha parecia solta.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", teclado);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-ink/40 sm:items-center sm:p-6" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-panel sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-3.5 sm:px-6">
          <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-2xl leading-none text-slate-500 hover:bg-mist hover:text-ink">
            ×
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
