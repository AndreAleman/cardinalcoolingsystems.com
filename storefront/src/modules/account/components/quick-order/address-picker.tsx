"use client"

/*
  Address picker for the order review drawer (ported from
  accurateforklift.net). Two modes:
    - "saved" → pick from customer.addresses[] via a native <select>
    - "new"   → inline one-off address form with an optional
                "Save this address for future orders" checkbox

  When the Company has sites ("Locations"), the Ship-to variant lists
  them FIRST — picking one ships the order to that site and records
  which site it was (location_id rides the submission).

  Output shape:
    { kind: "location", id }  ← a Company site
    | { kind: "saved", id }
    | { kind: "new", address: {…}, save: boolean }
    | null  ← nothing chosen yet
*/

import { Input } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import type { CompanyLocation } from "@lib/data/dashboard"

export type AddressPickerValue =
  | { kind: "location"; id: string }
  | { kind: "saved"; id: string }
  | {
      kind: "new"
      address: {
        first_name?: string
        last_name?: string
        company?: string
        address_1: string
        address_2?: string
        city: string
        postal_code: string
        province?: string
        country_code: string
        phone?: string
      }
      save: boolean
    }
  | null

type Props = {
  label: string
  addresses: HttpTypes.StoreCustomerAddress[]
  /* Company sites, listed first in the select (Ship-to only). */
  locations?: CompanyLocation[]
  value: AddressPickerValue
  onChange: (next: AddressPickerValue) => void
  disabled?: boolean
  hidden?: boolean
  countryCode: string
}

const ADD_NEW = "__add_new__"
const LOCATION_PREFIX = "__loc__:"

function summarizeLocation(l: CompanyLocation): string {
  return `🏭 ${l.name} — ${l.city}`
}

function summarize(a: HttpTypes.StoreCustomerAddress): string {
  const parts = [
    (a as any).address_name,
    a.company,
    a.address_1,
    a.city && a.province ? `${a.city}, ${a.province}` : a.city,
    a.postal_code,
  ]
  return parts.filter(Boolean).join(" · ")
}

export default function AddressPicker({
  label,
  addresses,
  locations = [],
  value,
  onChange,
  disabled,
  hidden,
  countryCode,
}: Props) {
  if (hidden) return null

  const isNewMode = value?.kind === "new"
  const newAddress = isNewMode
    ? value.address
    : {
        address_1: "",
        city: "",
        postal_code: "",
        country_code: countryCode,
      }
  const saveFlag = isNewMode ? value.save : false

  const setNewAddressField = (field: string, next: string) => {
    const updated = { ...newAddress, [field]: next }
    onChange({ kind: "new", address: updated as any, save: saveFlag })
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[15px] font-semibold text-neutral-700">
        {label}
      </label>

      <select
        className="rounded border border-neutral-300 bg-white px-3 h-12 text-[16px] focus:outline-none focus:ring-2 focus:ring-neutral-300"
        value={
          value?.kind === "location"
            ? `${LOCATION_PREFIX}${value.id}`
            : value?.kind === "saved"
            ? value.id
            : value?.kind === "new"
            ? ADD_NEW
            : ""
        }
        onChange={(e) => {
          const v = e.target.value
          if (v === "") {
            onChange(null)
          } else if (v === ADD_NEW) {
            onChange({ kind: "new", address: newAddress as any, save: saveFlag })
          } else if (v.startsWith(LOCATION_PREFIX)) {
            onChange({ kind: "location", id: v.slice(LOCATION_PREFIX.length) })
          } else {
            onChange({ kind: "saved", id: v })
          }
        }}
        disabled={disabled}
      >
        <option value="">
          {locations.length > 0
            ? "Choose where to ship…"
            : addresses.length === 0
            ? "No saved addresses yet"
            : "Choose a saved address…"}
        </option>
        {locations.map((l) => (
          <option key={l.id} value={`${LOCATION_PREFIX}${l.id}`}>
            {summarizeLocation(l)}
          </option>
        ))}
        {addresses.map((a) => (
          <option key={a.id} value={a.id}>
            {summarize(a)}
          </option>
        ))}
        <option value={ADD_NEW}>+ Enter a new address</option>
      </select>

      {value?.kind === "location" &&
        (() => {
          const site = locations.find((l) => l.id === value.id)
          if (!site) return null
          return (
            <p className="text-[14px] text-neutral-600 m-0">
              Ships to {site.name}: {site.address_1}
              {site.address_2 ? `, ${site.address_2}` : ""}, {site.city},{" "}
              {site.state} {site.zip}
            </p>
          )
        })()}

      {isNewMode && (
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3 grid grid-cols-2 gap-2">
          <Input
            placeholder="First name"
            value={newAddress.first_name ?? ""}
            onChange={(e) => setNewAddressField("first_name", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Last name"
            value={newAddress.last_name ?? ""}
            onChange={(e) => setNewAddressField("last_name", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Company (optional)"
            className="col-span-2"
            value={newAddress.company ?? ""}
            onChange={(e) => setNewAddressField("company", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Address line 1"
            className="col-span-2"
            value={newAddress.address_1}
            onChange={(e) => setNewAddressField("address_1", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Address line 2 (optional)"
            className="col-span-2"
            value={newAddress.address_2 ?? ""}
            onChange={(e) => setNewAddressField("address_2", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="City"
            value={newAddress.city}
            onChange={(e) => setNewAddressField("city", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="State"
            value={newAddress.province ?? ""}
            onChange={(e) => setNewAddressField("province", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="ZIP / Postal code"
            value={newAddress.postal_code}
            onChange={(e) => setNewAddressField("postal_code", e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Phone (optional)"
            value={newAddress.phone ?? ""}
            onChange={(e) => setNewAddressField("phone", e.target.value)}
            disabled={disabled}
          />
          <label className="col-span-2 flex items-center gap-2 text-[15px] text-neutral-700 mt-1">
            <input
              type="checkbox"
              checked={saveFlag}
              onChange={(e) =>
                onChange({
                  kind: "new",
                  address: newAddress as any,
                  save: e.target.checked,
                })
              }
              disabled={disabled}
              className="rounded border-neutral-300 h-5 w-5"
            />
            Save this address for future orders
          </label>
        </div>
      )}
    </div>
  )
}
