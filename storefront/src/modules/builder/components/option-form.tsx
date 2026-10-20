"use client"

// The configurator form: one control per canonical option key (lib/builder/fields.ts), in the
// spec's input order. Number inputs commit on blur / Enter so typing "120" doesn't resolve 1, 12.

import type { Options, OptionValue } from "@lib/cpq/shared"
import type { Field } from "@lib/builder/fields"
import { clx } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Props = {
  fields: Field[]
  options: Options
  onChange: (key: string, value: OptionValue) => void
  error: { key: string; message: string } | null
  /** Keys rendered disabled with a note (e.g. a CDU model fixes its port). */
  locked?: Record<string, string>
  /**
   * "grid": two columns, selects and numbers side by side, button groups and checks full width
   * (the primary questions, so they fit one phone screen). "stack" (default): one per row.
   */
  layout?: "stack" | "grid"
  testId?: string
}

/** Controls that read fine at half width. */
const HALF = new Set<Field["control"]>(["select", "number"])

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-neutral-600"
const helpCls = "mt-1 text-xs text-neutral-500"
const inputCls =
  "mt-1.5 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"

export default function OptionForm({ fields, options, onChange, error, locked = {}, layout = "stack", testId = "builder-form" }: Props) {
  const grid = layout === "grid"
  return (
    <div className={grid ? "grid grid-cols-2 gap-x-3 gap-y-4" : "flex flex-col gap-5"} data-testid={testId}>
      {fields.map((f) => (
        <div key={f.key} data-testid={`field-${f.key}`} className={clx("min-w-0", grid && !HALF.has(f.control) && "col-span-2")}>
          <FieldControl field={f} value={options[f.key]} onChange={onChange} lockedNote={locked[f.key]} />
          {f.help ? <p className={helpCls}>{f.help}</p> : null}
          {error?.key === f.key ? (
            <p className="mt-1 text-xs font-medium text-cardinal-red" role="alert" data-testid="field-error">
              {error.message}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function FieldControl({
  field: f,
  value,
  onChange,
  lockedNote,
}: {
  field: Field
  value: OptionValue | undefined
  onChange: (key: string, value: OptionValue) => void
  lockedNote?: string
}) {
  const id = `opt-${f.key}`
  switch (f.control) {
    case "select":
      return (
        <>
          <label htmlFor={id} className={labelCls}>
            {f.label}
          </label>
          <select
            id={id}
            className={inputCls}
            value={String(value)}
            disabled={!!lockedNote}
            onChange={(e) => {
              const c = f.choices.find((x) => String(x.value) === e.target.value)
              if (c) onChange(f.key, c.value)
            }}
          >
            {f.choices.map((c) => (
              <option key={String(c.value)} value={String(c.value)}>
                {c.label}
              </option>
            ))}
          </select>
          {lockedNote ? <p className={helpCls}>{lockedNote}</p> : null}
        </>
      )
    case "segmented":
      return (
        <fieldset>
          <legend className={labelCls}>{f.label}</legend>
          <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup">
            {f.choices.map((c) => {
              const on = String(c.value) === String(value)
              return (
                <button
                  key={String(c.value)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange(f.key, c.value)}
                  className={clx(
                    "min-h-[44px] border px-3 py-2 text-left text-sm transition-colors",
                    on
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500",
                  )}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      )
    case "toggle": {
      const on = String(value) === "1"
      return (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-[#D72638]"
            checked={on}
            onChange={(e) => onChange(f.key, e.target.checked ? "1" : "0")}
          />
          <span>
            <span className={labelCls}>{f.label}</span>
            <span className="block text-sm text-neutral-800">{on ? f.on : f.off}</span>
          </span>
        </label>
      )
    }
    case "checks": {
      const list = Array.isArray(value) ? value.map(String) : []
      return (
        <fieldset>
          <legend className={labelCls}>{f.label}</legend>
          <div className="mt-1.5 flex flex-col gap-2">
            {f.choices.map((c) => {
              const v = String(c.value)
              const on = list.indexOf(v) >= 0
              return (
                <label key={v} className="flex cursor-pointer items-center gap-3 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#D72638]"
                    checked={on}
                    onChange={(e) =>
                      onChange(f.key, e.target.checked ? [...list, v] : list.filter((x) => x !== v))
                    }
                  />
                  {c.label}
                </label>
              )
            })}
          </div>
        </fieldset>
      )
    }
    case "number":
      return <NumberField field={f} value={Number(value)} onChange={onChange} id={id} />
  }
}

function NumberField({
  field: f,
  value,
  onChange,
  id,
}: {
  field: Extract<Field, { control: "number" }>
  value: number
  onChange: (key: string, value: OptionValue) => void
  id: string
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const n = Number(draft.replace(/["\s]|in$/gi, ""))
    if (!Number.isFinite(n) || draft.trim() === "") {
      setDraft(String(value))
      return
    }
    const snapped = f.step < 1 ? Math.round(n / f.step) * f.step : Math.round(n)
    const clamped = Math.min(f.max, Math.max(f.min, snapped))
    setDraft(String(clamped))
    if (clamped !== value) onChange(f.key, clamped)
  }

  return (
    <>
      <label htmlFor={id} className={labelCls}>
        {f.label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode={f.step < 1 ? "decimal" : "numeric"}
          min={f.min}
          max={f.max}
          step={f.step}
          className={clx(inputCls, f.suffix && "pr-14")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commit()
            }
          }}
        />
        {f.suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-xs text-neutral-500">
            {f.suffix}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-neutral-400">
        {f.min}–{f.max}
      </p>
    </>
  )
}
