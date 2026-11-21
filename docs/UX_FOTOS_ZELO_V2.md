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
