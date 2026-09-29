-- Equipa paga à hora, várias funcionárias por limpeza, valor da gestora por serviço.
--
-- Antes: uma funcionária por marcação, com um valor fixo (sugestão 55 %).
-- Agora: cada limpeza tem N participações (`marcacoes_funcionarias`), cada uma
-- com horas × taxa à hora = valor, pagas uma a uma. A gestora também trabalha
-- nas limpezas e define o que recebe de cada serviço em `marcacoes.valor_gestora`
-- (predefinição por local em `clientes_locais.valor_gestora`). Não há
-- percentagens em lado nenhum.

alter table public.funcionarias
  add column if not exists taxa_hora numeric(10, 2) not null default 0 check (taxa_hora >= 0);

comment on column public.funcionarias.taxa_hora is
  'Valor por hora. Preenche a taxa ao juntar a funcionária a uma limpeza; editável caso a caso.';

create table if not exists public.marcacoes_funcionarias (
  id uuid primary key default gen_random_uuid(),
  marcacao_id uuid not null references public.marcacoes(id) on delete cascade,
  funcionaria_id uuid not null references public.funcionarias(id) on delete restrict,
  horas numeric(6, 2) check (horas is null or horas >= 0),
  taxa_hora numeric(10, 2) not null default 0 check (taxa_hora >= 0),
  valor numeric(10, 2) not null default 0 check (valor >= 0),
  paga boolean not null default false,
  criada_em timestamptz not null default now(),
  unique (marcacao_id, funcionaria_id)
);

comment on table public.marcacoes_funcionarias is
  'Quem fez cada limpeza e quanto recebe: horas × taxa_hora = valor (valor editável à mão). Horas vazias = ainda por definir.';

create index if not exists marcacoes_funcionarias_funcionaria_idx on public.marcacoes_funcionarias (funcionaria_id);
create index if not exists marcacoes_funcionarias_marcacao_idx on public.marcacoes_funcionarias (marcacao_id);

alter table public.marcacoes
  add column if not exists valor_gestora numeric(10, 2) not null default 0 check (valor_gestora >= 0);

comment on column public.marcacoes.valor_gestora is
  'O que a gestora recebe por este serviço (ela também limpa). Não é percentagem: valor definido por ela.';

alter table public.clientes_locais
  add column if not exists valor_gestora numeric(10, 2) check (valor_gestora is null or valor_gestora >= 0);

comment on column public.clientes_locais.valor_gestora is
  'Valor que a gestora recebe por limpeza neste local; preenche a marcação. Vazio = indica na altura.';

-- Marcações antigas: a funcionária e o valor passam para uma participação.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'marcacoes' and column_name = 'funcionaria_id'
  ) then
    insert into public.marcacoes_funcionarias (marcacao_id, funcionaria_id, valor, paga)
    select id, funcionaria_id, valor_funcionaria, funcionaria_paga
    from public.marcacoes
    where funcionaria_id is not null
    on conflict (marcacao_id, funcionaria_id) do nothing;
  end if;
end $$;

alter table public.marcacoes
  drop column if exists funcionaria_id,
  drop column if exists valor_funcionaria,
  drop column if exists funcionaria_paga;

alter table public.clientes_locais drop column if exists valor_funcionaria;

alter table public.marcacoes_funcionarias enable row level security;
drop policy if exists "gestora" on public.marcacoes_funcionarias;
create policy "gestora" on public.marcacoes_funcionarias for all to authenticated using (true) with check (true);
revoke all on public.marcacoes_funcionarias from anon;
grant select, insert, update, delete on public.marcacoes_funcionarias to authenticated;
