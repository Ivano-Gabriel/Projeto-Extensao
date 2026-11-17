import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adicionarTarefa, alternarTarefa, removerTarefa, filtrarPlano, resumoPlano,
  carregarPlano, salvarPlano, CHAVE_PLANO,
} from '../src/plano/regras.ts'

const exemplo = {titulo:'  Revisar porcentagem  ', materia:'Matemática', data:'2026-11-19', materialId:'porcentagem'}

test('adiciona tarefa limpa com materia e data validas, sem mutar o array', () => {
  const origem = []
  const tarefas = adicionarTarefa(origem, exemplo, 't-100')
  assert.equal(tarefas[0].titulo, 'Revisar porcentagem')
  assert.equal(tarefas[0].feito, false)
  assert.equal(tarefas[0].materialId, 'porcentagem')
  assert.equal(origem.length, 0)
})

test('rejeita títulos vazios, ID repetido, datas impossiveis, materia inexistente e links inventados', () => {
  const lista = adicionarTarefa([], exemplo, 't-1')
  assert.throws(() => adicionarTarefa(lista, exemplo, 't-1'))
  assert.throws(() => adicionarTarefa(lista, {...exemplo,titulo:'   '}, 't-2'))
  assert.throws(() => adicionarTarefa(lista, {...exemplo,titulo:'a'.repeat(91)}, 't-2'))
  assert.throws(() => adicionarTarefa(lista, {...exemplo,data:'2026-02-31'}, 't-2'))
  assert.throws(() => adicionarTarefa(lista, {...exemplo,materia:'Geografia'}, 't-2'))
  assert.throws(() => adicionarTarefa(lista, {...exemplo,materialId:'id-inventado'}, 't-2'))
})

test('limita a 50 tarefas e nao permite IDs malformados', () => {
  let tarefas = []
  for(let i=0;i<50;i++) tarefas=adicionarTarefa(tarefas,exemplo,'t-'+i)
  assert.throws(()=>adicionarTarefa(tarefas,exemplo,'t-51'))
  assert.throws(()=>adicionarTarefa([],exemplo,'<script>'))
})

test('concluir, reabrir e remover uma tarefa sao operações imutaveis', () => {
  const base=adicionarTarefa([],exemplo,'t-1')
  const feito=alternarTarefa(base,'t-1')
  assert.equal(feito[0].feito,true)
  assert.equal(base[0].feito,false)
  assert.equal(alternarTarefa(feito,'t-1')[0].feito,false)
  assert.deepEqual(removerTarefa(feito,'t-1'),[])
  assert.deepEqual(alternarTarefa(base,'nao-existe'),base)
})

test('ordena pendentes por vencimento e calcula atrasos usando hoje local', () => {
  const t=[
    {id:'t-1', titulo:'A',materia:'História',data:'2026-11-18',feito:false},
    {id:'t-2', titulo:'B',materia:'Física',data:'2026-11-12',feito:false},
    {id:'t-3', titulo:'C',materia:'Matemática',data:'2026-11-13',feito:true},
    {id:'t-4', titulo:'D',materia:'Português',data:'2026-11-25',feito:false},
  ]
  const hoje = new Date(2026,10,17,12)
  assert.equal(resumoPlano(t,hoje).pendentes,3)
  assert.equal(resumoPlano(t,hoje).atrasadas,1)
  assert.equal(resumoPlano(t,hoje).proximos7Dias,1)
  assert.deepEqual(filtrarPlano(t,'pendentes').map(x=>x.id),['t-2','t-1','t-4'])
  assert.deepEqual(filtrarPlano(t,'concluidas').map(x=>x.id),['t-3'])
})

test('rejeita estado local corrompido e itens adulterados sem travar UI', () => {
  assert.deepEqual(carregarPlano({getItem:()=>'{'}),[])
  const entrada = [
    {id:'t-1',titulo:'Ok',materia:'Física',data:'2026-11-20',feito:false},
    {id:'t-1',titulo:'Duplicado',materia:'Física',data:'2026-11-20',feito:false},
    {id:'t-2',titulo:'Ruim',materia:'Física',data:'2026-02-31',feito:false},
    {id:'t-3',titulo:'Outros',materia:'Outra',data:'2026-11-20',feito:false},
    {id:'t-4',titulo:'X',materia:'História',data:'2026-11-20',feito:'sim'},
  ]
  const validas=carregarPlano({getItem:()=>JSON.stringify(entrada)})
  assert.equal(validas.length,1)
  assert.equal(validas[0].id,'t-1')
})

test('salva somente no storage fornecido e lida com storage bloqueado', () => {
  const map=new Map()
  const store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}
  const plano=adicionarTarefa([],exemplo,'t-1')
  assert.equal(salvarPlano(store,plano),true)
  assert.equal(carregarPlano(store)[0].id,'t-1')
  assert.ok(map.has(CHAVE_PLANO))
  assert.equal(salvarPlano({setItem:()=>{throw Error('bloqueado')}},plano),false)
})
