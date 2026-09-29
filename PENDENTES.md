# Pendências — integração Paradise Villas ↔ Alice Limpezas

Estado a 2026-09-27. Atualizar ao fechar cada ponto.

## Feito

- Alice: migrações `202609270001` e `202609270002` aplicadas; `main` em produção (alice-limpezas.vercel.app) com locais por cliente e pedidos por integração.
- Alice: Edge Function `pedido-limpeza` publicada com `PEDIDO_LIMPEZA_SEGREDO` definido (responde `Não autorizado` sem segredo — correto).
- Paradise Villas: migrações `202609280001_empresas_de_limpeza` e `202609280002_cron_limpeza` aplicadas; código em `main` (`f18cdbf`) e pushed para `henriquessss/paradise-villas-pdf`.

## Por fazer (bloqueado: sem acesso à Vercel do Paradise Villas)

1. **Confirmar o deploy do PV.** `GET https://app.paradisevillas.pt/api/limpeza` tem de responder `405` (código novo). A 2026-09-27 respondia `404` = código antigo. A Vercel do PV não está na conta acessível deste PC; se não houver deploy automático do `main`, alguém com acesso faz `vercel --prod` ou «Redeploy».
2. **Variável `LIMPEZA_WEBHOOK_SEGREDO`** na Vercel do PV (Production + Preview) = o segredo gerado ao publicar a Edge Function. Também em `clients/paradise-villas/.env.local` para desenvolvimento. Sem ela, pedidos por webhook ficam «Falhou» no histórico da reserva e o cron reenvia quando existir.
3. **Definições do PV → Empresas de limpeza:**
   - Alice Limpezas — canal «plataforma», endereço `https://nspellvudlwpkwfbgvrg.supabase.co/functions/v1/pedido-limpeza`, hora da limpeza (ex. 10:00).
   - Outra empresa — canal «email», email dela.
4. **Villas do PV:** escolher a empresa predefinida em cada villa.
5. **Alice → Clientes → Paradise Villas → Locais:** o cliente e cada villa aparecem sozinhos no primeiro pedido; preencher o preço acordado e, se diferente de 55 %, o valor da funcionária por villa.
6. **Smoke test ponta a ponta:** criar reserva de teste no PV com empresa Alice → confirmar marcação no painel da Alice no dia do check-out, com extras nos detalhes → apagar a reserva no PV → confirmar que a marcação desaparece (ou fica anotada, se já tiver pagamento).
7. **Testar em browser** o que foi construído sem browser nesta sessão: bloco «Limpeza» na página da reserva do PV, select de empresa ao criar reserva, secção Empresas de limpeza nas Definições; na Alice, locais no cliente e filtro por villa nas contas.

## Feito na fase de avisos à equipa (2026-09-27/28)

- Migração `202609280003_email_funcionaria.sql` aplicada; `33fcce8` em produção.

- Email por funcionária no perfil.
- Avisos por `mailto:` (0 €, saem da conta da gestora): botão «Avisar … por email» ao editar uma marcação com funcionária; «Enviar plano do dia» no painel, um botão por funcionária com marcações nesse dia. Textos em `src/lib/emailEquipa.ts`.

## Equipa por horas + valor da gestora (2026-09-29)

Pedido: várias funcionárias por limpeza; pagas à hora (horas definíveis na hora ou depois); a gestora também limpa e define o que recebe por serviço; sem percentagens (o 55 % desapareceu).

1. **Aplicar a migração `supabase/migrations/202609290004_equipa_por_horas.sql`** no SQL Editor. Cria `marcacoes_funcionarias`, `funcionarias.taxa_hora`, `marcacoes.valor_gestora`, `clientes_locais.valor_gestora`; migra as marcações antigas (funcionária + valor passam para uma participação) e **apaga** `marcacoes.funcionaria_id/valor_funcionaria/funcionaria_paga` e `clientes_locais.valor_funcionaria`.
2. **Só depois: push de `main`** (o código novo lê `marcacoes_funcionarias`; o código antigo lê colunas que a migração apaga — a ordem é migração → deploy).
3. **Republicar a Edge Function `pedido-limpeza`** (PowerShell, como da outra vez: `C:\Users\gffth\bin\supabase.exe functions deploy pedido-limpeza --no-verify-jwt --project-ref nspellvudlwpkwfbgvrg`). A versão publicada escreve `valor_funcionaria`, que deixa de existir: sem republicar, os pedidos do PV falham com «column does not exist».
4. Equipa: preencher o **valor à hora** de cada funcionária (página Equipa). Locais do PV: coluna «gestora» = o que a Alice recebe por villa.

## Depois (não iniciado)

- Envio automático (Gmail da gestora via SMTP numa Edge Function) reaproveitando os textos de `emailEquipa.ts`; registo «avisada em …» por marcação.
- Retorno Alice → PV («limpeza feita»).
- Relatório mensal em PDF.
