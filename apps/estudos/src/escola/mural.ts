import { materiais, type Materia } from '../dados/materiais.ts'

export const MAX_POSTS_DEMO = 15
export type PostDemo = {
  id: string
  titulo: string
  texto: string
  materia: Materia
  criadoEm: string
  materialId?: string
}
export type NovoPostDemo = Omit<PostDemo,'id'>
const materiasValidas = new Set<Materia>(['Matemática','Português','Física','História'])
const materiaisValidos = new Set(materiais.map((m)=>m.id))
const idValido = (id: unknown): id is string =>
  typeof id === 'string' && /^demo-[A-Za-z0-9-]{1,70}$/.test(id)

function dataValida(iso: unknown): iso is string {
  if(typeof iso!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [a,m,d]=iso.split('-').map(Number)
  return a>=2000&&a<=2100&&new Date(Date.UTC(a,m-1,d)).toISOString().slice(0,10)===iso
}
export function criarPostDemo(novo: NovoPostDemo, id: string): PostDemo {
  if(!idValido(id)) throw new Error('Publicação de demonstração inválida.')
  if(typeof novo.titulo!=='string'||novo.titulo.trim().length<5||novo.titulo.trim().length>100)
    throw new Error('O título precisa de 5 a 100 caracteres.')
  if(typeof novo.texto!=='string'||novo.texto.trim().length<10||novo.texto.trim().length>500)
    throw new Error('A mensagem precisa de 10 a 500 caracteres.')
  if(!materiasValidas.has(novo.materia)) throw new Error('Escolha uma matéria válida.')
  if(!dataValida(novo.criadoEm)) throw new Error('Data de publicação inválida.')
  if(novo.materialId && !materiaisValidos.has(novo.materialId)) throw new Error('Material não encontrado.')
  return {id,titulo:novo.titulo.trim(),texto:novo.texto.trim(),
    materia:novo.materia,criadoEm:novo.criadoEm,
    ...(novo.materialId?{materialId:novo.materialId}:{})}
}

export function adicionarPostDemo(lista: readonly PostDemo[],novo:NovoPostDemo,id:string): PostDemo[] {
  if(lista.length>=MAX_POSTS_DEMO) throw new Error('O limite de 15 posts demonstrativos foi atingido.')
  if(lista.some(p=>p.id===id)) throw new Error('Esse post já existe.')
  return [criarPostDemo(novo,id),...lista]
}
export function removerPostDemo(lista: readonly PostDemo[],id:string): PostDemo[] {
  return lista.filter(p=>p.id!==id)
}
export function validarPostsDemo(entrada: unknown): PostDemo[] {
  if(!Array.isArray(entrada)) return []
  const encontrados:PostDemo[]=[]
  const ids=new Set<string>()
  for(const item of entrada.slice(0,100)) {
    if(encontrados.length>=MAX_POSTS_DEMO) break
    if(!item||typeof item!=='object'||Array.isArray(item)) continue
    const dados=item as Record<string,unknown>
    if(!idValido(dados.id)||ids.has(dados.id)) continue
    try {
      // Nenhum objeto externo é preservado diretamente.
      const valido=criarPostDemo({
        titulo:dados.titulo as string,texto:dados.texto as string,
        materia:dados.materia as Materia,criadoEm:dados.criadoEm as string,
        ...(dados.materialId!==undefined?{materialId:dados.materialId as string}:{})
      },dados.id)
      ids.add(valido.id)
      encontrados.push(valido)
    } catch { continue }
  }
  return encontrados
}
