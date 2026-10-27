import { CUSTOMER_NAME_SEARCH_COLUMNS, type CustomerNameMatch } from "./customerNameSearchColumns";

const keys = ["customerId", "lastCallDate", "hasAssignment", "hasSignedContract", ...CUSTOMER_NAME_SEARCH_COLUMNS.map(column => column.key)] as const;
type Cell = string | boolean;
type PackedCustomers = { values: Cell[][]; rows: number[][] };

// Dictionary encoding removes repeated field names and repeated cell values from
// the React server payload. Every row and every full note is retained.
export function packCustomers(customers: CustomerNameMatch[]): string {
  const values: Cell[][] = keys.map(() => []);
  const dictionaries = keys.map(() => new Map<Cell, number>());
  const rows = customers.map(customer => keys.map((key, column) => {
    const value = customer[key];
    let index = dictionaries[column].get(value);
    if (index === undefined) {
      index = values[column].length;
      dictionaries[column].set(value, index);
      values[column].push(value);
    }
    return index;
  }));
  return JSON.stringify({ values, rows } satisfies PackedCustomers);
}

export function unpackCustomers(payload: string): CustomerNameMatch[] {
  const { values, rows } = JSON.parse(payload) as PackedCustomers;
  return rows.map(row => Object.fromEntries(keys.map((key, column) => [key, values[column][row[column]]])) as CustomerNameMatch);
}
