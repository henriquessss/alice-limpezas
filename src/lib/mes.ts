import { mesAtual } from "./datas";
import { navegar, useRota } from "./rota";

const PADRAO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Mês em vista, guardado na query string (`?mes=2026-09`) para sobreviver a navegação e recarregamentos. */
export function useMes(): { mes: string; mudarMes: (novo: string) => void } {
  const { path, query } = useRota();
  const pedido = query.get("mes");
  const mes = pedido && PADRAO_MES.test(pedido) ? pedido : mesAtual();
  return {
    mes,
    mudarMes: (novo) => navegar(novo === mesAtual() ? path : `${path}?mes=${novo}`),
  };
}

export function ligacaoCom(path: string, mes: string): string {
  return mes === mesAtual() ? path : `${path}?mes=${mes}`;
}
