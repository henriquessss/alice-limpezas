import { mesAtual } from "./datas";
import { valorSugeridoFuncionaria, type Cliente, type Despesa, type Funcionaria, type Marcacao } from "./modelo";

type Base = {
  clientes: Cliente[];
  funcionarias: Funcionaria[];
  marcacoes: Marcacao[];
  despesas: Despesa[];
};

/** Um mês de dados fictícios para demonstrar o painel sem base de dados. */
export function dadosDeExemplo(): Base {
  const mes = mesAtual();
  const dia = (n: number) => `${mes}-${String(n).padStart(2, "0")}`;

  const funcionarias: Funcionaria[] = [
    { id: "f-ana", nome: "Ana Rocha", telefone: "912 000 001", ativa: true },
    { id: "f-marta", nome: "Marta Silva", telefone: "912 000 002", ativa: true },
    { id: "f-catia", nome: "Cátia Nunes", telefone: "912 000 003", ativa: true },
  ];

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
  ];

  const hoje = new Date().getDate();
  let n = 0;
  const marcacao = (
    d: number,
    hora: string,
    cliente_id: string,
    funcionaria_id: string,
    valor: number,
    pago: boolean,
    funcionariaPaga: boolean,
  ): Marcacao => ({
    id: `m-${++n}`,
    cliente_id,
    funcionaria_id,
    data: dia(d),
    hora,
    valor_cobrado: valor,
    valor_funcionaria: valorSugeridoFuncionaria(valor),
    cliente_pagou: pago,
    funcionaria_paga: funcionariaPaga,
    notas: null,
  });

  const marcacoes: Marcacao[] = [];
  for (let semana = 0; semana < 5; semana++) {
    const base = 1 + semana * 7;
    if (base > 28) break;
    const passado = base + 3 < hoje;
    marcacoes.push(marcacao(base, "09:00", "c-fernanda", "f-ana", 55, passado, semana < 2));
    marcacoes.push(marcacao(base + 1, "09:30", "c-nuno", "f-catia", 45, passado, semana < 2));
    if (semana % 2 === 0) marcacoes.push(marcacao(base, "14:30", "c-aurora", "f-marta", 90, passado && semana === 0, semana < 2));
    if (semana % 2 === 1) marcacoes.push(marcacao(base, "18:00", "c-beltrao", "f-marta", 120, false, false));
    if (base + 3 <= 28) marcacoes.push(marcacao(base + 3, "11:00", "c-al", "f-ana", 70, passado, semana < 2));
    if (base + 4 <= 28) marcacoes.push(marcacao(base + 4, "15:00", "c-isabel", "f-catia", 60, passado && semana < 2, semana < 2));
  }
  marcacoes.push(marcacao(17, "08:30", "c-vitor", "f-marta", 180, false, false));

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

  return { clientes, funcionarias, marcacoes, despesas };
}
