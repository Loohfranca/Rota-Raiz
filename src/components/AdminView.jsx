import React,{useCallback,useEffect,useState} from "react";
import { ArrowLeft, BarChart3, Users, MapPin, MessageCircle, ShieldAlert, HardDrive, Wallet, RefreshCw, Check, X, ExternalLink, Image as ImageIcon, Bell } from "lucide-react";
import { checkAdmin,getDashboard,getOverview,reviewEvent,formatSize,limits } from "../lib/adminApi";

const sections=[
  {id:"overview",label:"Visão geral",icon:BarChart3},
  {id:"users",label:"Usuários",icon:Users},
  {id:"places",label:"Lugares",icon:MapPin},
  {id:"comments",label:"Comentários",icon:MessageCircle},
  {id:"moderation",label:"Moderação",icon:ShieldAlert},
  {id:"storage",label:"Fotos e custos",icon:HardDrive}
];
const date=s=>s?new Date(s).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"Sem registro";
const amount=n=>Number(n||0).toLocaleString("pt-BR");
function Stat({label,value,detail,icon:Icon}){return <article className="rr-admin-stat"><span className="rr-admin-stat-icon"><Icon size={18}/></span><span className="rr-admin-stat-value">{value}</span><b>{label}</b>{detail&&<small>{detail}</small>}</article>;}
function DataTable({headers,items,render}){return <div className="rr-admin-table-wrap"><table className="rr-admin-table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{items.length?items.map((r,i)=><tr key={r.id||i}>{render(r)}</tr>):<tr><td colSpan={headers.length} className="rr-admin-empty">Nenhum registro disponível.</td></tr>}</tbody></table></div>;}
export default function AdminView({onBack}){
 const [allowed,setAllowed]=useState(null);
 const [section,setSection]=useState("overview");
 const [metrics,setMetrics]=useState(null);
 const [rows,setRows]=useState([]);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [simUsers,setSimUsers]=useState(100);
 const [simPhotos,setSimPhotos]=useState(3);
 const [simPhotoKB,setSimPhotoKB]=useState(250);
 const refresh=useCallback(async()=>{
   setLoading(true);setError("");
   try{
     const ok=await checkAdmin();setAllowed(!!ok);
     if(!ok)return;
     const m=await getDashboard();setMetrics(m);
     if(["users","places","comments","moderation"].includes(section))setRows(await getOverview(section));
     else setRows([]);
   }catch(e){setError(e.message);}finally{setLoading(false);}
 },[section]);
 useEffect(()=>{refresh();},[refresh]);
 async function decide(id,decision) {
   if(busy)return;
   setBusy(true);setError("");
   try{await reviewEvent(id,decision);setMessage(decision==="approve"?"Comentário aprovado após revisão.":"Ocorrência encerrada.");await refresh();}
   catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const photos=Number(metrics?.stored_photos||0),bytes=Number(metrics?.stored_photo_bytes||0);
 const ratio=bytes/(limits.bucketTargetMB*1048576);
 return <div className="rr-admin-page">
   <header className="rr-admin-head">
     <div><span className="eyebrow"><ShieldAlert size={15}/> ÁREA RESTRITA</span><h1>Central Rota Raiz</h1><p>Visão administrativa, segurança e consumo do aplicativo.</p></div>
     <div className="rr-admin-header-actions"><button type="button" className="small-action" onClick={onBack}><ArrowLeft size={16}/> Voltar</button><button type="button" className="small-action" disabled={loading} onClick={refresh}><RefreshCw size={16}/> Atualizar</button></div>
   </header>
   {allowed===null?<p role="status">Verificando permissão de administrador…</p>:!allowed?<div className="rr-admin-denied"><ShieldAlert size={28}/><h2>Acesso restrito</h2><p>É necessário entrar com uma conta Google autorizada como administradora. Não existe mais acesso por PIN.</p><button className="small-action" onClick={onBack}>Voltar ao aplicativo</button></div>:<>
    <nav className="rr-admin-tabs" aria-label="Áreas administrativas">
      {sections.map(s=><button type="button" key={s.id} aria-pressed={section===s.id} onClick={()=>{setSection(s.id);setMessage("");}}><s.icon size={17}/>{s.label}{s.id==="moderation"&&metrics?.moderation_pending>0&&<b>{metrics.moderation_pending}</b>}</button>)}
    </nav>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {message&&<p className="rr-admin-success" role="status"><Check size={16}/>{message}</p>}
    {section==="overview"&&<><div className="rr-admin-stats">
      <Stat icon={Users} label="Usuários cadastrados" value={amount(metrics?.users_total)}/>
      <Stat icon={Users} label="Ativos nos últimos 5 min" value={amount(metrics?.users_active_5m)} detail="Estimativa por atividade recente"/>
      <Stat icon={Users} label="Ativos em 24 horas" value={amount(metrics?.users_logged_24h)}/>
      <Stat icon={BarChart3} label="Ativos em 30 dias" value={amount(metrics?.users_seen_30d)} detail="Dados desde o início da medição"/>
      <Stat icon={Users} label="Último login nas últimas 24h" value={amount(metrics?.users_signin_24h)} detail="Contas distintas; autenticação Supabase"/>
      <Stat icon={BarChart3} label="Sessões estimadas" value={amount(metrics?.visits_estimate)} detail="Não equivalem a logins Google"/>
      <Stat icon={MapPin} label="Indicações cadastradas" value={amount(metrics?.recommendations)}/>
      <Stat icon={MessageCircle} label="Comentários publicados" value={amount(metrics?.comments)}/>
      <Stat icon={ShieldAlert} label="Revisões pendentes" value={amount(metrics?.moderation_pending)}/>
      <Stat icon={HardDrive} label="Fotos no Storage" value={amount(photos)} detail={formatSize(bytes)}/>
      <Stat icon={MapPin} label="Viagens registradas" value={amount(metrics?.trips)}/>
      <Stat icon={MapPin} label="Paradas cadastradas no banco" value={amount(metrics?.stops)}/>
      <Stat icon={MapPin} label="Trechos cadastrados no banco" value={amount(metrics?.routes)}/>
      <Stat icon={Wallet} label="Contas compartilhadas" value={amount(metrics?.shared_trips)}/>
    </div>
    <div className="rr-admin-info"><Bell size={20}/><div><b>Monitoramento da Comunidade</b><p>{amount(metrics?.moderation_pending)} ocorrência(s) aguardando decisão. {amount(metrics?.moderation_blocked)} mensagens bloqueadas. Os alertas aparecem aqui no painel; notificações externas por e-mail ainda não estão configuradas.</p></div><button className="small-action" onClick={()=>setSection("moderation")}>Analisar</button></div>
    <p className="rr-admin-caption">Atividade registrada aproximadamente a cada 3 minutos. “Online” é uma estimativa, e as métricas não recuperam acessos anteriores à implantação. Viagens e contas são exibidas apenas como totais, sem expor seus dados privados.</p>
    </>}
    {section==="users"&&<><h2>Usuários cadastrados</h2><p className="rr-admin-caption">Até 100 cadastros mais recentes. O número de sessões representa períodos separados por pelo menos 30 minutos de inatividade, não logins Google exatos.</p><DataTable headers={["Usuário","E-mail","Cadastro","Último login","Atividade recente","Fotos","Sessões estimadas"]} items={rows} render={r=><><td>{r.name}</td><td>{r.email}</td><td>{date(r.created_at)}</td><td>{date(r.last_sign_in_at)}</td><td>{date(r.last_seen)}</td><td>{amount(r.photos)}</td><td>{amount(r.sessions)}</td></>}/></>}
    {section==="places"&&<><h2>Indicações e lugares</h2><p className="rr-admin-caption">Até 150 publicações mais recentes, incluindo o autor, endereço, status e presença de foto. Indicações repetidas continuam preservadas individualmente.</p><DataTable headers={["Lugar","Localização","Autor","Categoria","Foto","Status","Dica"]} items={rows} render={r=><><td><strong>{r.name}</strong></td><td>{r.city}<small className="rr-admin-muted">{r.address}</small></td><td>{r.author_name}</td><td>{r.category==="Comida"?"Alimentação":r.category}</td><td>{r.has_photo?"Sim":"Não"}</td><td>{r.status}</td><td>{r.note}</td></>}/></>}
    {section==="comments"&&<><h2>Comentários publicados</h2><DataTable headers={["Quem comentou","Lugar","Comentário","Data"]} items={rows} render={r=><><td>{r.author_name}</td><td>{r.place}</td><td className="rr-admin-comment">{r.body}</td><td>{date(r.created_at)}</td></>}/></>}
    {section==="moderation"&&<><h2>Central de moderação</h2><p className="rr-admin-caption">Conteúdos detectados como ofensivos não são exibidos publicamente. Casos ambíguos ficam retidos. Você pode liberar uma mensagem após análise ou encerrar a ocorrência. Denúncias de mensagens já publicadas também são registradas.</p><div className="rr-admin-events">{rows.length?rows.map(e=><article key={e.id} className="rr-admin-event"><div className="rr-admin-event-head"><strong>{e.reason==="ofensa_ou_ameaca"?"Ofensa ou ameaça":e.reason==="denuncia_usuario"?"Denúncia":"Revisão de contexto"}</strong><span>{e.state==="reviewed"?"Revisado":e.state==="blocked"?"Bloqueado":"Pendente"} · {date(e.created_at)}</span></div><p>{e.content_text}</p><small>Autor: {e.author_email||"Conta indisponível"} · {e.place||"Indicação removida"}</small>{e.state!=="reviewed"&&<div className="rr-admin-actions"><button className="small-action" type="button" disabled={busy} onClick={()=>decide(e.id,"approve")}><Check size={15}/> Aprovar</button><button className="small-action" type="button" disabled={busy} onClick={()=>decide(e.id,"dismiss")}><X size={15}/> Encerrar</button></div>}</article>):<p className="rr-admin-empty">Nenhuma ocorrência registrada.</p>}</div></>}
    {section==="storage"&&<><h2>Fotografias e custos</h2><div className="rr-admin-stats"><Stat icon={ImageIcon} label="Arquivos no bucket da comunidade" value={amount(photos)}/><Stat icon={HardDrive} label="Armazenamento monitorado" value={formatSize(bytes)}/>
      <Stat icon={HardDrive} label="Banco de dados" value={formatSize(metrics?.database_bytes)}/><Stat icon={Users} label="Limite preventivo por conta" value="20 fotos"/><Stat icon={HardDrive} label="Limite por upload" value="3 MB"/></div>
      <div className="rr-admin-storage"><div className="rr-admin-storage-row"><b>Consumo do bucket comunitário</b><span>{formatSize(bytes)} / {limits.bucketTargetMB} MB</span></div><div className="rr-admin-progress" role="progressbar" aria-label="Uso do limite preventivo de fotos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.round(ratio*100))}><span style={{width:Math.min(100,ratio*100)+"%"}}/></div><p>{ratio>=.95?"Atenção: próximo do bloqueio preventivo.":ratio>=.8?"Alerta: mais de 80% do limite preventivo usado.":"Monitoramento preventivo ativo."} O limite de 700 MB se aplica ao bucket community-photos, não ao armazenamento total do projeto.</p></div>
      <section className="rr-admin-simulator">
        <h3>Simule o crescimento da comunidade</h3>
        <p>Estimativa de armazenamento, não uma previsão de cobrança ou de tráfego.</p>
        <div className="rr-admin-simulator-inputs">
          <label>Usuários cadastrados <b>{amount(simUsers)}</b><input aria-label="Número estimado de usuários" type="range" min="50" max="5000" step="50" value={simUsers} onChange={e=>setSimUsers(Number(e.target.value))}/></label>
          <label>Fotos por usuário <b>{simPhotos}</b><input aria-label="Fotos médias por usuário" type="range" min="0" max="20" step="1" value={simPhotos} onChange={e=>setSimPhotos(Number(e.target.value))}/></label>
          <label>Tamanho médio da foto <b>{simPhotoKB} KB</b><input aria-label="Tamanho médio da foto" type="range" min="100" max="1000" step="50" value={simPhotoKB} onChange={e=>setSimPhotoKB(Number(e.target.value))}/></label>
        </div>
        <div className="rr-admin-simulator-result"><strong>{amount(simUsers*simPhotos)} fotos</strong><strong>{formatSize(simUsers*simPhotos*simPhotoKB*1024)}</strong></div>
        <p>{simUsers*simPhotos*simPhotoKB*1024>limits.bucketTargetMB*1048576?"Esta hipótese ultrapassaria o limite preventivo de 700 MB da Comunidade.":"Esta hipótese ficaria dentro do limite preventivo de 700 MB da Comunidade."} Não inclui imagens externas, tráfego de visualização ou demais bancos de dados.</p>
      </section>
      <div className="rr-admin-info"><Wallet size={20}/><div><b>Custos reais e franquias</b><p>Os valores de faturamento e uso de transferência não podem ser lidos diretamente por este painel sem as APIs de cobrança dos serviços. Consulte as fontes oficiais abaixo. Usuários ativos e fotos não equivalem, isoladamente, ao custo da operação.</p><p>Os limites gratuitos e os preços dos planos podem mudar. As franquias de Supabase, Vercel e outros serviços devem ser verificadas no painel de cobrança de cada provedor.</p><div className="rr-admin-links"><a href="https://supabase.com/dashboard/project/cbaommdaoaqmxurkkeho" target="_blank" rel="noopener noreferrer">Supabase · abrir projeto <ExternalLink size={14}/></a><a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">Vercel · Analytics e Billing <ExternalLink size={14}/></a></div></div></div>
      <p className="rr-admin-caption">Imagens externas exibidas por URL não contam como arquivos do bucket comunitário, mas seu tráfego pode ter custos próprios. O bloqueio preventivo não garante custo zero porque outros serviços e buckets também têm limites.</p>
    </>}
   </>}
 </div>;
}
