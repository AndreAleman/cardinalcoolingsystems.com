"use client"

import { useRef, useState } from "react"
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_FILES,
  MAX_ATTACHMENTS_TOTAL_BYTES,
  totalAttachmentBytes,
} from "@lib/util/attachments"

type Props = {
  files: File[]
  onChange: (files: File[]) => void
  label?: string
  labelClassName?: string
  disabled?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function AttachmentInput({
  files,
  onChange,
  label = "Attachments",
  labelClassName = "block text-xs text-gray-500 mb-1.5",
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return
    setError(null)

    const merged = [...files]
    for (const file of Array.from(incoming)) {
      if (!merged.some((f) => f.name === file.name && f.size === file.size)) {
        merged.push(file)
      }
    }

    if (merged.length > MAX_ATTACHMENT_FILES) {
      setError(`You can attach up to ${MAX_ATTACHMENT_FILES} files.`)
      return
    }
    if (totalAttachmentBytes(merged) > MAX_ATTACHMENTS_TOTAL_BYTES) {
      setError("Attachments can't exceed 10MB in total.")
      return
    }

    onChange(merged)
  }

  const removeFile = (index: number) => {
    setError(null)
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className={labelClassName}>
        {label}{" "}
        <span className="normal-case font-light tracking-normal" style={{ color: "#9ca3af" }}>
          (optional)
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_ATTACHMENT_TYPES}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          addFiles(e.target.files)
          // Allow re-selecting the same file after removing it
          e.target.value = ""
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: "5px",
          color: "#6b7280",
          backgroundColor: "transparent",
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
          />
        </svg>
        Attach files
        <span className="text-xs" style={{ color: "#9ca3af" }}>
          (up to {MAX_ATTACHMENT_FILES}, 10MB total)
        </span>
      </button>

      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                color: "#374151",
              }}
            >
              <span className="truncate min-w-0">
                {file.name}{" "}
                <span className="text-xs" style={{ color: "#9ca3af" }}>
                  ({formatBytes(file.size)})
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-gray-200"
                style={{ color: "#9ca3af" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  )
}
