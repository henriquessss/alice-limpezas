import { diaLongo, hora } from "./format";
import type { Cliente, Funcionaria, Local, Marcacao } from "./modelo";

/**
 * Emails à equipa, abertos na app de email da gestora com `mailto:`.
 *
 * Sem servidor de envio de propósito: a plataforma custa 0 €, e um email que
 * sai da conta dela chega sempre e vem assinado por ela. Quando houver
 * envio automático, estes textos são os que seguem.
 */

export type Nomes = {
  clientes: Map<string, Cliente>;
  locais: Map<string, Local>;
};

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function moradaDaMarcacao(m: Pick<Marcacao, "cliente_id" | "local_id">, nomes: Nomes): string {
  const local = m.local_id ? nomes.locais.get(m.local_id) : undefined;
  return local?.morada || nomes.clientes.get(m.cliente_id)?.morada || "";
}

export function sitioDaMarcacao(m: Pick<Marcacao, "cliente_id" | "local_id">, nomes: Nomes): string {
  const cliente = nomes.clientes.get(m.cliente_id)?.nome ?? "—";
  const local = m.local_id ? nomes.locais.get(m.local_id)?.nome : undefined;
  return local ? `${cliente} · ${local}` : cliente;
}

function linhasDosDetalhes(m: Marcacao): string[] {
  const linhas: string[] = [];
  const d = m.detalhes;
  if (d?.numero_hospedes) linhas.push(`Hóspedes: ${d.numero_hospedes}`);
  if (d?.extras && d.extras.length > 0) linhas.push(`Extras: ${d.extras.map((e) => `${e.quantidade}× ${e.nome}`).join(", ")}`);
  if (m.notas) linhas.push(`Notas: ${m.notas}`);
  return linhas;
}

/** `colegas`: nomes das outras funcionárias na mesma limpeza, se houver. */
export function emailDaMarcacao(m: Marcacao, funcionaria: Funcionaria, nomes: Nomes, colegas: string[] = []): { assunto: string; corpo: string } {
  const sitio = sitioDaMarcacao(m, nomes);
  const morada = moradaDaMarcacao(m, nomes);
  const quando = `${diaLongo(m.data)}${m.hora ? ` às ${hora(m.hora)}` : ""}`;
  const linhas = [
    `Olá ${primeiroNome(funcionaria.nome)},`,
    "",
    "Tens uma limpeza marcada:",
    "",
    `Quando: ${quando}`,
    `Onde: ${sitio}`,
    ...(morada ? [`Morada: ${morada}`] : []),
    ...(colegas.length > 0 ? [`Com: ${colegas.map(primeiroNome).join(", ")}`] : []),
    ...linhasDosDetalhes(m),
    "",
    "Se não puderes, responde a este email o quanto antes.",
    "",
    "Alice Limpezas",
  ];
  return { assunto: `Limpeza ${m.data.slice(8, 10)}/${m.data.slice(5, 7)}${m.hora ? ` ${hora(m.hora)}` : ""} — ${sitio}`, corpo: linhas.join("\n") };
}

export function emailDoPlano(dia: string, funcionaria: Funcionaria, marcacoes: Marcacao[], nomes: Nomes): { assunto: string; corpo: string } {
  const ordenadas = [...marcacoes].sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
  const blocos = ordenadas.map((m) => {
    const morada = moradaDaMarcacao(m, nomes);
    return [
      `${m.hora ? hora(m.hora) : "—"}  ${sitioDaMarcacao(m, nomes)}`,
      ...(morada ? [`      ${morada}`] : []),
      ...linhasDosDetalhes(m).map((linha) => `      ${linha}`),
    ].join("\n");
  });
  const linhas = [
    `Olá ${primeiroNome(funcionaria.nome)},`,
    "",
    `Plano para ${diaLongo(dia)} — ${ordenadas.length} ${ordenadas.length === 1 ? "limpeza" : "limpezas"}:`,
    "",
    ...blocos.flatMap((bloco) => [bloco, ""]),
    "Qualquer dúvida, responde a este email.",
    "",
    "Alice Limpezas",
  ];
  return { assunto: `Plano de ${diaLongo(dia)}`, corpo: linhas.join("\n") };
}

export function mailto(destino: string, assunto: string, corpo: string): string {
  return `mailto:${encodeURIComponent(destino)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
