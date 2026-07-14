// Shared helpers for attaching files to contact / quote request forms.
// Limits mirror the backend validator on /store/contact: 5 files, 10MB total.

export type EmailAttachment = {
  filename: string
  content_type: string
  content: string // base64-encoded file content
}

export const MAX_ATTACHMENT_FILES = 5
export const MAX_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024

// Spec sheets, drawings, photos, spreadsheets — typical B2B RFQ documents.
export const ACCEPTED_ATTACHMENT_TYPES =
  ".pdf,.png,.jpg,.jpeg,.webp,.heic,.gif,.csv,.xls,.xlsx,.doc,.docx,.dwg,.dxf,.step,.stp,.zip"

export function totalAttachmentBytes(files: File[]): number {
  return files.reduce((sum, file) => sum + file.size, 0)
}

function fileToAttachment(file: File): Promise<EmailAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(",")[1] ?? ""
      resolve({
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        content: base64,
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function filesToAttachments(files: File[]): Promise<EmailAttachment[]> {
  return Promise.all(files.map(fileToAttachment))
}
