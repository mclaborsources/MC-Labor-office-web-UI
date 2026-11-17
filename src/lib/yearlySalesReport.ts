import {getWeeklySalesRows} from "@/lib/weeklySalesReport";
import {yearlySalesPeople} from "./yearlySalesReportColumns";
type SalesPersonKey = typeof yearlySalesPeople[number][1];
export type YearlySalesRow = {id:string;year:number;weeks:number;totalSales:number;perDiem:number;subSales:number;employeeSales:number;adjustedAfter20:number} & Record<`${SalesPersonKey}${"Before"|"After"}`,number|null>;
export async function getYearlySalesRows(criteria:Record<string,string|undefined>){
 const weekly=await getWeeklySalesRows(criteria);
 const groups=new Map<number,YearlySalesRow>();
 for(const row of weekly){let year=groups.get(row.year);if(!year){year={id:String(row.year),year:row.year,weeks:0,totalSales:0,perDiem:0,subSales:0,employeeSales:0,adjustedAfter20:0,...Object.fromEntries(yearlySalesPeople.flatMap(([,key])=>[`${key}Before`,`${key}After`].map(k=>[k,null])))} as YearlySalesRow;groups.set(row.year,year);}
 year.weeks++;
 for(const key of ["totalSales","perDiem","subSales","employeeSales","adjustedAfter20"] as const)year[key]+=row[key];
 for(const [,person] of yearlySalesPeople)for(const suffix of ["Before","After"] as const){const key=`${person}${suffix}` as const;const value=row[key];if(value!=null)year[key]=(year[key]??0)+value;}
 }
 return [...groups.values()].sort((a,b)=>a.year-b.year);
}
