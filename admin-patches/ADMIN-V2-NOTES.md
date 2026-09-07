# ADMIN v2 — escopo

Este enhancement trabalha sobre o painel administrativo existente do Bizu X. Não cria sistema paralelo e não altera `role` pelo frontend.

## Funções expostas no painel existente
- Dashboard administrativo visível e atalhos para módulos já existentes.
- Alunos e acessos: listagem, busca, edição de nome/plano, informações de assinatura/pagamento e bloqueio/desbloqueio reversível.
- Gestão acadêmica: atalhos para concursos, editais, turmas, matérias, assuntos, questões, PDFs, vídeo aulas e demais recursos do editor existente.
- Avisos/Central Bizu: criar, editar, visualizar como aluno, publicar/ocultar e excluir.
- Mensagens dos alunos, Fábrica, IA, Redações e Arquivos: atalhos para páginas já existentes.

## Segurança
- A autorização real continua no servidor (`profiles.role='admin'`, rota privada e `/api/admin/*`).
- Aluno não pode alterar a própria role.
- Bloqueio de aluno preserva dados; não há hard delete de usuário neste enhancement.
- Nenhuma credencial é armazenada no patch.
- Nenhum recurso `r27_*` é acessado ou alterado.
