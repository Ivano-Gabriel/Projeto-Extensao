export type Categoria = 'Literatura' | 'Ciências' | 'História' | 'Tecnologia' | 'Humanas'

export type Livro = {
  id: string
  titulo: string
  autor: string
  categoria: Categoria
  ano: number
  paginas: number
  descricao: string
  disponiveisBase: number
  capa: string
  etiqueta: string
  destaque?: boolean
}

// Acervo ficticio para votacao dos alunos: titulos conhecidos, estoque inventado.
// Nenhum registro aqui representa o inventario real da escola.
export const livros: Livro[] = [
  {
    id: 'dom-casmurro', titulo: 'Dom Casmurro', autor: 'Machado de Assis',
    categoria: 'Literatura', ano: 1899, paginas: 256,
    descricao: 'Uma historia sobre memoria, ciume e as duvidas de um narrador que nem sempre conta tudo.',
    disponiveisBase: 3, capa: 'azul', etiqueta: 'CLASSICO', destaque: true,
  },
  {
    id: 'olhos-dagua', titulo: 'Olhos d’água', autor: 'Conceição Evaristo',
    categoria: 'Literatura', ano: 2014, paginas: 116,
    descricao: 'Contos que aproximam memoria, afeto e cotidiano pela voz de personagens inesqueciveis.',
    disponiveisBase: 2, capa: 'coral', etiqueta: 'CONTOS', destaque: true,
  },
  {
    id: 'breve-historia-tempo', titulo: 'Uma breve história do tempo', autor: 'Stephen Hawking',
    categoria: 'Ciências', ano: 1988, paginas: 256,
    descricao: 'Uma viagem pelas grandes perguntas sobre o universo, os buracos negros e o tempo.',
    disponiveisBase: 2, capa: 'noite', etiqueta: 'UNIVERSO', destaque: true,
  },
  {
    id: 'quarto-despejo', titulo: 'Quarto de despejo', autor: 'Carolina Maria de Jesus',
    categoria: 'Literatura', ano: 1960, paginas: 200,
    descricao: 'Relatos do cotidiano, das dificuldades e da resistencia de uma mulher que escreve a propria historia.',
    disponiveisBase: 1, capa: 'amarelo', etiqueta: 'DIARIO',
  },
  {
    id: 'sapiens', titulo: 'Sapiens: uma breve história da humanidade', autor: 'Yuval Noah Harari',
    categoria: 'História', ano: 2011, paginas: 464,
    descricao: 'Um olhar panoramico sobre como as sociedades humanas mudaram ao longo do tempo.',
    disponiveisBase: 0, capa: 'areia', etiqueta: 'HISTORIA',
  },
  {
    id: 'capitaes-areia', titulo: 'Capitães da Areia', autor: 'Jorge Amado',
    categoria: 'Literatura', ano: 1937, paginas: 280,
    descricao: 'Uma narrativa sobre infancia, amizade e desigualdade nas ruas de Salvador.',
    disponiveisBase: 2, capa: 'verde', etiqueta: 'ROMANCE',
  },
  {
    id: 'codigo-limpo', titulo: 'Código Limpo', autor: 'Robert C. Martin',
    categoria: 'Tecnologia', ano: 2008, paginas: 456,
    descricao: 'Ideias para escrever, organizar e melhorar programas de computador.',
    disponiveisBase: 2, capa: 'azul-claro', etiqueta: 'PROGRAMACAO',
  },
  {
    id: 'pequeno-principe', titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry',
    categoria: 'Literatura', ano: 1943, paginas: 96,
    descricao: 'Uma historia de encontros e perguntas simples que fazem a gente pensar grande.',
    disponiveisBase: 4, capa: 'ceu', etiqueta: 'FANTASIA',
  },
  {
    id: 'diario-anne', titulo: 'O Diário de Anne Frank', autor: 'Anne Frank',
    categoria: 'História', ano: 1947, paginas: 352,
    descricao: 'Um testemunho pessoal sobre juventude e esperança em tempos de perseguicao.',
    disponiveisBase: 2, capa: 'vinho', etiqueta: 'MEMORIA',
  },
  {
    id: 'cosmos', titulo: 'Cosmos', autor: 'Carl Sagan',
    categoria: 'Ciências', ano: 1980, paginas: 384,
    descricao: 'A ciencia como convite para observar o ceu e entender nosso lugar no universo.',
    disponiveisBase: 1, capa: 'escuro', etiqueta: 'ASTRONOMIA',
  },
  {
    id: 'pedagogia-autonomia', titulo: 'Pedagogia da autonomia', autor: 'Paulo Freire',
    categoria: 'Humanas', ano: 1996, paginas: 144,
    descricao: 'Reflexoes sobre ensinar, aprender e construir conhecimento em conjunto.',
    disponiveisBase: 3, capa: 'laranja', etiqueta: 'EDUCACAO',
  },
  {
    id: 'homem-calculava', titulo: 'O homem que calculava', autor: 'Malba Tahan',
    categoria: 'Ciências', ano: 1938, paginas: 288,
    descricao: 'Problemas e desafios matematicos contados como aventuras.',
    disponiveisBase: 2, capa: 'turquesa', etiqueta: 'MATEMATICA',
  },
  {
    id: '1984', titulo: '1984', autor: 'George Orwell',
    categoria: 'Literatura', ano: 1949, paginas: 328,
    descricao: 'Uma historia que provoca perguntas sobre poder, liberdade e vigilancia.',
    disponiveisBase: 1, capa: 'vermelho', etiqueta: 'FICCAO',
  },
  {
    id: 'algoritmos', titulo: 'Entendendo algoritmos', autor: 'Aditya Bhargava',
    categoria: 'Tecnologia', ano: 2016, paginas: 264,
    descricao: 'Conceitos de algoritmos explicados com exemplos e situacoes praticas.',
    disponiveisBase: 3, capa: 'roxo', etiqueta: 'TECNOLOGIA',
  },
  {
    id: 'racismo-estrutural', titulo: 'Racismo estrutural', autor: 'Silvio Almeida',
    categoria: 'Humanas', ano: 2019, paginas: 264,
    descricao: 'Uma introducao ao debate sobre racismo, sociedade e instituicoes.',
    disponiveisBase: 2, capa: 'marrom', etiqueta: 'SOCIEDADE',
  },
  {
    id: 'historia-brasil', titulo: 'Brasil: uma biografia', autor: 'Lilia Schwarcz e Heloisa Starling',
    categoria: 'História', ano: 2015, paginas: 792,
    descricao: 'Um percurso por acontecimentos e disputas que marcaram a historia brasileira.',
    disponiveisBase: 1, capa: 'oliva', etiqueta: 'BRASIL',
  },
]

export const categorias: Array<'Todas' | Categoria> = [
  'Todas', 'Literatura', 'Ciências', 'História', 'Tecnologia', 'Humanas',
]
