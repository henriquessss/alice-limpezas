import { useState, type FormEvent } from "react";
import { iniciarSessao } from "../lib/auth";
import { mensagemDeErro } from "../lib/erros";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await iniciarSessao(email, password);
    } catch (reason) {
      setError(mensagemDeErro(reason, "Não foi possível iniciar sessão."));
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sand px-5 py-12">
      <section className="painel w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-sm font-bold text-white">AL</span>
          <span className="text-lg font-semibold text-ink">Alice Limpezas</span>
        </div>
        <p className="text-sm text-slate-600">Inicie sessão para ver as marcações e as contas.</p>

        {error && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label>
            <span className="rotulo">Email</span>
            <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
          </label>
          <label>
            <span className="rotulo">Palavra-passe</span>
            <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="campo" />
          </label>
          <button disabled={submitting} className="botao-primario mt-2 h-11">{submitting ? "A entrar…" : "Entrar"}</button>
        </form>

        <p className="mt-6 text-xs leading-5 text-slate-500">As contas são criadas no painel Supabase (Authentication → Users). Não existe registo público.</p>
      </section>
    </main>
  );
}
