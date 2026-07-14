import { z } from "zod"

// Attachment limits shared with the storefront file input: 5 files, 10MB raw
// total. Content arrives base64-encoded (~4/3 overhead), so the character cap
// is 10MB * 4/3 with a little slack.
export const MAX_ATTACHMENTS = 5
export const MAX_ATTACHMENTS_TOTAL_BASE64_CHARS = 15 * 1024 * 1024

export const ContactAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  content_type: z.string().min(1).max(128),
  // Base64-encoded file content
  content: z.string().min(1),
})

export const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  attachments: z
    .array(ContactAttachmentSchema)
    .max(MAX_ATTACHMENTS, `At most ${MAX_ATTACHMENTS} attachments are allowed`)
    .optional()
    .refine(
      (files) =>
        !files ||
        files.reduce((sum, f) => sum + f.content.length, 0) <=
          MAX_ATTACHMENTS_TOTAL_BASE64_CHARS,
      "Attachments exceed the 10MB total size limit"
    ),
})

export type ContactFormType = z.infer<typeof ContactFormSchema>
