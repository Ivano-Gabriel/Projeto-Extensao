import {setTimeout as dormirPadrao} from 'node:timers/promises'
import {pathToFileURL} from 'node:url'

const obterRaiz=(valor)=>{
  const url=new URL(valor)
  if(url.protocol!=='https:')throw new Error('A verificação externa exige HTTPS.')
  return url.origin
}

const checar=async(buscar,url,esperado,rota,validar)=>{
  const resposta=await buscar(url,{
    method:'GET',
    redirect:'manual',
    credentials:'omit',
    cache:'no-store',
    signal:AbortSignal.timeout(20000),
  })
  if(resposta.status!==esperado)throw new Error(rota+' HTTP '+resposta.status)
  if(validar){
    let dados
    try{dados=await resposta.json()}catch{throw new Error(rota+' resposta inválida')}
    if(!validar(dados))throw new Error(rota+' resposta inesperada')
  }
}

export async function verificarPiloto({
  baseApi='https://extensao-api-staging.onrender.com',
  baseSite='https://extensao-estudos.vercel.app',
  buscar=fetch,
  dormir=dormirPadrao,
  tentativas=10,
  intervaloMs=20000,
}={}){
  const api=obterRaiz(baseApi)
  const site=obterRaiz(baseSite)
  if(!Number.isInteger(tentativas)||tentativas<1||tentativas>20)
    throw new Error('Número de tentativas inválido.')
  let ultimaFalha=null
  let numero=0
  for(let i=1;i<=tentativas;i++){
    numero=i
    try{
      await checar(buscar,api+'/healthz',200,'healthz',dados=>dados?.status==='ok')
      await checar(buscar,api+'/readyz',200,'readyz',dados=>dados?.status==='ready')
      ultimaFalha=null
      break
    }catch(erro){
      ultimaFalha=erro
      if(i<tentativas)await dormir(intervaloMs)
    }
  }
  if(ultimaFalha)throw new Error('API não ficou pronta: '+ultimaFalha.message)
  await checar(buscar,site+'/api/csrf',200,'csrf',dados=>typeof dados?.token==='string'&&dados.token.length>0)
  await checar(buscar,site+'/api/me',401,'me')
  return {tentativas:numero,verificacoes:['healthz','readyz','csrf','me protegido']}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  verificarPiloto().then(resultado=>{
    console.log('PILOTO OK | '+resultado.verificacoes.join(' | ')+
      ' | inicialização: '+resultado.tentativas+' tentativa(s)')
  }).catch(erro=>{
    console.error('PILOTO BLOQUEADO | '+erro.message)
    process.exitCode=1
  })
}
