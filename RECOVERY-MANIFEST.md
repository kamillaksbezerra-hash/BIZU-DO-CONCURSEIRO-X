# Recovery Manifest — 2026-09-06

## Vercel baseline preservado

- Project ID: `prj_egNj08Eerf6kOO1bKBxT5cJzxXk3`
- Deployment anterior preservado: `dpl_5doLBMRPxnGji5KY1krPpcov2b22`
- Estado observado antes da recuperação: `READY` / `production`

## Wrappers restaurados

- `index.html` SHA-256: `1bb820942c1969f5d1ec54972801279b225d7ea33cb602bef98e87679eb878e9`
- `admin.html` SHA-256: `870ec736b2ab0f150fb6707a6a8ff1f6768aeab27ccd31c721b9260349cf3012`

## Backend ativo no Supabase

- `bizu-x-api`: v14
- `bizu-x-private-ui`: v23
- `bizu-x-integrated`: v20
- `bizu-x-validator`: v7

O GitHub versiona a camada de hospedagem pública; as funções de backend continuam implantadas no projeto Supabase existente e são referenciadas pelas rotas de `vercel.json`.

## Rollback

O deployment anterior da Vercel foi mantido intacto durante a recuperação. Nenhuma exclusão de deployment, banco, usuário ou conteúdo foi realizada.
