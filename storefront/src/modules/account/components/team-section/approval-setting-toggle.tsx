"use client"

/*
  The Company's Approval Setting (CONTEXT.md): "orders from members need
  admin approval." Rendered in the Team section for role `admin` only;
  the backend enforces the role on write.
*/

import { useState, useTransition } from "react"
import { toast } from "@medusajs/ui"
import { setApprovalSettings } from "@lib/data/dashboard"

type Props = {
  initialValue: boolean
}

const ApprovalSettingToggle = ({ initialValue }: Props) => {
  const [enabled, setEnabled] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        await setApprovalSettings(next)
      } catch (err: any) {
        setEnabled(!next)
        toast.error(err?.message ?? "Could not update the approval setting.")
      }
    })
  }

  return (
    <label
      className="flex items-center justify-between gap-4 rounded border border-neutral-200 bg-neutral-50 px-4 py-3"
      data-testid="approval-setting-toggle"
    >
      <span className="text-[16px] text-neutral-700">
        Orders from members need admin approval
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={toggle}
        disabled={isPending}
        className="h-6 w-6 rounded border-neutral-300 accent-green-600"
        aria-label="Require admin approval for member orders"
      />
    </label>
  )
}

export default ApprovalSettingToggle
