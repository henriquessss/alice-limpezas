import { useCallback, useEffect, useState } from "react";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "./datas";
import { mensagemDeErro } from "./erros";
import type { Cliente, Despesa, Funcionaria, Local, Marcacao } from "./modelo";
import { repositorio } from "./repositorio";

export interface DadosDoMes {
  clientes: Cliente[];
  locais: Local[];
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
  const [clientes, locais, funcionarias, marcacoes, despesas] = await Promise.all([
    repositorio.listar<Cliente>("clientes", { ordenar: "nome" }),
    repositorio.listar<Local>("clientes_locais", { ordenar: "nome" }),
    repositorio.listar<Funcionaria>("funcionarias", { ordenar: "nome" }),
    repositorio.listar<Marcacao>("marcacoes", { entre: { coluna: "data", ...entre }, ordenar: "data" }),
    repositorio.listar<Despesa>("despesas", { entre: { coluna: "data", ...entre }, ordenar: "data" }),
  ]);
  return {
    clientes,
    locais: locais.map((l) => ({
      ...l,
      preco_acordado: l.preco_acordado === null ? null : numero(l.preco_acordado),
      valor_funcionaria: l.valor_funcionaria === null ? null : numero(l.valor_funcionaria),
    })),
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

export type NovaMarcacao = Omit<Marcacao, "id" | "origem" | "referencia_externa" | "detalhes">;
export type NovoLocal = Omit<Local, "id" | "referencia_externa">;
export type NovaDespesa = Omit<Despesa, "id">;

export const operacoes = {
  criarMarcacoes: (linhas: NovaMarcacao[]) =>
    repositorio.inserir<Marcacao>("marcacoes", linhas.map((l) => ({ ...l, origem: "manual", referencia_externa: null, detalhes: null }))),
  atualizarMarcacao: (id: string, valores: Partial<NovaMarcacao>) => repositorio.atualizar("marcacoes", [id], valores),
  apagarMarcacao: (id: string) => repositorio.apagar("marcacoes", id),
  marcarFuncionariaPaga: (ids: string[]) => repositorio.atualizar("marcacoes", ids, { funcionaria_paga: true }),

  criarDespesa: (linha: NovaDespesa) => repositorio.inserir<Despesa>("despesas", [linha]),
  atualizarDespesa: (id: string, valores: Partial<NovaDespesa>) => repositorio.atualizar("despesas", [id], valores),
  apagarDespesa: (id: string) => repositorio.apagar("despesas", id),

  criarCliente: (linha: Omit<Cliente, "id" | "origem" | "referencia_externa">) =>
    repositorio.inserir<Cliente>("clientes", [{ ...linha, origem: "manual", referencia_externa: null }]),
  atualizarCliente: (id: string, valores: Partial<Omit<Cliente, "id">>) => repositorio.atualizar("clientes", [id], valores),

  listarLocais: (clienteId: string) => repositorio.listar<Local>("clientes_locais", { igual: { cliente_id: clienteId }, ordenar: "nome" }),
  criarLocal: (linha: NovoLocal) => repositorio.inserir<Local>("clientes_locais", [{ ...linha, referencia_externa: null }]),
  atualizarLocal: (id: string, valores: Partial<NovoLocal>) => repositorio.atualizar("clientes_locais", [id], valores),
  apagarLocal: (id: string) => repositorio.apagar("clientes_locais", id),

  criarFuncionaria: (linha: Omit<Funcionaria, "id">) => repositorio.inserir<Funcionaria>("funcionarias", [linha]),
  atualizarFuncionaria: (id: string, valores: Partial<Omit<Funcionaria, "id">>) =>
    repositorio.atualizar("funcionarias", [id], valores),
};
