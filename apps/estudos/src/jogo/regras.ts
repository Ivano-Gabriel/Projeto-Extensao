export type MissaoId = 'tecnologia' | 'negocios' | 'jornalismo'
export type Pergunta = {
  situacao: string
  desafio: string
  opcoes: readonly [string,string,string,string]
  correta: number
  explicacao: string
}
export type Missao = {id:MissaoId;nome:string;descricao:string;profissao:string;cor:string;perguntas:readonly Pergunta[]}
export const missoes: readonly Missao[] = [
  {id:'tecnologia',nome:'Missão Tech',descricao:'Encontre falhas e proteja dados.',profissao:'Tecnologia',cor:'azul',perguntas:[
    {situacao:'Você trabalha com segurança digital.',desafio:'Chegou um e-mail pedindo sua senha para liberar a conta. O que fazer?',
      opcoes:['Responder com a senha','Abrir o link para conferir','Acessar o site oficial por conta própria','Encaminhar para todos'],
      correta:2,explicacao:'Links em mensagens suspeitas podem ser falsos. Entre diretamente no site oficial e use canais de suporte confiáveis.'},
    {situacao:'Seu app está lento.',desafio:'Qual medida ajuda a descobrir o motivo antes de mexer no código?',
      opcoes:['Apagar o projeto','Medir o tempo das operações','Trocar todas as cores','Reiniciar sem investigar'],
      correta:1,explicacao:'Medir o desempenho permite identificar onde está o problema e evita mudanças no escuro.'},
    {situacao:'Uma escola quer proteger dados dos estudantes.',desafio:'Qual acesso faz mais sentido para um professor?',
      opcoes:['Todos os alunos do município','Apenas suas turmas autorizadas','Todos os administradores','Qualquer usuário com o link'],
      correta:1,explicacao:'O princípio do menor privilégio limita cada pessoa aos dados necessários para seu trabalho.'}
  ]},
  {id:'negocios',nome:'Missão Negócios',descricao:'Tome decisões e avalie resultados.',profissao:'Gestão e empreendedorismo',cor:'amarelo',perguntas:[
    {situacao:'Você vende camisetas feitas por encomenda.',desafio:'Custo por peça: R$ 40. Venda: R$ 65. Qual margem bruta em reais por peça?',
      opcoes:['R$ 15','R$ 25','R$ 40','R$ 105'],correta:1,
      explicacao:'A diferença entre o preço de venda e o custo direto é R$ 65 − R$ 40 = R$ 25, antes das demais despesas.'},
    {situacao:'Seu estoque tem poucas unidades.',desafio:'Qual informação é mais útil para decidir quando comprar novamente?',
      opcoes:['Cor preferida do dono','Número de seguidores','Vendas e prazo de reposição','Tamanho da loja'],
      correta:2,explicacao:'A demanda e o tempo para receber novos produtos ajudam a evitar falta e excesso de estoque.'},
    {situacao:'Você quer testar um novo produto.',desafio:'Qual é a forma mais prudente de descobrir se existe interesse?',
      opcoes:['Comprar mil unidades','Validar com um grupo pequeno e medir retorno','Investir tudo em anúncios','Copiar a concorrência sem dados'],
      correta:1,explicacao:'Um piloto pequeno permite aprender com custos e riscos mais baixos antes de escalar.'}
  ]},
  {id:'jornalismo',nome:'Missão Investigação',descricao:'Cheque pistas e encontre o contexto.',profissao:'Comunicação e pesquisa',cor:'verde',perguntas:[
    {situacao:'Uma mensagem viral traz um dado surpreendente.',desafio:'Qual é a primeira atitude mais confiável?',
      opcoes:['Repassar rápido','Verificar fonte, data e contexto','Confiar em muitas curtidas','Ignorar toda notícia'],
      correta:1,explicacao:'A credibilidade depende da fonte, evidências, contexto e atualização, não da quantidade de compartilhamentos.'},
    {situacao:'Uma foto antiga circula como se fosse de hoje.',desafio:'Como investigar sua origem?',
      opcoes:['Buscar a imagem e sua publicação original','Alterar a legenda','Usar apenas a opinião de amigos','Contar quantos emojis recebeu'],
      correta:0,explicacao:'A busca reversa e a verificação da data da publicação original ajudam a detectar imagens fora de contexto.'},
    {situacao:'Duas fontes confiáveis discordam sobre um número.',desafio:'O que um bom pesquisador faz?',
      opcoes:['Escolhe a maior cifra','Descarta ambas sem ler','Compara período, método e definição','Publica um número aleatório'],
      correta:2,explicacao:'Resultados diferentes podem usar amostras, períodos ou conceitos distintos. Comparar metodologia esclarece a divergência.'}
  ]}
]
export type EstadoJogo = {missao:MissaoId|null;indice:number;respostas:readonly number[];concluido:boolean}
export function estadoInicial():EstadoJogo {return {missao:null,indice:0,respostas:[],concluido:false}}
export function iniciarJogo(missao:MissaoId):EstadoJogo {
  if(!missoes.some(m=>m.id===missao)) throw new Error('Missão inválida.')
  return {missao,indice:0,respostas:[],concluido:false}
}
export function responder(estado:EstadoJogo,opcao:number):EstadoJogo {
  const missao=missoes.find(m=>m.id===estado.missao)
  if(!missao||estado.concluido||estado.respostas.length>estado.indice||
    !Number.isInteger(opcao)||opcao<0||opcao>3)return estado
  return {...estado,respostas:[...estado.respostas,opcao]}
}
export function avancar(estado:EstadoJogo):EstadoJogo {
  const missao=missoes.find(m=>m.id===estado.missao)
  if(!missao||estado.concluido||estado.respostas.length<=estado.indice)return estado
  return estado.indice>=missao.perguntas.length-1?{...estado,concluido:true}:{...estado,indice:estado.indice+1}
}
export function pontos(estado:EstadoJogo):number {
  const missao=missoes.find(m=>m.id===estado.missao)
  if(!missao)return 0
  return estado.respostas.reduce((total,r,i)=>total+(r===missao.perguntas[i]?.correta?100:0),0)
}
