"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { blastEmailPresetLayout, callListTemplatePresetLayout, coldDormantCallPresetLayout, customerInfoPresetLayout, customerSavedViewSchema, defaultCustomerPresetLayout, defaultCustomerViewLayout, emailMailerPresetLayout, isBlankGridCustomerViewSlot, kickbacksPresetLayout, normalizeCustomerSavedView, profileTypePresetLayout, ryanEamonBrianPresetLayout, rtsPresetLayout, salesPackagesPresetLayout, selectProfilePresetLayout, siobhanOnePresetLayout, siobhanTwoPresetLayout, siobhanTwoScreensPresetLayout, siteOfficeVisitPresetLayout, testOneScreenPresetLayout, testTwoScreenPresetLayout, viewEightPresetLayout, viewThirteenPresetLayout, viewFourteenPresetLayout, viewFifteenPresetLayout, viewSixteenPresetLayout, viewNineteenPresetLayout, viewThirtyOnePresetLayout, viewThirtyTwoPresetLayout, type CustomerSavedView, type CustomerViewLayout } from "@/lib/customerSavedViews";
import { CUSTOMER_SEARCH_PRESET_GRID } from "@/lib/customerSearchColumns";
import { CUSTOMER_SEARCH_VIEWS_2_GRID } from "@/lib/customerSearchViewsLayout";
function originalName(slot:number) {
  const grid=slot<=32 ? CUSTOMER_SEARCH_PRESET_GRID : CUSTOMER_SEARCH_VIEWS_2_GRID;
  const index=(slot-1)%32,cell=grid[Math.floor(index/8)]?.[index%8];
  return cell && typeof cell === "object" ? cell.label : `View ${String(slot).padStart(2,"0")}`;
}
function presetButtonName(slot:number) {
  const grid=slot<=32 ? CUSTOMER_SEARCH_PRESET_GRID : CUSTOMER_SEARCH_VIEWS_2_GRID;
  const index=(slot-1)%32,cell=grid[Math.floor(index/8)]?.[index%8];
  return cell && typeof cell === "object" ? cell.label : "";
}
type ViewsContext = {
  slot:number; select:(slot:number)=>void; views:CustomerSavedView[]; layout:CustomerViewLayout;
  setWidths:Dispatch<SetStateAction<CustomerViewLayout["widths"]>>; setLayout:Dispatch<SetStateAction<CustomerViewLayout>>; ready:boolean; busy:boolean; message:string; canRename:boolean;
  openSave:()=>void; openRename:()=>void; openDelete:()=>void; remove:()=>Promise<void>; retryLoad:()=>void; loadFailed:boolean;
};
const Context=createContext<ViewsContext|null>(null);
export const useCustomerSavedViews = ()=>useContext(Context);
export function CustomerSavedViewsProvider({children}:{children:ReactNode}) {
  const [slot,setSlot]=useState(1),[views,setViews]=useState<CustomerSavedView[]>([]);
  const [layout,setLayout]=useState(defaultCustomerViewLayout);
  const [sharedWidths,setWidths]=useState<CustomerViewLayout["widths"]>({});
  const [widthsReady,setWidthsReady]=useState(false);
  useEffect(()=>{
    try {
      const stored=JSON.parse(localStorage.getItem("customer-search-shared-widths") ?? "{}");
      const parsed=customerSavedViewSchema.shape.layout.shape.widths.safeParse(stored);
      if(parsed.success)setWidths(parsed.data);
    } catch { /* Keep defaults when browser storage is unavailable. */ }
    setWidthsReady(true);
  },[]);
  useEffect(()=>{
    if(!widthsReady)return;
    try { localStorage.setItem("customer-search-shared-widths",JSON.stringify(sharedWidths)); } catch { /* Session widths still work. */ }
  },[sharedWidths,widthsReady]);
  const effectiveLayout={...layout,widths:{...layout.widths,...sharedWidths}};
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [loadFailed,setLoadFailed]=useState(false),[loadAttempt,setLoadAttempt]=useState(0);
  const [name,setName]=useState(""),[error,setError]=useState(""),[dialogMode,setDialogMode]=useState<"save"|"rename">("save");
  const dialog=useRef<HTMLDialogElement>(null),deleteDialog=useRef<HTMLDialogElement>(null),saveSlot=useRef(1),snapshot=useRef(layout);
  useEffect(()=>{
    let active=true;
    fetch("/api/customers/saved-views",{cache:"no-store"}).then(async response=>{
      const data=await response.json(); if(!response.ok) throw new Error(data.error);
      const saved=(data.views as unknown[]).map(view=>normalizeCustomerSavedView(view));
      if(active){
        setViews(saved);
        // View 01 is active on first open, so load its saved columns as soon as
        // the database response arrives instead of leaving the default layout.
        setLayout(saved.find(view=>view.slot===1)?.layout ?? defaultCustomerPresetLayout());
        setLoadFailed(false);
        setReady(true);
      }
    }).catch(error=>{if(active){setLoadFailed(true);setMessage(error.message || "Saved views could not be loaded. Retry before saving.");}});
    return ()=>{active=false;};
  },[loadAttempt]);
  const retryLoad=()=>{setMessage("");setLoadFailed(false);setReady(false);setLoadAttempt(attempt=>attempt+1);};
  const presetLayout=(viewSlot:number)=>viewSlot===1 ? defaultCustomerPresetLayout() : viewSlot===2 ? customerInfoPresetLayout() : viewSlot===3 || viewSlot===4 ? blastEmailPresetLayout() : viewSlot===5 ? siteOfficeVisitPresetLayout() : viewSlot===6 ? coldDormantCallPresetLayout() : viewSlot===7 ? emailMailerPresetLayout() : viewSlot===8 ? viewEightPresetLayout() : viewSlot===9 ? ryanEamonBrianPresetLayout() : viewSlot===10 ? siobhanOnePresetLayout() : viewSlot===11 ? profileTypePresetLayout() : viewSlot===12 ? kickbacksPresetLayout() : viewSlot===13 ? viewThirteenPresetLayout() : viewSlot===14 ? viewFourteenPresetLayout() : viewSlot===15 ? viewFifteenPresetLayout() : viewSlot===16 ? viewSixteenPresetLayout() : viewSlot===17 ? selectProfilePresetLayout() : viewSlot===18 ? siobhanTwoPresetLayout() : isBlankGridCustomerViewSlot(viewSlot) ? viewNineteenPresetLayout() : viewSlot===23 ? testOneScreenPresetLayout() : viewSlot===24 ? testTwoScreenPresetLayout() : viewSlot===25 ? rtsPresetLayout() : viewSlot===26 ? siobhanTwoScreensPresetLayout() : viewSlot===27 ? salesPackagesPresetLayout() : viewSlot===28 ? callListTemplatePresetLayout() : viewSlot===31 ? viewThirtyOnePresetLayout() : viewSlot===32 ? viewThirtyTwoPresetLayout() : defaultCustomerViewLayout();
  const select=(next:number)=>{setSlot(next);setLayout(views.find(view=>view.slot===next)?.layout ?? presetLayout(next));setMessage("");};
  const openSave=()=>{setDialogMode("save");saveSlot.current=slot;snapshot.current=structuredClone(effectiveLayout);setName(views.find(view=>view.slot===slot)?.name ?? originalName(slot));setError("");dialog.current?.showModal();};
  const canRename=Boolean(views.some(view=>view.slot===slot)||presetButtonName(slot));
  const openRename=()=>{
    const saved=views.find(view=>view.slot===slot);
    const presetName=presetButtonName(slot);
    if(!saved&&!presetName)return;
    setDialogMode("rename");saveSlot.current=slot;
    snapshot.current=structuredClone(saved?.layout ?? presetLayout(slot));
    setName(saved?.name ?? presetName);setError("");dialog.current?.showModal();
  };
  async function save() {
    setBusy(true);setError("");
    try {
      const view=customerSavedViewSchema.parse({slot:saveSlot.current,name,layout:snapshot.current});
      const response=await fetch("/api/customers/saved-views",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(view)});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      const saved=customerSavedViewSchema.parse(data.view);
      const replacing=views.some(item=>item.slot===saved.slot);
      setViews(current=>[...current.filter(item=>item.slot!==saved.slot),saved]);
      setMessage(dialogMode==="rename"?`${saved.name} renamed.`:replacing?`${saved.name} updated in View ${String(saved.slot).padStart(2,"0")}.`:`${saved.name} saved to View ${String(saved.slot).padStart(2,"0")}.`);dialog.current?.close();
    }catch(error){setError(error instanceof Error ? error.message : "View could not be saved.");}finally{setBusy(false);}
  }
  const openDelete=()=>{if(views.some(view=>view.slot===slot))deleteDialog.current?.showModal();};
  async function remove() {
    const deleteSlot=slot,saved=views.find(view=>view.slot===deleteSlot);if(!saved)return;
    setBusy(true);
    try {
      const response=await fetch("/api/customers/saved-views",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({slot:deleteSlot})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setViews(current=>current.filter(view=>view.slot!==deleteSlot));setLayout(presetLayout(deleteSlot));setMessage("Saved view deleted.");deleteDialog.current?.close();
    }catch(error){setMessage(error instanceof Error ? error.message : "View could not be deleted.");}finally{setBusy(false);}
  }
  return <Context.Provider value={{slot,select,views,layout:effectiveLayout,setLayout,setWidths,ready,busy,message,canRename,openSave,openRename,openDelete,remove,retryLoad,loadFailed}}>
    {children}
    <dialog ref={dialog} className="ac-customer-saved-view-dialog" onCancel={event=>{if(busy)event.preventDefault();}}>
      <form onSubmit={event=>{event.preventDefault();void save();}}>
        <header><h2>{dialogMode==="rename"?"Rename View":views.some(view=>view.slot===saveSlot.current)?"Update View":"Save View"} {String(saveSlot.current).padStart(2,"0")}</h2></header>
        <div className="ac-customer-saved-view-body">
          <label>Button name<input autoFocus required maxLength={80} value={name} onChange={event=>setName(event.target.value)} /></label>
          <p>{dialogMode==="rename"?"Change this existing button’s name. Its current column layout will stay the same.":views.some(view=>view.slot===saveSlot.current)?"Replace this same view button’s saved columns, widths, hidden columns, sorting, and filters with the current layout.":"Save the current columns, widths, hidden columns, sorting, and filters to this existing view button."}</p>
          {error && <p role="alert">{error}</p>}
        </div>
        <footer><button className="ac-btn ac-btn-xs" type="submit" disabled={busy || !name.trim()}>{busy ? (dialogMode==="rename"?"Renaming…":views.some(view=>view.slot===saveSlot.current)?"Updating…":"Saving…") : (dialogMode==="rename"?"Rename":views.some(view=>view.slot===saveSlot.current)?"Update View":"Save View")}</button><button className="ac-btn ac-btn-xs" type="button" disabled={busy} onClick={()=>dialog.current?.close()}>Cancel</button></footer>
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
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openRename} disabled={!state.ready || state.busy || !state.canRename}>Rename View</button>
    <button type="button" data-action-status="complete" className="ac-btn ac-btn-xs" onClick={state.openDelete} disabled={!state.ready || state.busy || !state.views.some(view=>view.slot===state.slot)}>Delete View</button>
    {state.message && <span role={state.loadFailed?"alert":"status"} title={state.message} style={{position:"fixed",right:16,bottom:20,zIndex:1000,maxWidth:420,padding:"8px 12px",border:"1px solid #aaa",background:"#fff",color:"#111",fontSize:13}}>{state.message}{state.loadFailed&&<button type="button" className="ac-btn ac-btn-xs" onClick={state.retryLoad} style={{marginLeft:8}}>Retry</button>}</span>}</>;
}
export function useCustomerViewField<K extends keyof CustomerViewLayout>(key:K,initial:CustomerViewLayout[K],enabled:boolean):[CustomerViewLayout[K],Dispatch<SetStateAction<CustomerViewLayout[K]>>] {
  const context=useCustomerSavedViews();
  const [local,setLocal]=useState(initial);
  const setLayout=context?.setLayout;
  const setWidths=context?.setWidths;
  const setter=useCallback<Dispatch<SetStateAction<CustomerViewLayout[K]>>>(update=>{
    if(enabled && key === "widths" && setWidths) {
      setWidths(update as SetStateAction<CustomerViewLayout["widths"]>);
    }
    else if(enabled && setLayout)setLayout(current=>({...current,[key]:typeof update === "function" ? (update as (value:CustomerViewLayout[K])=>CustomerViewLayout[K])(current[key]) : update}));
    else setLocal(update);
  },[enabled,setLayout,setWidths,key]);
  return [enabled && context ? context.layout[key] : local,setter];
}
