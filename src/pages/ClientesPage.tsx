import { useEffect, useState, type FormEvent } from "react";
import { Dialogo } from "../components/Dialogo";
import { operacoes } from "../lib/dados";
import { mensagemDeErro } from "../lib/erros";
import type { Cliente, Local } from "../lib/modelo";
import { repositorio } from "../lib/repositorio";

function numeroOuNulo(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/**
 * Locais do cliente (villas, apartamentos), com o preço acordado por limpeza.
 * Vive dentro do diálogo do cliente mas grava por si — cada linha é um
 * registo próprio e não faz sentido esperar pelo «Guardar» do cliente.
 */
function LocaisDoCliente({ clienteId }: { clienteId: string }) {
  const [locais, setLocais] = useState<Local[]>();
  const [novo, setNovo] = useState({ nome: "", morada: "", preco: "", funcionaria: "" });
  const [erro, setErro] = useState<string>();

  const carregar = async () => {
    try {
      setLocais(await operacoes.listarLocais(clienteId));
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível carregar os locais."));
    }
  };

  useEffect(() => {
    void carregar();
  }, [clienteId]);

  const executar = async (acao: () => Promise<unknown>) => {
    setErro(undefined);
    try {
      await acao();
      await carregar();
    } catch (reason) {
      setErro(mensagemDeErro(reason, "Não foi possível guardar o local."));
    }
  };

  const adicionar = () => {
    if (!novo.nome.trim()) return setErro("Indique o nome do local.");
    void executar(async () => {
      await operacoes.criarLocal({
        cliente_id: clienteId,
        nome: novo.nome.trim(),
        morada: novo.morada.trim() || null,
        preco_acordado: numeroOuNulo(novo.preco),
        valor_funcionaria: numeroOuNulo(novo.funcionaria),
        ativo: true,
      });
      setNovo({ nome: "", morada: "", preco: "", funcionaria: "" });
    });
  };

  const guardarCampo = (local: Local, campo: "nome" | "morada" | "preco_acordado" | "valor_funcionaria", texto: string) => {
    const valor = campo === "nome" ? texto.trim() : campo === "morada" ? texto.trim() || null : numeroOuNulo(texto);
    if (campo === "nome" && !valor) return;
    if (local[campo] === valor) return;
    void executar(() => operacoes.atualizarLocal(local.id, { [campo]: valor }));
  };

  const remover = (local: Local) => {
    if (!window.confirm(`Apagar «${local.nome}»? As marcações antigas ficam sem local.`)) return;
    void executar(() => operacoes.apagarLocal(local.id));
  };

  const entrada = "h-9 w-full rounded-md border border-line bg-white px-2 text-sm";

  return (
    <fieldset className="rounded-lg border border-line p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Locais e preços acordados</legend>
      <p className="text-xs text-slate-500">Para clientes com várias casas. O preço preenche o valor da marcação; vazio = 55% para a funcionária.</p>
      {erro && <div role="alert" className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{erro}</div>}
      <div className="mt-3 grid gap-2">
        {locais?.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_1fr_5rem_5rem_auto] items-center gap-1.5">
            <input defaultValue={l.nome} onBlur={(e) => guardarCampo(l, "nome", e.target.value)} aria-label="Nome do local" className={entrada} />
            <input defaultValue={l.morada ?? ""} onBlur={(e) => guardarCampo(l, "morada", e.target.value)} aria-label="Morada" placeholder="Morada" className={entrada} />
            <input defaultValue={l.preco_acordado ?? ""} onBlur={(e) => guardarCampo(l, "preco_acordado", e.target.value)} aria-label="Preço acordado" placeholder="€" inputMode="decimal" className={`${entrada} text-right`} />
            <input defaultValue={l.valor_funcionaria ?? ""} onBlur={(e) => guardarCampo(l, "valor_funcionaria", e.target.value)} aria-label="Valor à funcionária" placeholder="func." inputMode="decimal" className={`${entrada} text-right`} />
            <button type="button" onClick={() => remover(l)} aria-label={`Apagar ${l.nome}`} className="h-9 px-2 text-slate-500 hover:text-rose-700">×</button>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_1fr_5rem_5rem_auto] items-center gap-1.5">
          <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Novo local" aria-label="Nome do novo local" className={entrada} />
          <input value={novo.morada} onChange={(e) => setNovo({ ...novo, morada: e.target.value })} placeholder="Morada" aria-label="Morada do novo local" className={entrada} />
          <input value={novo.preco} onChange={(e) => setNovo({ ...novo, preco: e.target.value })} placeholder="€" aria-label="Preço acordado do novo local" inputMode="decimal" className={`${entrada} text-right`} />
          <input value={novo.funcionaria} onChange={(e) => setNovo({ ...novo, funcionaria: e.target.value })} placeholder="func." aria-label="Valor à funcionária do novo local" inputMode="decimal" className={`${entrada} text-right`} />
          <button type="button" onClick={adicionar} className="botao-secundario h-9 px-3 text-xs">+</button>
        </div>
      </div>
    </fieldset>
  );
}

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
        {cliente && <LocaisDoCliente clienteId={cliente.id} />}
        {erro && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{erro}</div>}
        <div className="mt-2 flex gap-2">
          <button type="submit" disabled={aGuardar} className="botao-primario">{aGuardar ? "A guardar…" : "Guardar"}</button>
          <button type="button" onClick={aoFechar} className="botao-secundario">Cancelar</button>
        </div>
      </form>
    </Dialogo>
  );
}
