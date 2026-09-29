import { useState, type FormEvent } from "react";
import { operacoes, type NovaMarcacao, type NovaParticipacao } from "../lib/dados";
import { somarDias } from "../lib/datas";
import { mensagemDeErro } from "../lib/erros";
import { emailDaMarcacao, mailto } from "../lib/emailEquipa";
import { dataCurta, moeda } from "../lib/format";
import { valorDaParticipacao, type Cliente, type Funcionaria, type Local, type Marcacao, type Participacao } from "../lib/modelo";
import { Dialogo } from "./Dialogo";

interface Props {
  clientes: Cliente[];
  locais: Local[];
  funcionarias: Funcionaria[];
  /** Sem `marcacao` cria; com `marcacao` edita. */
  marcacao?: Marcacao;
  /** Equipa atual da marcação em edição. */
  participacoes?: Participacao[];
  dataInicial?: string;
  aoFechar: () => void;
  aoGuardar: () => Promise<void>;
}

/** Uma funcionária no formulário; os números ficam em texto até gravar. */
interface LinhaEquipa {
  funcionaria_id: string;
  horas: string;
  taxa: string;
  valor: string;
  /** A gestora escreveu o valor à mão: as horas deixam de o recalcular. */
  valorManual: boolean;
  paga: boolean;
}

