import { useEffect, useState, type FormEvent } from "react";
import { Dialogo } from "../components/Dialogo";
import { operacoes } from "../lib/dados";
import { mensagemDeErro } from "../lib/erros";
import type { Funcionaria } from "../lib/modelo";
import { repositorio } from "../lib/repositorio";

type Formulario = { modo: "fechado" } | { modo: "nova" } | { modo: "editar"; funcionaria: Funcionaria };

export function EquipaPage() {
  const [funcionarias, setFuncionarias] = useState<Funcionaria[]>();
  const [erro, setErro] = useState<string>();
  const [formulario, setFormulario] = useState<Formulario>({ modo: "fechado" });

  const carregar = async () => {
    try {
      setFuncionarias(await repositorio.listar<Funcionaria>("funcionarias", { ordenar: "nome" }));
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível carregar a equipa."));
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Equipa</h1>
          <p className="text-sm text-slate-500">Funcionárias que fazem os serviços</p>
        </div>
        <button type="button" onClick={() => setFormulario({ modo: "nova" })} className="botao-primario">+ Nova funcionária</button>
      </div>
      {erro && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</div>}

      <section className="painel mt-6 overflow-hidden">
        {!funcionarias ? (
          <p className="py-12 text-center text-sm text-slate-500">A carregar…</p>
        ) : funcionarias.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Ainda não há funcionárias.</p>
        ) : (
          <ul className="divide-y divide-line">
            {funcionarias.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => setFormulario({ modo: "editar", funcionaria: f })} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-mist">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">{iniciais(f.nome)}</span>
                  <span className="flex-1">
                    <span className="block font-semibold text-ink">
                      {f.nome}
                      {!f.ativa && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">inativa</span>}
                    </span>
                    <span className="block truncate text-sm text-slate-500">{[f.email, f.telefone].filter(Boolean).join(" · ") || "—"}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-slate-600">{f.taxa_hora > 0 ? `${f.taxa_hora.toFixed(2)} €/h` : <em className="text-amber-700">sem €/h</em>}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formulario.modo !== "fechado" && (
        <FormFuncionaria
          funcionaria={formulario.modo === "editar" ? formulario.funcionaria : undefined}
          aoFechar={() => setFormulario({ modo: "fechado" })}
          aoGuardar={carregar}
        />
      )}
    </>
  );
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function FormFuncionaria({ funcionaria, aoFechar, aoGuardar }: { funcionaria?: Funcionaria; aoFechar: () => void; aoGuardar: () => Promise<void> }) {
  const [nome, setNome] = useState(funcionaria?.nome ?? "");
  const [telefone, setTelefone] = useState(funcionaria?.telefone ?? "");
  const [email, setEmail] = useState(funcionaria?.email ?? "");
  const [taxaHora, setTaxaHora] = useState(funcionaria ? String(funcionaria.taxa_hora) : "");
  const [ativa, setAtiva] = useState(funcionaria?.ativa ?? true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const submeter = async (event: FormEvent) => {
    event.preventDefault();
    const taxa_hora = Number(taxaHora.replace(",", ".")) || 0;
    const valores = { nome: nome.trim(), telefone: telefone.trim() || null, email: email.trim() || null, taxa_hora, ativa };
    if (!valores.nome) return setErro("Indique o nome.");
    if (taxa_hora < 0) return setErro("O valor à hora não pode ser negativo.");
    if (valores.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) return setErro("Email inválido.");
    setAGuardar(true);
    setErro(undefined);
    try {
      if (funcionaria) await operacoes.atualizarFuncionaria(funcionaria.id, valores);
      else await operacoes.criarFuncionaria(valores);
      await aoGuardar();
      aoFechar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível guardar."));
      setAGuardar(false);
    }
  };

  return (
    <Dialogo titulo={funcionaria ? "Editar funcionária" : "Nova funcionária"} aoFechar={aoFechar}>
      <form onSubmit={submeter} className="grid gap-4">
        <label>
          <span className="rotulo">Nome</span>
          <input required value={nome} onChange={(e) => setNome(e.target.value)} className="campo" />
        </label>
        <label>
          <span className="rotulo">Email</span>
          <input type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
          <span className="mt-1 block text-xs text-slate-500">É por aqui que a gestora comunica com a equipa.</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="rotulo">Telefone</span>
            <input type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Valor à hora (€)</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={taxaHora} onChange={(e) => setTaxaHora(e.target.value)} className="campo" />
          </label>
        </div>
        <p className="-mt-2 text-xs text-slate-500">Ao juntá-la a uma limpeza, recebe horas × este valor. Pode corrigir-se caso a caso.</p>
        {funcionaria && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} className="h-5 w-5 accent-accent" />
            Ativa (aparece ao marcar)
          </label>
        )}
        {erro && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{erro}</div>}
        <div className="mt-2 flex gap-2">
          <button type="submit" disabled={aGuardar} className="botao-primario">{aGuardar ? "A guardar…" : "Guardar"}</button>
          <button type="button" onClick={aoFechar} className="botao-secundario">Cancelar</button>
        </div>
      </form>
    </Dialogo>
  );
}
