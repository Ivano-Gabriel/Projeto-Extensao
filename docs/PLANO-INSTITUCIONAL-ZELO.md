# zELO+ — Plano de prontidão institucional e contratação

**Status:** proposta de evolução de um projeto de extensão — **não** há contratação, aprovação do Estado, garantia de conformidade, homologação oficial ou autorização para usar dados reais de alunos.

## 1. Propósito

Converter um protótipo escolar em produto que possa **participar de uma avaliação institucional** com evidências técnicas, pedagógicas e operacionais. A contratação por um ente público depende de necessidade identificada, requisitos administrativos, orçamento, competição/hipóteses legais de contratação e avaliação pelo órgão competente; um bom aplicativo **não implica contratação automática**.

## 2. Diagnóstico por dimensão (sem percentuais fictícios)

| Dimensão | Ponto existente | Lacuna crítica / evidência necessária |
| --- | --- | --- |
| UX | Fluxos adaptados aluno/professor/direção; login, PWA, menu | Auditoria mobile, acessibilidade, testes com usuários e métricas |
| Gestão escolar | Turmas, matrículas, transferências, vínculos, horários, comunicados | Calendário oficial, etapas pedagógicas e tratamento de erros real |
| Ensino | Questões com gabarito, respostas persistidas, materiais e desempenho de quizzes | Avaliações oficiais, aprovação acadêmica e relatórios pedagógicos |
| Frequência | Aulas e presença **provisórias** | Regras de validação, correções justificadas, auditoria e caráter oficial |
| Segurança | Sessão, CSRF e autorização por escola/papel | Pentest, gestão de incidentes, MFA/admin, recuperação segura, auditoria imutável |
| Dados | PostgreSQL/Flyway e dados de homologação | Retenção/descarte, backup comprovado, restauração testada, LGPD |
| IA | Assistente guiado gratuito e geração opt-in preparada | Política de fornecedor, custos, revisão humana e avaliação de risco a menores |
| Operação | CI e hosp. staging | SLA, observabilidade, alerta, suporte, RTO/RPO e documentação de mudanças |
| Governança | GitHub, PRs e testes | Documentação de propriedade intelectual, licenças e continuidade |
| Aquisição | Demonstrador + relatório | Pesquisa com rede de ensino, requisitos, trâmites oficiais de contratação |

## 3. Fases para amadurecimento

### Fase A — demonstração consistente

- Fechar identidade provisória zELO+ e verificar marca/dominio no INPI antes de investimento comercial.
- Executar [20 cenários de homologação](./HOMOLOGACAO-ZELO.md), corrigir bugs críticos e registrar evidências.
- Cadastrar dados **fictícios persistentes** pelas interfaces; não confundir com o Laboratório (demo).
- Rodar projeto local por integrante e entregar vídeo de 3 jornadas: direção → professor → aluno.
- Produzir guia de instalação e arquitetura atualizados.

**Critério:** todos os cenários críticos aprovados; demonstrável em desktop/mobile, sem vazamento cruzado.

### Fase B — piloto acompanhado por uma instituição

- Obter autorização formal de escola parceira; delimitar escopo pedagógico e classes de dados antes de qualquer uso.
- Preferir dados sintéticos/pseudonimizados no início; estruturar base legal, papéis de controlador/operador e transparência LGPD.
- Implementar recuperação de acesso, trilha de auditoria por mudança de matrícula, atividade, presença, usuário e permissões.
- Estabelecer backup automático e **simular restauração**, monitoramento, plano de falha do provedor e atualização segura.
- Conduzir auditoria de acessibilidade e testes com diferentes necessidades e dispositivos; observar WCAG 2.2 e eMAG.
- Estabelecer indicadores de UX/operacional reais, com consentimento e sem exposição individual de menores.

**Critério:** aceite técnico e pedagógico documentado, incidentes classificados, reversão do piloto possível.

### Fase C — proposta a órgão público

- Levantar necessidade concreta da rede (ex.: comunicação, acompanhamento de atividades, uso offline de conteúdos permitidos).
- Obter parecer de professores/direção e dados de eficácia do piloto **quando coletados**, sem inventar impactos.
- Definir custo total anual, hospedagem, atendimento, implantação, treinamento, segurança, suporte, continuidade, exportação e portabilidade.
- Preparar demonstração institucional, documentação técnica, matriz de requisitos, prova de acessibilidade, SLA e matriz de riscos.
- Submeter solução pelos **procedimentos legais aplicáveis**. Identificar responsáveis, requisitos de contratação, competição e documentação. Evitar afirmações de contratação direta ou exclusividade.

**Critério:** pacote de evidências auditáveis e requisitos do órgão, sem promessas não verificadas.

## 4. Conformidade e proteção de dados

A LGPD (Lei nº 13.709/2018) e o princípio do **melhor interesse de crianças e adolescentes** exigem análise específica do tratamento. **Não basta um checkbox de consentimento.** Mapear as categorias de dados, finalidades, fundamento legal, minimização, retenção, descarte, acesso por escola e resposta a incidentes. A área Jurídica/encarregado da instituição deve avaliar as obrigações.

O eMAG é a referência nacional de acessibilidade em governo eletrônico; utilizar também práticas atuais WCAG 2.2 AA e validação com tecnologias assistivas, com evidências de execução.

A Lei nº 14.133/2021 traz normas gerais de licitações e contratações para União, estados e municípios. As regras do processo concreto precisam ser analisadas pelo órgão competente; instruções federais específicas de TIC não devem ser tratadas automaticamente como obrigatórias para qualquer estado.

## 5. Indicadores para negociar um piloto (sem coleta indevida)

- Taxa de conclusão de tarefas: cadastrar turma, publicar atividade, responder, transferir aluno.
- Tempo médio para concluir tarefas e taxa de erro de navegação.
- Compatibilidade mobile e acessibilidade verificada.
- Disponibilidade e tempos de resposta observados do serviço.
- Incidentes de autorização (meta: zero), recuperação de serviço e restaurabilidade.
- Satisfação de docentes/gestores/estudantes coletada de forma apropriada e anonimizada.
- Custo por escola, por turma e por atendimento **após medição**.

## 6. Entregáveis para reunião com educação ou equipe de TI

1. Demonstração de 5 minutos e roteiro de 3 perfis.
2. Relatório técnico/ acadêmico com arquitetura e limites reais.
3. Registro de testes, prints e vídeo sem dados pessoais.
4. Documento de requisitos prioritários elaborado junto à escola.
5. Plano de segurança/privacidade e responsáveis institucionais.
6. Modelo de implantação, suporte, orçamento e cronograma realistas.
7. Identificação de direitos de propriedade intelectual e licenças do trabalho em equipe.

## 7. Referências oficiais

- [Lei 14.133/2021 — normas gerais de contratação pública](https://www.gov.br/compras/pt-br/nllc)
- [Contratações de soluções de TIC — Governo Digital](https://www.gov.br/governodigital/pt-br/contratacoes-de-tic)
- [LGPD — texto compilado](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- [ANPD — orientação sobre dados de crianças/adolescentes](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_legitimo_interesse.pdf/@@download/file)
- [eMAG — Modelo de Acessibilidade em Governo Eletrônico](https://www.gov.br/governodigitallogin/pt-br/acessibilidade-e-usuario/acessibilidade-digital/modelo-de-acessibilidade)
- [Instituto Nacional da Propriedade Industrial — consulta de marcas](https://busca.inpi.gov.br/pePI/)

> Este documento organiza o planejamento; não é laudo jurídico, relatório de conformidade ou garantia de contratação.
