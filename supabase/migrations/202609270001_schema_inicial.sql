-- Schema inicial da Alice Limpezas: marcações de limpeza, equipa, clientes e despesas.
--
-- Só há um tipo de utilizador (a gestora) e entra por Supabase Auth; todas as
-- tabelas ficam acessíveis a `authenticated` e fechadas a `anon`.

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  morada text,
  telefone text,
  email text,
  notas text,
  ativo boolean not null default true,
  -- `manual` para clientes criados no painel. Integrações futuras (ex.: pedidos
  -- vindos do backoffice da Paradise Villas) usam outra origem e guardam o id
  -- do lado de lá em `referencia_externa`.
  origem text not null default 'manual',
  referencia_externa text,
  criado_em timestamptz not null default now(),
  unique (origem, referencia_externa)
);

create table if not exists public.funcionarias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  ativa boolean not null default true,
  criada_em timestamptz not null default now()
);

create table if not exists public.marcacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  funcionaria_id uuid references public.funcionarias(id) on delete set null,
  data date not null,
  hora time,
  valor_cobrado numeric(10, 2) not null default 0 check (valor_cobrado >= 0),
  valor_funcionaria numeric(10, 2) not null default 0 check (valor_funcionaria >= 0),
  cliente_pagou boolean not null default false,
  funcionaria_paga boolean not null default false,
  notas text,
  criada_em timestamptz not null default now()
);

comment on column public.marcacoes.valor_funcionaria is
  'Valor a pagar à funcionária por este serviço. A sugestão no painel é 55% do valor cobrado, mas é editável.';

create index if not exists marcacoes_data_idx on public.marcacoes (data);
create index if not exists marcacoes_cliente_idx on public.marcacoes (cliente_id);
create index if not exists marcacoes_funcionaria_idx on public.marcacoes (funcionaria_id);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  tipo text not null check (tipo in (
    'Produtos de limpeza', 'Consumíveis', 'Equipamento', 'Deslocações', 'Lavandaria', 'Outros'
  )),
  descricao text not null,
  fornecedor text,
  valor numeric(10, 2) not null check (valor >= 0),
  criada_em timestamptz not null default now()
);

create index if not exists despesas_data_idx on public.despesas (data);

-- ---------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------

alter table public.clientes enable row level security;
alter table public.funcionarias enable row level security;
alter table public.marcacoes enable row level security;
alter table public.despesas enable row level security;

drop policy if exists "gestora" on public.clientes;
drop policy if exists "gestora" on public.funcionarias;
drop policy if exists "gestora" on public.marcacoes;
drop policy if exists "gestora" on public.despesas;

create policy "gestora" on public.clientes for all to authenticated using (true) with check (true);
create policy "gestora" on public.funcionarias for all to authenticated using (true) with check (true);
create policy "gestora" on public.marcacoes for all to authenticated using (true) with check (true);
create policy "gestora" on public.despesas for all to authenticated using (true) with check (true);

revoke all on public.clientes, public.funcionarias, public.marcacoes, public.despesas from anon;
grant select, insert, update, delete on public.clientes, public.funcionarias, public.marcacoes, public.despesas to authenticated;
