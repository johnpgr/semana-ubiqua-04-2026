import "server-only"

import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  buildDocumentStoragePath,
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_FILE_SIZE_LIMIT,
  DOCUMENTS_BUCKET,
  type DocumentRecord,
} from "@/lib/documents"
import type { Database } from "@/lib/supabase/database.types"

const DocumentUploadInput = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
})

type AppSupabaseClient = SupabaseClient<Database>

export type UploadDocumentErrorCode =
  | "INVALID_REQUEST_ID"
  | "INVALID_USER_ID"
  | "FILE_REQUIRED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MIME_TYPE"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_LOOKUP_FAILED"
  | "STORAGE_UPLOAD_FAILED"
  | "STORAGE_ROLLBACK_FAILED"
  | "DOCUMENT_INSERT_FAILED"

export type DeleteDocumentErrorCode =
  | "INVALID_DOCUMENT_ID"
  | "INVALID_REQUEST_ID"
  | "INVALID_USER_ID"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_LOOKUP_FAILED"
  | "STORAGE_DELETE_FAILED"
  | "DOCUMENT_DELETE_FAILED"

export type UploadDocumentError = {
  code: UploadDocumentErrorCode
  message: string
}

export type DeleteDocumentError = {
  code: DeleteDocumentErrorCode
  message: string
}

export type UploadDocumentResult =
  | {
      ok: true
      data: {
        document: DocumentRecord
      }
    }
  | {
      ok: false
      error: UploadDocumentError
    }

export type DeleteDocumentResult =
  | {
      ok: true
    }
  | {
      ok: false
      error: DeleteDocumentError
    }

type UploadDocumentForRequestInput = {
  file: FormDataEntryValue | null
  requestId: string
  supabase: AppSupabaseClient
  userId: string
}

type DeleteDocumentForRequestInput = {
  documentId: string
  requestId: string
  supabase: AppSupabaseClient
  userId: string
}

function fail(
  code: UploadDocumentErrorCode,
  message: string
): UploadDocumentResult {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  }
}

function failDelete(
  code: DeleteDocumentErrorCode,
  message: string
): DeleteDocumentResult {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  }
}

function validateDocumentFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return fail("FILE_REQUIRED", "Selecione um arquivo para continuar")
  }

  if (file.size > DOCUMENT_FILE_SIZE_LIMIT) {
    return fail("FILE_TOO_LARGE", "O arquivo excede o limite de 10 MB")
  }

  if (
    !DOCUMENT_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof DOCUMENT_ALLOWED_MIME_TYPES)[number]
    )
  ) {
    return fail("UNSUPPORTED_MIME_TYPE", "Envie um PDF, JPG, PNG ou WEBP")
  }

  return {
    ok: true as const,
    file,
  }
}

export async function uploadDocumentForRequest(
  input: UploadDocumentForRequestInput
): Promise<UploadDocumentResult> {
  const parsedInput = DocumentUploadInput.safeParse({
    requestId: input.requestId,
    userId: input.userId,
  })

  if (!parsedInput.success) {
    const requestIdIssue = parsedInput.error.issues.find(
      (issue) => issue.path[0] === "requestId"
    )

    if (requestIdIssue) {
      return fail("INVALID_REQUEST_ID", "Solicitacao invalida")
    }

    return fail("INVALID_USER_ID", "Usuario invalido")
  }

  const validatedFile = validateDocumentFile(input.file)

  if (!validatedFile.ok) {
    return validatedFile
  }

  const { data: request, error: requestError } = await input.supabase
    .from("credit_requests")
    .select("id")
    .eq("id", parsedInput.data.requestId)
    .eq("user_id", parsedInput.data.userId)
    .maybeSingle()

  if (requestError) {
    return fail(
      "REQUEST_LOOKUP_FAILED",
      "Nao foi possivel carregar a solicitacao"
    )
  }

  if (!request) {
    return fail("REQUEST_NOT_FOUND", "Solicitacao nao encontrada")
  }

  const { sanitizedFileName, storagePath } = buildDocumentStoragePath({
    fileName: validatedFile.file.name,
    requestId: request.id,
    userId: parsedInput.data.userId,
  })

  const { error: uploadError } = await input.supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, validatedFile.file, {
      contentType: validatedFile.file.type,
      upsert: false,
    })

  if (uploadError) {
    return fail("STORAGE_UPLOAD_FAILED", "Nao foi possivel enviar o arquivo agora")
  }

  const { data: document, error: documentError } = await input.supabase
    .from("documents")
    .insert({
      request_id: request.id,
      file_name: sanitizedFileName,
      storage_path: storagePath,
      mime_type: validatedFile.file.type,
      user_id: parsedInput.data.userId,
    })
    .select("id, request_id, file_name, storage_path, mime_type, uploaded_at")
    .single()

  if (documentError || !document) {
    // Best-effort rollback to avoid leaving orphaned objects in Storage.
    const { error: rollbackError } = await input.supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([storagePath])

    if (rollbackError) {
      return fail(
        "STORAGE_ROLLBACK_FAILED",
        "O arquivo subiu, mas houve falha ao salvar e limpar o upload"
      )
    }

    return fail(
      "DOCUMENT_INSERT_FAILED",
      "O arquivo foi enviado, mas o metadado nao pode ser salvo"
    )
  }

  return {
    ok: true,
    data: {
      document,
    },
  }
}

export async function deleteDocumentForRequest(
  input: DeleteDocumentForRequestInput
): Promise<DeleteDocumentResult> {
  const parsedIds = z
    .object({
      documentId: z.string().uuid(),
      requestId: z.string().uuid(),
      userId: z.string().uuid(),
    })
    .safeParse(input)

  if (!parsedIds.success) {
    const documentIdIssue = parsedIds.error.issues.find(
      (issue) => issue.path[0] === "documentId"
    )
    const requestIdIssue = parsedIds.error.issues.find(
      (issue) => issue.path[0] === "requestId"
    )

    if (documentIdIssue) {
      return failDelete("INVALID_DOCUMENT_ID", "Documento invalido")
    }

    if (requestIdIssue) {
      return failDelete("INVALID_REQUEST_ID", "Solicitacao invalida")
    }

    return failDelete("INVALID_USER_ID", "Usuario invalido")
  }

  const { data: document, error: documentLookupError } = await input.supabase
    .from("documents")
    .select("id, request_id, storage_path")
    .eq("id", parsedIds.data.documentId)
    .eq("request_id", parsedIds.data.requestId)
    .eq("user_id", parsedIds.data.userId)
    .maybeSingle()

  if (documentLookupError) {
    return failDelete(
      "DOCUMENT_LOOKUP_FAILED",
      "Nao foi possivel localizar o documento"
    )
  }

  if (!document) {
    return failDelete("DOCUMENT_NOT_FOUND", "Documento nao encontrado")
  }

  const { error: storageDeleteError } = await input.supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([document.storage_path])

  if (storageDeleteError) {
    return failDelete(
      "STORAGE_DELETE_FAILED",
      "Nao foi possivel remover o arquivo agora"
    )
  }

  const { error: documentDeleteError } = await input.supabase
    .from("documents")
    .delete()
    .eq("id", document.id)
    .eq("request_id", document.request_id)
    .eq("user_id", parsedIds.data.userId)

  if (documentDeleteError) {
    return failDelete(
      "DOCUMENT_DELETE_FAILED",
      "O arquivo foi removido, mas o registro nao pode ser apagado"
    )
  }

  return {
    ok: true,
  }
}
