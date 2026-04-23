"use client"

import { useActionState, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
  const router = useRouter()

  useEffect(() => {
    if (!state.ok) {
      return
    }

    router.refresh()
  }, [router, state.ok])

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

export function DocumentUploadForm({
  initialDocuments,
  requestId,
}: DocumentUploadFormProps) {
  const [state, formAction] = useActionState(
    uploadDocument,
    UPLOAD_DOCUMENT_INITIAL_STATE
  )
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const inputId = useId()
  const router = useRouter()

  useEffect(() => {
    if (!state.ok) {
      return
    }

    formRef.current?.reset()
    setSelectedFileName(null)
    router.refresh()
  }, [router, state.ok, state.data?.document.id])

  return (
    <div className="space-y-5">
      <form ref={formRef} action={formAction} encType="multipart/form-data">
        <input type="hidden" name="request_id" value={requestId} />
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Opcional</Badge>
              <Badge variant="secondary">Complementa a analise</Badge>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Anexe seu extrato ou comprovantes caso a coleta automatica nao
                tenha sido suficiente
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Isso pode ajudar a complementar a analise da sua solicitacao.
                O envio de arquivos nao substitui o consentimento.
              </p>
            </div>
          </div>

          <label
            htmlFor={inputId}
            className="block cursor-pointer rounded-2xl border border-dashed border-border/80 bg-muted/25 p-5 transition-colors hover:bg-muted/40"
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
                    PDF, JPG, PNG ou WEBP ate {formatDocumentSizeLimit()}.
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                Selecionar arquivo
              </span>
            </div>
            <Input
              id={inputId}
              name="file"
              type="file"
              accept={acceptedFileTypes}
              className="sr-only"
              onChange={(event) => {
                setSelectedFileName(event.target.files?.[0]?.name ?? null)
              }}
              aria-invalid={state.fieldErrors?.file ? true : undefined}
            />
          </label>

          {selectedFileName ? (
            <p className="text-sm text-muted-foreground">
              Pronto para envio: <strong>{selectedFileName}</strong>
            </p>
          ) : null}

          {state.fieldErrors?.file?.[0] ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.file[0]}
            </p>
          ) : null}
          {state.ok && state.data?.document ? (
            <p className="text-sm text-foreground">
              Arquivo <strong>{state.data.document.file_name}</strong> enviado
              com sucesso.
            </p>
          ) : null}
          {state.formError ? (
            <p className="text-sm text-destructive">{state.formError}</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <UploadSubmitButton />
        </CardFooter>
      </form>

      <Separator />

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Arquivos enviados</p>
            <p className="text-sm text-muted-foreground">
              {initialDocuments.length === 0
                ? "Nenhum comprovante anexado ate agora."
                : `${initialDocuments.length} arquivo(s) complementar(es) vinculado(s) a esta solicitacao.`}
            </p>
          </div>
          <Badge variant="outline">{initialDocuments.length} arquivo(s)</Badge>
        </div>

        {initialDocuments.length > 0 ? (
          <ul className="mt-4 space-y-3">
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
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            Se a coleta automatica nao tiver sido suficiente, voce pode anexar
            comprovantes aqui antes de seguir para o consentimento.
          </div>
        )}
      </div>
    </div>
  )
}
