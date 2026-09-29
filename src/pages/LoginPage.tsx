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
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-12">
      <form onSubmit={submit} className="grid w-full max-w-xs gap-3">
        <img src="/logo-transparente.png" alt="Alice Limpezas" className="mx-auto mb-6 w-56 sm:w-64" />
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
        <input required type="email" autoComplete="username" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
        <input required type="password" autoComplete="current-password" placeholder="Palavra-passe" aria-label="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} className="campo" />
        <button disabled={submitting} className="botao-primario mt-1 h-11">{submitting ? "A entrar…" : "Entrar"}</button>
      </form>
    </main>
  );
}
