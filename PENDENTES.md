# Pendências — integração Paradise Villas ↔ Alice Limpezas

Estado a 2026-09-29. Atualizar ao fechar cada ponto.

## Feito

- Alice: migrações `202609270001` e `202609270002` aplicadas; `main` em produção (alice-limpezas.vercel.app) com locais por cliente e pedidos por integração.
- Alice: Edge Function `pedido-limpeza` publicada com `PEDIDO_LIMPEZA_SEGREDO` definido (responde `Não autorizado` sem segredo — correto).
- Paradise Villas: migrações `202609280001_empresas_de_limpeza` e `202609280002_cron_limpeza` aplicadas; código em `main` (`f18cdbf`) e pushed para `henriquessss/paradise-villas-pdf`.

## Feito 2026-09-29

- PV: `main` (`e1def1e`) deployado — `GET https://app.paradisevillas.pt/api/limpeza` responde `405`. Variável `LIMPEZA_WEBHOOK_SEGREDO` definida na Vercel do PV pelo utilizador (a primeira tentativa usou o nome errado `PEDIDO_LIMPEZA_SEGREDO`, que é o da Edge Function). Em `clients/paradise-villas/.env.local` ainda **não** está (só precisa para correr o PV localmente).
- Alice: migração `202609290004_equipa_por_horas` aplicada; `de4f8e8` em produção; Edge Function `pedido-limpeza` republicada (escreve `valor_gestora`).

## Por fazer (agora desbloqueado — no browser do PV)

3. **Definições do PV → Empresas de limpeza:**
   - Alice Limpezas — canal «plataforma», endereço `https://nspellvudlwpkwfbgvrg.supabase.co/functions/v1/pedido-limpeza`, hora da limpeza (ex. 10:00).
   - Outra empresa — canal «email», email dela.
4. **Villas do PV:** escolher a empresa predefinida em cada villa.
5. **Alice → Clientes → Paradise Villas → Locais:** o cliente e cada villa aparecem sozinhos no primeiro pedido; preencher o preço acordado e, se diferente de 55 %, o valor da funcionária por villa.
5b. **Alice → Equipa:** valor à hora de cada funcionária.
6. **Smoke test ponta a ponta:** criar reserva de teste no PV com empresa Alice → confirmar marcação no painel da Alice no dia do check-out, com extras nos detalhes → apagar a reserva no PV → confirmar que a marcação desaparece (ou fica anotada, se já tiver pagamento).
7. **Testar em browser** o que foi construído sem browser nesta sessão: bloco «Limpeza» na página da reserva do PV, select de empresa ao criar reserva, secção Empresas de limpeza nas Definições; na Alice, locais no cliente e filtro por villa nas contas.

## Feito na fase de avisos à equipa (2026-09-27/28)

- Migração `202609280003_email_funcionaria.sql` aplicada; `33fcce8` em produção.

- Email por funcionária no perfil.
- Avisos por `mailto:` (0 €, saem da conta da gestora): botão «Avisar … por email» ao editar uma marcação com funcionária; «Enviar plano do dia» no painel, um botão por funcionária com marcações nesse dia. Textos em `src/lib/emailEquipa.ts`.

## Equipa por horas + valor da gestora (2026-09-29) — feito

Várias funcionárias por limpeza (`marcacoes_funcionarias`: horas × taxa = valor, paga uma a uma); `funcionarias.taxa_hora`; a gestora define `valor_gestora` por serviço (predefinição por local); sem percentagens. Migração aplicada, Edge Function republicada, em produção. Deploy da Edge Function corre-se **dentro de `clients/alice-limpezas`** (`supabase.exe functions deploy pedido-limpeza --no-verify-jwt --project-ref nspellvudlwpkwfbgvrg`).

## Depois (não iniciado)

- Envio automático (Gmail da gestora via SMTP numa Edge Function) reaproveitando os textos de `emailEquipa.ts`; registo «avisada em …» por marcação.
- Retorno Alice → PV («limpeza feita»).
- Relatório mensal em PDF.
