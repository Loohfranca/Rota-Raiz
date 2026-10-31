import { before, after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
let server,dom,React,render,screen,cleanup,userEvent,act,Search,Form,DuplicateNotice;
const suggestion={id:'morere',kind:'place',name:'Praia de Moreré',category:'Praia',municipality:'Cairu',state:'BA',destination:'Ilha de Boipeba'};
const full={...suggestion,address:'Praia de Moreré, Ilha de Boipeba',instagram:'',destination:{id:'boipeba',name:'Ilha de Boipeba'}};
const defaultApi={search:async()=>[suggestion],getPlace:async()=>full,duplicates:async()=>[]};
before(async()=>{
 dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'});
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','localStorage','sessionStorage','MutationObserver','Node','Event','MouseEvent'])globalThis[key]=dom.window[key];
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 globalThis.FormData=dom.window.FormData;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 React=await import('react');({render,screen,cleanup,act}=await import('@testing-library/react'));userEvent=(await import('@testing-library/user-event')).default;
 server=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true,hmr:false},appType:'custom'});
 ({default:Search,PlaceDuplicateNotice:DuplicateNotice}=await server.ssrLoadModule('/src/components/InternalPlaceSearch.jsx'));
 ({RecommendationForm:Form}=await server.ssrLoadModule('/src/components/CommunityView.jsx'));
});
afterEach(()=>cleanup());after(async()=>{await server.close();dom.window.close();});
function Harness({api=defaultApi,onSelected=()=>{},onCreated=()=>{}}){const [value,setValue]=React.useState('');return React.createElement(Search,{value,onChange:setValue,onSelect:p=>{setValue(p.name);onSelected(p);},onCreate:onCreated,api});}

test('primeira letra abre sugestões; teclado seleciona o cadastro completo',async()=>{
 let picked,calls=[];const api={...defaultApi,search:async(q,options)=>{calls.push([q,options]);return[suggestion];},getPlace:async(id)=>{assert.equal(id,'morere');return full;}};
 render(React.createElement(Harness,{api,onSelected:p=>picked=p}));const ui=userEvent.setup();
 await ui.type(screen.getByRole('combobox'),'M');await screen.findByRole('option',{name:/Praia de Moreré/});
 assert.equal(calls[0][0],'M');assert.ok(screen.getByText(/Praia · Ilha de Boipeba · Cairu · BA/));
 await ui.keyboard('{ArrowDown}{Enter}');assert.deepEqual(picked,full);assert.equal(screen.getByRole('combobox').value,'Praia de Moreré');
 assert.equal(screen.getByRole('combobox').getAttribute('aria-expanded'),'false');
});
test('escolher Boipeba abre seus lugares com escopo enviado ao servidor',async()=>{
 const calls=[];const api={...defaultApi,search:async(q,o)=>{calls.push([q,o.destinationId]);return o.destinationId?[suggestion]:[{kind:'destination',id:'boipeba',name:'Ilha de Boipeba',category:'Destino',municipality:'Cairu',state:'BA'}];}};
 render(React.createElement(Harness,{api}));const ui=userEvent.setup();await ui.type(screen.getByRole('combobox'),'Boipeba');
 await ui.click(await screen.findByRole('option',{name:/Ilha de Boipeba/}));await screen.findByRole('option',{name:/Praia de Moreré/});
 assert.ok(calls.some(([q,id])=>q===''&&id==='boipeba'));assert.ok(screen.getByText('Lugares em Ilha de Boipeba'));
 await ui.click(screen.getByRole('button',{name:'Remover filtro de destino'}));assert.equal(screen.queryByText('Lugares em Ilha de Boipeba'),null);
});
test('resposta de consulta antiga não substitui sugestões do texto atual',async()=>{
 let oldResolve;const api={...defaultApi,search:async q=>q==='A'?new Promise(resolve=>oldResolve=resolve):[suggestion]};
 render(React.createElement(Harness,{api}));const ui=userEvent.setup();await ui.type(screen.getByRole('combobox'),'A');
 await act(()=>new Promise(r=>setTimeout(r,210)));assert.ok(oldResolve);
 await ui.clear(screen.getByRole('combobox'));await ui.type(screen.getByRole('combobox'),'Mor');await screen.findByRole('option',{name:/Praia de Moreré/});
 await act(async()=>oldResolve([{...suggestion,name:'Resposta antiga'}]));assert.equal(screen.queryByRole('option',{name:/Resposta antiga/}),null);
});
test('seleção em andamento não sobrescreve texto que o usuário já trocou',async()=>{
 let resolve,selected=false;const api={...defaultApi,getPlace:()=>new Promise(r=>resolve=r)};
 render(React.createElement(Harness,{api,onSelected:()=>selected=true}));const ui=userEvent.setup();await ui.type(screen.getByRole('combobox'),'Mor');
 await ui.click(await screen.findByRole('option',{name:/Praia de Moreré/}));await ui.clear(screen.getByRole('combobox'));await ui.type(screen.getByRole('combobox'),'Outro');
 await act(async()=>resolve(full));assert.equal(selected,false);assert.equal(screen.getByRole('combobox').value,'Outro');
});
test('vazio e falha são distintos; cadastrar novo lugar mantém o nome digitado',async()=>{
 let created;render(React.createElement(Harness,{api:{...defaultApi,search:async()=>[]},onCreated:name=>created=name}));
 const ui=userEvent.setup();await ui.type(screen.getByRole('combobox'),'Lugar novo');await screen.findByText('Nenhum lugar cadastrado encontrado.');
 await ui.click(screen.getByRole('button',{name:'Cadastrar novo lugar'}));assert.equal(created,'Lugar novo');
 cleanup();render(React.createElement(Harness,{api:{...defaultApi,search:async()=>{throw new Error('Falha de rede');}}}));
 await ui.type(screen.getByRole('combobox'),'A');await screen.findByRole('alert');assert.ok(screen.getByText(/Falha de rede/));
 assert.equal(screen.queryByText('Nenhum lugar cadastrado encontrado.'),null);
});
test('formulário existente recebe lugar completo e publica só a experiência com seu ID',async()=>{
 let saved;render(React.createElement(Form,{user:{id:'test',user_metadata:{full_name:'Teste'}},searchApi:defaultApi,onSave:async item=>saved=item}));
 const ui=userEvent.setup();await ui.type(screen.getByRole('combobox'),'Mor');await ui.click(await screen.findByRole('option',{name:/Praia de Moreré/}));
 assert.equal(screen.getByLabelText('Endereço completo').value,full.address);assert.equal(screen.getByLabelText('Cidade e estado').value,'Cairu, BA');
 assert.equal(screen.getByLabelText('Endereço completo').readOnly,true);await ui.type(screen.getByLabelText('Sua dica'),'Minha experiência.');
 await ui.click(screen.getByRole('button',{name:'Publicar na comunidade'}));assert.equal(saved.place_id,'morere');assert.equal(saved.note,'Minha experiência.');
});
test('aviso de homônimo exige escolha e recupera os dados antes de preencher',async()=>{
 let selected;const api={...defaultApi,duplicates:async()=>[{...suggestion,address:'Rua de teste',possible_duplicate:false}]};
 render(React.createElement(DuplicateNotice,{name:'Praia de Moreré',address:'Outra rua',city:'Cairu',state:'BA',api,onSelect:p=>selected=p}));
 const ui=userEvent.setup();await ui.click(await screen.findByRole('button',{name:/Mesmo nome; confirme/}));assert.deepEqual(selected,full);
});

