# Ferramenta de Estudos — escolhida pelos alunos

O protótipo 3 foi escolhido na apresentação escolar. Esta branch implementa a primeira evolução das **ideias propostas pelos próprios alunos**.

## O que já funciona no protótipo

- **Atividade vinculada ao Feed:** no simulador do professor, escolha um tema que já possui material e clique em **Gerar atividade deste tema**. O aplicativo preenche um recado e vincula uma questão existente ao post; o aluno responde no Feed, vê explicação e pode refazer. O resultado fica só no navegador.
- **Limite do gerador atual:** seleciona uma questão previamente cadastrada, não cria conteúdo novo com IA e não interpreta arquivos PDF. Isso exige backend protegido, fornecedor de IA, validação pedagógica e autorização antes de dados escolares reais.

- **Arcade do Saber:** minigame próprio de 30 segundos, com livro que salta obstáculos, dois pontos de vida, pontuação local, botão de toque e teclas Espaço/Seta para cima. Sem cadastro, ranking, coleta de dados ou recompensas que afetem a avaliação escolar.
- **Livro que se abre:** animação de apresentação do conteúdo com suporte a movimento reduzido e melhorias nas interações mobile.

- **Plano semanal pessoal:** criar tarefas com matéria, data e material opcional; filtrar pendentes/concluídas, marcar feitas, reabrir e excluir. Limite de 50 tarefas no próprio dispositivo; sem envio para a escola ou cobrança escolar.

- Resumos por matéria, leitura, busca, marcação como revisado e quiz com explicações
- **Escola > Frequência**: semana, mês e ano; total ponderado pelas aulas/horas; detalhe por matéria; avisos de proximidade da referência de 80%
- **Escola > Notas**: boletim de exemplo com médias parciais (não é boletim real)
- **Escola > Feed**: publicações fictícias de professores, curtir, marcar como lido e acessar o material correspondente
- **Escola > Frequência**: intenção de comparecimento no próximo dia da semana (vou/talvez/não vou), *não é presença oficial*
- **Escola > Feedback**: rascunhos locais que o aluno pode copiar para enviar manualmente à equipe; o app **não transmite** as mensagens
- **Foguinho**: sequência de dias em que o estudante realmente marcou uma revisão ou respondeu quiz; não substitui a frequência
- **Modo escuro**: botão no cabeçalho, preferência salva localmente
- **Offline**: Service Worker que armazena o frontend compilado e os conteúdos já incluídos no app. Funciona depois da primeira visita online na versão **build/preview**; não funciona no modo dev

## Rodar e testar

```bash
cd apps/estudos
npm ci
npm test
npm run build
npm run dev
```

URL exibida no terminal (normalmente `http://localhost:5173`).

### Testar offline corretamente

```bash
npm run build
npm run preview
```

Abra a URL do preview online, entre na aba **Escola**, clique em **Guardar para offline** e aguarde a confirmação. Abra as ferramentas de desenvolvedor do navegador, ative **Offline** e recarregue a página. O cache não inclui APIs externas nem autenticação.

## Limites de segurança e produto

**Tudo é demonstrativo e fictício.** Não há login real neste frontend, integração com o banco, professores reais, notas de estudantes ou registros oficiais de frequência.

- Não armazenar informações de crianças ou adolescentes reais neste protótipo
- A referência de 80% é informativa; a elegibilidade do Pé-de-Meia, a frequência oficial e os pagamentos dependem das regras e dos dados validados pelo poder público
- Alertas **por matéria** são educativos, não equivalem ao cálculo oficial do Pé-de-Meia
- Previsão de comparecimento não equivale a uma presença, falta justificada ou comprovante
- Feedback é salvo apenas no dispositivo, não enviado à equipe; evitar nomes, CPF, endereço ou informações pessoais
- Notas não determinam situação de aprovação/reprovação
- O dia letivo previsto ignora apenas fins de semana, não tem calendário de feriados ou interrupções da escola

Para usar dados reais, será preciso definir os papéis (aluno, professor, direção), autorização, privacidade e integração com a fonte oficial da escola. O backend Java existente ainda **não foi conectado** a este protótipo.

## Código

- `src/plano/regras.ts` + `src/plano/Plano.tsx`: tarefas pessoais, validação, filtros, status e interface mobile
- `tests/plano.test.mjs`: 7 casos sobre persistência, limites, datas, exclusão e cálculo de prioridades
- `src/escola/dados.ts`: exemplos de presença, boletim e posts
- `src/escola/regras.ts`: cálculo de frequência, indicadores, notas e sequência
- `src/escola/estado.ts`: validação e persistência local
- `src/escola/Escola.tsx`: telas e interações escolares
- `src/escola/escola.css`: responsividade, novo painel e modo escuro
- `public/sw.js`: cache restrito à página e assets estáticos
- `src/escola/offline.ts`: solicitação de download local
- `tests/escola*.test.mjs`: regras de frequência, estado e casos de borda

O app mantém seu próprio `package.json` e `package-lock.json`, independente de `apps/web` e `apps/biblioteca`.
