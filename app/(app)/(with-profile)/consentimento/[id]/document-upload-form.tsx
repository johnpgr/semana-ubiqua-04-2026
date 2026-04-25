"use client"

import { useActionState, useId, useState } from "react"
import { useFormStatus } from "react-dom"
import { FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  formatDocumentSizeLimit,
  type DocumentListItem,
} from "@/lib/documents"

import {
  removeDocument,
  type RemoveDocumentState,
  uploadDocument,
  type UploadDocumentState,
} from "./actions"

const UPLOAD_DOCUMENT_INITIAL_STATE: UploadDocumentState = {
  ok: false,
}

const REMOVE_DOCUMENT_INITIAL_STATE: RemoveDocumentState = {
  ok: false,
}

const acceptedFileTypes = DOCUMENT_ALLOWED_MIME_TYPES.join(",")

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

type DocumentUploadFormProps = {
  initialDocuments: DocumentListItem[]
  requestId: string
}

function UploadSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="outline" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Spinner />
          Enviando...
        </>
      ) : (
        "Enviar documento"
      )}
    </Button>
  )
}

function RemoveDocumentButton({
  documentId,
  fileName,
  requestId,
}: {
  documentId: string
  fileName: string
  requestId: string
}) {
  const [state, formAction] = useActionState(
    removeDocument,
    REMOVE_DOCUMENT_INITIAL_STATE
  )

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="request_id" value={requestId} />
      <RemoveDocumentSubmitButton fileName={fileName} />
      {state.formError ? (
        <span className="text-xs text-destructive">{state.formError}</span>
      ) : null}
    </form>
  )
}

function RemoveDocumentSubmitButton({ fileName }: { fileName: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`Remover ${fileName}`}
    >
      {pending ? <Spinner /> : <Trash2Icon />}
      {pending ? "Removendo..." : "Remover"}
    </Button>
  )
}

function FileInput({
  id,
  acceptedMimeTypes,
  onFileSelect,
  ariaInvalid,
}: {
  id: string
  acceptedMimeTypes: string
  onFileSelect: (name: string | null) => void
  ariaInvalid: true | undefined
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(event.target.files?.[0]?.name ?? null)
  }

  return (
    <Input
      id={id}
      name="file"
      type="file"
      accept={acceptedMimeTypes}
      className="sr-only"
      onChange={handleChange}
      aria-invalid={ariaInvalid}
    />
  )
}

export function DocumentUploadForm({
  initialDocuments,
  requestId,
}: DocumentUploadFormProps) {
  const [state, formAction] = useActionState(
    uploadDocument,
    UPLOAD_DOCUMENT_INITIAL_STATE
  )
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const inputId = useId()
  const selectedFileNameToShow =
    selectedFileName && selectedFileName !== state.data?.document.file_name
      ? selectedFileName
      : null

  return (
    <div className="space-y-5">
      <form action={formAction}>
        <input type="hidden" name="request_id" value={requestId} />
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Opcional</Badge>
              <Badge variant="secondary">Complementa a análise</Badge>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Anexe seu extrato ou comprovantes caso a coleta automática não
                tenha sido suficiente
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Isso pode ajudar a complementar a análise da sua solicitação. O
                envio de arquivos não substitui o consentimento.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/15 p-4 sm:p-5">
            <label
              htmlFor={inputId}
              className="block cursor-pointer rounded-2xl border border-dashed border-border/80 bg-background/30 p-5 transition-colors hover:bg-background/45"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-background p-2 text-muted-foreground">
                    <UploadIcon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      Escolha um arquivo para enviar
                    </div>
                    <div className="text-sm text-muted-foreground">
                      PDF, JPG, PNG ou WEBP até {formatDocumentSizeLimit()}.
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Selecionar arquivo
                </span>
              </div>
              <FileInput
                id={inputId}
                acceptedMimeTypes={acceptedFileTypes}
                onFileSelect={setSelectedFileName}
                ariaInvalid={state.fieldErrors?.file ? true : undefined}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                {selectedFileNameToShow ? (
                  <p className="text-sm text-muted-foreground">
                    Pronto para envio: <strong>{selectedFileNameToShow}</strong>
                  </p>
                ) : null}

                {state.fieldErrors?.file?.[0] ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.file[0]}
                  </p>
                ) : null}
                {state.ok && state.data?.document ? (
                  <p className="text-sm text-foreground">
                    Arquivo <strong>{state.data.document.file_name}</strong>
                    enviado com sucesso.
                  </p>
                ) : null}
                {state.formError ? (
                  <p className="text-sm text-destructive">{state.formError}</p>
                ) : null}
              </div>

              <div className="sm:shrink-0">
                <UploadSubmitButton />
              </div>
            </div>
          </div>
        </CardContent>
      </form>

      <div className="px-4 pb-4">
        <div className="space-y-4 border-t border-border/60 pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Arquivos enviados</p>
              <p className="text-sm text-muted-foreground">
                {initialDocuments.length === 0
                  ? "Nenhum comprovante anexado até agora."
                  : `${initialDocuments.length} arquivo(s) complementar(es) vinculado(s) a esta solicitação.`}
              </p>
            </div>
            <Badge variant="outline">
              {initialDocuments.length} arquivo(s)
            </Badge>
          </div>

          {initialDocuments.length > 0 ? (
            <ul className="space-y-3">
              {initialDocuments.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-background p-2 text-muted-foreground">
                        <FileTextIcon className="size-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">
                          {document.file_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {document.mime_type} |{" "}
                          {dateFormatter.format(new Date(document.uploaded_at))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <RemoveDocumentButton
                    documentId={document.id}
                    fileName={document.file_name}
                    requestId={requestId}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              Se a coleta automática não tiver sido suficiente, você pode anexar
              comprovantes aqui antes de seguir para o consentimento.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
