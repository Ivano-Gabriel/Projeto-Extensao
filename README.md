# Projeto de Extensão

Tres propostas para os alunos conhecerem e escolherem qual ideia a equipe vai desenvolver com mais profundidade. Cada prototipo tem seu proprio frontend, com dados de demonstracao.

## Prototipos

| Proposta | Pasta | O que demonstra |
| --- | --- | --- |
| 1. Calendario de provas, trabalhos e avisos | `apps/web` | Agenda, comunicados, boletim demonstrativo e area do aluno |
| 2. Biblioteca escolar | `apps/biblioteca` | Catalogo, busca, filtros, emprestimo e devolucao simulados |
| 3. Ferramenta de estudos | `apps/estudos` (planejado) | Materias, materiais e revisoes |

O `Backend/` contem a API Java com login e permissoes. Ela foi criada para a proposta 1 e **ainda nao esta ligada aos prototipos do frontend**. Nao existe banco ou conta real na biblioteca.

## Como rodar localmente

Precisa de Node.js compativel com o Vite 8.

**Proposta 1 — Calendario:**

```powershell
cd apps/web
npm.cmd ci
npm.cmd test
npm.cmd run dev
```

**Proposta 2 — Biblioteca:**

```powershell
cd apps/biblioteca
npm.cmd ci
npm.cmd test
npm.cmd run dev
```

Execute um app por vez, ou passe `-- --port 5174` ao iniciar o segundo app.

O Vite mostrara a URL local. Para gerar versao de producao, execute `npm.cmd run build` dentro da pasta de cada frontend.

## Identidade visual

O arquivo [DESIGN.md](./DESIGN.md) define as cores e a linguagem visual da familia de prototipos. A proposta do calendario tambem segue o [UX-CONTRACT.md](./UX-CONTRACT.md); cada app novo mantem o foco mobile e controles acessiveis.

## Combinados da equipe

- `main` sempre revisada e funcional
- Cada prototipo ou mudanca usa uma branch e seu proprio PR
- Sem merge automatico: a equipe revisa e aprova
- Nao usar dados pessoais ou estoque real nas demonstracoes
- A escolha dos alunos vem antes de ligar API, banco ou deploy definitivo
