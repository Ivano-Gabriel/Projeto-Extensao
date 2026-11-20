type Props={variante?:'completa'|'compacta';clara?:boolean;className?:string}
export default function ZeloMarca({variante='completa',clara=false,className=''}:Props){
  if(variante==='compacta')return <span className={'zelo-marca zelo-marca-compacta '+className}
    aria-label="zELO+">
    <img src="/zelo-icon-192.png" alt="" width="44" height="44"/>
    <span aria-hidden="true">z<span>ELO</span><b>+</b></span>
  </span>
  return <img className={'zelo-marca-imagem '+(clara?'zelo-marca-clara ':'')+className}
    src="/zelo-wordmark.svg" alt="zELO+" width="316" height="105" decoding="async"/>
}
