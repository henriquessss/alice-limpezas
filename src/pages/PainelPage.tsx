import { useMemo, useState } from "react";
import { Carregamento } from "../components/Carregamento";
import { COR_ESTADO } from "../components/Estado";
import { FormMarcacao } from "../components/FormMarcacao";
import { IconeMais } from "../components/Icones";
import { BotaoFlutuante } from "../components/Layout";
import { SeletorMes } from "../components/SeletorMes";
import { useDadosDoMes } from "../lib/dados";
import { grelhaDoMes, hojeIso, mesDe } from "../lib/datas";
import { diaLongo, hora, moeda, moedaInteira, percentagem } from "../lib/format";
import { useMes } from "../lib/mes";
import { ROTULO_ESTADO, estadoDaMarcacao, nomeDaMarcacao, resumoDoMes, type Marcacao } from "../lib/modelo";

const DIAS_SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"];
const DIAS_SEMANA_LONGOS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

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

  const abrirNova = () => setFormulario({ modo: "nova", data: dia });

  if (dados.estado !== "pronto") {
    return (
      <>
        <Cabecalho mes={mes} mudarMes={mudarMes} aoMarcar={abrirNova} />
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
      <Cabecalho mes={mes} mudarMes={mudarMes} aoMarcar={abrirNova} />

      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 lg:grid-cols-4">
        <Kpi titulo="Receita" valor={moedaInteira(resumo!.receita)} detalhe={`${resumo!.servicos} serviços`} />
        <Kpi
          titulo="Recebido"
          valor={moedaInteira(resumo!.recebido)}
          detalhe={
            resumo!.emAtraso > 0
              ? <span className="font-semibold text-rose-700">{moedaInteira(resumo!.emAtraso)} em atraso</span>
              : `${moedaInteira(resumo!.porReceber)} por receber`
          }
        />
        <Kpi titulo="Custos" valor={moedaInteira(resumo!.custos)} detalhe={`${moedaInteira(resumo!.custoEquipa)} equipa · ${moedaInteira(resumo!.despesas)} despesas`} />
        <Kpi titulo="Lucro" valor={moedaInteira(resumo!.lucro)} detalhe={`margem ${percentagem(resumo!.margem)} · ${moedaInteira(resumo!.porPagarEquipa)} por pagar`} destaque />
      </section>

      <section className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[1fr_minmax(18rem,22rem)]">
        <div className="painel overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {DIAS_SEMANA_LONGOS.map((d, i) => (
              <div key={d} className="py-2">
                <span className="sm:hidden">{DIAS_SEMANA[i]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grelhaDoMes(mes).map((celula) => {
              const marcacoes = porDia.get(celula.iso) ?? [];
              const escolhido = celula.iso === dia;
              const eHoje = celula.iso === hoje;
              return (
                <button
                  type="button"
                  key={celula.iso}
                  onClick={() => setDiaEscolhido(celula.iso)}
                  aria-label={`${celula.iso}, ${marcacoes.length} marcações`}
                  aria-pressed={escolhido}
                  className={`min-h-[3.25rem] border-b border-r border-line p-1 text-left align-top transition sm:min-h-[5.5rem] ${
                    celula.doMes ? "bg-white" : "bg-slate-50 text-slate-400"
                  } ${escolhido ? "bg-mist ring-2 ring-inset ring-accent" : "active:bg-mist"}`}
                >
                  <span className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-xs font-semibold sm:mx-0 ${eHoje ? "bg-accent text-white" : ""}`}>
                    {Number(celula.iso.slice(8, 10))}
                  </span>
                  {/* Telemóvel: um ponto por marcação, na cor do estado. */}
                  <div className="mt-1 flex h-2 justify-center gap-0.5 sm:hidden">
                    {marcacoes.slice(0, 4).map((m) => (
                      <span key={m.id} className="h-1.5 w-1.5 rounded-full" style={{ background: COR_ESTADO[estadoDaMarcacao(m, hoje)] }} />
                    ))}
                  </div>
                  <div className="mt-0.5 hidden gap-0.5 sm:grid">
                    {marcacoes.slice(0, 3).map((m) => {
                      const cor = COR_ESTADO[estadoDaMarcacao(m, hoje)];
                      return (
                        <span key={m.id} className="truncate rounded px-1 text-[11px] leading-5 text-ink" style={{ borderLeft: `3px solid ${cor}`, background: `${cor}14` }}>
                          <span className="font-semibold">{hora(m.hora)} </span>
                          {nome(m)}
                        </span>
                      );
                    })}
                    {marcacoes.length > 3 && <span className="px-1 text-[11px] text-slate-500">+{marcacoes.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs text-slate-600">
            <Legenda cor={COR_ESTADO.recebido} rotulo="Recebido" />
            <Legenda cor={COR_ESTADO.pendente} rotulo="Pendente" />
            <Legenda cor={COR_ESTADO.em_atraso} rotulo="Em atraso" />
            <span className="ml-auto text-slate-500">{dados.marcacoes.length} no mês</span>
          </div>
        </div>

        <div className="painel self-start">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">{diaLongo(dia)}</h2>
            <button type="button" onClick={abrirNova} className="botao-secundario hidden h-8 px-3 text-xs md:inline-flex">
              + marcar
            </button>
          </div>
          {doDia.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Sem marcações neste dia.</p>
          ) : (
            <ul className="divide-y divide-line">
              {doDia.map((m) => {
                const estado = estadoDaMarcacao(m, hoje);
                return (
                  <li key={m.id}>
                    <button type="button" onClick={() => setFormulario({ modo: "editar", marcacao: m })} className="grid w-full gap-1 px-4 py-3.5 text-left active:bg-mist md:hover:bg-mist">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink">
                          <span className="mr-2 tabular-nums text-slate-500">{hora(m.hora)}</span>
                          {nome(m)}
                        </span>
                        <span className="shrink-0 tabular-nums text-sm font-semibold">{moeda(m.valor_cobrado)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                        <span>{m.funcionaria_id ? nomeFuncionaria.get(m.funcionaria_id) : <em>por atribuir</em>}</span>
                        <span style={{ color: COR_ESTADO[estado] }} className="font-semibold">{ROTULO_ESTADO[estado]}</span>
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

      <BotaoFlutuante rotulo="Nova marcação" onClick={abrirNova}>
        <IconeMais className="h-7 w-7" />
      </BotaoFlutuante>

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
    <div className="flex items-center justify-between gap-3">
      <SeletorMes mes={mes} mudarMes={mudarMes} />
      <button type="button" onClick={aoMarcar} className="botao-primario hidden md:inline-flex">+ Nova marcação</button>
    </div>
  );
}

function Kpi({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe: React.ReactNode; destaque?: boolean }) {
  return (
    <div className={`painel p-3 sm:p-4 ${destaque ? "border-sky/50 bg-mist" : ""}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${destaque ? "text-accent" : "text-slate-500"}`}>{titulo}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums sm:mt-1 sm:text-2xl ${destaque ? "text-accent" : "text-ink"}`}>{valor}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-600 sm:mt-1 sm:text-xs">{detalhe}</p>
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
