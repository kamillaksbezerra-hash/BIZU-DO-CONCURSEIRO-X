# Auditoria RBAC ADMIN × ALUNO — 2026-09-07

Escopo exclusivo: Bizu do Concurseiro X.

## Evidências antes da correção

- `public.profiles.role` é a fonte de autoridade para ADMIN/ALUNO.
- `private.is_admin()` consulta `public.profiles` e exige `role = 'admin'`.
- RLS de `public.profiles` não permite auto-update de role por aluno; UPDATE exige `private.is_admin()`.
- Escrita em cursos, matérias, tópicos, questões, materiais e avisos exige `private.is_admin()`.
- `/api/admin/*` em `bizu-x-api` possui gate server-side `role === 'admin'`.
- `/private/admin` em `bizu-x-private-ui` bloqueia não-admin.
- Falha encontrada: login principal `/` não separava perfis e enviava qualquer conta autenticada para `/private/app`.
- Falha encontrada: proxy `/private/*` não fazia roteamento mutuamente exclusivo por role.
- O painel ADMIN contém atalho legado `Área do aluno` apontando para `/`, o que podia levar um administrador ao fluxo de aluno/login.

## Correção implementada nesta branch

1. Login `/`: `admin -> /private/admin`, `student -> /private/app`.
2. Login `/admin`: conta student autenticada é enviada à sua área `/private/app` e nunca recebe HTML ADMIN.
3. Proxy privado consulta `/api/session` no servidor antes de entregar HTML:
   - student + rota ADMIN -> `/private/app`;
   - admin + rota ALUNO -> `/private/admin`;
   - sem sessão -> login correspondente.
4. Apenas cookies de autenticação Bizu (`bx_at`, `bx_rt`) são retransmitidos pelo proxy privado.
5. API administrativa continua com autorização server-side independente do frontend.

## Estado do painel administrativo observado

O `prod_admin` atual contém Dashboard, Conteúdo e Cadastros, Usuários, Arquivos, Fábrica de Conteúdo X, Inteligência Artificial, Redações, Central de Conteúdo, Avisos, Mensagens dos alunos e Identificação/planos. O CRUD de Avisos já usa `/admin/notices`; a auditoria funcional desses módulos continua após o fechamento do RBAC P0.

Nenhuma tabela, função ou recurso `r27_*` faz parte deste trabalho.
