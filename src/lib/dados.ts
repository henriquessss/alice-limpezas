import { useCallback, useEffect, useState } from "react";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "./datas";
import { mensagemDeErro } from "./erros";
import type { Cliente, Despesa, Funcionaria, Local, Marcacao, Participacao } from "./modelo";
import { repositorio } from "./repositorio";

export interface DadosDoMes {
  clientes: Cliente[];
  locais: Local[];
  funcionarias: Funcionaria[];
  marcacoes: Marcacao[];
  /** Participações das marcações do mês (quem fez cada limpeza e quanto recebe). */
  participacoes: Participacao[];
  despesas: Despesa[];
}

export type EstadoDados =
  | { estado: "a_carregar" }
  | { estado: "erro"; mensagem: string }
  | ({ estado: "pronto" } & DadosDoMes);

function numero(valor: unknown): number {
  return typeof valor === "number" ? valor : Number(valor ?? 0);
}

function numeroOuNulo(valor: unknown): number | null {
  return valor === null || valor === undefined ? null : numero(valor);
}

// O PostgREST devolve `numeric` como string; normaliza-se aqui uma vez.
function normalizarParticipacao(p: Participacao): Participacao {
  return { ...p, horas: numeroOuNulo(p.horas), taxa_hora: numero(p.taxa_hora), valor: numero(p.valor) };
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
  const participacoes = await repositorio.listar<Participacao>("marcacoes_funcionarias", {
    em: { coluna: "marcacao_id", valores: marcacoes.map((m) => m.id) },
  });
  return {
    clientes,
    locais: locais.map((l) => ({ ...l, preco_acordado: numeroOuNulo(l.preco_acordado), valor_gestora: numeroOuNulo(l.valor_gestora) })),
    funcionarias: funcionarias.map((f) => ({ ...f, taxa_hora: numero(f.taxa_hora) })),
    marcacoes: marcacoes
      .map((m) => ({ ...m, valor_cobrado: numero(m.valor_cobrado), valor_gestora: numero(m.valor_gestora) }))
      .sort((a, b) => `${a.data} ${a.hora ?? ""}`.localeCompare(`${b.data} ${b.hora ?? ""}`)),
    participacoes: participacoes.map(normalizarParticipacao),
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
export type NovaParticipacao = Omit<Participacao, "id" | "marcacao_id">;
export type NovoLocal = Omit<Local, "id" | "referencia_externa">;
export type NovaDespesa = Omit<Despesa, "id">;

async function inserirEquipa(marcacaoIds: string[], equipa: NovaParticipacao[]) {
  if (marcacaoIds.length === 0 || equipa.length === 0) return;
  await repositorio.inserir<Participacao>(
    "marcacoes_funcionarias",
    marcacaoIds.flatMap((marcacao_id) => equipa.map((p) => ({ ...p, marcacao_id }))),
  );
}

export const operacoes = {
  /** Cria as marcações e, em cada uma, a mesma equipa. */
  criarMarcacoes: async (linhas: NovaMarcacao[], equipa: NovaParticipacao[]) => {
    const criadas = await repositorio.inserir<Marcacao>(
      "marcacoes",
      linhas.map((l) => ({ ...l, origem: "manual", referencia_externa: null, detalhes: null })),
    );
    await inserirEquipa(criadas.map((m) => m.id), equipa);
    return criadas;
  },
  atualizarMarcacao: (id: string, valores: Partial<NovaMarcacao>) => repositorio.atualizar("marcacoes", [id], valores),
  apagarMarcacao: (id: string) => repositorio.apagar("marcacoes", id),

  /**
   * Alinha a equipa de uma marcação com a lista nova: quem saiu é apagada,
   * quem ficou é atualizada, quem entrou é inserida. Participações pagas
   * de quem saiu ficam (é histórico financeiro).
   */
  guardarEquipa: async (marcacaoId: string, atuais: Participacao[], novas: NovaParticipacao[]) => {
    const porFuncionaria = new Map(atuais.map((p) => [p.funcionaria_id, p]));
    const mantidas = new Set<string>();
    const aInserir: NovaParticipacao[] = [];
    for (const nova of novas) {
      const atual = porFuncionaria.get(nova.funcionaria_id);
      if (!atual) {
        aInserir.push(nova);
        continue;
      }
      mantidas.add(atual.id);
      const mudou = atual.horas !== nova.horas || atual.taxa_hora !== nova.taxa_hora || atual.valor !== nova.valor || atual.paga !== nova.paga;
      if (mudou) await repositorio.atualizar("marcacoes_funcionarias", [atual.id], nova);
    }
    for (const atual of atuais) {
      if (!mantidas.has(atual.id) && !atual.paga) await repositorio.apagar("marcacoes_funcionarias", atual.id);
    }
    await inserirEquipa([marcacaoId], aInserir);
  },
  atualizarParticipacao: (id: string, valores: Partial<NovaParticipacao>) => repositorio.atualizar("marcacoes_funcionarias", [id], valores),
  marcarParticipacoesPagas: (ids: string[]) => repositorio.atualizar("marcacoes_funcionarias", ids, { paga: true }),

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
