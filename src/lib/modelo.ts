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
  valor_funcionaria: number | null;
  ativo: boolean;
  referencia_externa: string | null;
}

export interface Funcionaria {
  id: string;
  nome: string;
  telefone: string | null;
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
  funcionaria_id: string | null;
  data: string;
  hora: string | null;
  valor_cobrado: number;
  valor_funcionaria: number;
  cliente_pagou: boolean;
  funcionaria_paga: boolean;
  notas: string | null;
  origem: string;
  referencia_externa: string | null;
  detalhes: DetalhesPedido | null;
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

export const PERCENTAGEM_FUNCIONARIA_SUGERIDA = 0.55;

export function estadoDaMarcacao(m: Pick<Marcacao, "data" | "cliente_pagou">, hoje: string): EstadoMarcacao {
  if (m.cliente_pagou) return "recebido";
  return m.data < hoje ? "em_atraso" : "pendente";
}

export function valorSugeridoFuncionaria(valorCobrado: number): number {
  return Math.round(valorCobrado * PERCENTAGEM_FUNCIONARIA_SUGERIDA * 100) / 100;
}

export interface ResumoMes {
  servicos: number;
  receita: number;
  recebido: number;
  porReceber: number;
  emAtraso: number;
  custoEquipa: number;
  despesas: number;
  custos: number;
  lucro: number;
  margem: number;
  porPagarEquipa: number;
}

export function resumoDoMes(marcacoes: Marcacao[], despesas: Despesa[], hoje: string): ResumoMes {
  let receita = 0;
  let recebido = 0;
  let emAtraso = 0;
  let custoEquipa = 0;
  let porPagarEquipa = 0;
  for (const m of marcacoes) {
    receita += m.valor_cobrado;
    custoEquipa += m.valor_funcionaria;
    const estado = estadoDaMarcacao(m, hoje);
    if (estado === "recebido") recebido += m.valor_cobrado;
    if (estado === "em_atraso") emAtraso += m.valor_cobrado;
    if (!m.funcionaria_paga) porPagarEquipa += m.valor_funcionaria;
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
    margem: receita > 0 ? lucro / receita : 0,
    porPagarEquipa,
  };
}

export interface ResumoFuncionaria {
  funcionaria: Funcionaria;
  servicos: number;
  aReceber: number;
  porPagar: number;
  marcacoesPorPagar: string[];
}

export function resumoPorFuncionaria(funcionarias: Funcionaria[], marcacoes: Marcacao[]): ResumoFuncionaria[] {
  return funcionarias
    .map((funcionaria) => {
      const suas = marcacoes.filter((m) => m.funcionaria_id === funcionaria.id);
      const porPagar = suas.filter((m) => !m.funcionaria_paga);
      return {
        funcionaria,
        servicos: suas.length,
        aReceber: suas.reduce((soma, m) => soma + m.valor_funcionaria, 0),
        porPagar: porPagar.reduce((soma, m) => soma + m.valor_funcionaria, 0),
        marcacoesPorPagar: porPagar.map((m) => m.id),
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
