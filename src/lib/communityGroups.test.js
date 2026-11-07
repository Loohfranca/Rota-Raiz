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

test("O vínculo canônico prevalece sobre texto; contagem e ordem são por experiência publicada",()=>{
  const older={id:"old",place_id:"praia-a",name:"Praia",visited_on:"2025-02-01",created_at:"2026-06-01"};
  const newer={id:"new",place_id:"praia-a",name:"Praia renomeada",visited_on:"2025-03-01",created_at:"2026-05-01",photos:[{},{}]};
  const undated={id:"undated",place_id:"praia-a",created_at:"2026-07-01"};
  const groups=groupCommunityRecommendations([older,newer,newer,undated,
    {...older,id:"other",place_id:"praia-b"},{...older,id:"pending",status:"pending"},
    {...older,id:"deleted",deleted_at:"2026-07-01"}]);
  assert.deepEqual(groups.map(g=>g.map(x=>x.id)),[["new","old","undated"],["other"]]);
});
