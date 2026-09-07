# Bizu do Concurseiro X

Repositório oficial da camada Vercel do Bizu do Concurseiro X.

## Produção

- Projeto Vercel: `bizu-do-concurseiro-x-oficial-2026`
- Domínio: `bizu-do-concurseiro-x-oficial-2026.vercel.app`
- Backend: Supabase `xizvzwvvtfavsxtyosso`

## Arquitetura atual

- `index.html`: entrada do aluno.
- `admin.html`: entrada administrativa.
- `/api/*`: encaminhado para a Edge Function `bizu-x-api`.
- `/private/*`: encaminhado para a Edge Function `bizu-x-private-ui`.
- Persistência, autenticação, conteúdo e regras de negócio permanecem no Supabase.

## Segurança

Nenhuma chave, senha, token ou `SERVICE_ROLE` deve ser armazenada neste repositório. As Edge Functions leem segredos somente do ambiente seguro do Supabase.

## Publicação

Mudanças devem passar por branch de recuperação/homologação e Preview antes de serem habilitadas na branch `main`.

## Escopo

Este repositório pertence exclusivamente ao Bizu do Concurseiro X. Recursos de outros projetos não fazem parte deste código.
