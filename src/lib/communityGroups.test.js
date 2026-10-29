import test from "node:test";
import assert from "node:assert/strict";
import { groupCommunityRecommendations, placeGroupKey } from "./communityGroups.js";

test("Agrupa as duas indicações do KOA mesmo com CEP digitado com zero extra",()=>{
  const a={id:"1",name:"Koa bar - Frutos do mar",address:"Caraíva, Porto Seguro - BA, 45810-000",city:"Caraiva"};
  const b={id:"2",name:"Koa bar - Frutos do mar",address:"Caraíva, Porto Seguro - BA, 45810-0000",city:"caraiva"};
  assert.equal(placeGroupKey(a),placeGroupKey(b));
  assert.equal(groupCommunityRecommendations([a,b]).length,1);
  assert.equal(groupCommunityRecommendations([a,b])[0].length,2);
});
test("Não junta homônimos com ruas diferentes ou cidades diferentes",()=>{
  const a={name:"Bar do Sol",city:"Salvador, BA",address:"Rua das Flores, 15, Salvador - BA, 40100-100"};
  const b={name:"Bar do Sol",city:"Salvador, BA",address:"Rua das Flores, 16, Salvador - BA, 40100-100"};
  const c={name:"Bar do Sol",city:"Porto Seguro, BA",address:"Rua das Flores, 15, Salvador - BA, 40100-100"};
  assert.equal(groupCommunityRecommendations([a,b,c]).length,3);
});
