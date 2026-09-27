-- A gestora comunica com a equipa por email: cada funcionária tem o seu.
alter table public.funcionarias add column if not exists email text;
