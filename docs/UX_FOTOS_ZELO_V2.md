# Fotografias e decisões da UX zELO+ V2

**Status:** proposta de preview não aprovada. Fotos reais e públicas não são imagens de alunos da escola nem representam qualquer vínculo institucional.

## Origem e licença
Fotografias fornecidas pelo [Unsplash](https://unsplash.com/license), sob a licença gratuita Unsplash, inclusive uso comercial em interfaces. Todas as imagens foram selecionadas para mostrar estudo, leitura e ambiente de aprendizagem; as imagens são **editoriais genéricas**, não dados de alunos. Não atribuir identidades ou vínculo com a escola às pessoas retratadas.

- `photo-1497633762265-9d179a990aa6` — Element5 Digital, pilha de livros, usado em biblioteca, atalhos, materiais e cabeçalho da direção.
- `photo-1434030216411-0b793f4b4173` — Green Chameleon, mesa/caderno de estudo, usado no hero do aluno, revisão e cards.
- `photo-1456513080510-7bf3a84b82f8` — fotografia de estudo/livro, usada em revisão, biblioteca e cartões.
- `photo-1513258496099-48168024aec0` — ambiente de aprendizagem, usada no cabeçalho de professor.

As imagens são carregadas com `images.unsplash.com` e têm fallback de cor; não são distribuídas no repositório. Antes de uma implantação institucional durável, vale reduzir dependências remotas (otimizar, armazenar localmente as cópias licenciadas e aplicar política de imagens/CSP apropriada).

## Diretrizes funcionais
- **Navegação mobile**: 4 destinos comuns + Mais em painel próprio. Nunca usar barra de rolagem horizontal para encontrar abas de gestão, professor ou aluno.
- **Menu do livro**: capa bipartida e três folhas animadas só quando abrir; `prefers-reduced-motion` impede animações.
- **Material escolar real**: pesquisa, filtro por disciplina, resumo e leitura por expansão; mostrar texto completo apenas quando selecionado.
- **Modo escuro**: depende de revisão visual com usuários; não declarar WCAG certificado.
- **Proteção**: fotos não incluem registros escolares; nenhuma mudança de API, permissão, banco, login ou IA.
- **Validação**: PR e preview separados de `main`. Avaliação visual pelo usuário antes de merge.

## Revisão V3 — 21/11/2026 (aguardando avaliação)
- `photo-1523240795612-9a054b0db644` — fotografia de estudantes/ambiente educacional exibida como capa editorial do login mobile, com degradê para legibilidade.
- `photo-1516321318423-f06f85e504b3` — fotografia temática de tecnologia no cartão de segurança digital.
- `photo-1460925895917-afdab827c52f` — fotografia temática de indicadores e negócios.
- `photo-1495020689067-958852a7765e` — fotografia temática de notícias/pesquisa.
- As fotos são ilustrativas, sem vínculo com alunos, professores ou escolas cadastradas.
- A navegação do livro abre na direção oposta à proposta anterior, com estados finais mais definidos. A animação e as imagens ainda exigem inspeção visual em navegador real.
- O azul do botão Entrar é `#24527F`. O login de desktop foi preservado, e a capa com fotografia foi introduzida no telefone.
- Nenhuma alteração foi realizada em autenticação, banco de dados, permissões ou rotas do backend.
- **Não declarar concluído** até CI de build e homologação mobile/desktop; o Vercel sinalizou limite de builds no plano em 21/11/2026.
