import { useEffect, useState } from "react";

const EVENTO = "alice-limpezas:rota";

function lerRota() {
  return window.location.pathname + window.location.search;
}

export function useRota(): { path: string; query: URLSearchParams } {
  const [rota, setRota] = useState(lerRota);

  useEffect(() => {
    const ler = () => setRota(lerRota());
    window.addEventListener("popstate", ler);
    window.addEventListener(EVENTO, ler);
    return () => {
      window.removeEventListener("popstate", ler);
      window.removeEventListener(EVENTO, ler);
    };
  }, []);

  const url = new URL(rota, window.location.origin);
  return { path: url.pathname.replace(/\/+$/, "") || "/", query: url.searchParams };
}

export function navegar(destino: string) {
  if (destino === lerRota()) return;
  window.history.pushState(null, "", destino);
  window.dispatchEvent(new Event(EVENTO));
}
