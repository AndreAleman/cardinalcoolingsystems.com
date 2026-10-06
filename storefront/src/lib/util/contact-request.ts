/*
  POST /store/contact — the existing public contact / RFQ endpoint
  (backend/src/api/store/contact, validated by ContactFormSchema). Same
  URL, headers and body shape the contact page sends, so a submission from
  here is indistinguishable from one sent from /contact: same email to
  Cardinal, same validation.

  Only the stainless-tubing quote form uses this helper today; the
  existing contact page, home quote form and bulk-pricing modal keep their
  own inline fetch and are unchanged.
*/

import type { EmailAttachment } from "./attachments"

export type ContactRequest = {
  name: string
  lastName: string
  email: string
  phone?: string
  message: string
  attachments?: EmailAttachment[]
}

export async function postContactRequest(request: ContactRequest): Promise<boolean> {
  const { attachments, ...data } = request
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
      },
      body: JSON.stringify(
        attachments && attachments.length > 0 ? { ...data, attachments } : data
      ),
    }
  )
  return response.ok
}
