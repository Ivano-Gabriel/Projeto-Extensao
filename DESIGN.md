---
version: alpha
colors:
  paper: "#F6F4EE"
  sheet: "#FFFFFF"
  ink: "#172033"
  ink-muted: "#667085"
  blue: "#1E5EFF"
  blue-soft: "#E9F0FF"
  yellow: "#F7C948"
  coral: "#F06449"
  mint: "#2FA77A"
  line: "#D8DDE8"
typography:
  display:
    fontFamily: "Trebuchet MS, Aptos Display, sans-serif"
    fontSize: "2rem"
    lineHeight: "1.05"
  body:
    fontFamily: "Aptos, Segoe UI, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.55"
  utility:
    fontFamily: "Aptos, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    lineHeight: "1.3"
rounded:
  control: "0.875rem"
  card: "1.25rem"
  pill: "999px"
spacing:
  unit: "0.25rem"
  page: "1rem"
  section: "1.5rem"
components:
  navigation:
    mobile: "bottom bar com área segura"
    desktop: "trilho lateral"
  card:
    style: "papel branco, borda visível e sombra curta"
  focus:
    style: "anel azul de 3px com afastamento"
---

# DESIGN.md

## Overview

A interface deve parecer um **caderno escolar organizado por um aluno**, não um painel corporativo. O público principal é estudante do ensino médio usando o celular entre aulas, no ônibus e em casa.

A assinatura visual é a combinação de margem de caderno, marca-texto e etiquetas de matéria. O resultado precisa ser jovem, rápido e legível sem parecer infantil.

Evitar:

- roxo com gradiente de SaaS;
- cartões de vidro;
- dashboard financeiro;
- excesso de sombras e bordas arredondadas;
- textos motivacionais genéricos.

O CSS em `apps/web/src/styles.css` é a fonte dos tokens em tempo de execução. Este documento espelha os mesmos valores e explica a intenção.

## Colors

- **Ink** organiza títulos e textos importantes.
- **Blue** representa ação e navegação.
- **Yellow** destaca prazo e atenção sem significar erro.
- **Coral** representa urgência.
- **Mint** representa conclusão.
- **Paper e sheet** mantêm a referência física de caderno.

Cor nunca será a única forma de comunicar um estado.

## Typography

Títulos usam uma fonte com personalidade editorial curta. Textos e controles usam uma fonte simples e altamente legível. O corpo não deve ficar abaixo de 16px no celular.

## Layout

O projeto nasce mobile-first. No celular, existe navegação inferior com alvos de toque de pelo menos 48px. A partir de 900px, a navegação vira um trilho lateral e o conteúdo ganha colunas sem mudar a ordem das tarefas.

## Elevation & Depth

Superfícies estáticas usam borda. Sombra curta aparece somente em elementos elevados ou interativos. Não usar brilho, vidro ou profundidade artificial.

## Shapes

Controles são arredondados, mas não viram cápsulas sem necessidade. Etiquetas e filtros podem usar formato pill. Cartões mantêm cantos médios.

## Components

- Botões têm estados de hover, foco, pressionado e desabilitado.
- A navegação sempre mostra ícone e texto.
- Cartões de compromisso mostram tipo, matéria, prazo e ação.
- Formulários têm rótulos visíveis e mensagens em texto.
- Conteúdo crítico nunca depende apenas de hover.

## Do's and Don'ts

**Fazer:** linguagem direta, datas claras, toque confortável, foco visível e hierarquia por conteúdo.

**Não fazer:** esconder navegação, usar dados técnicos na tela, misturar padrões do Nummo ou inventar funcionalidades sem validar com os alunos.
