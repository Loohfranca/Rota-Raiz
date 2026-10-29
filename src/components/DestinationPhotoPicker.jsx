import React,{useEffect,useState} from "react";
import {ImagePlus,Upload,Trash2} from "lucide-react";

export default function DestinationPhotoPicker({city,remaining,onPublish,busy}){
 const [files,setFiles]=useState([]);
 const [previewUrls,setPreviewUrls]=useState([]);
 const [caption,setCaption]=useState("");
 const [validation,setValidation]=useState("");
 const allowed=Math.min(2,Math.max(0,remaining));
 useEffect(()=>{
   const urls=files.map(file=>URL.createObjectURL(file));
   setPreviewUrls(urls);
   return()=>urls.forEach(url=>URL.revokeObjectURL(url));
 },[files]);
 function choose(event){
   const selected=Array.from(event.target.files||[]);
   event.target.value="";
   if(!selected.length)return;
   if(selected.length>allowed){
     setValidation("Este destino aceita até 2 fotos. Você pode selecionar "+allowed+" agora.");
     return;
   }
   if(selected.some(file=>!(file.type.startsWith("image/")||/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)))){
     setValidation("Selecione apenas imagens da galeria.");return;
   }
   if(selected.some(file=>file.size>25*1048576)){
     setValidation("Cada foto original deve ter até 25 MB.");return;
   }
   setValidation("");setFiles(selected);
 }
 async function publish(){
   if(!files.length||busy)return;
   const ok=await onPublish(files,caption);
   if(ok){setFiles([]);setCaption("");setValidation("");}
 }
 return <div className="rr-profile-batch-picker">
   <label className="rr-profile-gallery-select"><ImagePlus size={17}/> Selecionar {allowed>1?"até 2 fotos":"1 foto"}
     <input type="file" accept="image/*,.heic,.heif" multiple disabled={busy} onChange={choose} aria-label={"Selecionar fotos de "+city}/>
   </label>
   {validation&&<p className="form-error" role="alert">{validation}</p>}
   {files.length>0&&<>
     <div className="rr-profile-batch-previews">{files.map((file,index)=><div className="rr-profile-batch-thumb" key={index}>
       <img src={previewUrls[index]} alt={"Prévia "+(index+1)+" de "+city}/>
       <span>{index+1} / {files.length}</span>
     </div>)}</div>
     <label className="rr-profile-batch-caption">Legenda (opcional)
       <input maxLength={180} value={caption} disabled={busy} placeholder="Uma lembrança deste lugar…" onChange={e=>setCaption(e.target.value)}/>
     </label>
     <div className="rr-profile-batch-actions">
       <button type="button" className="small-action" disabled={busy} onClick={()=>setFiles([])}><Trash2 size={15}/> Limpar</button>
       <button type="button" className="primary-action" disabled={busy} onClick={publish}><Upload size={17}/> {busy?"Publicando…":"Publicar "+files.length+" foto"+(files.length===1?"":"s")}</button>
     </div>
   </>}
 </div>;
}
