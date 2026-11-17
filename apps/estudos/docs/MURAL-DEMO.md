# Simulador de publicações do professor — apenas para demonstração

O Feed da proposta 3 já tinha publicações fictícias. Este PR acrescenta um jeito de mostrar **como seria** o fluxo de postagem, sem autenticar professores ou enviar conteúdo para a escola.

## Como usar

1. `cd apps/estudos && npm ci && npm run dev`.
2. No app, entre em **Escola > Feed**.
3. Clique em **Simular publicação**.
4. Preencha um título fictício (5–100 caracteres), uma mensagem fictícia (10–500), escolha disciplina e, opcionalmente, material de estudo.
5. Clique em **Publicar na simulação**. O post surge com a etiqueta **LOCAL**.
6. Teste marcar como lido, curtir, filtrar por disciplina e abrir material; atualize a página para validar persistência.
7. Exclua o post local pela própria interface.

## O que é e o que não é

- Qualquer pessoa com acesso ao navegador pode usar o simulador: **não é conta nem permissão real de professor**.
- Os posts são guardados apenas em `localStorage`, limitados a 15, com validação na gravação e na recuperação.
- A navegação é local, não sincroniza entre aparelhos, não envia notificações e não salva em banco.
- O feed usa o mesmo visual dos posts fictícios originais; as publicações do simulador são destacadas como locais.
- Não digitar nome, CPF, escola identificada, histórico ou informações de crianças reais.
- Para um professor real publicar, falta integrar o frontend ao backend com sessão segura, vínculo professor/turma e autorização por recurso.

## Testes

`npm test` cobre criação, entrada inválida, duplicidade, limite de posts, recuperação de dados corrompidos e persistência de reações. `npm run build` verifica TypeScript/Vite.

Este simulador não deve entrar no piloto com dados reais sem uma análise explícita de privacidade e autorização.
