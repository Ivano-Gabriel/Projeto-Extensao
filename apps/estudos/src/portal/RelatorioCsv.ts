export async function baixarRelatorio(turmaId:number):Promise<void>{
  if(!Number.isSafeInteger(turmaId)||turmaId<=0)throw new Error('Turma inválida.')
  const resposta=await fetch(`/api/professor/turmas/${turmaId}/desempenho.csv`,{
    method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',
    headers:{Accept:'text/csv'},
  })
  if(!resposta.ok)throw new Error(resposta.status===403||resposta.status===404?
    'Você não está vinculado a esta turma.':'Falha ao exportar o relatório.')
  const blob=await resposta.blob()
  const url=URL.createObjectURL(blob)
  try{
    const a=document.createElement('a')
    a.href=url
    a.download=`desempenho-turma-${turmaId}.csv`
    a.rel='noopener'
    document.body.append(a)
    a.click()
    a.remove()
  }finally{
    window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
}
