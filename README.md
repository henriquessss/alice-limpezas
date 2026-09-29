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
| `funcionarias` | Equipa. `taxa_hora` = valor por hora (preenche a taxa ao juntá-la a uma limpeza). |
| `marcacoes` | Um serviço: cliente (+ local), data/hora, valor cobrado, `valor_gestora` (o que a gestora recebe por este serviço — ela também limpa; valor fixo, nunca percentagem), `cliente_pagou`. |
| `marcacoes_funcionarias` | Quem fez cada limpeza (N por marcação): `horas` × `taxa_hora` = `valor` (editável à mão), `paga`. Horas vazias = por definir depois do serviço. |
| `despesas` | Despesas por tipo (produtos, consumíveis, equipamento, deslocações, lavandaria, outros). |

Estado de uma marcação deriva-se, não se guarda: `cliente_pagou` → Recebido; data passada sem pagamento → Em atraso; resto → Pendente.

## Páginas

- `/` Painel — KPIs do mês, calendário, marcações do dia escolhido.
- `/contas` — Receitas (clicar no estado alterna pago/por pagar), pagamentos à equipa (tocar no nome abre os serviços do mês com horas/valor editáveis; «Pagar» liquida tudo o que está por pagar à funcionária), despesas.
- `/clientes`, `/equipa` — cadastro.

O mês em vista vai na query string (`?mes=2026-09`).

## Deploy

Vercel, framework Vite. Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no projeto Vercel. `vercel.json` já reescreve as rotas para `index.html`.

## Pedidos de limpeza de parceiros (Paradise Villas)

O backoffice da Paradise Villas envia um pedido por reserva para a Edge Function `pedido-limpeza` (`supabase/functions/pedido-limpeza/index.ts`). A função cria o cliente (`origem = 'paradise-villas'`) e o local (uma villa) na primeira vez, e depois cria/atualiza/cancela a marcação pela `referencia_externa` (id da reserva). O preço vem de `clientes_locais.preco_acordado` — a gestora preenche-o em Clientes → Paradise Villas → Locais; sem preço, a marcação entra a 0 € com nota.

Contrato do pedido (`POST`, `Authorization: Bearer <PEDIDO_LIMPEZA_SEGREDO>`):

```json
{
  "acao": "criar | atualizar | cancelar",
  "origem": "paradise-villas",
  "referencia": "<id da reserva>",
  "cliente": { "referencia": "paradise-villas", "nome": "Paradise Villas" },
  "local": { "referencia": "<id da villa>", "nome": "Villa Paulo", "morada": "…" },
  "data": "2026-10-03",
  "hora": "10:00",
  "detalhes": { "nome_hospede": "…", "numero_hospedes": 4, "checkin": "…", "checkout": "…", "extras": [{ "nome": "Berço", "quantidade": 1 }] }
}
```

Publicar e configurar:

```bash
supabase functions deploy pedido-limpeza --project-ref nspellvudlwpkwfbgvrg --no-verify-jwt
supabase secrets set --project-ref nspellvudlwpkwfbgvrg PEDIDO_LIMPEZA_SEGREDO=<segredo longo aleatório>
```

O mesmo segredo vai para o Paradise Villas em `LIMPEZA_WEBHOOK_SEGREDO`, e o URL da função (`https://nspellvudlwpkwfbgvrg.supabase.co/functions/v1/pedido-limpeza`) na empresa de limpeza com canal `webhook`.

## Por fazer

- Retorno para a Paradise Villas («limpeza feita»).
- Notificações às funcionárias (email/WhatsApp) com o plano do dia.
- Relatório mensal em PDF para o contabilista.
