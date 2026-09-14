import type { TrackingPreviewRow } from "@/types/tracking";
export const trackingDays = ["satHours", "sunHours", "monHours", "tueHours", "wedHours", "thuHours", "friHours"] as const;
const numericFields = new Set<keyof TrackingPreviewRow>([...trackingDays,"payRate","billRate","billRateOT","totalHours","trackMargin","perDiem","parkingPerHr","oh"]);
export function trackingNumber(value: string): number | null { const cleaned=value.replace(/[$,%\s]/g,""); if(!cleaned)return null; const result=Number(cleaned); return Number.isFinite(result)?result:null; }
export function dailyTotal(row: TrackingPreviewRow) { return trackingDays.reduce((sum,key)=>sum+(trackingNumber(row[key])??0),0); }
export function filterTrackingRows(rows: TrackingPreviewRow[],query:string,employeeId="") {
  const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean),digits=query.replace(/\D/g,"");
  return rows.map((row,index)=>({row,index})).filter(({row})=>{ if(employeeId&&row.employeeId!==employeeId)return false; const text=Object.values(row).filter(v=>typeof v === "string").join(" ").toLowerCase(); return terms.every(term=>text.includes(term)) || (!!digits && /^[\d\s()+.-]+$/.test(query) && row.cell.replace(/\D/g,"").includes(digits)); });
}
export function compareTrackingRows(a:TrackingPreviewRow,b:TrackingPreviewRow,key:keyof TrackingPreviewRow,direction:"asc"|"desc") {
  let comparison:number; if(numericFields.has(key)){const left=trackingNumber(String(a[key])),right=trackingNumber(String(b[key])); if(left===null||right===null)return left===right?0:left===null?1:-1; comparison=left-right;}else comparison=String(a[key]).localeCompare(String(b[key]),undefined,{numeric:true,sensitivity:"base"}); return direction==="asc"?comparison:-comparison;
}
export function trackingCsv(headers:string[],records:unknown[][]) { return [headers,...records].map(record=>record.map(value=>{const text=String(value??"");const safe=/^\s*[=+@-]/.test(text)?"'"+text:text;return '"'+safe.replaceAll('"','""')+'"';}).join(",")).join("\r\n"); }
