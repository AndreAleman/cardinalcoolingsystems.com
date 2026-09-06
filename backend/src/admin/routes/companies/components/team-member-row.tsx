import { Button, Select, Table, usePrompt } from "@medusajs/ui"
import {
  AdminLocation,
  AdminTeamMember,
  TeamMemberRole,
  useRemoveTeamMember,
  useUpdateTeamMember,
} from "../../../hooks/companies"

const ROLES: TeamMemberRole[] = ["member", "manager", "admin"]
const NO_LOCATION = "no-location"

/* One Team Member: name, email, Role picker, home-site picker, Remove. */
export const TeamMemberRow = ({
  companyId,
  member,
  locations = [],
}: {
  companyId: string
  member: AdminTeamMember
  locations?: AdminLocation[]
}) => {
  const update = useUpdateTeamMember(companyId)
  const remove = useRemoveTeamMember(companyId)
  const prompt = usePrompt()

  const onRemove = async () => {
    const ok = await prompt({
      title: "Remove team member?",
      description: `${member.customer?.email ?? "This person"} will lose access to the company dashboard.`,
      confirmText: "Remove",
    })
    if (ok) remove.mutate(member.id)
  }

  return (
    <Table.Row>
      <Table.Cell>
        {[member.customer?.first_name, member.customer?.last_name].filter(Boolean).join(" ") || "—"}
      </Table.Cell>
      <Table.Cell>{member.customer?.email ?? "—"}</Table.Cell>
      <Table.Cell>
        <Select
          size="small"
          value={member.role}
          disabled={update.isPending}
          onValueChange={(role) => update.mutate({ teamMemberId: member.id, role: role as TeamMemberRole })}
        >
          <Select.Trigger className="w-32">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {ROLES.map((r) => (
              <Select.Item key={r} value={r}>{r}</Select.Item>
            ))}
          </Select.Content>
        </Select>
      </Table.Cell>
      <Table.Cell>
        <Select
          size="small"
          value={member.location?.id ?? NO_LOCATION}
          disabled={update.isPending}
          onValueChange={(next) =>
            update.mutate({
              teamMemberId: member.id,
              location_id: next === NO_LOCATION ? null : next,
            })
          }
        >
          <Select.Trigger className="w-40">
            <Select.Value placeholder="No location" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={NO_LOCATION}>No location</Select.Item>
            {locations.map((location) => (
              <Select.Item key={location.id} value={location.id}>
                {location.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </Table.Cell>
      <Table.Cell>
        <Button size="small" variant="danger" disabled={remove.isPending} isLoading={remove.isPending} onClick={onRemove}>
          Remove
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}
