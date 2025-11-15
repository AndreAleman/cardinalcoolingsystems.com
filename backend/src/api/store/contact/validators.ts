import { z } from "zod"

export const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  message: z.string().min(1, "Message is required")
})

export type ContactFormType = z.infer<typeof ContactFormSchema>
