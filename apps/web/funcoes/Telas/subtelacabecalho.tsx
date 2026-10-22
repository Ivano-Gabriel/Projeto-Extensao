import { ArrowLeft } from 'lucide-react'

type Props = {
  titulo: string
  subtitulo: string
  onVoltar: () => void
}

/** Cabeçalho reaproveitado pelas 3 telas: botão Voltar + título. */
export function SubtelaCabecalho({ titulo, subtitulo, onVoltar }: Props) {
  return (
    <div className="subtela-header">
      <button className="back-button" type="button" onClick={onVoltar}>
        <ArrowLeft size={18} /> Voltar
      </button>
      <div>
        <p className="eyebrow">{subtitulo}</p>
        <h2>{titulo}</h2>
      </div>
    </div>
  )
}