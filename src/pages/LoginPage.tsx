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
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#e8f2fb_0%,#f4f8fc_55%,#ffffff_100%)] px-5 py-12">
      <div className="w-full max-w-sm">
        <img src="/logo.png" alt="Alice Limpezas" className="mx-auto h-44 w-44 object-contain sm:h-52 sm:w-52" />

        <section className="painel mt-2 p-6 sm:p-8">
          {error && <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

          <form onSubmit={submit} className="grid gap-4">
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
        </section>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.2em] text-slate-400">Painel da gestora</p>
      </div>
    </main>
  );
}
