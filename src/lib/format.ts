const moedaFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moedaInteiraFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const mesFormatter = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" });
const diaLongoFormatter = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long" });

export function moeda(valor: number): string {
  return moedaFormatter.format(valor);
}

export function moedaInteira(valor: number): string {
  return moedaInteiraFormatter.format(Math.round(valor));
}

/** "2026-09-20" → "20/09" */
export function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** "2026-09-20" → "20/09/2026" */
export function dataCurta(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** "09:00:00" → "09:00" */
export function hora(valor: string | null): string {
  return valor ? valor.slice(0, 5) : "";
}

export function nomeDoMes(mes: string): string {
  const texto = mesFormatter.format(new Date(`${mes}-01T12:00:00`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function diaLongo(iso: string): string {
  const texto = diaLongoFormatter.format(new Date(`${iso}T12:00:00`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function percentagem(valor: number): string {
  return `${Math.round(valor * 100)}%`;
}

/** 2.5 → "2,5 h"; 0 → "0 h" */
export function horasTexto(horas: number): string {
  return `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(horas)} h`;
}
