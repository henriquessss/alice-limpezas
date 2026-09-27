import { describe, expect, it } from "vitest";
import {
  despesasPorTipo,
  estadoDaMarcacao,
  resumoDoMes,
  resumoPorFuncionaria,
  valorSugeridoFuncionaria,
  type Despesa,
  type Funcionaria,
  type Marcacao,
} from "./modelo";

const HOJE = "2026-09-20";

function marcacao(parcial: Partial<Marcacao>): Marcacao {
  return {
    id: parcial.id ?? crypto.randomUUID(),
    cliente_id: "c1",
    funcionaria_id: "f1",
    data: "2026-09-10",
    hora: "09:00",
    valor_cobrado: 100,
    valor_funcionaria: 55,
    cliente_pagou: false,
    funcionaria_paga: false,
    notas: null,
    ...parcial,
  };
}

describe("estadoDaMarcacao", () => {
  it("é recebido quando o cliente pagou, independentemente da data", () => {
    expect(estadoDaMarcacao({ data: "2026-09-01", cliente_pagou: true }, HOJE)).toBe("recebido");
    expect(estadoDaMarcacao({ data: "2026-09-30", cliente_pagou: true }, HOJE)).toBe("recebido");
  });

  it("é em atraso só quando a data já passou", () => {
    expect(estadoDaMarcacao({ data: "2026-09-19", cliente_pagou: false }, HOJE)).toBe("em_atraso");
    expect(estadoDaMarcacao({ data: "2026-09-20", cliente_pagou: false }, HOJE)).toBe("pendente");
    expect(estadoDaMarcacao({ data: "2026-09-21", cliente_pagou: false }, HOJE)).toBe("pendente");
  });
});

describe("valorSugeridoFuncionaria", () => {
  it("é 55% arredondado ao cêntimo", () => {
    expect(valorSugeridoFuncionaria(55)).toBe(30.25);
    expect(valorSugeridoFuncionaria(90)).toBe(49.5);
  });
});

describe("resumoDoMes", () => {
  const marcacoes = [
    marcacao({ data: "2026-09-01", valor_cobrado: 55, valor_funcionaria: 30, cliente_pagou: true, funcionaria_paga: true }),
    marcacao({ data: "2026-09-15", valor_cobrado: 90, valor_funcionaria: 50, cliente_pagou: false }),
    marcacao({ data: "2026-09-25", valor_cobrado: 70, valor_funcionaria: 40, cliente_pagou: false }),
  ];
  const despesas: Despesa[] = [
    { id: "d1", data: "2026-09-02", tipo: "Produtos de limpeza", descricao: "x", fornecedor: null, valor: 20 },
    { id: "d2", data: "2026-09-04", tipo: "Deslocações", descricao: "y", fornecedor: null, valor: 10 },
  ];

  it("soma receita, recebido, atraso, custos e lucro", () => {
    const r = resumoDoMes(marcacoes, despesas, HOJE);
    expect(r.servicos).toBe(3);
    expect(r.receita).toBe(215);
    expect(r.recebido).toBe(55);
    expect(r.porReceber).toBe(160);
    expect(r.emAtraso).toBe(90);
    expect(r.custoEquipa).toBe(120);
    expect(r.despesas).toBe(30);
    expect(r.custos).toBe(150);
    expect(r.lucro).toBe(65);
    expect(r.margem).toBeCloseTo(65 / 215);
    expect(r.porPagarEquipa).toBe(90);
  });

  it("tem margem zero sem receita", () => {
    expect(resumoDoMes([], despesas, HOJE).margem).toBe(0);
  });
});

describe("resumoPorFuncionaria", () => {
  const funcionarias: Funcionaria[] = [
    { id: "f1", nome: "Ana", telefone: null, ativa: true },
    { id: "f2", nome: "Marta", telefone: null, ativa: false },
    { id: "f3", nome: "Cátia", telefone: null, ativa: false },
  ];
  const marcacoes = [
    marcacao({ id: "m1", funcionaria_id: "f1", valor_funcionaria: 30, funcionaria_paga: true }),
    marcacao({ id: "m2", funcionaria_id: "f1", valor_funcionaria: 25 }),
    marcacao({ id: "m3", funcionaria_id: "f2", valor_funcionaria: 40 }),
  ];

  it("agrega por funcionária e lista as marcações por pagar", () => {
    const r = resumoPorFuncionaria(funcionarias, marcacoes);
    expect(r.map((x) => x.funcionaria.id)).toEqual(["f1", "f2"]);
    expect(r[0]).toMatchObject({ servicos: 2, aReceber: 55, porPagar: 25, marcacoesPorPagar: ["m2"] });
    expect(r[1]).toMatchObject({ servicos: 1, aReceber: 40, porPagar: 40, marcacoesPorPagar: ["m3"] });
  });
});

describe("despesasPorTipo", () => {
  it("dá fração do total por tipo, com todos os tipos presentes", () => {
    const r = despesasPorTipo([
      { id: "d1", data: "2026-09-02", tipo: "Lavandaria", descricao: "x", fornecedor: null, valor: 25 },
      { id: "d2", data: "2026-09-04", tipo: "Lavandaria", descricao: "y", fornecedor: null, valor: 25 },
      { id: "d3", data: "2026-09-04", tipo: "Outros", descricao: "z", fornecedor: null, valor: 50 },
    ]);
    expect(r).toHaveLength(6);
    expect(r.find((x) => x.tipo === "Lavandaria")).toMatchObject({ valor: 50, fracao: 0.5 });
    expect(r.find((x) => x.tipo === "Equipamento")).toMatchObject({ valor: 0, fracao: 0 });
  });
});
