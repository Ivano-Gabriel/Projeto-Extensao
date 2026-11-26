# zELO+ — Prontidão técnica antes de um piloto

## O que foi implementado

- `GET /healthz`: verifica que o servidor HTTP está respondendo. Não comprova acesso ao banco.
- `GET /readyz`: executa uma leitura mínima `SELECT 1` no banco configurado. Responde `200 {"status":"ready"}` com banco disponível, ou `503 {"status":"unavailable"}` se houver indisponibilidade de conexão. Não revela nome do banco, usuário, senha nem erro interno.
- `scripts/pilot-smoke.mjs`: verifica saúde HTTP, prontidão do banco, emissão de CSRF através da Vercel e proteção do endpoint `/api/me` contra acesso anônimo.
- Workflow **Verificar prontidão do piloto zELO+**: testes automatizados no PR e checagem externa manual no GitHub Actions (`Run workflow`).

## Como executar a verificação

Em um ambiente com Node.js 22 ou superior, sem fornecer senhas:

```sh
node --test scripts/pilot-smoke.test.mjs
node scripts/pilot-smoke.mjs
```

A verificação externa pressupõe que o backend publicado já contenha `/readyz`.
Ela espera a inicialização do serviço gratuito por até dez tentativas, com intervalo de vinte segundos.
Se houver erro HTTP, banco indisponível, CSRF inválido ou endpoint privado acessível anonimamente, falha e imprime motivo genérico.

É um **teste de prontidão**, não um monitor de disponibilidade contínua e não simula login real. A aprovação não atesta funcionamento de aulas, vínculos, publicações ou integração Groq.

## Antes de uso com estudantes

1. Revisar o PR, rodar Maven/Node no CI e obter aprovação do responsável.
2. Decidir janela para deploy manual e backup/restore do banco. **Este PR não altera o Render, Vercel nem o banco.**
3. Validar a infraestrutura aprovada. No Render Free, o servidor pode entrar em suspensão; o link de despertar não oferece SLA.
4. Executar o workflow manual e confirmar que os quatro testes públicos passaram.
5. Homologar login dos três perfis em contas fictícias, com teste humano de criação de turma, vínculo, publicação e resposta.
6. Usar dados de estudantes reais apenas após autorização institucional e revisão de privacidade e segurança apropriadas.

## Pendência crítica

O PostgreSQL gratuito de homologação tem vencimento informado para **18/12/2026**.
Planejar migração ou upgrade, **com backup e restauração comprovados**, antes dessa data.

Não usar o sucesso de `/readyz` como substituto do plano de infraestrutura, proteção de dados ou capacidade para uma rede municipal.
