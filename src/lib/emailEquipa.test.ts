import { describe, expect, it } from "vitest";
import { emailDaMarcacao, emailDoPlano, mailto, moradaDaMarcacao, type Nomes } from "./emailEquipa";
import type { Cliente, Funcionaria, Local, Marcacao } from "./modelo";

const cliente: Cliente = { id: "c1", nome: "Paradise Villas", morada: "Algarve", telefone: null, email: null, notas: null, ativo: true, origem: "paradise-villas", referencia_externa: "pv" };
const local: Local = { id: "l1", cliente_id: "c1", nome: "Villa Paulo", morada: "Vale do Lobo, lote 3", preco_acordado: 120, valor_funcionaria: 60, ativo: true, referencia_externa: "v1" };
const ana: Funcionaria = { id: "f1", nome: "Ana Rocha", telefone: null, email: "ana@exemplo.pt", ativa: true };
const nomes: Nomes = { clientes: new Map([[cliente.id, cliente]]), locais: new Map([[local.id, local]]) };

const marcacao: Marcacao = {
  id: "m1", cliente_id: "c1", local_id: "l1", funcionaria_id: "f1", data: "2026-10-08", hora: "10:00:00",
  valor_cobrado: 120, valor_funcionaria: 60, cliente_pagou: false, funcionaria_paga: false, notas: "Chave na caixa",
  origem: "paradise-villas", referencia_externa: "r1",
  detalhes: { nome_hospede: "Smith", numero_hospedes: 4, checkin: "2026-10-01", checkout: "2026-10-08", extras: [{ nome: "Berço", quantidade: 1 }] },
};

describe("moradaDaMarcacao", () => {
  it("prefere a morada do local e cai na do cliente", () => {
    expect(moradaDaMarcacao(marcacao, nomes)).toBe("Vale do Lobo, lote 3");
    expect(moradaDaMarcacao({ cliente_id: "c1", local_id: null }, nomes)).toBe("Algarve");
  });
});

describe("emailDaMarcacao", () => {
  it("escreve quando, onde, morada, extras e notas", () => {
    const { assunto, corpo } = emailDaMarcacao(marcacao, ana, nomes);
    expect(assunto).toBe("Limpeza 08/10 10:00 — Paradise Villas · Villa Paulo");
    expect(corpo).toContain("Olá Ana,");
    expect(corpo).toContain("às 10:00");
    expect(corpo).toContain("Morada: Vale do Lobo, lote 3");
    expect(corpo).toContain("Hóspedes: 4");
    expect(corpo).toContain("Extras: 1× Berço");
    expect(corpo).toContain("Notas: Chave na caixa");
  });
});

describe("emailDoPlano", () => {
  it("ordena por hora e conta as limpezas", () => {
    const tarde = { ...marcacao, id: "m2", hora: "15:00", local_id: null, notas: null, detalhes: null };
    const { assunto, corpo } = emailDoPlano("2026-10-08", ana, [tarde, marcacao], nomes);
    expect(assunto).toMatch(/^Plano de /);
    expect(corpo).toContain("2 limpezas");
    expect(corpo.indexOf("10:00")).toBeLessThan(corpo.indexOf("15:00"));
  });
});

describe("mailto", () => {
  it("codifica destinatário, assunto e corpo com quebras de linha", () => {
    const url = mailto("ana@exemplo.pt", "Olá & adeus", "linha 1\nlinha 2");
    expect(url).toBe("mailto:ana%40exemplo.pt?subject=Ol%C3%A1%20%26%20adeus&body=linha%201%0Alinha%202");
  });
});
