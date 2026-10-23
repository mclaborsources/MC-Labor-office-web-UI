import { z } from "zod";
import { CUSTOMER_NAME_SEARCH_COLUMNS, type CustomerNameColumnKey } from "./customerNameSearchColumns";
const keys = new Set<string>(CUSTOMER_NAME_SEARCH_COLUMNS.map(column => column.key));
const columnKey = z.custom<CustomerNameColumnKey>(value => typeof value === "string" && keys.has(value));
export const customerViewLayoutSchema = z.object({
  order: z.array(columnKey).max(keys.size).refine(order => order.length === keys.size && new Set(order).size === keys.size, "Every column must appear once."),
  hidden: z.array(columnKey).max(keys.size - 1),
  widths: z.record(columnKey, z.number().int().min(48).max(1600)),
  filters: z.record(columnKey, z.array(z.string().max(5000)).max(20000)),
  sort: z.object({key:columnKey, direction:z.enum(["asc","desc"])}).nullable(),
});
export type CustomerViewLayout = z.infer<typeof customerViewLayoutSchema>;
export const customerSavedViewSchema = z.object({slot:z.number().int().min(1).max(64),name:z.string().trim().min(1).max(80),layout:customerViewLayoutSchema});
export type CustomerSavedView = z.infer<typeof customerSavedViewSchema>;
export function defaultCustomerViewLayout(): CustomerViewLayout {
  return {order:CUSTOMER_NAME_SEARCH_COLUMNS.map(column=>column.key),hidden:[],widths:{},filters:{},sort:null};
}
