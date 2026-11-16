// 60 s in-memory cache of resolve results, keyed by config_key + price basis + Customer Group.

export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>()
  constructor(private ttlMs: number, private max = 1000, private now: () => number = Date.now) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key)
    if (!hit) return undefined
    if (hit.expires <= this.now()) {
      this.map.delete(key)
      return undefined
    }
    return hit.value
  }

  set(key: string, value: V): void {
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
    this.map.set(key, { value, expires: this.now() + this.ttlMs })
  }

  clear(): void {
    this.map.clear()
  }
}

export const RESOLVE_CACHE_TTL_MS = 60_000

export function resolveCacheKey(configKey: string, basis: string, customerGroupId: string | null): string {
  return `${configKey}|${basis}|${customerGroupId ?? ""}`
}
