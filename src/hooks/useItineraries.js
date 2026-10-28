import { useCallback,useEffect,useRef,useState } from 'react';
import * as live from '../lib/itineraryApi';
export default function useItineraries(userId,api=live) {
  const [stateOwner,setStateOwner]=useState(userId);
  const [plans,setPlans]=useState([]),[activeId,setActiveId]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const sequence=useRef(0),epoch=useRef(0),lock=useRef(false),current=useRef([]);
  const select=useCallback(id=>{setActiveId(id);try{sessionStorage.setItem(`rotaraiz_itinerary_${userId}`,id);}catch{}},[userId]);
  const refresh=useCallback(async()=>{
    if(!userId||lock.current)return;const ticket=epoch.current,request=++sequence.current;
    try{const next=await api.listItineraries();if(ticket!==epoch.current||request!==sequence.current)return;current.current=next;setPlans(next);setError('');setActiveId(id=>next.some(p=>p.id===id)?id:next[0]?.id||'');}
    catch(e){if(ticket===epoch.current&&request===sequence.current)setError(e.message);}finally{if(ticket===epoch.current)setLoading(false);}
  },[userId,api]);
  useEffect(()=>{epoch.current++;setStateOwner(userId);current.current=[];setPlans([]);setError('');setLoading(!!userId);let previous='';try{previous=sessionStorage.getItem(`rotaraiz_itinerary_${userId}`)||'';}catch{}setActiveId(previous);if(userId)refresh();return()=>{epoch.current++;};},[userId,refresh]);
  async function mutate(operation) {
    if(stateOwner!==userId||!userId)throw new Error('Aguarde o roteiro da sua conta carregar.');
    if(lock.current)throw new Error('Aguarde o salvamento atual.');lock.current=true;sequence.current++;setBusy(true);const ticket=epoch.current;
    try{const updated=await operation();if(ticket!==epoch.current)throw new Error('A conta mudou. Reabra o roteiro.');const next=[updated,...current.current.filter(p=>p.id!==updated.id)];current.current=next;setPlans(next);select(updated.id);setError('');return updated;}
    finally{lock.current=false;if(ticket===epoch.current)setBusy(false);}
  }
  return {plans:stateOwner===userId?plans:[],activeId:stateOwner===userId?activeId:'',select,loading:stateOwner!==userId||loading,busy,error:stateOwner===userId?error:'',refresh,create:title=>mutate(()=>api.createItinerary(title)),save:plan=>mutate(()=>api.saveItinerary(plan))};
}
