import { describe, expect, it } from "vitest";
import {
  despesasPorTipo,
  estadoDaMarcacao,
  nomeDaMarcacao,
  participacoesPorMarcacao,
  resumoDoMes,
  resumoPorFuncionaria,
  valorDaParticipacao,
  type Despesa,
  type Funcionaria,
  type Marcacao,
  type Participacao,
} from "./modelo";

const HOJE = "2026-09-20";

function marcacao(parcial: Partial<Marcacao>): Marcacao {
  return {
    id: parcial.id ?? crypto.randomUUID(),
    cliente_id: "c1",
    local_id: null,
    data: "2026-09-10",
    hora: "09:00",
    valor_cobrado: 100,
    valor_gestora: 0,
    cliente_pagou: false,
    notas: null,
    origem: "manual",
    referencia_externa: null,
    detalhes: null,
    ...parcial,
  };
}

function participacao(parcial: Partial<Participacao>): Participacao {
  return {
    id: parcial.id ?? crypto.randomUUID(),
    marcacao_id: "m1",
    funcionaria_id: "f1",
    horas: 2,
    taxa_hora: 10,
    valor: 20,
    paga: false,
    ...parcial,
  };
}

describe("nomeDaMarcacao", () => {
  const clientes = new Map([["c1", "Paradise Villas"]]);
  const locais = new Map([["l1", "Villa Paulo"]]);
  it("junta cliente e local quando há local", () => {
    expect(nomeDaMarcacao({ cliente_id: "c1", local_id: "l1" }, clientes, locais)).toBe("Paradise Villas · Villa Paulo");
    expect(nomeDaMarcacao({ cliente_id: "c1", local_id: null }, clientes, locais)).toBe("Paradise Villas");
    expect(nomeDaMarcacao({ cliente_id: "x", local_id: null }, clientes, locais)).toBe("—");
  });
});

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

describe("valorDaParticipacao", () => {
  it("é horas × taxa ao cêntimo, e zero sem horas", () => {
    expect(valorDaParticipacao(2.5, 8)).toBe(20);
    expect(valorDaParticipacao(1.75, 9.9)).toBe(17.33);
    expect(valorDaParticipacao(null, 10)).toBe(0);
  });
});

describe("participacoesPorMarcacao", () => {
  it("agrupa pelo id da marcação", () => {
    const mapa = participacoesPorMarcacao([participacao({ marcacao_id: "a" }), participacao({ marcacao_id: "b" }), participacao({ marcacao_id: "a" })]);
    expect(mapa.get("a")).toHaveLength(2);
    expect(mapa.get("b")).toHaveLength(1);
    expect(mapa.get("c")).toBeUndefined();
  });
});

describe("resumoDoMes", () => {
  const marcacoes = [
    marcacao({ id: "m1", data: "2026-09-01", valor_cobrado: 55, valor_gestora: 20, cliente_pagou: true }),
    marcacao({ id: "m2", data: "2026-09-15", valor_cobrado: 90, valor_gestora: 30, cliente_pagou: false }),
    marcacao({ id: "m3", data: "2026-09-25", valor_cobrado: 70, valor_gestora: 25, cliente_pagou: false }),
  ];
  const participacoes = [
    participacao({ marcacao_id: "m1", valor: 30, paga: true }),
    participacao({ marcacao_id: "m2", funcionaria_id: "f1", valor: 25 }),
    participacao({ marcacao_id: "m2", funcionaria_id: "f2", valor: 25 }),
    participacao({ marcacao_id: "m3", valor: 40 }),
  ];
  const despesas: Despesa[] = [
    { id: "d1", data: "2026-09-02", tipo: "Produtos de limpeza", descricao: "x", fornecedor: null, valor: 20 },
    { id: "d2", data: "2026-09-04", tipo: "Deslocações", descricao: "y", fornecedor: null, valor: 10 },
  ];

  it("soma receita, recebido, atraso, custos, gestora e sobra", () => {
    const r = resumoDoMes(marcacoes, participacoes, despesas, HOJE);
    expect(r.servicos).toBe(3);
    expect(r.receita).toBe(215);
    expect(r.recebido).toBe(55);
    expect(r.porReceber).toBe(160);
    expect(r.emAtraso).toBe(90);
    expect(r.custoEquipa).toBe(120);
    expect(r.despesas).toBe(30);
    expect(r.custos).toBe(150);
    expect(r.lucro).toBe(65);
    expect(r.gestora).toBe(75);
    expect(r.sobra).toBe(-10);
    expect(r.porPagarEquipa).toBe(90);
  });

  it("não aplica percentagens: despesas entram pelo valor e nada mais", () => {
    const r = resumoDoMes([], [], despesas, HOJE);
    expect(r.custos).toBe(30);
    expect(r.lucro).toBe(-30);
    expect(r.gestora).toBe(0);
  });
});

describe("resumoPorFuncionaria", () => {
  const funcionarias: Funcionaria[] = [
    { id: "f1", nome: "Ana", telefone: null, email: null, taxa_hora: 10, ativa: true },
    { id: "f2", nome: "Marta", telefone: null, email: null, taxa_hora: 12, ativa: false },
    { id: "f3", nome: "Cátia", telefone: null, email: null, taxa_hora: 0, ativa: false },
  ];
  const participacoes = [
    participacao({ id: "p1", marcacao_id: "m1", funcionaria_id: "f1", horas: 3, valor: 30, paga: true }),
    participacao({ id: "p2", marcacao_id: "m2", funcionaria_id: "f1", horas: 2.5, valor: 25 }),
    participacao({ id: "p3", marcacao_id: "m2", funcionaria_id: "f2", horas: null, valor: 0 }),
  ];

  it("agrega por funcionária, soma horas e lista o que está por pagar", () => {
    const r = resumoPorFuncionaria(funcionarias, participacoes);
    expect(r.map((x) => x.funcionaria.id)).toEqual(["f1", "f2"]);
    expect(r[0]).toMatchObject({ servicos: 2, horas: 5.5, semValor: 0, aReceber: 55, porPagar: 25, participacoesPorPagar: ["p2"] });
    expect(r[1]).toMatchObject({ servicos: 1, horas: 0, semValor: 1, aReceber: 0, porPagar: 0, participacoesPorPagar: ["p3"] });
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
