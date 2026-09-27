import { useState, type FormEvent } from "react";
import { operacoes, type NovaDespesa } from "../lib/dados";
import { hojeIso } from "../lib/datas";
import { mensagemDeErro } from "../lib/erros";
import { TIPOS_DESPESA, type Despesa, type TipoDespesa } from "../lib/modelo";
import { Dialogo } from "./Dialogo";

interface Props {
  despesa?: Despesa;
  aoFechar: () => void;
  aoGuardar: () => Promise<void>;
}

export function FormDespesa({ despesa, aoFechar, aoGuardar }: Props) {
  const [tipo, setTipo] = useState<TipoDespesa>(despesa?.tipo ?? "Produtos de limpeza");
  const [descricao, setDescricao] = useState(despesa?.descricao ?? "");
  const [data, setData] = useState(despesa?.data ?? hojeIso());
  const [valor, setValor] = useState(despesa ? String(despesa.valor) : "");
  const [fornecedor, setFornecedor] = useState(despesa?.fornecedor ?? "");
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const submeter = async (event: FormEvent) => {
    event.preventDefault();
    setErro(undefined);
    const linha: NovaDespesa = {
      tipo,
      descricao: descricao.trim(),
      data,
      valor: Number(valor.replace(",", ".")) || 0,
      fornecedor: fornecedor.trim() || null,
    };
    if (!linha.descricao) return setErro("Indique a descrição.");
    setAGuardar(true);
    try {
      if (despesa) await operacoes.atualizarDespesa(despesa.id, linha);
      else await operacoes.criarDespesa(linha);
      await aoGuardar();
      aoFechar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível guardar a despesa."));
      setAGuardar(false);
    }
  };

  const apagar = async () => {
    if (!despesa || !window.confirm("Apagar esta despesa?")) return;
    setAGuardar(true);
    try {
      await operacoes.apagarDespesa(despesa.id);
      await aoGuardar();
      aoFechar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível apagar."));
      setAGuardar(false);
    }
  };

  return (
    <Dialogo titulo={despesa ? "Editar despesa" : "Nova despesa"} aoFechar={aoFechar}>
      <form onSubmit={submeter} className="grid gap-4">
        <label>
          <span className="rotulo">Tipo de despesa</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDespesa)} className="campo">
            {TIPOS_DESPESA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          <span className="rotulo">Descrição</span>
          <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className="campo" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="rotulo">Data</span>
            <input required type="date" value={data} onChange={(e) => setData(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Valor (€)</span>
            <input required type="number" min="0" step="0.01" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="campo" />
          </label>
        </div>
        <label>
          <span className="rotulo">Fornecedor / loja</span>
          <input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} className="campo" />
        </label>
        {erro && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{erro}</div>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={aGuardar} className="botao-primario">{aGuardar ? "A guardar…" : "Guardar"}</button>
          <button type="button" onClick={aoFechar} className="botao-secundario">Cancelar</button>
          {despesa && (
            <button type="button" onClick={() => void apagar()} disabled={aGuardar} className="botao ml-auto text-rose-700 hover:bg-rose-50">
              Apagar
            </button>
          )}
        </div>
      </form>
    </Dialogo>
  );
}
