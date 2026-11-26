import type {ErroFormulario} from './formularios-seguros'

export function ResumoErros({erros}:{erros:readonly ErroFormulario[]}){
  if(erros.length===0)return null
  return <div className="zelo-form-erros" role="alert">
    <strong>Revise estes campos antes de continuar:</strong>
    <ul>{erros.map((erro,i)=><li key={erro.campo+'-'+i}>{erro.mensagem}</li>)}</ul>
  </div>
}
export function ErroNoCampo({erros,campo}:{erros:readonly ErroFormulario[];campo:string}){
  const erro=erros.find(e=>e.campo===campo)
  return erro?<small className="zelo-form-erro-campo">{erro.mensagem}</small>:null
}
