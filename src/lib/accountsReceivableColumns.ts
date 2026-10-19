import type { AccountsReceivableRow } from "./accountsReceivable";

export const arColumns: { label: string; key: keyof AccountsReceivableRow; money?: boolean }[] = [
  { label: "Customer", key: "customer" }, { label: "Credit", key: "credit" },
  { label: "Cust Since", key: "customerSince" }, { label: "State", key: "state" },
  { label: "Co", key: "company" }, { label: "Legal Status", key: "legalStatus" },
  { label: "Last Action", key: "lastAction" }, { label: "Next Action", key: "nextAction" },
  { label: "Small", key: "smallClaims" }, { label: "Salesman", key: "salesman" },
  { label: "Terms", key: "terms" }, { label: "Aging", key: "aging" },
  { label: "Inv G", key: "invoiceGroup" }, { label: "Age", key: "age" },
  { label: "Total Owed", key: "totalOwed", money: true },
  { label: "Under 30", key: "under30", money: true },
  { label: "Over 30", key: "over30", money: true },
  { label: "Over 60", key: "over60", money: true },
  { label: "Over 90", key: "over90", money: true },
  { label: "Over 120", key: "over120", money: true },
  { label: "History", key: "history" }, { label: "Last AR Email", key: "lastArEmail" },
  { label: "Last Invoice", key: "lastInvoice" },
];

export function arCell(row: Partial<AccountsReceivableRow>, column: typeof arColumns[number]) {
  const value = row[column.key];
  if (value === null || value === undefined || value === "") return "";
  return column.money ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value)) : String(value);
}
