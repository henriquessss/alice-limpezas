export interface Cliente {
  id: string;
  nome: string;
  morada: string | null;
  telefone: string | null;
  email: string | null;
  notas: string | null;
  ativo: boolean;
  /** `manual` para clientes criados aqui; outras origens ficam para integrações (ex.: Paradise Villas). */
  origem: string;
  referencia_externa: string | null;
}

/** Um sítio onde se limpa, quando o cliente tem vários (villas, apartamentos). */
export interface Local {
  id: string;
  cliente_id: string;
  nome: string;
  morada: string | null;
  preco_acordado: number | null;
  /** O que a gestora recebe por limpeza neste local; preenche a marcação. */
  valor_gestora: number | null;
  ativo: boolean;
  referencia_externa: string | null;
}

export interface Funcionaria {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  /** Valor por hora; preenche a taxa ao juntá-la a uma limpeza. */
  taxa_hora: number;
  ativa: boolean;
}

export interface DetalhesPedido {
  nome_hospede?: string;
  numero_hospedes?: number;
  checkin?: string;
  checkout?: string;
  extras?: { nome: string; quantidade: number }[];
}

export interface Marcacao {
  id: string;
  cliente_id: string;
  local_id: string | null;
  data: string;
  hora: string | null;
  valor_cobrado: number;
  /** O que a gestora recebe por este serviço. Valor definido por ela, nunca percentagem. */
  valor_gestora: number;
  cliente_pagou: boolean;
  notas: string | null;
  origem: string;
  referencia_externa: string | null;
  detalhes: DetalhesPedido | null;
}

/**
 * Uma funcionária numa limpeza. As funcionárias são pagas à hora: as horas
 * podem ficar por preencher até depois do serviço; o valor é horas × taxa, mas
 * a gestora pode escrevê-lo à mão.
 */
export interface Participacao {
  id: string;
  marcacao_id: string;
  funcionaria_id: string;
  horas: number | null;
  taxa_hora: number;
  valor: number;
  paga: boolean;
}

export function valorDaParticipacao(horas: number | null, taxaHora: number): number {
  if (horas === null) return 0;
  return Math.round(horas * taxaHora * 100) / 100;
}

export function participacoesPorMarcacao(participacoes: Participacao[]): Map<string, Participacao[]> {
  const mapa = new Map<string, Participacao[]>();
  for (const p of participacoes) mapa.set(p.marcacao_id, [...(mapa.get(p.marcacao_id) ?? []), p]);
  return mapa;
}

export function nomeDaMarcacao(m: Pick<Marcacao, "cliente_id" | "local_id">, clientes: Map<string, string>, locais: Map<string, string>): string {
  const cliente = clientes.get(m.cliente_id) ?? "—";
  const local = m.local_id ? locais.get(m.local_id) : undefined;
  return local ? `${cliente} · ${local}` : cliente;
}

export const TIPOS_DESPESA = [
  "Produtos de limpeza",
  "Consumíveis",
  "Equipamento",
  "Deslocações",
  "Lavandaria",
  "Outros",
] as const;

export type TipoDespesa = (typeof TIPOS_DESPESA)[number];

export const CORES_DESPESA: Record<TipoDespesa, string> = {
  "Produtos de limpeza": "#1e6fae",
  Consumíveis: "#2f6fdb",
  Equipamento: "#7c5cd6",
  Deslocações: "#d98a1f",
  Lavandaria: "#3f9d3c",
  Outros: "#6b7280",
};

export interface Despesa {
  id: string;
  data: string;
  tipo: TipoDespesa;
  descricao: string;
  fornecedor: string | null;
  valor: number;
}

export type EstadoMarcacao = "recebido" | "pendente" | "em_atraso";

export const ROTULO_ESTADO: Record<EstadoMarcacao, string> = {
  recebido: "Recebido",
  pendente: "Pendente",
  em_atraso: "Em atraso",
};

export function estadoDaMarcacao(m: Pick<Marcacao, "data" | "cliente_pagou">, hoje: string): EstadoMarcacao {
  if (m.cliente_pagou) return "recebido";
  return m.data < hoje ? "em_atraso" : "pendente";
}

export interface ResumoMes {
  servicos: number;
  receita: number;
  recebido: number;
  porReceber: number;
  emAtraso: number;
  /** Soma do que as funcionárias recebem (participações). */
  custoEquipa: number;
  despesas: number;
  /** Equipa + despesas. */
  custos: number;
  /** Receita − custos: o que fica para a gestora antes de ela fixar o seu valor. */
  lucro: number;
  /** Soma de `valor_gestora`: o que a gestora definiu receber. */
  gestora: number;
  /** Lucro − gestora: o que sobra na empresa depois de todos pagos, incluindo ela. */
  sobra: number;
  porPagarEquipa: number;
}

export function resumoDoMes(marcacoes: Marcacao[], participacoes: Participacao[], despesas: Despesa[], hoje: string): ResumoMes {
  let receita = 0;
  let recebido = 0;
  let emAtraso = 0;
  let gestora = 0;
  for (const m of marcacoes) {
    receita += m.valor_cobrado;
    gestora += m.valor_gestora;
    const estado = estadoDaMarcacao(m, hoje);
    if (estado === "recebido") recebido += m.valor_cobrado;
    if (estado === "em_atraso") emAtraso += m.valor_cobrado;
  }
  let custoEquipa = 0;
  let porPagarEquipa = 0;
  for (const p of participacoes) {
    custoEquipa += p.valor;
    if (!p.paga) porPagarEquipa += p.valor;
  }
  const totalDespesas = despesas.reduce((soma, d) => soma + d.valor, 0);
  const custos = custoEquipa + totalDespesas;
  const lucro = receita - custos;
  return {
    servicos: marcacoes.length,
    receita,
    recebido,
    porReceber: receita - recebido,
    emAtraso,
    custoEquipa,
    despesas: totalDespesas,
    custos,
    lucro,
    gestora,
    sobra: lucro - gestora,
    porPagarEquipa,
  };
}

export interface ResumoFuncionaria {
  funcionaria: Funcionaria;
  servicos: number;
  horas: number;
  /** Participações ainda sem horas nem valor — por definir depois do serviço. */
  semValor: number;
  aReceber: number;
  porPagar: number;
  participacoesPorPagar: string[];
}

export function resumoPorFuncionaria(funcionarias: Funcionaria[], participacoes: Participacao[]): ResumoFuncionaria[] {
  return funcionarias
    .map((funcionaria) => {
      const suas = participacoes.filter((p) => p.funcionaria_id === funcionaria.id);
      const porPagar = suas.filter((p) => !p.paga);
      return {
        funcionaria,
        servicos: suas.length,
        horas: suas.reduce((soma, p) => soma + (p.horas ?? 0), 0),
        semValor: suas.filter((p) => p.horas === null && p.valor === 0).length,
        aReceber: suas.reduce((soma, p) => soma + p.valor, 0),
        porPagar: porPagar.reduce((soma, p) => soma + p.valor, 0),
        participacoesPorPagar: porPagar.map((p) => p.id),
      };
    })
    .filter((r) => r.servicos > 0 || r.funcionaria.ativa);
}

export function despesasPorTipo(despesas: Despesa[]): { tipo: TipoDespesa; valor: number; fracao: number }[] {
  const total = despesas.reduce((soma, d) => soma + d.valor, 0);
  return TIPOS_DESPESA.map((tipo) => {
    const valor = despesas.filter((d) => d.tipo === tipo).reduce((soma, d) => soma + d.valor, 0);
    return { tipo, valor, fracao: total > 0 ? valor / total : 0 };
  });
}
