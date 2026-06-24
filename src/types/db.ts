export interface DbHealthResult {
  ok: boolean;
  database?: string;
  error?: string;
}

export type QueryParam = {
  name: string;
  value: unknown;
};
