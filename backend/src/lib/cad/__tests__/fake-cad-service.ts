// In-memory stand-in for CadRequestModuleService (unit tests only). Implements
// the filters the real service passes ($gte on created_at, arrays as $in).

type Row = Record<string, any>

function matches(row: Row, filters: Row): boolean {
  return Object.entries(filters).every(([k, v]) => {
    if (Array.isArray(v)) return v.includes(row[k])
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("$gte" in v) return new Date(row[k]).getTime() >= new Date(v.$gte).getTime()
      if ("$lte" in v) return new Date(row[k]).getTime() <= new Date(v.$lte).getTime()
    }
    return row[k] === v
  })
}

export class FakeCadService {
  requests: Row[] = []
  packages: Row[] = []
  settings: Row = {id: "cadset_1", daily_generation_cap: 10, require_review: true, updated_by: null}
  private seq = 0
  createPackageCalls = 0

  addRequest(r: Row) {
    const row = {id: `cadr_${++this.seq}`, counted: true, status: "pending", created_at: new Date(), ...r}
    this.requests.push(row)
    return row
  }
  addPackage(p: Row) {
    const row = {id: `cadpkg_${++this.seq}`, status: "ready", counted_against_cap: false, cap_day: null, ...p}
    this.packages.push(row)
    return row
  }

  async getSettings() {
    return this.settings as any
  }
  async countEmailRequests(email: string, since: Date) {
    return this.requests.filter((r) => matches(r, {email, counted: true, created_at: {$gte: since}})).length
  }
  async countIpRequests(ip: string, since: Date) {
    return this.requests.filter((r) =>
      matches(r, {client_ip: ip, counted: true, ip_source: ["forwarded", "cf"], created_at: {$gte: since}}),
    ).length
  }
  async countCapGenerations(capDay: string) {
    return this.packages.filter((p) => p.counted_against_cap === true && p.cap_day === capDay).length
  }
  async everGenerated(partNumber: string) {
    return this.packages.some((p) => p.part_number === partNumber && p.status === "ready")
  }
  async findPackageByCacheKey(cacheKey: string) {
    return (this.packages.find((p) => p.cache_key === cacheKey) as any) ?? null
  }
  async findReadyPackage(cacheKey: string) {
    const p = await this.findPackageByCacheKey(cacheKey)
    return p && p.status === "ready" ? p : null
  }
  async createCadPackages(data: Row) {
    this.createPackageCalls++
    if (this.packages.some((p) => p.cache_key === data.cache_key)) {
      throw new Error("duplicate key value violates unique constraint")
    }
    return this.addPackage({status: "generating", ...data}) as any
  }
  async updateCadPackages(data: Row) {
    const row = this.packages.find((p) => p.id === data.id)
    if (!row) throw new Error("not found")
    Object.assign(row, data)
    return {...row} as any
  }
}
