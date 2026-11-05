import type { Materia } from './materiais.ts'

export type Questao = {
  id: string
  materialId: string
  materia: Materia
  pergunta: string
  opcoes: readonly [string, string, string, string]
  correta: number
  explicacao: string
}

export const questoes: Questao[] = [
  {
    id: 'q-funcao', materialId: 'funcao-quadratica', materia: 'Matemática',
    pergunta: 'Quais são as raízes de x² − 5x + 6 = 0?',
    opcoes: ['1 e 6', '2 e 3', '−2 e −3', '5 e 6'], correta: 1,
    explicacao: 'Fatorando, temos (x − 2)(x − 3) = 0. Portanto, x = 2 ou x = 3.',
  },
  {
    id: 'q-porcentagem', materialId: 'porcentagem', materia: 'Matemática',
    pergunta: 'Um livro custa R$ 150 e tem desconto de 20%. Quanto ele custa depois?',
    opcoes: ['R$ 120', 'R$ 130', 'R$ 100', 'R$ 180'], correta: 0,
    explicacao: '20% de 150 é 30. Tirando 30 de 150, o preço final é R$ 120.',
  },
  {
    id: 'q-figuras', materialId: 'figuras-linguagem', materia: 'Português',
    pergunta: 'Em “o vento sussurrou pela janela”, qual figura aparece?',
    opcoes: ['Comparação', 'Personificação', 'Hipérbole', 'Antítese'], correta: 1,
    explicacao: 'Sussurrar é uma ação humana atribuída ao vento, caracterizando personificação.',
  },
  {
    id: 'q-modernismo', materialId: 'modernismo', materia: 'Português',
    pergunta: 'Qual evento é um marco simbólico do Modernismo brasileiro?',
    opcoes: ['Independência do Brasil', 'Semana de Arte Moderna de 1922', 'Proclamação da República', 'Revolução de 1930'], correta: 1,
    explicacao: 'A Semana de Arte Moderna de 1922 é um marco simbólico do movimento, embora suas transformações não tenham começado ali do zero.',
  },
  {
    id: 'q-newton', materialId: 'leis-newton', materia: 'Física',
    pergunta: 'Qual é a força resultante em um corpo de 2 kg com aceleração de 3 m/s²?',
    opcoes: ['1,5 N', '5 N', '6 N', '9 N'], correta: 2,
    explicacao: 'Pela segunda lei de Newton, F = m · a = 2 × 3 = 6 newtons.',
  },
  {
    id: 'q-velocidade', materialId: 'velocidade-media', materia: 'Física',
    pergunta: 'Qual a rapidez média de quem percorre 120 km em 2 horas?',
    opcoes: ['30 km/h', '60 km/h', '120 km/h', '240 km/h'], correta: 1,
    explicacao: 'Rapidez média é distância total dividida pelo tempo total: 120 / 2 = 60 km/h.',
  },
  {
    id: 'q-industrial', materialId: 'revolucao-industrial', materia: 'História',
    pergunta: 'Onde a Primeira Revolução Industrial ganhou força inicialmente?',
    opcoes: ['Grã-Bretanha', 'Brasil', 'Japão', 'Egito'], correta: 0,
    explicacao: 'A industrialização ganhou força na Grã-Bretanha no século XVIII e depois se expandiu para outras regiões.',
  },
  {
    id: 'q-vargas', materialId: 'era-vargas', materia: 'História',
    pergunta: 'Em que período ocorreu o Estado Novo no Brasil?',
    opcoes: ['1822–1889', '1889–1930', '1937–1945', '1951–1954'], correta: 2,
    explicacao: 'O Estado Novo foi uma ditadura liderada por Vargas entre 1937 e 1945.',
  },
]
