# Guia rápido para a equipe

Obrigado por trabalhar no Projeto de Extensão. A proposta de Estudos foi escolhida pelos alunos: queremos evoluir com eles, não inventar funcionalidades sem validar.

## Preparação

Git e Node.js compatível com Vite 8. Para a API: Java 21 e Maven.

```bash
git clone https://github.com/Ivano-Gabriel/Projeto-Extensao.git
cd Projeto-Extensao
git switch main
git pull --ff-only origin main
cd apps/estudos
npm ci
npm test
npm run build
npm run dev
```

No Windows PowerShell, use `npm.cmd` no lugar de `npm` se necessário.

## Fluxo de contribuição

1. `git switch main && git pull --ff-only origin main`
2. `git switch -c feature/nome-da-melhoria`
3. Faça uma mudança pequena, com teste e README quando o comportamento muda.
4. Em `apps/estudos`: `npm test && npm run build`. Em `Backend`: `mvn test`.
5. `git add ... && git commit -m "feat: descricao objetiva"`
6. `git push -u origin feature/nome-da-melhoria` e abra PR para `main`.
7. Descreva o que muda visualmente, como testar e quais riscos existem.
8. Esperar revisão antes do merge; **não alterar produção, banco, acessos ou segredos**.

## Checklist de PR

- [ ] Sem nomes/CPF/contato de crianças em dados de exemplo, capturas ou commits.
- [ ] Testes e build executados, ou limitação declarada.
- [ ] Responsivo em tela pequena (320–390px), teclado e foco visível.
- [ ] Botões funcionam e feedback é anunciado; não depender só da cor.
- [ ] Novos dados persistidos no navegador têm validação, limite de tamanho e forma de excluir.
- [ ] Telas com dados inventados deixam isso explícito.
- [ ] Não confundir atividade do aluno com frequência, nota ou benefício oficial.
- [ ] Mudanças de backend exigem autorização por papel **e turma**.
- [ ] Migrations reversíveis ou plano de rollback documentado.
- [ ] Sem merge automático de mudanças não revisadas.

Arquitetura, limites do MVP e roteiro de testes em [docs/ARQUITETURA-E-PILOTO.md](docs/ARQUITETURA-E-PILOTO.md).
