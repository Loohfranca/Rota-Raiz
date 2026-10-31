import { validateExperienceDraft } from "./experienceFormModel.js";

// Inject compression and IDs for tests. Both screens use this exact service.
export function createExperiencePublication(client, { optimize, uuid = () => crypto.randomUUID() } = {}) {
  const pending = new Map();
  async function own(id) {
    const {data,error}=await client.rpc("rr_get_own_experience",{p_id:id});
    if(error)throw error;return data;
  }
  function message(error) {
    if(['PGRST301','PGRST302'].includes(error.code))return "Entre novamente com sua conta para continuar. Seus campos foram mantidos.";
    if(error.code==='PGRST202')return "A publicação ainda precisa ser ativada. Seus campos foram mantidos.";
    if(error.code==='23505')return "Este lugar pode já estar cadastrado. Pesquise e confira antes de tentar novamente.";
    if(error.code==='40001')return "As informações foram atualizadas em outra sessão. Reabra o formulário antes de salvar.";
    if(error.code==='42501')return "Sua conta não tem permissão para esta experiência.";
    if(error.code==='P0001')return error.message;
    return "Não foi possível concluir o envio. Seus campos foram mantidos.";
  }
  async function finish(id) {
    const attempt=pending.get(id);if(!attempt)throw new Error("Nenhum envio pendente.");
    let response;
    try{response=await client.rpc("rr_save_experience_form",attempt.args);}catch(error){response={error};}
    if(!response.error){pending.delete(id);return response.data;}
    // An HTTP error may happen after COMMIT. Never remove those objects blindly.
    try{
      const saved=await own(id);
      if(saved&&saved.user_id===attempt.userId&&saved.request_token===attempt.args.p.request_token&&
        (attempt.args.p_expected_version==null||saved.version>attempt.args.p_expected_version)&&
        saved.note===attempt.args.p.note&&saved.visited_on===attempt.args.p.visited_on&&saved.tips===attempt.args.p.tips&&
        ['starting_point','transport','route'].every(key=>(saved.how_to_get?.[key]||'')===(attempt.args.p.how_to_get?.[key]||''))&&
        saved.photos?.find(photo=>photo.is_cover)?.storage_path===attempt.paths[attempt.args.p.cover_index]&&
        attempt.paths.every(path=>saved.photos?.some(photo=>photo.storage_path===path))){pending.delete(id);return saved;}
    }catch{/* ambiguous: keep files for explicit retry */}
    const definite=['PGRST301','PGRST302','PGRST202'].includes(response.error.code)||(/^[0-9A-Z]{5}$/.test(response.error.code||'')&&!/^08|^PGRST|^57/.test(response.error.code));
    if(definite){
      if(attempt.uploaded.length)await client.storage.from('community-photos').remove(attempt.uploaded).catch(()=>{});
      pending.delete(id);throw new Error(message(response.error));
    }
    throw Object.assign(new Error("A conexão foi interrompida. Confira o envio antes de editar ou publicar novamente."),{pending:true});
  }
  return {
    get: own,
    retry: finish,
    async save(draft) {
      if(!client)throw new Error("Conecte-se para publicar sua experiência.");
      if(pending.has(draft.id))return finish(draft.id);
      const payload=validateExperienceDraft(draft);
      const {data:auth,error:authError}=await client.auth.getUser();
      if(authError||!auth?.user)throw new Error("Entre com sua conta para publicar.");
      if(draft.legacy){
        const {data,error}=await client.rpc('rr_edit_legacy_experience',{p_id:draft.id,p_note:payload.note,p_how_to_get:payload.how_to_get,p_tips:payload.tips,p_expected_version:draft.version});
        if(error)throw new Error(message(error));return data;
      }
      // Decode/compress both files before the first upload or DB mutation.
      const blobs=await Promise.all(draft.photos.map(photo=>photo.file?optimize(photo.file):null));
      const uploaded=[],photos=[];
      try{
        for(let i=0;i<2;i++){
          let path=draft.photos[i].storage_path;
          if(blobs[i]){
            path=`${auth.user.id}/${uuid()}.webp`;
            const {error}=await client.storage.from('community-photos').upload(path,blobs[i],{contentType:'image/webp',upsert:false});
            if(error)throw new Error("Não foi possível enviar as duas fotos. Verifique sua conexão e o limite da galeria.");
            uploaded.push(path);
          }
          photos.push({storage_path:path,caption:draft.photos[i].caption||''});
        }
      }catch(error){if(uploaded.length)await client.storage.from('community-photos').remove(uploaded).catch(()=>{});throw error;}
      const args={p_id:draft.id,p_expected_version:draft.version??null,p:{...payload,photos,request_token:draft.requestToken||draft.id}};
      pending.set(draft.id,{args,uploaded,paths:photos.map(p=>p.storage_path),userId:auth.user.id});
      return finish(draft.id);
    },
    async setDeleted(item,deleted=true){
      const {data,error}=await client.rpc('rr_set_experience_deleted',{p_id:item.id,p_expected_version:item.version,p_deleted:deleted});
      if(error)throw new Error(message(error));return data;
    },
  };
}
