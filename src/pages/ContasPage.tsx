import { useState } from "react";
import { Carregamento } from "../components/Carregamento";
import { Estado } from "../components/Estado";
import { FormDespesa } from "../components/FormDespesa";
import { SeletorMes } from "../components/SeletorMes";
import { operacoes, useDadosDoMes } from "../lib/dados";
import { hojeIso } from "../lib/datas";
import { mensagemDeErro } from "../lib/erros";
import { diaMes, moeda, percentagem } from "../lib/format";
import { useMes } from "../lib/mes";
import { CORES_DESPESA, despesasPorTipo, estadoDaMarcacao, nomeDaMarcacao, resumoPorFuncionaria, type Despesa } from "../lib/modelo";

type Formulario = { modo: "fechado" } | { modo: "nova" } | { modo: "editar"; despesa: Despesa };

export function ContasPage() {
  const { mes, mudarMes } = useMes();
  const { dados, recarregar } = useDadosDoMes(mes);
  const hoje = hojeIso();
  const [formulario, setFormulario] = useState<Formulario>({ modo: "fechado" });
  const [erro, setErro] = useState<string>();
  const [ocupado, setOcupado] = useState(false);
  // "cliente:<id>" ou "local:<id>"; vazio = tudo. Só filtra a tabela de receitas.
  const [filtro, setFiltro] = useState("");

  const executar = async (acao: () => Promise<unknown>, fallback: string) => {
    setErro(undefined);
    setOcupado(true);
    try {
      await acao();
      await recarregar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, fallback));
    } finally {
      setOcupado(false);
    }
  };

  const cabecalho = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-ink">Contas</h1>
        <p className="text-sm text-slate-500">Receitas, pagamentos à equipa e despesas</p>
      </div>
      <SeletorMes mes={mes} mudarMes={mudarMes} />
    </div>
  );

  if (dados.estado !== "pronto") return <>{cabecalho}<div className="mt-6"><Carregamento dados={dados} /></div></>;

  const nomeCliente = new Map(dados.clientes.map((c) => [c.id, c.nome]));
  const nomeLocal = new Map(dados.locais.map((l) => [l.id, l.nome]));
  const [tipoFiltro, idFiltro] = filtro.split(":");
  const receitas = dados.marcacoes.filter((m) =>
    !filtro || (tipoFiltro === "cliente" ? m.cliente_id === idFiltro : m.local_id === idFiltro),
  );
  const clientesComMarcacoes = dados.clientes.filter((c) => dados.marcacoes.some((m) => m.cliente_id === c.id));
  const equipa = resumoPorFuncionaria(dados.funcionarias, dados.marcacoes);
  const totalEquipa = equipa.reduce((s, r) => s + r.aReceber, 0);
  const totalPorPagar = equipa.reduce((s, r) => s + r.porPagar, 0);
  const porTipo = despesasPorTipo(dados.despesas);
  const totalDespesas = dados.despesas.reduce((s, d) => s + d.valor, 0);
  const totalReceita = receitas.reduce((s, m) => s + m.valor_cobrado, 0);

  return (
    <>
      {cabecalho}
      {erro && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</div>}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="painel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Receitas do mês</h2>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:inline">clicar no estado para alterar</span>
              {clientesComMarcacoes.length > 0 && (
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar receitas" className="h-8 rounded-full border border-line bg-white px-2 text-xs">
                  <option value="">Todos os clientes</option>
                  {clientesComMarcacoes.map((c) => {
                    const locais = dados.locais.filter((l) => l.cliente_id === c.id && dados.marcacoes.some((m) => m.local_id === l.id));
                    return [
                      <option key={c.id} value={`cliente:${c.id}`}>{c.nome}</option>,
                      ...locais.map((l) => <option key={l.id} value={`local:${l.id}`}>{`  · ${l.nome}`}</option>),
                    ];
                  })}
                </select>
              )}
            </div>
          </div>
          {receitas.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Sem marcações neste mês.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Data</th>
                  <th className="px-2 py-2 font-semibold">Cliente</th>
                  <th className="px-2 py-2 text-right font-semibold">Valor</th>
                  <th className="px-4 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {receitas.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 tabular-nums text-slate-600">{diaMes(m.data)}</td>
                    <td className="px-2 py-2 text-ink">{nomeDaMarcacao(m, nomeCliente, nomeLocal)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{moeda(m.valor_cobrado)}</td>
                    <td className="px-4 py-2">
                      <Estado
                        estado={estadoDaMarcacao(m, hoje)}
                        onClick={ocupado ? undefined : () => void executar(() => operacoes.atualizarMarcacao(m.id, { cliente_pagou: !m.cliente_pagou }), "Não foi possível alterar o estado.")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="px-4 py-2" colSpan={2}>Total</td>
                  <td className="px-2 py-2 text-right tabular-nums">{moeda(totalReceita)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div className="painel self-start overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Pagamentos à equipa</h2>
            <span className="text-xs text-slate-500">valor a pagar por funcionária</span>
          </div>
          {equipa.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Sem funcionárias. Crie-as na página Equipa.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Funcionária</th>
                  <th className="px-2 py-2 text-right font-semibold">Serviços</th>
                  <th className="px-2 py-2 text-right font-semibold">A receber</th>
                  <th className="px-2 py-2 text-right font-semibold">Por pagar</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {equipa.map((r) => (
                  <tr key={r.funcionaria.id}>
                    <td className="px-4 py-2 text-ink">{r.funcionaria.nome}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{r.servicos}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{moeda(r.aReceber)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {r.porPagar > 0 ? <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">{moeda(r.porPagar)}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {r.porPagar > 0 && (
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => {
                            if (window.confirm(`Marcar ${moeda(r.porPagar)} como pago a ${r.funcionaria.nome}?`)) {
                              void executar(() => operacoes.marcarFuncionariaPaga(r.marcacoesPorPagar), "Não foi possível registar o pagamento.");
                            }
                          }}
                          className="botao-secundario h-8 px-3 text-xs"
                        >
                          Marcar pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-semibold">
                  <td className="px-4 py-2" colSpan={2}>Total equipa</td>
                  <td className="px-2 py-2 text-right tabular-nums">{moeda(totalEquipa)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{moeda(totalPorPagar)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </section>

      <section className="painel mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Despesas do mês</h2>
          <button type="button" onClick={() => setFormulario({ modo: "nova" })} className="botao-secundario h-8 px-3 text-xs">+ Nova despesa</button>
        </div>
        <div className="grid grid-cols-2 gap-4 border-b border-line px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
          {porTipo.map((t) => (
            <div key={t.tipo}>
              <p className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-sm" style={{ background: CORES_DESPESA[t.tipo] }} />
                {t.tipo}
              </p>
              <p className="mt-1 font-semibold tabular-nums text-ink">{moeda(t.valor)}</p>
              <div className="mt-1 h-1 rounded-full bg-slate-100">
                <div className="h-1 rounded-full" style={{ width: `${Math.round(t.fracao * 100)}%`, background: CORES_DESPESA[t.tipo] }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{percentagem(t.fracao)} das despesas</p>
            </div>
          ))}
        </div>
        {dados.despesas.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Sem despesas neste mês.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Data</th>
                <th className="hidden px-2 py-2 font-semibold sm:table-cell">Tipo</th>
                <th className="px-2 py-2 font-semibold">Descrição</th>
                <th className="px-2 py-2 text-right font-semibold">Valor</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dados.despesas.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2 tabular-nums text-slate-600">{diaMes(d.data)}</td>
                  <td className="hidden px-2 py-2 sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs">
                      <span className="h-2 w-2 rounded-sm" style={{ background: CORES_DESPESA[d.tipo] }} />
                      {d.tipo}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-ink">
                    {d.descricao}
                    {d.fornecedor && <span className="text-slate-500"> · {d.fornecedor}</span>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{moeda(d.valor)}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => setFormulario({ modo: "editar", despesa: d })} className="botao-secundario h-8 px-3 text-xs">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-semibold">
                <td className="px-4 py-2" colSpan={3}>Total de despesas · {dados.despesas.length} registos</td>
                <td className="px-2 py-2 text-right tabular-nums">{moeda(totalDespesas)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {formulario.modo !== "fechado" && (
        <FormDespesa
          despesa={formulario.modo === "editar" ? formulario.despesa : undefined}
          aoFechar={() => setFormulario({ modo: "fechado" })}
          aoGuardar={recarregar}
        />
      )}
    </>
  );
}