function texto(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

function numero(valor: string): number {
  return Number(valor.replace(",", ".")) || 0;
}

function numeroOuNulo(valor: string): number | null {
  return valor.trim() === "" ? null : numero(valor);
}

function linhaDe(p: Participacao): LinhaEquipa {
  return {
    funcionaria_id: p.funcionaria_id,
    horas: texto(p.horas),
    taxa: texto(p.taxa_hora),
    valor: texto(p.valor),
    valorManual: p.valor !== valorDaParticipacao(p.horas, p.taxa_hora),
    paga: p.paga,
  };
}

function participacaoDe(l: LinhaEquipa): NovaParticipacao {
  const horas = numeroOuNulo(l.horas);
  const taxa_hora = numero(l.taxa);
  return {
    funcionaria_id: l.funcionaria_id,
    horas,
    taxa_hora,
    valor: l.valorManual ? numero(l.valor) : valorDaParticipacao(horas, taxa_hora),
    paga: l.paga,
  };
}

export function FormMarcacao({ clientes, locais, funcionarias, marcacao, participacoes = [], dataInicial, aoFechar, aoGuardar }: Props) {
  const [clienteId, setClienteId] = useState(marcacao?.cliente_id ?? clientes[0]?.id ?? "");
  const [localId, setLocalId] = useState(marcacao?.local_id ?? "");
  const [data, setData] = useState(marcacao?.data ?? dataInicial ?? "");
  const [hora, setHora] = useState(marcacao?.hora?.slice(0, 5) ?? "09:00");
  const [valorCobrado, setValorCobrado] = useState(texto(marcacao?.valor_cobrado));
  const [valorGestora, setValorGestora] = useState(texto(marcacao?.valor_gestora));
  const [equipa, setEquipa] = useState<LinhaEquipa[]>(participacoes.map(linhaDe));
  const [clientePagou, setClientePagou] = useState(marcacao?.cliente_pagou ?? false);
  const [notas, setNotas] = useState(marcacao?.notas ?? "");
  const [repetirAte, setRepetirAte] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const locaisDoCliente = locais.filter((l) => l.cliente_id === clienteId && (l.ativo || l.id === localId));
  const integracao = marcacao && marcacao.origem !== "manual";
  const nomeFuncionaria = new Map(funcionarias.map((f) => [f.id, f]));
  const disponiveis = funcionarias.filter((f) => f.ativa && !equipa.some((l) => l.funcionaria_id === f.id));

  const cobrado = numero(valorCobrado);
  const gestora = numero(valorGestora);
  const totalEquipa = equipa.reduce((soma, l) => soma + participacaoDe(l).valor, 0);
  const sobra = cobrado - totalEquipa - gestora;

  const mudarCliente = (id: string) => {
    setClienteId(id);
    setLocalId("");
  };

  // Escolher um local preenche os valores acordados; a gestora pode corrigir depois.
  const mudarLocal = (id: string) => {
    setLocalId(id);
    const local = locais.find((l) => l.id === id);
    if (!local) return;
    if (local.preco_acordado !== null) setValorCobrado(String(local.preco_acordado));
    if (local.valor_gestora !== null) setValorGestora(String(local.valor_gestora));
  };

  const juntar = (funcionariaId: string) => {
    const f = nomeFuncionaria.get(funcionariaId);
    if (!f) return;
    setEquipa([...equipa, { funcionaria_id: f.id, horas: "", taxa: String(f.taxa_hora), valor: "", valorManual: false, paga: false }]);
  };

  const mudarLinha = (indice: number, mudanca: Partial<LinhaEquipa>) => {
    setEquipa(equipa.map((l, i) => {
      if (i !== indice) return l;
      const nova = { ...l, ...mudanca };
      if (!nova.valorManual) {
        const calculado = valorDaParticipacao(numeroOuNulo(nova.horas), numero(nova.taxa));
        nova.valor = calculado > 0 ? String(calculado) : "";
      }
      return nova;
    }));
  };

  const tirar = (indice: number) => setEquipa(equipa.filter((_, i) => i !== indice));

  const submeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(undefined);
    if (!clienteId) return setErro("Escolha o cliente.");
    if (!data) return setErro("Indique a data.");
    const base: NovaMarcacao = {
      cliente_id: clienteId,
      local_id: localId || null,
      data,
      hora: hora || null,
      valor_cobrado: cobrado,
      valor_gestora: gestora,
      cliente_pagou: clientePagou,
      notas: notas.trim() || null,
    };
    const novaEquipa = equipa.map(participacaoDe);
    setAGuardar(true);
    try {
      if (marcacao) {
        await operacoes.atualizarMarcacao(marcacao.id, base);
        await operacoes.guardarEquipa(marcacao.id, participacoes, novaEquipa);
      } else {
        const linhas: NovaMarcacao[] = [base];
        if (repetirAte && repetirAte > data) {
          for (let d = somarDias(data, 7); d <= repetirAte; d = somarDias(d, 7)) linhas.push({ ...base, data: d, cliente_pagou: false });
        }
        await operacoes.criarMarcacoes(linhas, novaEquipa.map((p) => ({ ...p, paga: false })));
      }
      await aoGuardar();
      aoFechar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível guardar a marcação."));
      setAGuardar(false);
    }
  };

  const apagar = async () => {
    if (!marcacao || !window.confirm("Apagar esta marcação?")) return;
    setAGuardar(true);
    try {
      await operacoes.apagarMarcacao(marcacao.id);
      await aoGuardar();
      aoFechar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível apagar."));
      setAGuardar(false);
    }
  };

  const detalhes = marcacao?.detalhes;
  const nomes = { clientes: new Map(clientes.map((c) => [c.id, c])), locais: new Map(locais.map((l) => [l.id, l])) };
  const equipaGuardada = participacoes.map((p) => nomeFuncionaria.get(p.funcionaria_id)).filter((f): f is Funcionaria => Boolean(f));
  const semEmail = equipaGuardada.filter((f) => !f.email);

  return (
    <Dialogo titulo={marcacao ? "Editar marcação" : "Nova marcação"} aoFechar={aoFechar}>
      {clientes.length === 0 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Ainda não há clientes. Crie um na página Clientes antes de marcar.
        </p>
      )}
      {integracao && (
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <p className="font-semibold">Pedido recebido de {marcacao.origem}</p>
          {detalhes && (
            <ul className="mt-1 grid gap-0.5 text-xs">
              {detalhes.nome_hospede && <li>Hóspede: {detalhes.nome_hospede}{detalhes.numero_hospedes ? ` (${detalhes.numero_hospedes} pessoas)` : ""}</li>}
              {detalhes.checkin && detalhes.checkout && <li>Estadia: {dataCurta(detalhes.checkin)} → {dataCurta(detalhes.checkout)}</li>}
              <li>Extras: {detalhes.extras?.length ? detalhes.extras.map((e) => `${e.quantidade}× ${e.nome}`).join(", ") : "nenhum"}</li>
            </ul>
          )}
          <p className="mt-1 text-xs">Cliente, local e data vêm do pedido; se mudarem lá, o pedido é reenviado e sobrepõe-se.</p>
        </div>
      )}
      <form onSubmit={submeter} className="grid gap-4">
        <label>
          <span className="rotulo">Cliente</span>
          <select required value={clienteId} onChange={(e) => mudarCliente(e.target.value)} disabled={integracao} className="campo">
            <option value="" disabled>Escolher…</option>
            {clientes.filter((c) => c.ativo || c.id === clienteId).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        {locaisDoCliente.length > 0 && (
          <label>
            <span className="rotulo">Local</span>
            <select value={localId} onChange={(e) => mudarLocal(e.target.value)} disabled={integracao} className="campo">
              <option value="">Sem local específico</option>
              {locaisDoCliente.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}{l.preco_acordado !== null ? ` — ${l.preco_acordado.toFixed(2)} €` : ""}</option>
              ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="rotulo">Data</span>
            <input required type="date" value={data} onChange={(e) => setData(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Hora</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="campo" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="rotulo">Valor cobrado (€)</span>
            <input required type="number" min="0" step="0.01" inputMode="decimal" value={valorCobrado} onChange={(e) => setValorCobrado(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Gestora recebe (€)</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={valorGestora} onChange={(e) => setValorGestora(e.target.value)} className="campo" />
          </label>
        </div>

        {/* ---------------- Equipa ---------------- */}
        <fieldset className="rounded-lg border border-line p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Equipa</legend>
          {equipa.length === 0 && <p className="text-xs text-slate-500">Ninguém atribuído. As horas podem ficar em branco e preencher-se depois da limpeza.</p>}
          <div className="grid gap-2">
            {equipa.map((l, i) => {
              const f = nomeFuncionaria.get(l.funcionaria_id);
              return (
                <div key={l.funcionaria_id} className="rounded-lg border border-line bg-sand/60 p-2">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{f?.nome ?? "—"}</span>
                    {marcacao && (
                      <label className="flex items-center gap-1.5 text-xs text-slate-600">
                        <input type="checkbox" checked={l.paga} onChange={(e) => mudarLinha(i, { paga: e.target.checked })} className="h-4 w-4 accent-accent" />
                        paga
                      </label>
                    )}
                    <button type="button" onClick={() => tirar(i)} disabled={l.paga} aria-label={`Tirar ${f?.nome ?? ""}`} className="grid h-8 w-8 place-items-center rounded-full text-lg text-slate-500 hover:bg-white hover:text-rose-700 disabled:opacity-40">×</button>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    <label className="text-[11px] text-slate-500">
                      Horas
                      <input type="number" min="0" step="0.25" inputMode="decimal" value={l.horas} onChange={(e) => mudarLinha(i, { horas: e.target.value })} placeholder="—" className="campo mt-0.5 h-10 px-2" />
                    </label>
                    <label className="text-[11px] text-slate-500">
                      €/hora
                      <input type="number" min="0" step="0.01" inputMode="decimal" value={l.taxa} onChange={(e) => mudarLinha(i, { taxa: e.target.value })} className="campo mt-0.5 h-10 px-2" />
                    </label>
                    <label className="text-[11px] text-slate-500">
                      Recebe (€)
                      <input type="number" min="0" step="0.01" inputMode="decimal" value={l.valor} onChange={(e) => mudarLinha(i, { valor: e.target.value, valorManual: true })} placeholder="0" className={`campo mt-0.5 h-10 px-2 ${l.valorManual ? "" : "text-slate-600"}`} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          {disponiveis.length > 0 ? (
            <select value="" onChange={(e) => juntar(e.target.value)} aria-label="Juntar funcionária" className="campo mt-2">
              <option value="">+ Juntar funcionária…</option>
              {disponiveis.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}{f.taxa_hora > 0 ? ` — ${f.taxa_hora.toFixed(2)} €/h` : ""}</option>
              ))}
            </select>
          ) : funcionarias.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">Sem funcionárias. Crie-as na página Equipa.</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Equipa {moeda(totalEquipa)} · gestora {moeda(gestora)} · <span className={sobra < 0 ? "font-semibold text-rose-700" : ""}>sobra {moeda(sobra)}</span>
          </p>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={clientePagou} onChange={(e) => setClientePagou(e.target.checked)} className="h-5 w-5 accent-accent" />
          Cliente pagou
        </label>
        <label>
          <span className="rotulo">Notas</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="campo h-auto py-2" />
        </label>
        {!marcacao && (
          <label>
            <span className="rotulo">Repetir todas as semanas até</span>
            <input type="date" value={repetirAte} min={data} onChange={(e) => setRepetirAte(e.target.value)} className="campo" />
            <span className="mt-1 block text-xs text-slate-500">Vazio = só esta marcação. Cria uma marcação por semana, no mesmo dia e hora, com a mesma equipa.</span>
          </label>
        )}
        {erro && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{erro}</div>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={aGuardar || clientes.length === 0} className="botao-primario">
            {aGuardar ? "A guardar…" : "Guardar"}
          </button>
          <button type="button" onClick={aoFechar} className="botao-secundario">Cancelar</button>
          {marcacao && (
            <button type="button" onClick={() => void apagar()} disabled={aGuardar} className="botao ml-auto text-rose-700 hover:bg-rose-50">
              Apagar
            </button>
          )}
        </div>
      </form>
      {marcacao && equipaGuardada.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {equipaGuardada.filter((f) => f.email).map((f) => {
              const colegas = equipaGuardada.filter((o) => o.id !== f.id).map((o) => o.nome);
              const { assunto, corpo } = emailDaMarcacao(marcacao, f, nomes, colegas);
              return (
                <a key={f.id} href={mailto(f.email!, assunto, corpo)} className="botao-secundario">
                  Avisar {f.nome.split(" ")[0]} por email
                </a>
              );
            })}
          </div>
          {semEmail.length > 0 && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {semEmail.map((f) => f.nome).join(", ")} sem email. Acrescenta-o na página Equipa para avisar daqui.
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">Abre a tua app de email com o texto pronto. Se mudaste algo, guarda primeiro.</p>
        </div>
      )}
    </Dialogo>
  );
}
