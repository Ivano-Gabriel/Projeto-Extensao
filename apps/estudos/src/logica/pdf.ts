import { jsPDF } from 'jspdf'
import type { Material } from '../dados/materiais'

const MARGEM = 20

export function nomeSeguro(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function gerarPdf(lista: Material[], tituloDocumento: string, nomeArquivo: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  const larguraTexto = largura - MARGEM * 2
  let y = MARGEM

  const garantirEspaco = (necessario: number) => {
    if (y + necessario > altura - MARGEM) {
      doc.addPage()
      y = MARGEM
    }
  }

  const escrever = (
    texto: string,
    tamanho: number,
    estilo: 'normal' | 'bold' | 'italic' = 'normal',
    espacoDepois = 2,
    cor = 30,
  ) => {
    doc.setFont('helvetica', estilo)
    doc.setFontSize(tamanho)
    doc.setTextColor(cor)
    const alturaLinha = tamanho * 0.5
    const linhas = doc.splitTextToSize(texto, larguraTexto) as string[]
    for (const linha of linhas) {
      garantirEspaco(alturaLinha)
      doc.text(linha, MARGEM, y)
      y += alturaLinha
    }
    y += espacoDepois
  }

  const linhaDivisoria = () => {
    garantirEspaco(6)
    doc.setDrawColor(200)
    doc.line(MARGEM, y, largura - MARGEM, y)
    y += 6
  }

  lista.forEach((material, indice) => {
    if (indice > 0) {
      doc.addPage()
      y = MARGEM
    }

    escrever(`${material.materia.toUpperCase()} - ${material.etiqueta}`, 9, 'bold', 3, 110)
    escrever(material.titulo, 20, 'bold', 3)
    escrever(material.descricao, 11, 'normal', 3, 80)
    escrever(`${material.minutos} min de leitura - ${material.tema}`, 9, 'italic', 4, 110)
    linhaDivisoria()

    material.conteudo.forEach((item, i) => {
      escrever(`${i + 1}. ${item.subtitulo}`, 13, 'bold', 2)
      escrever(item.texto, 11, 'normal', 5)
    })

    escrever('Exemplo na prática', 13, 'bold', 2)
    escrever(material.exemplo, 11, 'normal', 5)

    escrever('Pra guardar na cabeça', 13, 'bold', 2)
    escrever(material.dica, 11, 'italic', 0)
  })

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140)
    doc.text(tituloDocumento, MARGEM, altura - 10)
    doc.text(`${p} / ${total}`, largura - MARGEM, altura - 10, { align: 'right' })
  }

  doc.save(`${nomeArquivo}.pdf`)
}