import { supabase } from "./supabase";
import { dadosDeExemplo } from "./exemplo";

export type Tabela = "clientes" | "clientes_locais" | "funcionarias" | "marcacoes" | "marcacoes_funcionarias" | "despesas";
const TABELAS: Tabela[] = ["clientes", "clientes_locais", "funcionarias", "marcacoes", "marcacoes_funcionarias", "despesas"];

export interface Intervalo {
  coluna: string;
  de: string;
  ate: string;
}

export interface Conjunto {
  coluna: string;
  valores: string[];
}

export interface OpcoesListar {
  entre?: Intervalo;
  ordenar?: string;
  igual?: Record<string, string>;
  /** `coluna in (valores)`; lista vazia devolve nada. */
  em?: Conjunto;
}

export interface Repositorio {
  listar<T>(tabela: Tabela, opcoes?: OpcoesListar): Promise<T[]>;
  inserir<T>(tabela: Tabela, linhas: Record<string, unknown>[]): Promise<T[]>;
  atualizar(tabela: Tabela, ids: string[], valores: Record<string, unknown>): Promise<void>;
  apagar(tabela: Tabela, id: string): Promise<void>;
}

function repositorioSupabase(): Repositorio {
  const cliente = supabase!;
  return {
    async listar<T>(tabela: Tabela, opcoes?: OpcoesListar) {
      if (opcoes?.em && opcoes.em.valores.length === 0) return [];
      let query = cliente.from(tabela).select("*");
      if (opcoes?.em) query = query.in(opcoes.em.coluna, opcoes.em.valores);
      if (opcoes?.entre) query = query.gte(opcoes.entre.coluna, opcoes.entre.de).lte(opcoes.entre.coluna, opcoes.entre.ate);
      for (const [coluna, valor] of Object.entries(opcoes?.igual ?? {})) query = query.eq(coluna, valor);
      if (opcoes?.ordenar) query = query.order(opcoes.ordenar);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    },
    async inserir<T>(tabela: Tabela, linhas: Record<string, unknown>[]) {
      const { data, error } = await cliente.from(tabela).insert(linhas).select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    },
    async atualizar(tabela: Tabela, ids: string[], valores: Record<string, unknown>) {
      if (ids.length === 0) return;
      const { error } = await cliente.from(tabela).update(valores).in("id", ids);
      if (error) throw new Error(error.message);
    },
    async apagar(tabela: Tabela, id: string) {
      const { error } = await cliente.from(tabela).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}

// v2: equipa por horas (marcacoes_funcionarias). Dados v1 no browser ficam ignorados.
const CHAVE_LOCAL = "alice-limpezas:dados:v2";

type Linha = Record<string, unknown> & { id: string };
type Base = Record<Tabela, Linha[]>;

function lerBase(): Base {
  const guardado = window.localStorage.getItem(CHAVE_LOCAL);
  if (guardado) {
    const base = JSON.parse(guardado) as Partial<Base>;
    for (const tabela of TABELAS) base[tabela] ??= [];
    return base as Base;
  }
  const inicial = JSON.parse(JSON.stringify(dadosDeExemplo())) as Base;
  guardarBase(inicial);
  return inicial;
}

function guardarBase(base: Base) {
  window.localStorage.setItem(CHAVE_LOCAL, JSON.stringify(base));
}

/** Modo de desenvolvimento/demonstração: tudo vive no localStorage do browser. */
function repositorioLocal(): Repositorio {
  return {
    async listar<T>(tabela: Tabela, opcoes?: OpcoesListar) {
      let linhas = lerBase()[tabela];
      const em = opcoes?.em;
      if (em) linhas = linhas.filter((l) => em.valores.includes(String(l[em.coluna])));
      const entre = opcoes?.entre;
      if (entre) linhas = linhas.filter((l) => String(l[entre.coluna]) >= entre.de && String(l[entre.coluna]) <= entre.ate);
      for (const [coluna, valor] of Object.entries(opcoes?.igual ?? {})) linhas = linhas.filter((l) => l[coluna] === valor);
      const ordenar = opcoes?.ordenar;
      if (ordenar) linhas = [...linhas].sort((a, b) => String(a[ordenar]).localeCompare(String(b[ordenar])));
      return linhas as T[];
    },
    async inserir<T>(tabela: Tabela, linhas: Record<string, unknown>[]) {
      const base = lerBase();
      const novas = linhas.map((l) => ({ ...l, id: crypto.randomUUID() }));
      base[tabela].push(...novas);
      guardarBase(base);
      return novas as T[];
    },
    async atualizar(tabela: Tabela, ids: string[], valores: Record<string, unknown>) {
      const base = lerBase();
      base[tabela] = base[tabela].map((l) => (ids.includes(l.id) ? { ...l, ...valores } : l));
      guardarBase(base);
    },
    async apagar(tabela: Tabela, id: string) {
      const base = lerBase();
      base[tabela] = base[tabela].filter((l) => l.id !== id);
      if (tabela === "marcacoes") base.marcacoes_funcionarias = base.marcacoes_funcionarias.filter((l) => l.marcacao_id !== id);
      guardarBase(base);
    },
  };
}

export const repositorio: Repositorio = supabase ? repositorioSupabase() : repositorioLocal();

export function apagarDadosLocais() {
  window.localStorage.removeItem(CHAVE_LOCAL);
}
