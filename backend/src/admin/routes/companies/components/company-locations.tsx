import { useState } from "react"
import { Button, Input, Table, Text, usePrompt } from "@medusajs/ui"
import {
  AdminCompany,
  AdminLocation,
  LocationInput,
  useCreateLocation,
  useDeleteLocation,
  useUpdateLocation,
} from "../../../hooks/companies"

const EMPTY: LocationInput = {
  name: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
}

const FIELDS: { key: keyof LocationInput; label: string; required?: boolean }[] = [
  { key: "name", label: "Name", required: true },
  { key: "address_1", label: "Address", required: true },
  { key: "address_2", label: "Address 2" },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "zip", label: "ZIP", required: true },
  { key: "phone", label: "Phone" },
]

const LocationForm = ({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: LocationInput
  saving: boolean
  onSave: (values: LocationInput) => void
  onCancel: () => void
}) => {
  const [values, setValues] = useState<LocationInput>(initial)
  const valid = FIELDS.every(
    (field) => !field.required || String(values[field.key] ?? "").trim().length > 0
  )

  return (
    <div className="flex flex-col gap-2 px-6 py-4 border-t border-ui-border-base bg-ui-bg-subtle">
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            size="small"
            placeholder={field.required ? `${field.label} *` : field.label}
            value={(values[field.key] as string) ?? ""}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
            }
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="small" disabled={!valid || saving} isLoading={saving} onClick={() => onSave(values)}>
          Save
        </Button>
        <Button size="small" variant="secondary" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/*
  The Company's Locations (destination sites). Cardinal-managed only:
  buyers pick one at submit time as "where the order is sent", and a
  manager assigned to one sees only that site's orders and approvals.
*/
export const CompanyLocations = ({ company }: { company: AdminCompany }) => {
  const locations = company.locations ?? []
  const create = useCreateLocation(company.id)
  const update = useUpdateLocation(company.id)
  const remove = useDeleteLocation(company.id)
  const prompt = usePrompt()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AdminLocation | null>(null)

  const onDelete = async (location: AdminLocation) => {
    const ok = await prompt({
      title: "Remove location?",
      description: `Team members assigned to "${location.name}" will be unassigned and fall back to company-wide visibility.`,
      confirmText: "Remove",
    })
    if (ok) remove.mutate(location.id)
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between">
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus">Locations</Text>
          <Text size="xsmall" className="text-ui-fg-subtle">
            Destination sites — buyers pick one at submit time; managers assigned to one see only its orders.
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={() => {
            setEditing(null)
            setAdding(true)
          }}
        >
          Add location
        </Button>
      </div>
      {locations.length === 0 && !adding ? (
        <Text size="small" className="text-ui-fg-subtle px-6 py-4">
          No locations yet — orders go untagged and visibility follows roles alone.
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
              <Table.HeaderCell>Phone</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {locations.map((location) => (
              <Table.Row key={location.id}>
                <Table.Cell>{location.name}</Table.Cell>
                <Table.Cell>
                  {[location.address_1, location.address_2, location.city, location.state, location.zip]
                    .filter(Boolean)
                    .join(", ")}
                </Table.Cell>
                <Table.Cell>{location.phone || "—"}</Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setAdding(false)
                        setEditing(location)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      disabled={remove.isPending}
                      onClick={() => onDelete(location)}
                    >
                      Remove
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {adding && (
        <LocationForm
          initial={EMPTY}
          saving={create.isPending}
          onCancel={() => setAdding(false)}
          onSave={(values) =>
            create.mutate(values, { onSuccess: () => setAdding(false) })
          }
        />
      )}
      {editing && (
        <LocationForm
          key={editing.id}
          initial={{
            name: editing.name,
            address_1: editing.address_1,
            address_2: editing.address_2 ?? "",
            city: editing.city,
            state: editing.state,
            zip: editing.zip,
            phone: editing.phone ?? "",
          }}
          saving={update.isPending}
          onCancel={() => setEditing(null)}
          onSave={(values) =>
            update.mutate(
              { locationId: editing.id, ...values },
              { onSuccess: () => setEditing(null) }
            )
          }
        />
      )}
    </div>
  )
}
