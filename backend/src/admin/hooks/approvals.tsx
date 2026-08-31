import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"

export type ApprovalStatus = "pending" | "approved" | "rejected"

export type AdminApproval = {
  id: string
  cart_id: string
  type: string
  status: ApprovalStatus
  created_by: string
  handled_by?: string | null
  created_at?: string
  updated_at?: string
  cart?: {
    id: string
    total?: number
    items?: Array<{ id: string; title?: string; quantity: number }>
    company?: { id: string; name?: string | null } | null
  } | null
}

const approvalsKey = (status?: ApprovalStatus) => ["approvals", { status }] as const

export const useApprovals = (status?: ApprovalStatus) =>
  useQuery({
    queryKey: approvalsKey(status),
    queryFn: () =>
      sdk.client.fetch<{ approvals: AdminApproval[]; count: number }>(
        "/admin/approvals",
        { query: status ? { status } : {} }
      ),
  })

export const useUpdateApproval = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected" }) =>
      sdk.client.fetch<{ approval: AdminApproval }>(`/admin/approvals/${input.id}`, {
        method: "POST",
        body: { status: input.status },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] })
      toast.success(
        variables.status === "approved"
          ? "Cart approved — the customer can check out"
          : "Cart rejected"
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
