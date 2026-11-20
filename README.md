# zELO+ — Plataforma Escolar (Projeto de Extensão)

> **zELO+ é a identidade visual provisória da proposta escolhida no Projeto de Extensão.** Antes de registro e exploração comercial, verificar disponibilidade da marca, titularidade/autorizações da equipe e licenças dos componentes.

Aplicativo responsivo/PWA com espaço de estudos para alunos e portal escolar para **aluno, professor, direção e administração de escolas**. O projeto foi desenvolvido academicamente a partir da comparação de **três protótipos** (agenda, biblioteca e estudos), aprofundando a solução de estudos escolhida.

## Demonstração e código

- **Frontend homologação:** https://extensao-estudos.vercel.app
- **Frontend:** `apps/estudos` — React + TypeScript + Vite + PWA
- **Backend:** `Backend` — Java 21 + Spring Boot, API HTTP/JSON, sessões, CSRF
- **Banco de homologação:** PostgreSQL, versionado com Flyway
- **Fluxo de engenharia:** branches, pull requests, testes automatizados e homologação humana
- **Outros protótipos:** `apps/web` e `apps/biblioteca`

## O que funciona (sob contas e dados fictícios)

| Perfil | Funções em homologação |
| --- | --- |
| Aluno | Login, turmas, materiais publicados, atividades da turma, respostas, explicações, avisos, desempenho de quizzes |
| Professor | Turmas/disciplinas vinculadas, publicação de questões, materiais, comunicados, aulas e presença **provisória** |
| Direção | Turmas, usuários, vínculos, matrículas, realocações e histórico, horários, avisos |
| Administração | Cadastro de escolas e contas de direção |
| Estudos | Biblioteca demonstrativa, revisão, desafio do dia, plano e missões |
| Assistente | Respostas guiadas gratuitas; IA generativa preparada, **não habilitada por padrão** |

**Limite essencial:** os dados do Laboratório (demo) não são notas ou frequências oficiais. O portal guarda registros *persistidos de teste* sob autorização. Este software não está autorizado como diário escolar institucional e não deve receber dados reais de menores sem governança de privacidade e aprovação adequada.

## Executar localmente

**Pré-requisitos:** Git, Node.js compatível com Vite 8, Java 21 e Maven.

Consulte [COMO_RODAR_LOCAL.md](./COMO_RODAR_LOCAL.md). O guia cobre API local na porta `3001`, frontend na `5173`, usuário de homologação e criação de turmas/atividades pelas telas.

## Documentação do trabalho e profissionalização

| Arquivo | Para quê serve |
| --- | --- |
| [Relatório acadêmico](docs/TRABALHO-ACADEMICO-ZELO.md) | Introdução, objetivos, metodologia, arquitetura, resultados e limitações |
| [Roteiro de homologação](docs/HOMOLOGACAO-ZELO.md) | 20 cenários, critérios, dispositivos e modelo de relato de bug |
| [Massa de dados de teste](docs/DADOS-HOMOLOGACAO-ZELO.md) | Contas fictícias e atividades curadas para cadastro persistido |
| [Plano de prontidão institucional](docs/PLANO-INSTITUCIONAL-ZELO.md) | Acessibilidade, LGPD, auditoria, disponibilidade e apresentação a órgãos |
| [IA pedagógica](docs/IA-ESCOLAR-ATIVACAO.md) | Funcionamento, limites, custo, revisão docente e privacidade |

## Testes

```powershell
cd apps/estudos
npm ci
npm test
npm run build
```

```powershell
cd Backend
mvn.cmd test
```

O resultado real de cada execução deve ser verificado nas ações do GitHub e registrado na evidência de homologação; **não presumir** que testes automatizados bastam para aprovação de UX ou segurança institucional.

## Organização do trabalho e créditos

O desenvolvimento integra contribuições de estudantes. Antes da apresentação final, documentar as responsabilidades efetivas de cada integrante; não atribuir código, decisão ou resultados não comprovados. O nome zELO+ é provisório; marca, uso comercial e titularidade do código requerem análise e acordo apropriados.

**Objetivo:** melhorar a experiência de estudo e a organização escolar com acompanhamento docente e segurança, mantendo transparência sobre o que ainda está em validação.
