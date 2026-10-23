"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { customerSavedViewSchema, defaultCustomerViewLayout, type CustomerSavedView, type CustomerViewLayout } from "@/lib/customerSavedViews";
import { CUSTOMER_SEARCH_PRESET_GRID } from "@/lib/customerSearchColumns";
import { CUSTOMER_SEARCH_VIEWS_2_GRID } from "@/lib/customerSearchViewsLayout";
function originalName(slot:number) {
  const grid=slot<=32 ? CUSTOMER_SEARCH_PRESET_GRID : CUSTOMER_SEARCH_VIEWS_2_GRID;
  const index=(slot-1)%32,cell=grid[Math.floor(index/8)]?.[index%8];
  return cell && typeof cell === "object" ? cell.label : `View ${String(slot).padStart(2,"0")}`;
}
type ViewsContext = {
  slot:number; select:(slot:number)=>void; views:CustomerSavedView[]; layout:CustomerViewLayout;
  setLayout:Dispatch<SetStateAction<CustomerViewLayout>>; ready:boolean; busy:boolean; message:string;
  openSave:()=>void; openDelete:()=>void; remove:()=>Promise<void>;
};
const Context=createContext<ViewsContext|null>(null);
export const useCustomerSavedViews = ()=>useContext(Context);
export function CustomerSavedViewsProvider({children}:{children:ReactNode}) {
  const [slot,setSlot]=useState(1),[views,setViews]=useState<CustomerSavedView[]>([]);
  const [layout,setLayout]=useState(defaultCustomerViewLayout);
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [name,setName]=useState(""),[error,setError]=useState("");
  const dialog=useRef<HTMLDialogElement>(null),deleteDialog=useRef<HTMLDialogElement>(null),saveSlot=useRef(1),snapshot=useRef(layout),selectedSlot=useRef(1);
  useEffect(()=>{
    let active=true;
    fetch("/api/customers/saved-views",{cache:"no-store"}).then(async response=>{
      const data=await response.json(); if(!response.ok) throw new Error(data.error);
      const saved=(data.views as unknown[]).map(view=>customerSavedViewSchema.parse(view));
      if(active){setViews(saved); const initial=saved.find(view=>view.slot===selectedSlot.current); if(initial) setLayout(initial.layout); setReady(true);}
    }).catch(error=>{if(active)setMessage(error.message || "Saved views could not be loaded. Reload before saving.");});
    return ()=>{active=false;};
  },[]);
  const select=(next:number)=>{selectedSlot.current=next;setSlot(next);setLayout(views.find(view=>view.slot===next)?.layout ?? defaultCustomerViewLayout());setMessage("");};
  const openSave=()=>{saveSlot.current=slot;snapshot.current=structuredClone(layout);setName(views.find(view=>view.slot===slot)?.name ?? originalName(slot));setError("");dialog.current?.showModal();};
  async function save() {
    setBusy(true);setError("");
    try {
      const view=customerSavedViewSchema.parse({slot:saveSlot.current,name,layout:snapshot.current});
      const response=await fetch("/api/customers/saved-views",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(view)});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      const saved=customerSavedViewSchema.parse(data.view);
      setViews(current=>[...current.filter(item=>item.slot!==saved.slot),saved]);
      setMessage(`${saved.name} saved to the database.`);dialog.current?.close();
    }catch(error){setError(error instanceof Error ? error.message : "View could not be saved.");}finally{setBusy(false);}
  }
  const openDelete=()=>{if(views.some(view=>view.slot===slot))deleteDialog.current?.showModal();};
  async function remove() {
    const deleteSlot=slot,saved=views.find(view=>view.slot===deleteSlot);if(!saved)return;
    setBusy(true);
    try {
      const response=await fetch("/api/customers/saved-views",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({slot:deleteSlot})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setViews(current=>current.filter(view=>view.slot!==deleteSlot));setLayout(defaultCustomerViewLayout());setMessage("Saved view deleted.");deleteDialog.current?.close();
    }catch(error){setMessage(error instanceof Error ? error.message : "View could not be deleted.");}finally{setBusy(false);}
  }
  return <Context.Provider value={{slot,select,views,layout,setLayout,ready,busy,message,openSave,openDelete,remove}}>
    {children}
    <dialog ref={dialog} className="ac-customer-saved-view-dialog" onCancel={event=>{if(busy)event.preventDefault();}}>
      <form onSubmit={event=>{event.preventDefault();void save();}}>
        <header><h2>Save View {String(saveSlot.current).padStart(2,"0")}</h2></header>
        <div className="ac-customer-saved-view-body">
          <label>Button name<input autoFocus required maxLength={80} value={name} onChange={event=>setName(event.target.value)} /></label>
          <p>Save column order, widths, hidden columns, sorting, and column filters.</p>
          {error && <p role="alert">{error}</p>}
        </div>
        <footer><button className="ac-btn ac-btn-xs" type="submit" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save"}</button><button className="ac-btn ac-btn-xs" type="button" disabled={busy} onClick={()=>dialog.current?.close()}>Cancel</button></footer>
      </form>
    </dialog>
    <dialog ref={deleteDialog} className="ac-customer-saved-view-dialog ac-customer-saved-view-delete-dialog" onCancel={event=>{if(busy)event.preventDefault();}}>
      <form onSubmit={event=>{event.preventDefault();void remove();}}>
        <header><h2>Delete Saved View</h2></header>
        <div className="ac-customer-saved-view-body"><p>Delete “{views.find(view=>view.slot===slot)?.name}” (View {String(slot).padStart(2,"0")})?</p><p>This saved view and its column settings will be removed.</p>{message && message !== "Saved view deleted." && <p role="alert">{message}</p>}</div>
        <footer><button className="ac-btn ac-btn-xs" type="submit" disabled={busy}>{busy ? "Deleting…" : "Delete"}</button><button className="ac-btn ac-btn-xs" type="button" disabled={busy} onClick={()=>deleteDialog.current?.close()}>Cancel</button></footer>
      </form>
    </dialog>
  </Context.Provider>;
}
export function CustomerSavedViewActions() {
  const state=useCustomerSavedViews();
  if(!state)return null;
  return <><button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openSave} disabled={!state.ready || state.busy}>Save View</button>
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openSave} disabled={!state.ready || state.busy}>Rename View</button>
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openDelete} disabled={!state.ready || state.busy || !state.views.some(view=>view.slot===state.slot)}>Delete View</button>
    {state.message && <span role="status" title={state.message} style={{position:"fixed",right:16,bottom:20,zIndex:1000,maxWidth:420,padding:"8px 12px",border:"1px solid #aaa",background:"#fff",color:"#111",fontSize:13}}>{state.message}</span>}</>;
}
export function useCustomerViewField<K extends keyof CustomerViewLayout>(key:K,initial:CustomerViewLayout[K],enabled:boolean):[CustomerViewLayout[K],Dispatch<SetStateAction<CustomerViewLayout[K]>>] {
  const context=useCustomerSavedViews();
  const [local,setLocal]=useState(initial);
  const setLayout=context?.setLayout;
  const setter=useCallback<Dispatch<SetStateAction<CustomerViewLayout[K]>>>(update=>{
    if(enabled && setLayout)setLayout(current=>({...current,[key]:typeof update === "function" ? (update as (value:CustomerViewLayout[K])=>CustomerViewLayout[K])(current[key]) : update}));
    else setLocal(update);
  },[enabled,setLayout,key]);
  return [enabled && context ? context.layout[key] : local,setter];
}
