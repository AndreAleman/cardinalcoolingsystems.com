import { OpenInvite, TeamMember } from "@lib/data/companies"
import InviteForm from "./invite-form"
import { displayName } from "@lib/util/display-name"

type Props = { team: TeamMember[]; invites: OpenInvite[] }

/* Who is on the Company, who has been invited, and a box to invite more. */
const TeamSection = ({ team, invites }: Props) => (
  <section className="flex flex-col gap-4" data-testid="team-section">
    <h2 className="text-xl-semi m-0">Team</h2>
    <ul className="flex flex-col divide-y divide-gray-200 border-y border-gray-200">
      {team.map((m) => (
        <li key={m.id} className="flex justify-between py-2 text-small-regular" data-testid="team-member">
          <span>
            {displayName(m.customer)}
            <span className="text-ui-fg-subtle"> · {m.customer?.email}</span>
          </span>
          <span className="uppercase text-ui-fg-subtle">{m.role}</span>
        </li>
      ))}
      {invites.map((i) => (
        <li key={i.id} className="flex justify-between py-2 text-small-regular text-ui-fg-subtle" data-testid="open-invite">
          <span>{i.email}</span>
          <span>Invited</span>
        </li>
      ))}
    </ul>
    <InviteForm />
  </section>
)

export default TeamSection
