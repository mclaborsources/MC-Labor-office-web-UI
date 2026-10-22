/** In-memory data shared across route mounts, with no timed expiry. */
export class BrowserSessionCache {
  private scope = "";
  private entries = new Map<string, Promise<unknown>>();

  get<T>(scope: string, key: string, load: () => Promise<T>): Promise<T> {
    if (this.scope !== scope) { this.entries.clear(); this.scope = scope; }
    const existing = this.entries.get(key);
    if (existing) return existing as Promise<T>;
    const request = Promise.resolve().then(load).catch(error => {
      if (this.entries.get(key) === request) this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, request);
    return request;
  }

  clear() { this.entries.clear(); }
}
