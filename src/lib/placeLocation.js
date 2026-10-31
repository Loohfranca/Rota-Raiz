import {hasFiniteCoordinates} from './coordinates.js';
import {STATES} from './experienceFormModel.js';
export function currentPosition(geolocation = globalThis.navigator?.geolocation) {
 return new Promise((resolve,reject)=>{
  if(!geolocation)return reject(new Error('GPS indisponível. Você pode preencher a localização manualmente.'));
  geolocation.getCurrentPosition(({coords})=>{
   const point={lat:coords.latitude,lng:coords.longitude};
   if(!hasFiniteCoordinates(point))return reject(new Error('O GPS não retornou um ponto válido. Tente novamente ou preencha manualmente.'));
   resolve({...point,accuracy:coords.accuracy});
  },error=>reject(new Error(error.code===1?'Localização não autorizada. Continue pelo preenchimento manual.':error.code===3?'O GPS demorou para responder. Tente novamente ou preencha manualmente.':'Não foi possível obter o GPS. Preencha manualmente.')),
   {enableHighAccuracy:true,timeout:15000,maximumAge:0});
 });
}
export function reverseSuggestion(data={}) {
 const props=data.features?.[0]?.properties;
 const names='Acre|Alagoas|Amapá|Amazonas|Bahia|Ceará|Distrito Federal|Espírito Santo|Goiás|Maranhão|Mato Grosso|Mato Grosso do Sul|Minas Gerais|Pará|Paraíba|Paraná|Pernambuco|Piauí|Rio de Janeiro|Rio Grande do Norte|Rio Grande do Sul|Rondônia|Roraima|Santa Catarina|São Paulo|Sergipe|Tocantins'.split('|');
 const fold=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(props?.countrycode&&props.countrycode.toUpperCase()!=='BR')return {municipality:'',state:'',address:'',location_reference:''};
 const state=props?STATES[names.findIndex(n=>fold(n)===fold(props.state))]||'':'';
 const a=data.address||(props?{city:props.city,road:props.street,house_number:props.housenumber,suburb:props.district,neighbourhood:props.locality,'ISO3166-2-lvl4':state?'BR-'+state:''}:{});
 const code=(a['ISO3166-2-lvl4']||'').replace(/^BR-/,'');
 // Do not use suburb/village as a confirmed municipality or infer an establishment name.
 return {municipality:a.city||a.town||a.municipality||'',state:STATES.includes(code)?code:'',
  address:a.road?[a.road,a.house_number,a.suburb].filter(Boolean).join(', ').slice(0,300):'',
  location_reference:[a.hamlet||a.village||a.neighbourhood||a.suburb,a.county].filter(Boolean).join(' · ').slice(0,300)};
}
