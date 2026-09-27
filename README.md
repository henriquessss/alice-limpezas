# Alice Limpezas

Painel de gestão para uma empresa de limpezas: marcações no calendário, receitas por cliente, pagamentos à equipa e despesas do mês.

## Stack

Vite + React 19 + TypeScript + Tailwind, Supabase (Postgres + Auth), Vercel. Sem servidor próprio: o browser fala diretamente com o Supabase, protegido por RLS (só utilizadores autenticados).

## Correr localmente

```bash
npm install
npm run dev
```

Sem `.env.local` a aplicação corre em **modo local**: os dados ficam no `localStorage` do browser, já com um mês de exemplo. Serve para demonstrar ao cliente antes de haver base de dados. O botão «Repor exemplo» no cabeçalho apaga o que foi alterado.

Com Supabase:

1. Criar projeto no Supabase.
2. Aplicar `supabase/migrations/202609270001_schema_inicial.sql` no SQL Editor.
3. Criar o utilizador da gestora em Authentication → Users (email + palavra-passe; não há registo público).
4. Copiar `.env.example` para `.env.local` e preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Modelo

| Tabela | Para quê |
|---|---|
| `clientes` | Quem contrata. `origem`/`referencia_externa` reservam lugar para clientes vindos de integrações (ex.: Paradise Villas). |
| `funcionarias` | Equipa. |
| `marcacoes` | Um serviço: cliente, funcionária, data/hora, valor cobrado, valor a pagar à funcionária (sugestão 55%), `cliente_pagou`, `funcionaria_paga`. |
| `despesas` | Despesas por tipo (produtos, consumíveis, equipamento, deslocações, lavandaria, outros). |

Estado de uma marcação deriva-se, não se guarda: `cliente_pagou` → Recebido; data passada sem pagamento → Em atraso; resto → Pendente.

## Páginas

- `/` Painel — KPIs do mês, calendário, marcações do dia escolhido.
- `/contas` — Receitas (clicar no estado alterna pago/por pagar), pagamentos à equipa («Marcar pago» liquida todos os serviços por pagar da funcionária no mês), despesas.
- `/clientes`, `/equipa` — cadastro.

O mês em vista vai na query string (`?mes=2026-09`).

## Deploy

Vercel, framework Vite. Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no projeto Vercel. `vercel.json` já reescreve as rotas para `index.html`.

## Por fazer

- Integração com o backoffice da Paradise Villas (pedidos de limpeza por check-out → marcação aqui). Desenho: endpoint/webhook do lado da Alice Limpezas, cliente com `origem = 'paradise-villas'`.
- Notificações às funcionárias (email/WhatsApp) com o plano do dia.
- Relatório mensal em PDF para o contabilista.
