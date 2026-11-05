export type Materia = 'Matemática' | 'Português' | 'Física' | 'História'

export type Material = {
  id: string
  titulo: string
  materia: Materia
  tema: string
  descricao: string
  minutos: number
  conteudo: { subtitulo: string; texto: string }[]
  exemplo: string
  dica: string
  etiqueta: string
}

export const materias: Array<'Todas' | Materia> = [
  'Todas', 'Matemática', 'Português', 'Física', 'História',
]

// Conteudo original e resumido, apenas para demonstrar o prototipo.
// Nao representa material revisado pelos professores da escola.
export const materiais: Material[] = [
  {
    id: 'funcao-quadratica', materia: 'Matemática', titulo: 'Funções do 2º grau',
    tema: 'Álgebra', etiqueta: 'RESUMO', minutos: 6,
    descricao: 'Entenda a parábola, as raízes e o famoso delta sem decorar tudo no susto',
    conteudo: [
      { subtitulo: 'A cara da função', texto: 'Uma função quadrática tem a forma f(x) = ax² + bx + c, com a diferente de zero. Seu gráfico é uma parábola, que pode abrir para cima ou para baixo.' },
      { subtitulo: 'Como achar as raízes', texto: 'Para encontrar os valores de x em que f(x) = 0, calcule Δ = b² − 4ac e use x = (−b ± √Δ) / 2a quando Δ for maior ou igual a zero.' },
      { subtitulo: 'O vértice', texto: 'A coordenada horizontal do vértice é xv = −b / 2a. Ela mostra onde a parábola muda de direção.' },
    ],
    exemplo: 'f(x) = x² − 5x + 6. As raízes são 2 e 3, pois (x − 2)(x − 3) = 0.',
    dica: 'Antes de calcular, identifica quem são a, b e c. Isso evita trocar os sinais.',
  },
  {
    id: 'porcentagem', materia: 'Matemática', titulo: 'Porcentagem sem mistério',
    tema: 'Matemática do dia a dia', etiqueta: 'RESUMO', minutos: 5,
    descricao: 'Descontos, aumentos e proporções com contas que aparecem na vida real',
    conteudo: [
      { subtitulo: 'O que significa %', texto: 'Porcentagem é uma razão por cem. Por exemplo, 25% significa 25 em cada 100, ou 0,25 na forma decimal.' },
      { subtitulo: 'Desconto e aumento', texto: 'Para um desconto de 20%, multiplique o preço por 0,80. Para um aumento de 20%, multiplique por 1,20.' },
      { subtitulo: 'Atenção', texto: 'Um aumento de 20% seguido de desconto de 20% não volta ao valor inicial, pois a segunda conta usa outra base.' },
    ],
    exemplo: '20% de R$ 150 é R$ 30. Com desconto de 20%, o valor final fica R$ 120.',
    dica: 'Transforma a porcentagem em decimal antes de multiplicar: 15% = 0,15.',
  },
  {
    id: 'figuras-linguagem', materia: 'Português', titulo: 'Figuras de linguagem',
    tema: 'Interpretação', etiqueta: 'GUIA', minutos: 6,
    descricao: 'Metáfora, comparação e personificação com exemplos bem diretos',
    conteudo: [
      { subtitulo: 'Metáfora', texto: 'Aproxima duas ideias sem usar um conector de comparação. Exemplo: “seu sorriso é um sol”.' },
      { subtitulo: 'Comparação', texto: 'Aproxima ideias usando termos como “como” ou “tal qual”. Exemplo: “ele corre como o vento”.' },
      { subtitulo: 'Personificação', texto: 'Atribui características humanas a animais, ideias ou objetos. Exemplo: “o vento sussurrou”.' },
    ],
    exemplo: '“A cidade acordou cedo” é um exemplo de personificação.',
    dica: 'Procura o sentido figurado da frase, não apenas a palavra bonita.',
  },
  {
    id: 'modernismo', materia: 'Português', titulo: 'Modernismo brasileiro',
    tema: 'Literatura', etiqueta: 'GUIA', minutos: 7,
    descricao: 'O que mudou na arte e na escrita brasileira no começo do século XX',
    conteudo: [
      { subtitulo: 'Ruptura com o passado', texto: 'O Modernismo valorizou experimentação, linguagem mais próxima do cotidiano e novas maneiras de representar o Brasil.' },
      { subtitulo: 'Semana de 1922', texto: 'A Semana de Arte Moderna, em São Paulo, tornou-se um marco simbólico do movimento, embora as transformações já estivessem em curso.' },
      { subtitulo: 'Nomes importantes', texto: 'Mário de Andrade, Oswald de Andrade e Anita Malfatti são figuras associadas ao movimento.' },
    ],
    exemplo: 'A busca por uma linguagem brasileira mais livre foi uma das marcas de parte da produção modernista.',
    dica: 'Lembra que 1922 é um marco, não uma data mágica em que tudo começou de uma vez.',
  },
  {
    id: 'leis-newton', materia: 'Física', titulo: 'As leis de Newton',
    tema: 'Mecânica', etiqueta: 'RESUMO', minutos: 7,
    descricao: 'Movimento, forças e exemplos que ajudam a entender o mundo ao redor',
    conteudo: [
      { subtitulo: 'Primeira lei: inércia', texto: 'Sem força resultante, um corpo mantém seu repouso ou movimento retilíneo uniforme.' },
      { subtitulo: 'Segunda lei: dinâmica', texto: 'A força resultante é igual à massa vezes a aceleração: F = m · a. No SI, a força é medida em newtons.' },
      { subtitulo: 'Terceira lei: ação e reação', texto: 'Quando um corpo exerce força sobre outro, recebe uma força de mesma intensidade e sentido oposto. As forças atuam em corpos diferentes.' },
    ],
    exemplo: 'Um corpo de 2 kg acelerado a 3 m/s² por uma força resultante recebe F = 2 · 3 = 6 N.',
    dica: 'Na terceira lei, ação e reação não se anulam porque agem em corpos diferentes.',
  },
  {
    id: 'velocidade-media', materia: 'Física', titulo: 'Velocidade média',
    tema: 'Cinemática', etiqueta: 'EXEMPLO', minutos: 4,
    descricao: 'Calcule o ritmo de um deslocamento com tempo e distância',
    conteudo: [
      { subtitulo: 'Na prática', texto: 'Para calcular rapidez média, divida a distância total percorrida pelo tempo total gasto.' },
      { subtitulo: 'Unidades', texto: 'Se usar quilômetros e horas, o resultado sai em km/h. Para obter m/s, use metros e segundos.' },
      { subtitulo: 'Cuidado com o nome', texto: 'Na Física, velocidade média vetorial usa deslocamento pelo tempo, enquanto rapidez média usa distância total pelo tempo.' },
    ],
    exemplo: 'Um carro percorre 120 km em 2 horas. Sua rapidez média é 120 / 2 = 60 km/h.',
    dica: 'Confira as unidades antes de começar a dividir.',
  },
  {
    id: 'revolucao-industrial', materia: 'História', titulo: 'Revolução Industrial',
    tema: 'Transformações sociais', etiqueta: 'GUIA', minutos: 6,
    descricao: 'Como máquinas, fábricas e cidades mudaram a sociedade',
    conteudo: [
      { subtitulo: 'Onde começou', texto: 'A industrialização ganhou força na Grã-Bretanha a partir da segunda metade do século XVIII.' },
      { subtitulo: 'O que mudou', texto: 'Máquinas, fábricas e novas fontes de energia ampliaram a produção, transformando o trabalho e a vida nas cidades.' },
      { subtitulo: 'Impactos', texto: 'A urbanização e a expansão industrial trouxeram oportunidades, mas também jornadas longas, exploração e problemas ambientais.' },
    ],
    exemplo: 'O uso crescente de máquinas a vapor contribuiu para mudanças no ritmo e na escala da produção.',
    dica: 'Além de lembrar das máquinas, pensa em quem trabalhava nelas e como vivia.',
  },
  {
    id: 'era-vargas', materia: 'História', titulo: 'Era Vargas',
    tema: 'História do Brasil', etiqueta: 'LINHA DO TEMPO', minutos: 7,
    descricao: 'Uma revisão dos períodos e das principais mudanças políticas no Brasil',
    conteudo: [
      { subtitulo: 'Os períodos', texto: 'Getúlio Vargas governou de 1930 a 1945, em diferentes fases, e depois voltou à Presidência por eleição de 1951 a 1954.' },
      { subtitulo: 'Estado Novo', texto: 'Entre 1937 e 1945, o país viveu a ditadura do Estado Novo, com centralização do poder e restrição de liberdades.' },
      { subtitulo: 'Trabalho e legislação', texto: 'A CLT foi instituída em 1943, durante o governo Vargas, reunindo normas trabalhistas.' },
    ],
    exemplo: '1930 marca a chegada de Vargas ao poder; 1937 marca o início do Estado Novo.',
    dica: 'Não confunde todo o período de 1930–1945 com o Estado Novo de 1937–1945.',
  },
]
