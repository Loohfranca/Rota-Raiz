import {test} from 'node:test';import assert from 'node:assert/strict';
import {currentPosition,reverseSuggestion} from '../src/lib/placeLocation.js';
test('GPS é pontual, tem timeout e não reutiliza posição antiga',async()=>{let calls=0;const geo={getCurrentPosition(ok,fail,options){calls++;assert.equal(options.maximumAge,0);assert.equal(options.timeout,15000);ok({coords:{latitude:-13,longitude:-38,accuracy:20}});}};assert.deepEqual(await currentPosition(geo),{lat:-13,lng:-38,accuracy:20});assert.equal(calls,1);});
test('GPS negado, ausente, timeout e coordenada inválida permitem alternativa manual',async()=>{for(const code of [1,2,3])await assert.rejects(currentPosition({getCurrentPosition(ok,fail){fail({code});}}),/manual/);await assert.rejects(currentPosition(null),/manual/);await assert.rejects(currentPosition({getCurrentPosition(ok){ok({coords:{latitude:NaN,longitude:0}});}}),/válido/);});
test('reversa sugere município e UF sem inventar estabelecimento ou endereço',()=>{assert.deepEqual(reverseSuggestion({name:'Não copiar estabelecimento',address:{city:'Cairu','ISO3166-2-lvl4':'BR-BA',village:'Moreré'}}),{municipality:'Cairu',state:'BA',address:'',location_reference:'Moreré'});assert.equal(reverseSuggestion({address:{village:'Moreré',state:'Bahia'}}).municipality,'');assert.equal(reverseSuggestion({address:{road:'Rua Um',house_number:'10',suburb:'Centro'}}).address,'Rua Um, 10, Centro');});

test('Photon sugere cidade/UF e endereço sem usar nome do estabelecimento como identificação',()=>{
 const r=reverseSuggestion({features:[{properties:{countrycode:'BR',city:'Rio de Janeiro',state:'Rio de Janeiro',street:'Orla Copacabana',name:'Posto 3'}}]});assert.equal(r.state,'RJ');assert.equal(r.municipality,'Rio de Janeiro');assert.equal(r.address,'Orla Copacabana');assert.ok(!JSON.stringify(r).includes('Posto 3'));
 assert.equal(reverseSuggestion({features:[{properties:{countrycode:'BR',district:'Vila',state:'Bahia'}}]}).address,'');
 assert.equal(reverseSuggestion({features:[{properties:{countrycode:'PT',city:'Porto'}}]}).municipality,'');
});
