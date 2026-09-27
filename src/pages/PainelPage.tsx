import { useMemo, useState } from "react";
import { Carregamento } from "../components/Carregamento";
import { COR_ESTADO } from "../components/Estado";
import { FormMarcacao } from "../components/FormMarcacao";
import { SeletorMes } from "../components/SeletorMes";
import { useDadosDoMes } from "../lib/dados";
import { grelhaDoMes, hojeIso, mesDe } from "../lib/datas";
import { diaLongo, hora, moeda, moedaInteira, percentagem } from "../lib/format";
import { useMes } from "../lib/mes";
import { estadoDaMarcacao, nomeDaMarcacao, resumoDoMes, type Marcacao } from "../lib/modelo";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type Formulario = { modo: "fechado" } | { modo: "nova"; data?: string } | { modo: "editar"; marcacao: Marcacao };

export function PainelPage() {
  const { mes, mudarMes } = useMes();
  const { dados, recarregar } = useDadosDoMes(mes);
  const hoje = hojeIso();
  const [diaEscolhido, setDiaEscolhido] = useState<string>(() => (mesDe(hoje) === mes ? hoje : `${mes}-01`));
  const [formulario, setFormulario] = useState<Formulario>({ modo: "fechado" });

  const dia = mesDe(diaEscolhido) === mes ? diaEscolhido : `${mes}-01`;

  const resumo = useMemo(
    () => (dados.estado === "pronto" ? resumoDoMes(dados.marcacoes, dados.despesas, hoje) : undefined),
    [dados, hoje],
  );

  if (dados.estado !== "pronto") {
    return (
      <>
        <Cabecalho mes={mes} mudarMes={mudarMes} aoMarcar={() => setFormulario({ modo: "nova" })} />
        <Carregamento dados={dados} />
      </>
    );
  }

  const nomeCliente = new Map(dados.clientes.map((c) => [c.id, c.nome]));
  const nomeLocal = new Map(dados.locais.map((l) => [l.id, l.nome]));
  const nome = (m: Marcacao) => nomeDaMarcacao(m, nomeCliente, nomeLocal);
  const nomeFuncionaria = new Map(dados.funcionarias.map((f) => [f.id, f.nome]));
  const porDia = new Map<string, Marcacao[]>();
  for (const m of dados.marcacoes) porDia.set(m.data, [...(porDia.get(m.data) ?? []), m]);
  const doDia = porDia.get(dia) ?? [];

  return (
    <>
      <Cabecalho mes={mes} mudarMes={mudarMes} aoMarcar={() => setFormulario({ modo: "nova", data: dia })} />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Receita do mês" valor={moedaInteira(resumo!.receita)} detalhe={`${resumo!.servicos} serviços marcados`} />
        <Kpi
          titulo="Recebido"
          valor={moedaInteira(resumo!.recebido)}
          detalhe={
            <>
              {moedaInteira(resumo!.porReceber)} por receber
              {resumo!.emAtraso > 0 && <> · <span className="font-semibold text-rose-700">{moedaInteira(resumo!.emAtraso)} em atraso</span></>}
            </>
          }
        />
        <Kpi titulo="Custos do mês" valor={moedaInteira(resumo!.custos)} detalhe={`${moedaInteira(resumo!.custoEquipa)} equipa · ${moedaInteira(resumo!.despesas)} despesas`} />
        <Kpi
          titulo="Lucro do mês"
          valor={moedaInteira(resumo!.lucro)}
          detalhe={`margem ${percentagem(resumo!.margem)} · ${moedaInteira(resumo!.porPagarEquipa)} por pagar à equipa`}
          destaque
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_minmax(18rem,22rem)]">
        <div className="painel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Calendário</h2>
            <span className="text-xs text-slate-500">{dados.marcacoes.length} marcações</span>
          </div>
          <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {DIAS_SEMANA.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {grelhaDoMes(mes).map((celula) => {
              const marcacoes = porDia.get(celula.iso) ?? [];
              const escolhido = celula.iso === dia;
              return (
                <button
                  type="button"
                  key={celula.iso}
                  onClick={() => setDiaEscolhido(celula.iso)}
                  className={`min-h-[4.75rem] border-b border-r border-line p-1 text-left align-top transition sm:min-h-[5.5rem] ${
                    celula.doMes ? "bg-white hover:bg-sand" : "bg-slate-50 text-slate-400"
                  } ${escolhido ? "ring-2 ring-inset ring-accent" : ""}`}
                >
                  <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${celula.iso === hoje ? "bg-accent text-white" : ""}`}>
                    {Number(celula.iso.slice(8, 10))}
                  </span>
                  <div className="mt-0.5 grid gap-0.5">
                    {marcacoes.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className="truncate rounded px-1 text-[11px] leading-5 text-ink"
                        style={{ borderLeft: `3px solid ${COR_ESTADO[estadoDaMarcacao(m, hoje)]}`, background: `${COR_ESTADO[estadoDaMarcacao(m, hoje)]}14` }}
                      >
                        <span className="hidden font-semibold sm:inline">{hora(m.hora)} </span>
                        {nome(m)}
                      </span>
                    ))}
                    {marcacoes.length > 3 && <span className="px-1 text-[11px] text-slate-500">+{marcacoes.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-slate-600">
            <Legenda cor={COR_ESTADO.recebido} rotulo="Recebido" />
            <Legenda cor={COR_ESTADO.pendente} rotulo="Pendente" />
            <Legenda cor={COR_ESTADO.em_atraso} rotulo="Em atraso" />
          </div>
        </div>

        <div className="painel self-start">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">{diaLongo(dia)}</h2>
            <button type="button" onClick={() => setFormulario({ modo: "nova", data: dia })} className="botao-secundario h-8 px-3 text-xs">
              + marcar
            </button>
          </div>
          {doDia.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Sem marcações neste dia.</p>
          ) : (
            <ul className="divide-y divide-line">
              {doDia.map((m) => {
                const estado = estadoDaMarcacao(m, hoje);
                return (
                  <li key={m.id}>
                    <button type="button" onClick={() => setFormulario({ modo: "editar", marcacao: m })} className="grid w-full gap-1 px-4 py-3 text-left hover:bg-sand">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink">
                          <span className="mr-2 tabular-nums text-slate-500">{hora(m.hora)}</span>
                          {nome(m)}
                        </span>
                        <span className="tabular-nums text-sm font-semibold">{moeda(m.valor_cobrado)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                        <span>{m.funcionaria_id ? nomeFuncionaria.get(m.funcionaria_id) : <em>por atribuir</em>}</span>
                        <span style={{ color: COR_ESTADO[estado] }} className="font-semibold">
                          {estado === "recebido" ? "Recebido" : estado === "pendente" ? "Pendente" : "Em atraso"}
                        </span>
                      </div>
                      {m.notas && <p className="text-xs text-slate-500">{m.notas}</p>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {formulario.modo !== "fechado" && (
        <FormMarcacao
          clientes={dados.clientes}
          locais={dados.locais}
          funcionarias={dados.funcionarias}
          marcacao={formulario.modo === "editar" ? formulario.marcacao : undefined}
          dataInicial={formulario.modo === "nova" ? formulario.data : undefined}
          aoFechar={() => setFormulario({ modo: "fechado" })}
          aoGuardar={recarregar}
        />
      )}
    </>
  );
}

function Cabecalho({ mes, mudarMes, aoMarcar }: { mes: string; mudarMes: (m: string) => void; aoMarcar: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-ink">Marcações e contas</h1>
        <p className="text-sm text-slate-500">Painel da gestora · serviços de limpeza</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SeletorMes mes={mes} mudarMes={mudarMes} />
        <button type="button" onClick={aoMarcar} className="botao-primario">+ Nova marcação</button>
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe: React.ReactNode; destaque?: boolean }) {
  return (
    <div className={`painel p-4 ${destaque ? "border-accent/40 bg-emerald-50/60" : ""}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wider ${destaque ? "text-accent" : "text-slate-500"}`}>{titulo}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${destaque ? "text-accent" : "text-ink"}`}>{valor}</p>
      <p className="mt-1 text-xs text-slate-600">{detalhe}</p>
    </div>
  );
}

function Legenda({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: cor }} />
      {rotulo}
    </span>
  );
}
