-- Locais por cliente e origem das marcações.
--
-- Um cliente pode ter vários locais (a Paradise Villas tem 20 villas; um
-- proprietário de alojamento local tem vários apartamentos). O preço acordado
-- vive no local, porque é por villa que se negoceia.
--
-- `origem`/`referencia_externa` nas marcações permitem a integrações (o
-- backoffice da Paradise Villas) reenviar o mesmo pedido sem duplicar.

create table if not exists public.clientes_locais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  morada text,
  preco_acordado numeric(10, 2) check (preco_acordado is null or preco_acordado >= 0),
  valor_funcionaria numeric(10, 2) check (valor_funcionaria is null or valor_funcionaria >= 0),
  ativo boolean not null default true,
  referencia_externa text,
  criado_em timestamptz not null default now(),
  unique (cliente_id, referencia_externa)
);

comment on column public.clientes_locais.preco_acordado is
  'Preço por limpeza acordado para este local. Preenche o valor cobrado ao criar a marcação; vazio = a gestora indica na altura.';
comment on column public.clientes_locais.valor_funcionaria is
  'Valor a pagar à funcionária por limpeza neste local. Vazio = 55% do valor cobrado.';

create index if not exists clientes_locais_cliente_idx on public.clientes_locais (cliente_id);

alter table public.marcacoes
  add column if not exists local_id uuid references public.clientes_locais(id) on delete set null,
  add column if not exists origem text not null default 'manual',
  add column if not exists referencia_externa text,
  add column if not exists detalhes jsonb;

comment on column public.marcacoes.detalhes is
  'Cópia do pedido recebido por integração (hóspedes, extras, datas da estadia). Só leitura no painel.';

create unique index if not exists marcacoes_origem_referencia_idx
  on public.marcacoes (origem, referencia_externa)
  where referencia_externa is not null;

create index if not exists marcacoes_local_idx on public.marcacoes (local_id);

alter table public.clientes_locais enable row level security;
drop policy if exists "gestora" on public.clientes_locais;
create policy "gestora" on public.clientes_locais for all to authenticated using (true) with check (true);
revoke all on public.clientes_locais from anon;
grant select, insert, update, delete on public.clientes_locais to authenticated;
