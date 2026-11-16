// Private storage for CAD Package files. Only the backend reads or writes it; files are streamed to
// the browser through the token routes (and the admin review route), never served from a public URL.
//
// Driver chosen once per process:
// - MinIO when MINIO_ENDPOINT, MINIO_ACCESS_KEY and MINIO_SECRET_KEY are set (the same env and
//   port 443/SSL as modules/minio-file). Private bucket CAD_MINIO_BUCKET (default "cad-packages"),
//   created lazily WITHOUT a public policy (the medusa-media bucket is public-read).
// - Otherwise the filesystem: CAD_CACHE_DIR, default <cwd>/.cad-cache (git-ignored).

import fs from "node:fs"
import path from "node:path"
import {Readable} from "node:stream"
import {Client} from "minio"

export interface CadStore {
  readonly driver: "minio" | "fs"
  put(key: string, bytes: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<Readable>
  exists(key: string): Promise<boolean>
}

export const CAD_DEFAULT_BUCKET = "cad-packages"
const KEY_RE = /^cad\/[A-Za-z0-9-]{1,80}\/[A-Za-z0-9.-]{1,80}$/

function assertKey(key: string) {
  if (!KEY_RE.test(key) || key.includes("..")) {
    throw new Error(`Invalid CAD object key: ${key}`)
  }
}

export function createFsCadStore(root: string): CadStore {
  const abs = path.resolve(root)
  const file = (key: string) => {
    assertKey(key)
    return path.join(abs, ...key.split("/"))
  }
  return {
    driver: "fs",
    async put(key, bytes) {
      const target = file(key)
      await fs.promises.mkdir(path.dirname(target), {recursive: true})
      const tmp = `${target}.${process.pid}.${Date.now()}.tmp`
      await fs.promises.writeFile(tmp, bytes)
      await fs.promises.rename(tmp, target)
    },
    async get(key) {
      const target = file(key)
      await fs.promises.access(target)
      return fs.createReadStream(target)
    },
    async exists(key) {
      try {
        await fs.promises.access(file(key))
        return true
      } catch {
        return false
      }
    },
  }
}

export function createMinioCadStore(opts: {
  endPoint: string
  accessKey: string
  secretKey: string
  bucket?: string
}): CadStore {
  const bucket = opts.bucket || CAD_DEFAULT_BUCKET
  const client = new Client({
    endPoint: opts.endPoint,
    port: 443,
    useSSL: true,
    accessKey: opts.accessKey,
    secretKey: opts.secretKey,
  })
  let ready: Promise<void> | null = null
  const ensureBucket = () => {
    if (!ready) {
      ready = (async () => {
        if (!(await client.bucketExists(bucket))) {
          // Private: no bucket policy is ever set (unlike medusa-media).
          await client.makeBucket(bucket)
        }
      })().catch((e) => {
        ready = null
        throw e
      })
    }
    return ready
  }
  return {
    driver: "minio",
    async put(key, bytes, contentType) {
      assertKey(key)
      await ensureBucket()
      await client.putObject(bucket, key, bytes, bytes.length, {"Content-Type": contentType})
    },
    async get(key) {
      assertKey(key)
      await ensureBucket()
      return (await client.getObject(bucket, key)) as unknown as Readable
    },
    async exists(key) {
      assertKey(key)
      await ensureBucket()
      try {
        await client.statObject(bucket, key)
        return true
      } catch {
        return false
      }
    },
  }
}

let store: CadStore | null = null

export function getCadStore(): CadStore {
  if (store) return store
  const {MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY} = process.env
  store =
    MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY
      ? createMinioCadStore({
          endPoint: MINIO_ENDPOINT,
          accessKey: MINIO_ACCESS_KEY,
          secretKey: MINIO_SECRET_KEY,
          bucket: process.env.CAD_MINIO_BUCKET,
        })
      : createFsCadStore(process.env.CAD_CACHE_DIR || path.join(process.cwd(), ".cad-cache"))
  return store
}

/** Tests only. */
export function setCadStoreForTests(s: CadStore | null) {
  store = s
}
