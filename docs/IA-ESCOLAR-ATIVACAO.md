# zELO+ — tutor gratuito e ativação controlada da GroqCloud

Atualizado em 20/11/2026. A interface e a autenticação permanecem inalteradas.

## Dois níveis de assistência

1. **Assistente básico (sempre disponível, custo zero):** conteúdo programado localmente sobre Bhaskara, frações, porcentagem, fotossíntese, Revolução Francesa, DNA/RNA, leis de Newton, sujeito/predicado e regra de três. Pode responder dúvidas comuns e consultar, sob autorização do backend, turmas e comunicados. **Não é IA generativa**, não compartilha perguntas com empresas externas e não produz notas escolares.
2. **Tutor generativo GroqCloud (opcional):** professores vinculados podem elaborar rascunhos de quiz, explicações e plano de aula; alunos, quando autorizado pela instituição, podem pedir explicação na disciplina vinculada. **Nunca publica automaticamente.** A API externa recebe somente a disciplina e a pergunta/tema redigido pelo usuário, não os registros da escola.

## Configurar no Render, sem copiar segredos para o chat ou GitHub

No serviço de backend `extensao-api-staging`, definir em Environment:

| Nome | Valor seguro |
| --- | --- |
| `GROQ_API_KEY` | chave privada criada em https://console.groq.com/keys |
| `GROQ_MODEL` | `qwen/qwen3.8-27b` (modelo listado no plano gratuito em nov/2026) |
| `EXTENSAO_IA_ENABLED` | `true` somente após contas fictícias + política de privacidade aprovadas |
| `EXTENSAO_IA_ALUNOS_ENABLED` | `false` por padrão; habilitar somente após consentimento/avaliação institucional |
| `EXTENSAO_IA_PROFESSOR_POR_DIA` | `12` |
| `EXTENSAO_IA_ALUNO_POR_DIA` | `6` |

**A integração estará codificada, mas NÃO estará ativa na API publicada sem `GROQ_API_KEY` e flag habilitada.** Não existe API de geração sem credenciais garantidamente gratuita e segura. Ao usar plano Groq Free, a disponibilidade e os limites podem mudar. Conferir https://console.groq.com/docs/rate-limits.

### Privacidade e limite de proteção

- Chave fica apenas no Render, nunca na UI, cookie ou código publicado.
- Todas as rotas continuam exigindo sessão segura, CSRF para POST e vínculo professor/turma/disciplina ou matrícula; as cotas são persistidas em PostgreSQL.
- Bloqueio de e-mail, telefone, documentos, campos evidentes de nome completo e data de nascimento antes de transmitir perguntas. **Filtro não detecta todos os dados pessoais**: o usuário deve receber orientação para não digitar nomes reais, dados de alunos ou escola.
- No plano de dados publicado, Groq informa que o conteúdo de inferência não é retido por padrão, mas pode reter dados de confiabilidade/abuso até 30 dias; Zero Data Retention é opcional nos controles da organização. Conferir https://console.groq.com/docs/your-data e aceitar termos para menores antes de habilitar.
- **Não enviar informações de crianças menores de 13 anos ou fora das condições de idade aplicáveis.** Não usar IA para decisão sobre notas ou frequência. O piloto não deve tratar dados reais sem base legal e regras da instituição.
- Modelo gera conteúdo potencialmente errado. Professor revisa tudo antes de publicar. Sem análise de nota automática.

## Homologação recomendada

- Com flag desligada, garantir que o assistente básico responda e o tutor apareça como indisponível sem erros 500.
- Com chave de teste e `EXTENSAO_IA_ENABLED=true` em ambiente autorizado, professor vinculado deve gerar quiz e ver JSON validado. Nunca publicá-lo sem clique de revisão.
- Professor de outra turma deve receber 403/404. Aluno com flag desligada deve receber 503; com flag ligada, só pode perguntar na disciplina vinculada.
- Enviar pergunta contendo e-mail/CPF deve receber 400 **antes** da chamada externa. Limite diário deve produzir 429.
- Observar requisições e logs sem registrar prompt, resposta, chave, identidade ou dados pessoais. Desativar `EXTENSAO_IA_ENABLED` para reverter.

## Fontes do provedor

- https://console.groq.com/docs/api-reference
- https://console.groq.com/docs/models
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/your-data