test('cadastro antigo encontrado exige completar município e UF e preserva a referência',async()=>{
 const legacy={id:'legacy-morere',kind:'legacy',name:'Moreré',category:'Praia',municipality:'Localização a completar',state:''};
 const fullLegacy={...legacy,municipality:'',address:'Ilha de Boipeba',instagram:'',requires_completion:true,original_location:'Bahia · Ilha de Boipeba'};
 let saved;render(React.createElement(Form,{user:{id:'test'},searchApi:{search:async()=>[legacy],getPlace:async()=>fullLegacy,duplicates:async()=>[]},onSave:async item=>saved=item}));
 const ui=userEvent.setup();await ui.type(screen.getByRole('combobox'),'morere');await ui.click(await screen.findByRole('option',{name:/Cadastro antigo/}));
 assert.equal(screen.getByLabelText('Cidade e estado').value,'');assert.equal(screen.getByLabelText('Cidade e estado').readOnly,false);assert.equal(screen.getByLabelText('Endereço completo').value,'Ilha de Boipeba');
 await ui.type(screen.getByLabelText('Cidade e estado'),'Cairu, BA');await ui.type(screen.getByLabelText('Sua dica'),'Meu relato');await ui.click(screen.getByRole('button',{name:'Publicar na comunidade'}));assert.equal(saved,undefined);assert.match(screen.getByRole('alert').textContent,/confirme/);
 await ui.click(screen.getByLabelText(/Conferi município/));await ui.click(screen.getByRole('button',{name:'Publicar na comunidade'}));assert.equal(saved.legacy_source_id,'legacy-morere');assert.equal(saved.municipality,'Cairu');assert.equal(saved.state,'BA');assert.equal(saved.location_confirmed,true);
});
