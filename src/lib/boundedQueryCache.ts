/** Bounded, expiring process-memory storage for explicitly selected query results. */
export class BoundedQueryCache {
  private entries = new Map<string, { value: unknown; size: number; expires: number }>();
  private pending = new Map<string, Promise<unknown>>();
  private bytes = 0;
  private generation = 0;
  constructor(private maxBytes = 32 * 1024 * 1024, private ttl = 120_000, private maxEntries = 64) {}
  clear() { this.generation++; this.entries.clear(); this.pending.clear(); this.bytes = 0; }
  version() { return this.generation; }
  async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const now = Date.now();
    for (const [name, entry] of this.entries) if (entry.expires <= now) { this.bytes -= entry.size; this.entries.delete(name); }
    const entry = this.entries.get(key);
    if (entry) { this.entries.delete(key); this.entries.set(key, entry); return entry.value as T; }
    if (this.pending.has(key)) return this.pending.get(key) as Promise<T>;
    const generation = this.generation;
    const request = Promise.resolve().then(loader).then(value => {
      const size = Buffer.byteLength(JSON.stringify(value), "utf8") * 3;
      if (generation === this.generation && size <= this.maxBytes) {
        while (this.entries.size && (this.bytes + size > this.maxBytes || this.entries.size >= this.maxEntries)) {
          const oldest = this.entries.keys().next().value!;
          this.bytes -= this.entries.get(oldest)!.size; this.entries.delete(oldest);
        }
        this.entries.set(key, { value, size, expires: Date.now() + this.ttl }); this.bytes += size;
      }
      return value;
    }).finally(() => { if (this.pending.get(key) === request) this.pending.delete(key); });
    this.pending.set(key, request);
    return request;
  }
}

export const employeeQuickSearchCache = new BoundedQueryCache();
