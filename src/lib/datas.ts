function doisDigitos(n: number) {
  return String(n).padStart(2, "0");
}

export function isoDe(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function hojeIso(): string {
  return isoDe(new Date());
}

/** "2026-09" do dia de hoje. */
export function mesAtual(): string {
  return hojeIso().slice(0, 7);
}

export function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

export function primeiroDiaDoMes(mes: string): string {
  return `${mes}-01`;
}

export function ultimoDiaDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return isoDe(new Date(ano, m, 0));
}

export function somarMeses(mes: string, delta: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const data = new Date(ano, m - 1 + delta, 1);
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}`;
}

export function somarDias(iso: string, dias: number): string {
  const [ano, m, d] = iso.split("-").map(Number);
  return isoDe(new Date(ano, m - 1, d + dias));
}

/**
 * Grelha de calendário do mês: 6 semanas de segunda a domingo, a começar na
 * segunda-feira da semana que contém o dia 1. Dias fora do mês vêm marcados.
 */
export function grelhaDoMes(mes: string): { iso: string; doMes: boolean }[] {
  const [ano, m] = mes.split("-").map(Number);
  const primeiro = new Date(ano, m - 1, 1);
  const recuo = (primeiro.getDay() + 6) % 7;
  const inicio = new Date(ano, m - 1, 1 - recuo);
  const celulas: { iso: string; doMes: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    celulas.push({ iso: isoDe(dia), doMes: dia.getMonth() === m - 1 });
  }
  return celulas;
}
