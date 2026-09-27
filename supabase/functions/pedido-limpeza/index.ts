// Recebe pedidos de limpeza de plataformas parceiras (hoje: backoffice da
// Paradise Villas) e transforma-os em marcações.
//
// Autenticação: `Authorization: Bearer <PEDIDO_LIMPEZA_SEGREDO>`. A função é
// publicada com `--no-verify-jwt` porque quem chama não é um utilizador
// Supabase; o segredo partilhado é a única credencial.
//
// Idempotente: a mesma `referencia` da mesma `origem` actualiza a marcação em
// vez de a duplicar. Cliente e local são criados na primeira vez que aparecem.

import { createClient } from "npm:@supabase/supabase-js@2";

interface Pedido {
  acao: "criar" | "atualizar" | "cancelar";
  origem: string;
  referencia: string;
  cliente: { referencia: string; nome: string };
  local: { referencia: string; nome: string; morada?: string | null };
  data: string;
  hora?: string | null;
  detalhes?: {
    nome_hospede?: string;
    numero_hospedes?: number;
    checkin?: string;
    checkout?: string;
    extras?: { nome: string; quantidade: number }[];
  };
  notas?: string | null;
}

const PERCENTAGEM_FUNCIONARIA = 0.55;

function json(status: number, corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

function pedidoValido(p: unknown): p is Pedido {
  if (!p || typeof p !== "object") return false;
  const x = p as Record<string, unknown>;
  const cliente = x.cliente as Record<string, unknown> | undefined;
  const local = x.local as Record<string, unknown> | undefined;
  return (
    ["criar", "atualizar", "cancelar"].includes(String(x.acao)) &&
    typeof x.origem === "string" && x.origem.length > 0 && x.origem !== "manual" &&
    typeof x.referencia === "string" && x.referencia.length > 0 &&
    typeof cliente?.referencia === "string" && typeof cliente?.nome === "string" &&
    typeof local?.referencia === "string" && typeof local?.nome === "string" &&
    (x.acao === "cancelar" || /^\d{4}-\d{2}-\d{2}$/.test(String(x.data)))
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  const segredo = Deno.env.get("PEDIDO_LIMPEZA_SEGREDO");
  if (!segredo) return json(500, { error: "PEDIDO_LIMPEZA_SEGREDO não configurado." });
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) return json(401, { error: "Não autorizado." });

  let pedido: unknown;
  try {
    pedido = await req.json();
  } catch {
    return json(400, { error: "Corpo não é JSON." });
  }
  if (!pedidoValido(pedido)) return json(400, { error: "Pedido incompleto." });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: existente, error: erroExistente } = await supabase
    .from("marcacoes")
    .select("id, cliente_pagou, funcionaria_paga, data")
    .eq("origem", pedido.origem)
    .eq("referencia_externa", pedido.referencia)
    .maybeSingle();
  if (erroExistente) return json(500, { error: erroExistente.message });

  if (pedido.acao === "cancelar") {
    if (!existente) return json(200, { resultado: "inexistente" });
    // Uma limpeza já paga (por qualquer das partes) é história financeira:
    // fica, com nota, em vez de desaparecer das contas.
    if (existente.cliente_pagou || existente.funcionaria_paga) {
      const { error } = await supabase
        .from("marcacoes")
        .update({ notas: `CANCELADA pela ${pedido.origem} em ${new Date().toISOString().slice(0, 10)}.` })
        .eq("id", existente.id);
      if (error) return json(500, { error: error.message });
      return json(200, { resultado: "anotada", id: existente.id });
    }
    const { error } = await supabase.from("marcacoes").delete().eq("id", existente.id);
    if (error) return json(500, { error: error.message });
    return json(200, { resultado: "apagada", id: existente.id });
  }

  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .upsert(
      { origem: pedido.origem, referencia_externa: pedido.cliente.referencia, nome: pedido.cliente.nome, ativo: true },
      { onConflict: "origem,referencia_externa" },
    )
    .select("id")
    .single();
  if (erroCliente) return json(500, { error: erroCliente.message });

  const { data: local, error: erroLocal } = await supabase
    .from("clientes_locais")
    .upsert(
      { cliente_id: cliente.id, referencia_externa: pedido.local.referencia, nome: pedido.local.nome, morada: pedido.local.morada ?? null },
      { onConflict: "cliente_id,referencia_externa" },
    )
    .select("id, preco_acordado, valor_funcionaria")
    .single();
  if (erroLocal) return json(500, { error: erroLocal.message });

  const comum = {
    cliente_id: cliente.id,
    local_id: local.id,
    data: pedido.data,
    hora: pedido.hora ?? "10:00",
    detalhes: pedido.detalhes ?? null,
  };

  if (existente) {
    const { error } = await supabase.from("marcacoes").update(comum).eq("id", existente.id);
    if (error) return json(500, { error: error.message });
    return json(200, { resultado: "atualizada", id: existente.id });
  }

  const precoAcordado = local.preco_acordado === null ? null : Number(local.preco_acordado);
  const valorCobrado = precoAcordado ?? 0;
  const valorFuncionaria =
    local.valor_funcionaria !== null
      ? Number(local.valor_funcionaria)
      : Math.round(valorCobrado * PERCENTAGEM_FUNCIONARIA * 100) / 100;

  const { data: criada, error: erroCriar } = await supabase
    .from("marcacoes")
    .insert({
      ...comum,
      origem: pedido.origem,
      referencia_externa: pedido.referencia,
      valor_cobrado: valorCobrado,
      valor_funcionaria: valorFuncionaria,
      notas: pedido.notas ?? (precoAcordado === null ? "Sem preço acordado para este local — definir valor." : null),
    })
    .select("id")
    .single();
  if (erroCriar) return json(500, { error: erroCriar.message });
  return json(201, { resultado: "criada", id: criada.id, preco_definido: precoAcordado !== null });
});
