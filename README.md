# Projeto de Extensão

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
apps/api  → API Python (FastAPI + SQLite)
docs      → requisitos e decisões do projeto
```

## Fluxo da equipe

- A branch `main` deve permanecer funcional.
- Cada tarefa usa uma branch curta: `feature/nome-da-tarefa`.
- Toda mudança chega à `main` por Pull Request.
- Um colega revisa antes do merge.


## Rodar o projeto (dois terminais)

```bash
# Terminal 1 - API Python (http://127.0.0.1:8000, documentação em /docs)
cd apps/api
python -m venv .venv
.venv\Scripts\activate        # Windows (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 - interface
cd apps/web
npm install
npm run dev
```

O banco `apps/api/banco.db` é criado sozinho, já com dados de exemplo. Testes da API: `pip install httpx pytest` e `pytest` dentro de `apps/api`.

## Painel do backend

Depois de entrar, abra **Perfil → Painel do backend**:

- **Dados**: cria, edita, conclui e exclui provas, trabalhos e avisos (grava via API no SQLite).
- **Botões**: o que cada botão faz e qual rota da API ele chama (`src/backend/botoes.ts`).
- **Esquema SQL**: tabelas do banco e a evolução prevista (`apps/api/schema.sql`).
