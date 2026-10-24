# Biblioteca escolar — Proposta 2

Prototipo independente do Projeto de Extensao para demonstracao com alunos do ensino medio.

- Catalogo ficticio com busca, filtros e disponibilidade simulada
- Pagina de detalhes de cada livro
- Simulacao de emprestimo, devolucao e data prevista
- Emprestimos salvos somente no navegador (`localStorage`)
- Layout responsivo, seguindo a mesma identidade visual do prototipo da agenda
- **Sem cadastro, login real, banco, API ou livros reais da escola**

## Executar

No PowerShell, a partir da raiz do repositorio:

```powershell
cd apps/biblioteca
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

A URL local aparece no terminal do Vite (normalmente `http://localhost:5173`).

Se ja estiver dentro de `apps/biblioteca`, nao use `cd apps/biblioteca` de novo.

## Limites honestos da demonstracao

O estoque, as capas ilustrativas e os emprestimos sao inteiramente ficticios; nao existe reserva, retirada, devolucao nem notificacao real na biblioteca da escola. O estado pode ser apagado limpando os dados do navegador. Este prototipo nao reutiliza a API Java do projeto da agenda.

Quando os alunos escolherem a proposta, o backend e as regras de emprestimo reais serao planejados com os responsaveis pela biblioteca.

## Arquitetura

- `src/dados/livros.ts`: catalogo demonstrativo
- `src/logica/catalogo.ts`: busca e disponibilidade
- `src/logica/emprestimos.ts`: emprestimos, devolucoes e persistencia local
- `src/App.tsx`: telas e navegacao
- `tests/`: testes de comportamento

Para manter os aplicativos independentes, essa pasta tem seu proprio `package.json` e `package-lock.json`, separados de `apps/web`.
