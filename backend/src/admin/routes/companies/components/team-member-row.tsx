import { Button, Select, Table, usePrompt } from "@medusajs/ui"
import {
  AdminTeamMember,
  TeamMemberRole,
  useRemoveTeamMember,
  useUpdateTeamMember,
} from "../../../hooks/companies"

const ROLES: TeamMemberRole[] = ["member", "manager", "admin"]

/* One Team Member: name, email, a Role picker, and Remove. */
export const TeamMemberRow = ({ companyId, member }: { companyId: string; member: AdminTeamMember }) => {
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
        <Button size="small" variant="danger" disabled={remove.isPending} isLoading={remove.isPending} onClick={onRemove}>
          Remove
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}
