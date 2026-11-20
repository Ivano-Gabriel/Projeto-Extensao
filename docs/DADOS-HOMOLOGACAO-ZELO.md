# zELO+ — Massa de homologação persistente, sem dados pessoais reais

**Objetivo:** criar registros efetivos no banco de staging usando as telas autorizadas, e distinguir esses registros dos exemplos locais do Laboratório (demo). Nada aqui é dado escolar oficial.

## Preparação

Crie no portal, com a conta de administração autorizada, a escola **Escola Horizonte — Homologação** (código `HORIZONTE-TESTE`), uma conta de direção e três professores fictícios. A direção criará `1A`, `1B` (mesmo ano letivo) e `2A` (ano/nível distinto), 8 a 12 estudantes fictícios e vínculos de Matemática, Português e História. Exemplos de e-mail: `prof.matematica@exemplo.test` e `aluno01@exemplo.test`. **Nunca publicar senhas em arquivos, PRs ou capturas.**

Usar `@exemplo.test` apenas como domínio reservado de teste, sem supor que e-mails possam receber mensagens. Não cadastrar identidades reais de crianças.

## Atividades de teste para criar pelo professor

O formulário atual aceita **uma questão com quatro alternativas por atividade**, escolhendo qual índice (A–D) está correto e uma explicação. Não existe importação CSV oficial: copiar manualmente as questões abaixo na interface **Professor → Atividades**.

### A01 — Matemática (1A)

**Título:** Equações do segundo grau — raízes  
**Pergunta:** Quais são as raízes de x² − 5x + 6 = 0?  
A) 1 e 6 · B) 2 e 3 · C) −2 e −3 · D) 0 e 5  
**Correta:** B  
**Explicação:** (x − 2)(x − 3) = 0, então x = 2 ou x = 3.

### A02 — Matemática (1A)

**Título:** Porcentagem em situações cotidianas  
**Pergunta:** Um caderno custa R$ 80 e recebe desconto de 25%. Qual é o preço final?  
A) R$ 40 · B) R$ 50 · C) R$ 60 · D) R$ 75  
**Correta:** C  
**Explicação:** 25% de 80 = 20; 80 − 20 = 60.

### A03 — Matemática (1B)

**Título:** Função afim — identificar raiz  
**Pergunta:** Para f(x) = 2x − 8, em qual valor f(x) = 0?  
A) 2 · B) 4 · C) 6 · D) 8  
**Correta:** B  
**Explicação:** 2x − 8 = 0 → x = 4.

### A04 — Português (1A)

**Título:** Figuras de linguagem — comparação  
**Pergunta:** Em “corajoso como um leão”, a figura de linguagem predominante é:  
A) Metáfora · B) Hipérbole · C) Comparação · D) Antítese  
**Correta:** C  
**Explicação:** A palavra “como” explicita a aproximação entre duas características.

### A05 — Português (1B)

**Título:** Classes gramaticais — advérbio  
**Pergunta:** Em “ela estudou cuidadosamente”, a palavra “cuidadosamente” indica:  
A) Tempo · B) Modo · C) Lugar · D) Intensidade  
**Correta:** B  
**Explicação:** O advérbio caracteriza a maneira como a ação ocorreu.

### A06 — História (1A)

**Título:** História do Brasil — Independência  
**Pergunta:** Em que ano foi proclamada a Independência do Brasil?  
A) 1500 · B) 1808 · C) 1822 · D) 1889  
**Correta:** C  
**Explicação:** A Independência do Brasil foi proclamada em 1822; 1889 refere-se à Proclamação da República.

### A07 — História (1B)

**Título:** História geral — Revolução Industrial  
**Pergunta:** Qual setor foi central na primeira Revolução Industrial inglesa?  
A) Têxtil · B) Informática · C) Aeronáutica · D) Cinema  
**Correta:** A  
**Explicação:** A mecanização da produção têxtil impulsionou a primeira fase industrial.

### A08 — Matemática (1A)

**Título:** Geometria — área de retângulo  
**Pergunta:** Um retângulo mede 8 cm de comprimento e 3 cm de largura. Qual é sua área?  
A) 11 cm² · B) 16 cm² · C) 22 cm² · D) 24 cm²  
**Correta:** D  
**Explicação:** Área = base × altura = 8 × 3 = 24 cm².

## Materiais e comunicados para a bateria

- Rascunho de Matemática (não publicado): “Lista de exercícios de fatoração”.
- Material publicado de Matemática: “Revisão: equações e porcentagem” com exemplos.
- Material de Português: “Como identificar comparação e metáfora”.
- Comunicado de direção: “Reunião fictícia para exercício de homologação”.
- Comunicado docente para 1A: “Atividade A01 disponível — turma de teste”.

## O que comprovar e documentar

1. Cadastrar a atividade e atualizar a página: dados persistem na API.
2. Entrar como aluno da turma: atividade aparece com título e alternativas.
3. Enviar resposta, atualizar: a explicação e o registro permanecem.
4. Entrar como outro aluno: respostas não se misturam.
5. Entrar como professor não vinculado: não pode publicar na turma.
6. Transferir aluno de 1A para 1B: turma atual muda e há histórico na direção.
7. Verificar que dados do Laboratório (demo) continuam **identificados como demonstração**.
8. Registrar evidências sem dados identificáveis em [HOMOLOGACAO-ZELO.md](./HOMOLOGACAO-ZELO.md).

**Importante:** esta é uma lista de entrada manual. Não afirmar que a aplicação já tem importador CSV nem que os dados foram cadastrados automaticamente.
