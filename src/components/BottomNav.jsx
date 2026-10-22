import React from 'react';
import { Navigation, Map, Compass } from 'lucide-react';
export const TABS=[{id:'tours',label:'Explorar',icon:Compass},{id:'routes',label:'Como chegar',icon:Navigation},{id:'map',label:'Mapa',icon:Map}];
export default function BottomNav({activeTab,onChangeTab}) {
  return <nav className="mobile-nav" aria-label="Navegação no celular">{TABS.map(({id,label,icon:Icon})=><button key={id} onClick={()=>onChangeTab(id)} aria-current={activeTab===id?'page':undefined}><Icon size={21}/><span>{label}</span></button>)}</nav>;
}
