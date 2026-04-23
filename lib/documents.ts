import type { Database } from "@/lib/supabase/database.types"

export const DOCUMENTS_BUCKET = "documents"
export const DOCUMENT_FILE_SIZE_LIMIT = 10 * 1024 * 1024
export const DOCUMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type DocumentRecord = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  | "id"
  | "request_id"
  | "file_name"
  | "storage_path"
  | "mime_type"
  | "uploaded_at"
>

export type DocumentListItem = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "file_name" | "mime_type" | "uploaded_at"
>

export function formatDocumentSizeLimit() {
  return `${Math.floor(DOCUMENT_FILE_SIZE_LIMIT / (1024 * 1024))} MB`
}

export function sanitizeDocumentFileName(fileName: string) {
  const trimmed = fileName.trim()
  const extensionIndex = trimmed.lastIndexOf(".")
  const rawBaseName =
    extensionIndex > 0 ? trimmed.slice(0, extensionIndex) : trimmed
  const rawExtension =
    extensionIndex > 0 ? trimmed.slice(extensionIndex + 1) : ""

  const baseName = rawBaseName
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")

  const extension = rawExtension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10)

  const safeBaseName = baseName || "documento"

  return extension ? `${safeBaseName}.${extension}` : safeBaseName
}

export function buildDocumentStoragePath(params: {
  fileName: string
  requestId: string
  userId: string
}) {
  const sanitizedFileName = sanitizeDocumentFileName(params.fileName)

  return {
    sanitizedFileName,
    storagePath: `${params.userId}/${params.requestId}/${crypto.randomUUID()}-${sanitizedFileName}`,
  }
}
