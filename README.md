# Projeto de Extensão — Plataforma Escolar 🎓

Projeto acadêmico desenvolvido em equipe para explorar soluções digitais que auxiliem o cotidiano de **alunos, professores e direção escolar**. Os protótipos foram apresentados aos estudantes para ouvir suas preferências.

## Propostas desenvolvidas

| Protótipo | Pasta | Objetivo |
| --- | --- | --- |
| **Agenda escolar** | `apps/web/` | Provas, trabalhos, avisos e área do aluno. |
| **Biblioteca** | `apps/biblioteca/` | Busca, catálogo e empréstimos simulados. |
| **Ferramenta de estudos** | `apps/estudos/` | Materiais, revisões, questões e acompanhamento de estudos. |

✅ **A ferramenta de estudos foi a proposta escolhida pelos alunos.**

## Tecnologias

- **Frontend:** React, TypeScript e Vite.
- **Backend:** Java 21, Spring Boot e Spring Security.
- **Persistência:** PostgreSQL para a API; dados demonstrativos e armazenamento local nos protótipos.
- **Organização:** GitHub, branches, pull requests e testes automatizados.

## Executar um protótipo

**Pré-requisito:** Node.js compatível com Vite 8.

```bash
cd apps/estudos
npm ci
npm run dev
```

Para abrir os outros protótipos, substitua `apps/estudos` por `apps/web` ou `apps/biblioteca` e execute os mesmos comandos.

```bash
npm test
npm run build
```

O backend tem instruções específicas em [`Backend/README.md`](./Backend/README.md).

## Estado atual

O backend possui uma base de autenticação e permissões, mas **a integração com os protótipos ainda está em desenvolvimento**. Notas, frequência e demais dados exibidos nas demonstrações **não são registros escolares oficiais**.

**Trabalho em equipe:** mudanças de código são organizadas em branches e pull requests para revisão. Não utilizar dados pessoais reais nas demonstrações.

**Objetivo:** construir a solução com participação dos estudantes, priorizando usabilidade, acessibilidade e aprendizado prático.
