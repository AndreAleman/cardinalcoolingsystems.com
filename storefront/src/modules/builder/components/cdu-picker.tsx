"use client"

// The CDU kit's first question: one select for "my CDU" (a known model pre-fills its port, B13) or,
// when the CDU isn't listed, the port size itself. Value and change mapping: lib/primary-fields.ts.

import type { Field } from "@lib/builder/fields"
import type { Options, OptionValue } from "@lib/cpq/shared"
import { cduPickerChange, cduPickerGroups, cduPickerValue } from "@modules/builder/lib/primary-fields"

const labelCls = "block text-xs font-semibold uppercase tracking-wide text-neutral-600"
const inputCls =
  "mt-1.5 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"

export default function CduPicker({
  fields,
  options,
  onChange,
  error,
}: {
  fields: Field[]
  options: Options
  onChange: (key: string, value: OptionValue) => void
  error: { key: string; message: string } | null
}) {
  const groups = cduPickerGroups(fields)
  const err = error && (error.key === "cdu" || error.key === "port") ? error.message : null
  return (
    <div className="col-span-2 min-w-0" data-testid="field-cdu-picker">
      <label htmlFor="opt-cdu-picker" className={labelCls}>
        Your CDU or its port
      </label>
      <select
        id="opt-cdu-picker"
        className={inputCls}
        value={cduPickerValue(options)}
        onChange={(e) => {
          const c = cduPickerChange(e.target.value)
          if (c) onChange(c.key, c.value)
        }}
      >
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.choices.map((c) => (
              <option key={String(c.value)} value={String(c.value)}>
                {c.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {err ? (
        <p className="mt-1 text-xs font-medium text-cardinal-red" role="alert" data-testid="field-error">
          {err}
        </p>
      ) : null}
    </div>
  )
}
