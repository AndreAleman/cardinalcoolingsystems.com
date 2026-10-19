// Download links for a CAD package, always through the same-origin proxy (/api/cad/:token/:kind).

import { cadFileLabel, cadFileUrl, formatFileSize, sortCadFiles } from "@lib/builder/cad"
import type { CadFile } from "@lib/builder/types"

export default function CadFileLinks({ token, files, disabled = false }: { token: string; files: CadFile[]; disabled?: boolean }) {
  const list = sortCadFiles(files)
  if (!list.length) return null
  return (
    <ul className="flex flex-wrap gap-2" aria-label="CAD files">
      {list.map((f) => {
        const size = formatFileSize(f.bytes)
        const label = (
          <>
            <span>Download {cadFileLabel(f.kind)}</span>
            {size ? <span className="text-xs opacity-75">· {size}</span> : null}
          </>
        )
        return (
          <li key={f.kind}>
            {disabled ? (
              <span aria-disabled className="inline-flex cursor-not-allowed items-center gap-1.5 border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm text-neutral-500">
                {label}
              </span>
            ) : (
              <a
                href={cadFileUrl(token, f.kind)}
                download
                rel="nofollow"
                className="inline-flex items-center gap-1.5 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                data-testid={`cad-download-${f.kind}`}
              >
                {label}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
