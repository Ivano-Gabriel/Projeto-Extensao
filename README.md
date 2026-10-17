# Projeto de Extensão — Pulso Escolar

Protótipo de um web app que organiza provas, trabalhos e avisos e aproxima alunos, professores e direção.

## Primeira fatia

Este primeiro incremento contém somente uma experiência demonstrativa do aluno:

1. Login sem autenticação real.
2. Resumo do dia.
3. Radar da semana.
4. Agenda e avisos fictícios.

O objetivo é validar navegação, linguagem e identidade visual antes de conectar banco de dados e API.

## Executar o protótipo

```bash
cd apps/web
npm install
npm run dev
```

Abra o endereço exibido pelo Vite no navegador.

## Organização planejada

```text
apps/web  → interface React
apps/api  → API Spring Boot, adicionada na próxima etapa
docs      → requisitos e decisões do projeto
```

## Fluxo da equipe

- A branch `main` deve permanecer funcional.
- Cada tarefa usa uma branch curta: `feature/nome-da-tarefa`.
- Toda mudança chega à `main` por Pull Request.
- Um colega revisa antes do merge.

