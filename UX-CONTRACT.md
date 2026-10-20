# Contrato de experiência

Este arquivo registra as decisões de comportamento que precisam continuar iguais nas próximas telas. A identidade visual fica em [DESIGN.md](./DESIGN.md).

## Público e dispositivo

- Alunos do ensino médio são o público principal.
- O celular é o primeiro dispositivo de projeto.
- Professor e direção terão áreas próprias, sem misturar permissões com a área do aluno.

## Navegação

- No celular: barra inferior com Início, Agenda, Avisos e Perfil.
- No desktop: as mesmas opções aparecem em um trilho lateral.
- A opção atual precisa ter texto e estado visual.
- Cada tela atualiza o título da aba do navegador.
- Sair volta para o login demonstrativo.

## Estados

Enquanto não existe API real, toda tela deve indicar que usa dados de demonstração. Quando a API entrar, cada fluxo terá estado de carregamento, vazio, erro e sucesso.

## Ações e retorno

- Abrir um compromisso leva à agenda.
- Abrir uma notificação leva aos avisos.
- Voltar nunca depende do botão do navegador.
- Nenhuma ação destrutiva será criada sem confirmação acessível.
- Não usar `alert`, `confirm` ou `prompt`.

## Formulários

- Rótulos sempre ficam visíveis.
- Erros aparecem em texto junto ao campo.
- Campos de senha permitem mostrar e esconder o valor.
- Botões ocupados mantêm o mesmo tamanho e impedem envio duplicado.

## Acessibilidade

Meta: WCAG 2.2 AA. Controles usam HTML semântico, foco visível, contraste suficiente e alvos de toque de pelo menos 48px. Movimento reduzido do sistema deve ser respeitado.
