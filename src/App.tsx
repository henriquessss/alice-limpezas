import type { ReactElement } from "react";
import { Layout } from "./components/Layout";
import { useAuth } from "./lib/auth";
import { useRota } from "./lib/rota";
import { ClientesPage } from "./pages/ClientesPage";
import { ContasPage } from "./pages/ContasPage";
import { EquipaPage } from "./pages/EquipaPage";
import { LoginPage } from "./pages/LoginPage";
import { PainelPage } from "./pages/PainelPage";

const paginas: Record<string, () => ReactElement> = {
  "/": PainelPage,
  "/contas": ContasPage,
  "/clientes": ClientesPage,
  "/equipa": EquipaPage,
};

export default function App() {
  const auth = useAuth();
  const { path } = useRota();

  if (auth.estado === "a_carregar") {
    return <div className="flex min-h-dvh items-center justify-center bg-sand text-sm text-slate-500">A carregar…</div>;
  }
  if (auth.estado === "anonimo") return <LoginPage />;

  const Pagina = paginas[path] ?? PainelPage;
  return (
    <Layout>
      <Pagina />
    </Layout>
  );
}
