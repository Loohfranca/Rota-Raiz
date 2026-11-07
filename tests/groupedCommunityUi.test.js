import {before,after,test} from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import {createServer} from "vite";
import react from "@vitejs/plugin-react";

let dom,server,React,render,screen,within,fireEvent,View,cleanup;
before(async()=>{
  dom=new JSDOM("<html><body></body></html>",{url:"http://localhost"});
  for(const k of ["window","document","HTMLElement","localStorage","MutationObserver","Node","Event","HTMLDialogElement"]) globalThis[k]=dom.window[k];
  Object.defineProperty(globalThis,"navigator",{value:dom.window.navigator,configurable:true});
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","");};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute("open");};
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  React=await import("react");
  ({render,screen,within,fireEvent,cleanup}=await import("@testing-library/react"));
  server=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true,hmr:false},appType:"custom"});
  View=(await server.ssrLoadModule("/src/components/CommunityView.jsx")).default;
});
after(async()=>{cleanup();await server.close();dom.window.close();});

test("Busca mantém a contagem do lugar; gestos, fotos e interações seguem a experiência ativa",async()=>{
  const place={name:"Praia de Teste",category:"Praia",city:"Cairu",state:"BA",address:"Entrada da praia",destination:{name:"Ilha de Teste"}};
  const items=[
    {id:"b",name:"Nome antigo",city:"Cairu",place_id:"p",place,visited_on:"2026-09-02",note:"Relato antigo",author_name:"Bia",photos:[],tips:"Dica antiga"},
    {id:"a",name:"Praia de Teste",city:"Cairu",place_id:"p",place,visited_on:"2026-09-04",note:"Relato recente",author_name:"Ana",photos:[{storage_path:"a-capa",is_cover:true},{storage_path:"a-foto-2"}],how_to_get:{route:"Passe pela ponte"}},
  ];
  let finishOld;
  const liked=[];
  const api={
    getRecommendations:async()=>({available:true,items}),
    getEngagement:async()=>({a:{likes:7,comments:1},b:{likes:2,comments:1,liked:true}}),
    getPublicAuthors:async()=>({}),
    getComments:id=>id==="b"?new Promise(resolve=>{finishOld=resolve;}):Promise.resolve([{id:"comment-a",author_name:"Ana",body:"Comentário recente"}]),
    toggleLike:async(id,value)=>{liked.push(id);return !value;},
  };
  render(React.createElement(View,{api,user:{id:"me"},photoUrlFor:path=>"/"+path}));
  await screen.findByText("2 indicações de viajantes");
  fireEvent.change(screen.getByRole("textbox",{name:/Buscar indicação/}),{target:{value:"Bia"}});
  fireEvent.click(screen.getByRole("button",{name:"Abrir detalhes de Praia de Teste"}));
  const detail=within(screen.getByRole("dialog"));
  assert.ok(detail.getByText("1 de 2 indicações"));
  assert.ok(detail.getByText(/Ilha de Teste/));
  assert.ok(detail.getByText("Como chegar"));
  await detail.findByText("Comentário recente");
  const swipe=el=>{
    fireEvent.touchStart(el,{touches:[{clientX:150,clientY:90}]});
    fireEvent.touchEnd(el,{changedTouches:[{clientX:40,clientY:95}]});
  };
  swipe(detail.getByRole("img"));
  assert.ok(detail.getByText("Foto 2 de 2"));
  assert.ok(detail.getByText("1 de 2 indicações"));
  swipe(detail.getByText("Relato recente"));
  assert.ok(detail.getByText("2 de 2 indicações"));
  assert.ok(detail.getByText("Dicas adicionais"));
  assert.equal(detail.queryByText("Comentário recente"),null);
  assert.ok(detail.getByRole("button",{name:"2 curtidas",pressed:true}));
  fireEvent.click(detail.getByRole("button",{name:"2 curtidas"}));
  fireEvent.click(detail.getByRole("button",{name:"Indicação anterior"}));
  await React.act(async()=>finishOld([{id:"comment-b",body:"Comentário antigo"}]));
  assert.deepEqual(liked,["b"]);
  assert.equal(detail.queryByText("Comentário antigo"),null);
  assert.ok(detail.getByText("Foto 1 de 2"));
});
