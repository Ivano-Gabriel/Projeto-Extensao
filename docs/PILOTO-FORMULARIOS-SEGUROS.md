# Formulários seguros no piloto zELO+

## O que esta etapa impede

- Duas turmas com o mesmo código e ano letivo cadastradas pelo formulário da direção
- E-mail de conta já existente, mesmo com maiúsculas e espaços extras
- Conta de aluno/professor criada sem uma revisão explícita de nome, e-mail e perfil
- Atividades com respostas iguais, vazias, gabarito fora do intervalo ou prazo vencido
- Atividade publicada diretamente sem o professor conferir turma, enunciado, alternativas e gabarito
- Exclusão acidental de uma atividade sem confirmação contextual e possibilidade de cancelar

Essas verificações acontecem no navegador. As autorizações, as restrições de unicidade, o CSRF e o bloqueio de atividades respondidas continuam responsabilidade obrigatória do backend.

## Privacidade

A prévia de criação de conta não mostra senha nem a duplica em armazenamento local. A senha continua sendo enviada somente no pedido autenticado de criação da conta. O formulário atual é de homologação com dados fictícios.

## Verificação

Os testes Node validam a lógica sem dados reais. O Playwright usa perfis e respostas sintéticos para confirmar que nenhuma mutação ocorre antes da revisão. Esse teste não substitui uma homologação com contas de teste no backend de staging.

O login, o Laboratório, os menus e a infraestrutura do zELO+ não foram alterados nesta entrega.
