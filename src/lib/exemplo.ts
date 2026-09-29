import { mesAtual } from "./datas";
import { valorDaParticipacao, type Cliente, type Despesa, type Funcionaria, type Local, type Marcacao, type Participacao } from "./modelo";

type Base = {
  clientes: Cliente[];
  clientes_locais: Local[];
  funcionarias: Funcionaria[];
  marcacoes: Marcacao[];
  marcacoes_funcionarias: Participacao[];
  despesas: Despesa[];
};

/** Um mês de dados fictícios para demonstrar o painel sem base de dados. */
export function dadosDeExemplo(): Base {
  const mes = mesAtual();
  const dia = (n: number) => `${mes}-${String(n).padStart(2, "0")}`;

  const funcionarias: Funcionaria[] = [
    { id: "f-ana", nome: "Ana Rocha", telefone: "912 000 001", email: "ana@exemplo.pt", taxa_hora: 9, ativa: true },
    { id: "f-marta", nome: "Marta Silva", telefone: "912 000 002", email: "marta@exemplo.pt", taxa_hora: 10, ativa: true },
    { id: "f-catia", nome: "Cátia Nunes", telefone: "912 000 003", email: "catia@exemplo.pt", taxa_hora: 9, ativa: true },
  ];
  const taxa = new Map(funcionarias.map((f) => [f.id, f.taxa_hora]));

  const cliente = (id: string, nome: string, morada: string): Cliente => ({
    id,
    nome,
    morada,
    telefone: null,
    email: null,
    notas: null,
    ativo: true,
    origem: "manual",
    referencia_externa: null,
  });

  const clientes: Cliente[] = [
    cliente("c-fernanda", "D. Fernanda Matos", "Rua das Flores 12, Lisboa"),
    cliente("c-aurora", "Clínica Dentária Aurora", "Av. da República 40, Lisboa"),
    cliente("c-nuno", "Sr. Nuno Pereira", "Rua do Sol 3, Oeiras"),
    cliente("c-beltrao", "Escritório Beltrão & Costa", "Praça do Comércio 8, Lisboa"),
    cliente("c-al", "Apartamento Alojamento Local", "Rua Augusta 100, Lisboa"),
    cliente("c-isabel", "D. Isabel Lourenço", "Rua Verde 7, Cascais"),
    cliente("c-vitor", "Limpeza pós-obra — Sr. Vítor", "Rua Nova 21, Almada"),
    { ...cliente("c-pv", "Paradise Villas", "Algarve"), origem: "paradise-villas", referencia_externa: "paradise-villas" },
  ];

  const clientes_locais: Local[] = [
    { id: "l-paulo", cliente_id: "c-pv", nome: "Villa Paulo", morada: "Vale do Lobo", preco_acordado: 120, valor_gestora: 40, ativo: true, referencia_externa: "villa-paulo" },
    { id: "l-mar", cliente_id: "c-pv", nome: "Villa Mar", morada: "Quinta do Lago", preco_acordado: 150, valor_gestora: 50, ativo: true, referencia_externa: "villa-mar" },
  ];

  const hoje = new Date().getDate();
  let n = 0;
  const marcacoes: Marcacao[] = [];
  const marcacoes_funcionarias: Participacao[] = [];

  /** `equipa`: [funcionária, horas] — horas `null` = ainda por definir (limpeza futura). */
  const marcacao = (
    d: number,
    hora: string,
    cliente_id: string,
    equipa: [string, number | null][],
    valor: number,
    gestora: number,
    pago: boolean,
    equipaPaga: boolean,
    local_id: string | null = null,
  ): Marcacao => {
    const m: Marcacao = {
      id: `m-${++n}`,
      cliente_id,
      local_id,
      data: dia(d),
      hora,
      valor_cobrado: valor,
      valor_gestora: gestora,
      cliente_pagou: pago,
      notas: null,
      origem: "manual",
      referencia_externa: null,
      detalhes: null,
    };
    for (const [funcionaria_id, horas] of equipa) {
      const taxa_hora = taxa.get(funcionaria_id) ?? 0;
      marcacoes_funcionarias.push({
        id: `p-${m.id}-${funcionaria_id}`,
        marcacao_id: m.id,
        funcionaria_id,
        horas,
        taxa_hora,
        valor: valorDaParticipacao(horas, taxa_hora),
        paga: equipaPaga,
      });
    }
    return m;
  };

  for (let semana = 0; semana < 5; semana++) {
    const base = 1 + semana * 7;
    if (base > 28) break;
    const passado = base + 3 < hoje;
    // Limpezas já feitas têm horas; futuras ficam por preencher.
    const h = (horas: number, d: number) => (d < hoje ? horas : null);
    marcacoes.push(marcacao(base, "09:00", "c-fernanda", [["f-ana", h(3, base)]], 55, 20, passado, semana < 2));
    marcacoes.push(marcacao(base + 1, "09:30", "c-nuno", [["f-catia", h(2.5, base + 1)]], 45, 15, passado, semana < 2));
    if (semana % 2 === 0) marcacoes.push(marcacao(base, "14:30", "c-aurora", [["f-marta", h(4, base)], ["f-catia", h(4, base)]], 90, 0, passado && semana === 0, semana < 2));
    if (semana % 2 === 1) marcacoes.push(marcacao(base, "18:00", "c-beltrao", [["f-marta", h(5, base)]], 120, 50, false, false));
    if (base + 3 <= 28) marcacoes.push(marcacao(base + 3, "11:00", "c-al", [["f-ana", h(3, base + 3)]], 70, 30, passado, semana < 2));
    if (base + 4 <= 28) marcacoes.push(marcacao(base + 4, "15:00", "c-isabel", [["f-catia", h(3, base + 4)]], 60, 25, passado && semana < 2, semana < 2));
  }
  marcacoes.push(marcacao(17, "08:30", "c-vitor", [["f-marta", 17 < hoje ? 8 : null], ["f-ana", 17 < hoje ? 8 : null]], 180, 0, false, false));
  marcacoes.push({
    ...marcacao(12, "10:00", "c-pv", [["f-ana", 12 < hoje ? 4 : null], ["f-marta", 12 < hoje ? 4 : null]], 120, 40, 12 < hoje, false, "l-paulo"),
    origem: "paradise-villas",
    referencia_externa: "reserva-exemplo-1",
    detalhes: { nome_hospede: "Family Smith", numero_hospedes: 4, checkin: dia(5), checkout: dia(12), extras: [{ nome: "Berço", quantidade: 1 }] },
  });
  marcacoes.push({
    ...marcacao(26, "10:00", "c-pv", [], 150, 50, false, false, "l-mar"),
    origem: "paradise-villas",
    referencia_externa: "reserva-exemplo-2",
    detalhes: { nome_hospede: "M. Dupont", numero_hospedes: 6, checkin: dia(19), checkout: dia(26), extras: [] },
  });

  const despesa = (d: number, tipo: Despesa["tipo"], descricao: string, fornecedor: string, valor: number): Despesa => ({
    id: `d-${d}-${valor}`,
    data: dia(d),
    tipo,
    descricao,
    fornecedor,
    valor,
  });

  const despesas: Despesa[] = [
    despesa(2, "Produtos de limpeza", "Detergentes e desinfetante", "Makro", 68.4),
    despesa(4, "Consumíveis", "Luvas, panos microfibra e sacos", "Ikea Pro", 32.9),
    despesa(7, "Deslocações", "Combustível da carrinha", "Galp", 55),
    despesa(11, "Equipamento", "Aspirador de substituição", "Worten", 129.99),
    despesa(14, "Lavandaria", "Lavagem de mopas e panos", "Lavandaria Central", 24),
    despesa(18, "Deslocações", "Combustível da carrinha", "Galp", 48.2),
    despesa(19, "Produtos de limpeza", "Desengordurante para pós-obra", "Makro", 41.75),
    despesa(23, "Consumíveis", "Sacos de lixo industriais", "Makro", 18.5),
  ];

  return { clientes, clientes_locais, funcionarias, marcacoes, marcacoes_funcionarias, despesas };
}
