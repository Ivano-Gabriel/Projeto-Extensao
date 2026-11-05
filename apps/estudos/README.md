# Ferramenta de estudos — Proposta 3

Um prototipo separado para os alunos experimentarem revisao por materia, resumos e perguntas.

## O que funciona

- Busca e filtros de materiais de estudo
- Leitura de 8 resumos autorais organizados por materia
- Marcacao dos materiais ja revisados
- Quiz com 8 perguntas, feedback e explicacoes
- Progresso e resultados salvos somente neste navegador
- Layout mobile/desktop com as cores do projeto

**O conteudo e demonstrativo, nao e material oficial da escola.** Sem cadastro, login, banco, upload, IA, troca de mensagens ou dados reais dos adolescentes. O quiz foi pensado para estudar, nao para auxiliar em provas em andamento.

## Rodar no PowerShell

A partir da raiz do repositorio:

```powershell
cd apps/estudos
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

O Vite mostrara o endereco local, normalmente `http://localhost:5173`.

## Pastas

- `src/dados/materiais.ts`: textos demonstrativos
- `src/dados/questoes.ts`: questoes e explicacoes
- `src/logica/`: busca, pontuacao e persistencia sem React
- `src/App.tsx`: navegacao e interface
- `tests/`: testes do comportamento

O app tem `package.json` e `package-lock.json` proprios, separados de `apps/web` e `apps/biblioteca`.
