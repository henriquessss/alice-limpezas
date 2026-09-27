import { useCallback, useEffect, useState } from "react";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "./datas";
import { mensagemDeErro } from "./erros";
import type { Cliente, Despesa, Funcionaria, Marcacao } from "./modelo";
import { repositorio } from "./repositorio";

export interface DadosDoMes {
  clientes: Cliente[];
  funcionarias: Funcionaria[];
  marcacoes: Marcacao[];
  despesas: Despesa[];
}

export type EstadoDados =
  | { estado: "a_carregar" }
  | { estado: "erro"; mensagem: string }
  | ({ estado: "pronto" } & DadosDoMes);

function numero(valor: unknown): number {
  return typeof valor === "number" ? valor : Number(valor ?? 0);
}

export async function carregarMes(mes: string): Promise<DadosDoMes> {
  const entre = { de: primeiroDiaDoMes(mes), ate: ultimoDiaDoMes(mes) };
  const [clientes, funcionarias, marcacoes, despesas] = await Promise.all([
    repositorio.listar<Cliente>("clientes", { ordenar: "nome" }),
    repositorio.listar<Funcionaria>("funcionarias", { ordenar: "nome" }),
    repositorio.listar<Marcacao>("marcacoes", { entre: { coluna: "data", ...entre }, ordenar: "data" }),
    repositorio.listar<Despesa>("despesas", { entre: { coluna: "data", ...entre }, ordenar: "data" }),
  ]);
  return {
    clientes,
    funcionarias,
    // O PostgREST devolve `numeric` como string; normaliza-se aqui uma vez.
    marcacoes: marcacoes
      .map((m) => ({ ...m, valor_cobrado: numero(m.valor_cobrado), valor_funcionaria: numero(m.valor_funcionaria) }))
      .sort((a, b) => `${a.data} ${a.hora ?? ""}`.localeCompare(`${b.data} ${b.hora ?? ""}`)),
    despesas: despesas.map((d) => ({ ...d, valor: numero(d.valor) })),
  };
}

export function useDadosDoMes(mes: string): { dados: EstadoDados; recarregar: () => Promise<void> } {
  const [dados, setDados] = useState<EstadoDados>({ estado: "a_carregar" });

  const recarregar = useCallback(async () => {
    try {
      setDados({ estado: "pronto", ...(await carregarMes(mes)) });
    } catch (reason) {
      setDados({ estado: "erro", mensagem: mensagemDeErro(reason, "Não foi possível carregar os dados.") });
    }
  }, [mes]);

  useEffect(() => {
    setDados({ estado: "a_carregar" });
    void recarregar();
  }, [recarregar]);

  return { dados, recarregar };
}

export type NovaMarcacao = Omit<Marcacao, "id">;
export type NovaDespesa = Omit<Despesa, "id">;

export const operacoes = {
  criarMarcacoes: (linhas: NovaMarcacao[]) => repositorio.inserir<Marcacao>("marcacoes", linhas),
  atualizarMarcacao: (id: string, valores: Partial<NovaMarcacao>) => repositorio.atualizar("marcacoes", [id], valores),
  apagarMarcacao: (id: string) => repositorio.apagar("marcacoes", id),
  marcarFuncionariaPaga: (ids: string[]) => repositorio.atualizar("marcacoes", ids, { funcionaria_paga: true }),

  criarDespesa: (linha: NovaDespesa) => repositorio.inserir<Despesa>("despesas", [linha]),
  atualizarDespesa: (id: string, valores: Partial<NovaDespesa>) => repositorio.atualizar("despesas", [id], valores),
  apagarDespesa: (id: string) => repositorio.apagar("despesas", id),

  criarCliente: (linha: Omit<Cliente, "id" | "origem" | "referencia_externa">) =>
    repositorio.inserir<Cliente>("clientes", [{ ...linha, origem: "manual", referencia_externa: null }]),
  atualizarCliente: (id: string, valores: Partial<Omit<Cliente, "id">>) => repositorio.atualizar("clientes", [id], valores),

  criarFuncionaria: (linha: Omit<Funcionaria, "id">) => repositorio.inserir<Funcionaria>("funcionarias", [linha]),
  atualizarFuncionaria: (id: string, valores: Partial<Omit<Funcionaria, "id">>) =>
    repositorio.atualizar("funcionarias", [id], valores),
};
