export type TamanhoTexto = 'normal' | 'grande'
export type Preferencias = {
  notificarProvas: boolean
  notificarTrabalhos: boolean
  notificarAvisos: boolean
  tamanhoTexto: TamanhoTexto
  reduzirAnimacoes: boolean
}
export const CHAVE_PREFERENCIAS = 'extensao:preferencias:v1'
export const preferenciasPadrao: Preferencias = {
  notificarProvas: true,
  notificarTrabalhos: true,
  notificarAvisos: true,
  tamanhoTexto: 'normal',
  reduzirAnimacoes: false,
}
type Leitura = Pick<Storage, 'getItem'>
type Escrita = Pick<Storage, 'setItem'>

export function normalizarPreferencias(valor: unknown): Preferencias {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return { ...preferenciasPadrao }
  const bruto = valor as Record<string, unknown>
  const booleano = (campo: keyof Preferencias): boolean => typeof bruto[campo] === 'boolean'
    ? bruto[campo] as boolean : preferenciasPadrao[campo] as boolean
  return {
    notificarProvas: booleano('notificarProvas'),
    notificarTrabalhos: booleano('notificarTrabalhos'),
    notificarAvisos: booleano('notificarAvisos'),
    tamanhoTexto: bruto.tamanhoTexto === 'grande' ? 'grande' : 'normal',
    reduzirAnimacoes: booleano('reduzirAnimacoes'),
  }
}
export function carregarPreferencias(store?: Leitura | null): Preferencias {
  try {
    const bruto = store?.getItem(CHAVE_PREFERENCIAS)
    return bruto ? normalizarPreferencias(JSON.parse(bruto)) : { ...preferenciasPadrao }
  } catch {
    return { ...preferenciasPadrao }
  }
}
export function salvarPreferencias(store: Escrita | null | undefined, valor: Preferencias): boolean {
  try {
    if (!store) return false
    store.setItem(CHAVE_PREFERENCIAS, JSON.stringify(normalizarPreferencias(valor)))
    return true
  } catch {
    return false
  }
}
