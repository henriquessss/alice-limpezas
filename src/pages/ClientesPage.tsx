import { useEffect, useState, type FormEvent } from "react";
import { Dialogo } from "../components/Dialogo";
import { operacoes } from "../lib/dados";
import { mensagemDeErro } from "../lib/erros";
import type { Cliente } from "../lib/modelo";
import { repositorio } from "../lib/repositorio";

type Formulario = { modo: "fechado" } | { modo: "novo" } | { modo: "editar"; cliente: Cliente };

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>();
  const [erro, setErro] = useState<string>();
  const [formulario, setFormulario] = useState<Formulario>({ modo: "fechado" });
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const carregar = async () => {
    try {
      setClientes(await repositorio.listar<Cliente>("clientes", { ordenar: "nome" }));
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível carregar os clientes."));
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const visiveis = (clientes ?? []).filter((c) => mostrarInativos || c.ativo);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Clientes</h1>
          <p className="text-sm text-slate-500">Quem contrata os serviços</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} className="h-4 w-4 accent-accent" />
            Mostrar inativos
          </label>
          <button type="button" onClick={() => setFormulario({ modo: "novo" })} className="botao-primario">+ Novo cliente</button>
        </div>
      </div>
      {erro && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</div>}

      <section className="painel mt-6 overflow-hidden">
        {!clientes ? (
          <p className="py-12 text-center text-sm text-slate-500">A carregar…</p>
        ) : visiveis.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Ainda não há clientes.</p>
        ) : (
          <ul className="divide-y divide-line">
            {visiveis.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setFormulario({ modo: "editar", cliente: c })} className="grid w-full gap-0.5 px-4 py-3 text-left hover:bg-sand sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-ink">
                      {c.nome}
                      {!c.ativo && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">inativo</span>}
                      {c.origem !== "manual" && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">{c.origem}</span>}
                    </p>
                    <p className="text-sm text-slate-600">{c.morada ?? <em className="text-slate-400">sem morada</em>}</p>
                  </div>
                  <p className="text-sm text-slate-500">{[c.telefone, c.email].filter(Boolean).join(" · ")}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formulario.modo !== "fechado" && (
        <FormCliente
          cliente={formulario.modo === "editar" ? formulario.cliente : undefined}
          aoFechar={() => setFormulario({ modo: "fechado" })}
          aoGuardar={carregar}
        />
      )}
    </>
  );
}

function FormCliente({ cliente, aoFechar, aoGuardar }: { cliente?: Cliente; aoFechar: () => void; aoGuardar: () => Promise<void> }) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [morada, setMorada] = useState(cliente?.morada ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [notas, setNotas] = useState(cliente?.notas ?? "");
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const submeter = async (event: FormEvent) => {
    event.preventDefault();
    const valores = {
      nome: nome.trim(),
      morada: morada.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      notas: notas.trim() || null,
      ativo,
    };
    if (!valores.nome) return setErro("Indique o nome.");
    setAGuardar(true);
    setErro(undefined);
    try {
      if (cliente) await operacoes.atualizarCliente(cliente.id, valores);
      else await operacoes.criarCliente(valores);
      await aoGuardar();
      aoFechar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível guardar o cliente."));
      setAGuardar(false);
    }
  };

  return (
    <Dialogo titulo={cliente ? "Editar cliente" : "Novo cliente"} aoFechar={aoFechar}>
      <form onSubmit={submeter} className="grid gap-4">
        <label>
          <span className="rotulo">Nome</span>
          <input required value={nome} onChange={(e) => setNome(e.target.value)} className="campo" />
        </label>
        <label>
          <span className="rotulo">Morada</span>
          <input value={morada} onChange={(e) => setMorada(e.target.value)} className="campo" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="rotulo">Telefone</span>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
          </label>
        </div>
        <label>
          <span className="rotulo">Notas</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className="campo h-auto py-2" />
        </label>
        {cliente && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4 accent-accent" />
            Cliente ativo (aparece ao marcar)
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
