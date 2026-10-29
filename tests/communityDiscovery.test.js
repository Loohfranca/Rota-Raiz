import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCommunityGroups} from '../src/lib/communityDiscovery.js';
const row={id:'a',name:'Comida da praça',category:'Comida',city:'João Pessoa, PB',address:'Rua da Praça, 10',note:'Almoço'};
test('comunidade respeita cidade, busca, categoria e agrupamento por lugar',()=>{
 const items=[row,{...row,id:'b',category:'Alimentação'},{...row,id:'c',city:'Rio de Janeiro'},{...row,id:'d',category:'Praia',name:'Praia'}];
 const groups=selectCommunityGroups(items,{city:'Joao Pessoa',category:'food'});
 assert.equal(groups.length,1);assert.equal(groups[0].length,2);
 assert.equal(selectCommunityGroups(items,{city:'João Pessoa',category:'food',query:'almoco'}).length,1);
 assert.equal(selectCommunityGroups(items,{city:'Salvador',category:'food'}).length,0);
 assert.equal(selectCommunityGroups(items,{city:'João Pessoa',category:'beaches'}).length,1);
 assert.equal(selectCommunityGroups(items,{category:'all'}).length,3);
});
