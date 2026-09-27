import { useState, type FormEvent } from "react";
import { operacoes, type NovaMarcacao } from "../lib/dados";
import { somarDias } from "../lib/datas";
import { mensagemDeErro } from "../lib/erros";
import { valorSugeridoFuncionaria, type Cliente, type Funcionaria, type Marcacao } from "../lib/modelo";
import { Dialogo } from "./Dialogo";

interface Props {
  clientes: Cliente[];
  funcionarias: Funcionaria[];
  /** Sem `marcacao` cria; com `marcacao` edita. */
  marcacao?: Marcacao;
  dataInicial?: string;
  aoFechar: () => void;
  aoGuardar: () => Promise<void>;
}

export function FormMarcacao({ clientes, funcionarias, marcacao, dataInicial, aoFechar, aoGuardar }: Props) {
  const [clienteId, setClienteId] = useState(marcacao?.cliente_id ?? clientes[0]?.id ?? "");
  const [funcionariaId, setFuncionariaId] = useState(marcacao?.funcionaria_id ?? "");
  const [data, setData] = useState(marcacao?.data ?? dataInicial ?? "");
  const [hora, setHora] = useState(marcacao?.hora?.slice(0, 5) ?? "09:00");
  const [valorCobrado, setValorCobrado] = useState(marcacao ? String(marcacao.valor_cobrado) : "");
  const [valorFuncionaria, setValorFuncionaria] = useState(marcacao ? String(marcacao.valor_funcionaria) : "");
  const [valorFuncionariaManual, setValorFuncionariaManual] = useState(Boolean(marcacao));
  const [clientePagou, setClientePagou] = useState(marcacao?.cliente_pagou ?? false);
  const [funcionariaPaga, setFuncionariaPaga] = useState(marcacao?.funcionaria_paga ?? false);
  const [notas, setNotas] = useState(marcacao?.notas ?? "");
  const [repetirAte, setRepetirAte] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const cobrado = Number(valorCobrado.replace(",", ".")) || 0;
  const sugerido = valorSugeridoFuncionaria(cobrado);

  const mudarValorCobrado = (valor: string) => {
    setValorCobrado(valor);
    if (!valorFuncionariaManual) {
      const n = Number(valor.replace(",", ".")) || 0;
      setValorFuncionaria(n > 0 ? String(valorSugeridoFuncionaria(n)) : "");
    }
  };

  const submeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(undefined);
    if (!clienteId) return setErro("Escolha o cliente.");
    if (!data) return setErro("Indique a data.");
    const base: NovaMarcacao = {
      cliente_id: clienteId,
      funcionaria_id: funcionariaId || null,
      data,
      hora: hora || null,
      valor_cobrado: cobrado,
      valor_funcionaria: Number(valorFuncionaria.replace(",", ".")) || 0,
      cliente_pagou: clientePagou,
      funcionaria_paga: funcionariaPaga,
      notas: notas.trim() || null,
    };
    setAGuardar(true);
    try {
      if (marcacao) {
        await operacoes.atualizarMarcacao(marcacao.id, base);
      } else {
        const linhas: NovaMarcacao[] = [base];
        if (repetirAte && repetirAte > data) {
          for (let d = somarDias(data, 7); d <= repetirAte; d = somarDias(d, 7)) {
            linhas.push({ ...base, data: d, cliente_pagou: false, funcionaria_paga: false });
          }
        }
        await operacoes.criarMarcacoes(linhas);
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

  return (
    <Dialogo titulo={marcacao ? "Editar marcação" : "Nova marcação"} aoFechar={aoFechar}>
      {clientes.length === 0 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Ainda não há clientes. Crie um na página Clientes antes de marcar.
        </p>
      )}
      <form onSubmit={submeter} className="grid gap-4">
        <label>
          <span className="rotulo">Cliente</span>
          <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="campo">
            <option value="" disabled>Escolher…</option>
            {clientes.filter((c) => c.ativo || c.id === clienteId).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
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
        <label>
          <span className="rotulo">Funcionária</span>
          <select value={funcionariaId} onChange={(e) => setFuncionariaId(e.target.value)} className="campo">
            <option value="">Por atribuir</option>
            {funcionarias.filter((f) => f.ativa || f.id === funcionariaId).map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="rotulo">Valor cobrado (€)</span>
            <input required type="number" min="0" step="0.01" inputMode="decimal" value={valorCobrado} onChange={(e) => mudarValorCobrado(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">A pagar à funcionária (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={valorFuncionaria}
              onChange={(e) => {
                setValorFuncionariaManual(true);
                setValorFuncionaria(e.target.value);
              }}
              className="campo"
            />
            <span className="mt-1 block text-xs text-slate-500">Sugerido: 55% do valor{cobrado > 0 ? ` = ${sugerido.toFixed(2)} €` : ""}</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={clientePagou} onChange={(e) => setClientePagou(e.target.checked)} className="h-4 w-4 accent-accent" />
            Cliente pagou
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={funcionariaPaga} onChange={(e) => setFuncionariaPaga(e.target.checked)} className="h-4 w-4 accent-accent" />
            Funcionária paga
          </label>
        </div>
        <label>
          <span className="rotulo">Notas</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="campo h-auto py-2" />
        </label>
        {!marcacao && (
          <label>
            <span className="rotulo">Repetir todas as semanas até</span>
            <input type="date" value={repetirAte} min={data} onChange={(e) => setRepetirAte(e.target.value)} className="campo" />
            <span className="mt-1 block text-xs text-slate-500">Vazio = só esta marcação. Cria uma marcação por semana, no mesmo dia e hora.</span>
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
    </Dialogo>
  );
}
